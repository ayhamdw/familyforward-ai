import { createHash } from "node:crypto";
import { Router, type Request } from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import { z } from "zod";
import { ApiError } from "../lib/apiError";
import { normalizeEmail } from "../lib/crypto";
import { rateLimitedHandler } from "../middleware/rateLimit";
import type { AuthService } from "../services/auth.service";

const EmailSchema = z.string().trim().max(254).pipe(z.email());
const RequestCodeSchema = z.object({ email: EmailSchema });
const VerifyCodeSchema = z.object({ email: EmailSchema, code: z.string().regex(/^\d{6}$/) });

export type AuthLimits = {
  windowMs: number;
  requestCodePerIp: number;
  requestCodePerEmail: number;
  verifyPerIp: number;
  verifyPerEmail: number;
};

export const DEFAULT_AUTH_LIMITS: AuthLimits = {
  windowMs: 15 * 60 * 1000,
  requestCodePerIp: 10,
  requestCodePerEmail: 3,
  verifyPerIp: 30,
  verifyPerEmail: 10,
};

/** Rate limit key from the email. Hashed so the in-memory store holds no readable email. */
function emailKey(req: Request): string {
  const email = (req.body as { email?: unknown } | undefined)?.email;
  if (typeof email === "string" && email.length <= 254) {
    return `email:${createHash("sha256").update(normalizeEmail(email)).digest("hex")}`;
  }
  return `ip:${ipKeyGenerator(req.ip ?? "")}`;
}

function limiter(limit: number, windowMs: number, key: (req: Request) => string) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator: key,
    handler: rateLimitedHandler,
  });
}

const ipKey = (req: Request): string => ipKeyGenerator(req.ip ?? "");

export function authRouter(auth: AuthService, limits: AuthLimits = DEFAULT_AUTH_LIMITS): Router {
  const router = Router();

  router.post(
    "/request-code",
    limiter(limits.requestCodePerIp, limits.windowMs, ipKey),
    limiter(limits.requestCodePerEmail, limits.windowMs, emailKey),
    async (req, res, next) => {
      try {
        const parsed = RequestCodeSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new ApiError(400, "invalid_email", "Enter a valid email address.");
        }
        await auth.requestCode(parsed.data.email);
        // Same body for every valid email: nothing reveals whether an account exists.
        res.status(200).json({ ok: true });
      } catch (err) {
        next(err);
      }
    },
  );

  router.post(
    "/verify",
    limiter(limits.verifyPerIp, limits.windowMs, ipKey),
    limiter(limits.verifyPerEmail, limits.windowMs, emailKey),
    async (req, res, next) => {
      try {
        const parsed = VerifyCodeSchema.safeParse(req.body);
        if (!parsed.success) {
          throw new ApiError(400, "invalid_input", "Enter your email and the 6-digit code.");
        }
        const { token } = await auth.verifyCode(parsed.data.email, parsed.data.code);
        res.status(200).json({ token });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
