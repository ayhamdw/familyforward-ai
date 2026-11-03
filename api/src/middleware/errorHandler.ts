import type { ErrorRequestHandler } from "express";
import { ApiError, errorBody } from "../lib/apiError";

const CLIENT_ERRORS: Record<number, { code: string; message: string }> = {
  400: { code: "bad_request", message: "Bad request" },
  413: { code: "payload_too_large", message: "Payload too large" },
};

function clientStatus(err: unknown): number | null {
  if (typeof err === "object" && err !== null) {
    const status = (err as { status?: unknown; statusCode?: unknown }).status
      ?? (err as { statusCode?: unknown }).statusCode;
    if (typeof status === "number" && status >= 400 && status < 500) {
      return status;
    }
  }
  return null;
}

// Express identifies error handlers by their four-argument signature.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ApiError) {
    res.locals.errorCode = err.code;
    res.status(err.status).json(errorBody(err.code, err.message));
    return;
  }
  const status = clientStatus(err);
  if (status === null) {
    res.locals.errorCode = "internal_error";
    // Only name and code are logged (see serializeError); never message, stack or request data.
    req.log?.error(
      { err, status: 500, path: (req.originalUrl ?? req.url).split("?")[0] },
      "Unhandled error",
    );
    res.status(500).json(errorBody("internal_error", "Something went wrong"));
    return;
  }
  const known = CLIENT_ERRORS[status] ?? CLIENT_ERRORS[400];
  res.locals.errorCode = known.code;
  res.status(status).json(errorBody(known.code, known.message));
};
