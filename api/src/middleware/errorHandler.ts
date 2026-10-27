import type { ErrorRequestHandler } from "express";

const CLIENT_MESSAGES: Record<number, string> = {
  400: "Bad request",
  413: "Payload too large",
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
  const status = clientStatus(err);
  if (status === null) {
    req.log?.error({ err }, "Unhandled error");
    res.status(500).json({ error: "Internal server error" });
    return;
  }
  res.status(status).json({ error: CLIENT_MESSAGES[status] ?? "Bad request" });
};
