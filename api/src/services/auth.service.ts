import jwt from "jsonwebtoken";
import { ApiError } from "../lib/apiError";
import { generateCode, hashCode, hashEmail, normalizeEmail, safeEqualHex } from "../lib/crypto";
import { AuthCode, Parent } from "../models";
import type { Mailer } from "./mailer";

export const CODE_TTL_MS = 10 * 60 * 1000;
export const MAX_ATTEMPTS = 5;
export const TOKEN_TTL = "30d";

export type AuthServiceConfig = {
  jwtSecret: string;
  codeHmacSecret: string;
  mailer: Mailer;
  /** Called with an error code only (never the address or the code) when sending fails. */
  onMailError?: (code: string) => void;
};

export class AuthService {
  constructor(private readonly config: AuthServiceConfig) {}

  /** Creates and sends a new code. Always resolves the same way, whether or not the email has an account. */
  async requestCode(rawEmail: string): Promise<void> {
    const email = normalizeEmail(rawEmail);
    const emailHash = hashEmail(this.config.codeHmacSecret, email);
    const code = generateCode();
    // One row per email: a new code replaces any older one and resets the attempt counter.
    await AuthCode.findOneAndUpdate(
      { emailHash },
      {
        $set: {
          codeHash: hashCode(this.config.codeHmacSecret, emailHash, code),
          expiresAt: new Date(Date.now() + CODE_TTL_MS),
          attempts: 0,
        },
      },
      { upsert: true },
    );
    try {
      await this.config.mailer.sendCode(email, code);
    } catch {
      // Same response either way, so a mail failure must not be visible to the caller.
      this.config.onMailError?.("mail_failed");
    }
  }

  /** Checks a code. On success returns a token for the parent. */
  async verifyCode(rawEmail: string, code: string): Promise<{ token: string; parentId: string }> {
    const email = normalizeEmail(rawEmail);
    const emailHash = hashEmail(this.config.codeHmacSecret, email);

    // Atomic: count the attempt and only match a live, unlocked code. Concurrent guesses cannot exceed the limit.
    const row = await AuthCode.findOneAndUpdate(
      { emailHash, expiresAt: { $gt: new Date() }, attempts: { $lt: MAX_ATTEMPTS } },
      { $inc: { attempts: 1 } },
      { returnDocument: "after" },
    );
    if (!row) {
      throw new ApiError(400, "code_expired", "This code expired or was tried too many times. Ask for a new one.");
    }

    const expected = hashCode(this.config.codeHmacSecret, emailHash, code);
    if (!safeEqualHex(row.codeHash, expected)) {
      throw new ApiError(400, "invalid_code", "That code is not right.");
    }

    // Single use: only the request that deletes the row can sign in.
    const deleted = await AuthCode.deleteOne({ emailHash, codeHash: row.codeHash });
    if (deleted.deletedCount !== 1) {
      throw new ApiError(400, "code_expired", "This code expired or was tried too many times. Ask for a new one.");
    }

    const now = new Date();
    const parent = await Parent.findOneAndUpdate(
      { email },
      { $set: { lastLoginAt: now }, $setOnInsert: { createdAt: now } },
      { upsert: true, returnDocument: "after" },
    );
    const parentId = String(parent._id);
    return { token: this.signToken(parentId), parentId };
  }

  signToken(parentId: string): string {
    return jwt.sign({}, this.config.jwtSecret, { subject: parentId, expiresIn: TOKEN_TTL, algorithm: "HS256" });
  }
}
