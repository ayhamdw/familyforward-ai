import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hmac(secret: string, value: string): string {
  return createHmac("sha256", secret).update(value).digest("hex");
}

/** Keyed hash of the email, so the auth code table never holds a readable email. */
export function hashEmail(secret: string, email: string): string {
  return hmac(secret, `email:${normalizeEmail(email)}`);
}

/** Keyed hash of the code, bound to the email hash so a hash cannot be reused for another email. */
export function hashCode(secret: string, emailHash: string, code: string): string {
  return hmac(secret, `code:${emailHash}:${code}`);
}

/** Six digits from a cryptographically secure source, zero padded. */
export function generateCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** Constant-time comparison of two hex digests. */
export function safeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}
