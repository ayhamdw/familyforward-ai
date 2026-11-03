import type { RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import { errorBody } from "../lib/apiError";

export const RATE_LIMITED_MESSAGE = "Too many requests. Please wait a bit and try again.";

/** Shared 429 response so every limiter answers in the same format. */
export const rateLimitedHandler: RequestHandler = (_req, res) => {
  res.locals.errorCode = "rate_limited";
  res.status(429).json(errorBody("rate_limited", RATE_LIMITED_MESSAGE));
};

export const globalRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: rateLimitedHandler,
});
