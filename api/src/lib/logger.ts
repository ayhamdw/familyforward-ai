import pino, { type DestinationStream, type Logger } from "pino";
import pinoHttp from "pino-http";

type LoggedRequest = { method?: string; originalUrl?: string; url?: string };
type LoggedResponse = { statusCode?: number };

/**
 * Errors are logged as name and code only. message, stack, errors, value and cause
 * can contain survey text, so they are never copied into the log.
 */
export function serializeError(value: unknown): { name: string; code?: string | number } {
  if (typeof value !== "object" || value === null) {
    return { name: "NonError" };
  }
  // pino runs its standard error serializer first, so the class name arrives as `type`.
  const { type, name, code } = value as { type?: unknown; name?: unknown; code?: unknown };
  const label = typeof type === "string" ? type : name;
  const safe: { name: string; code?: string | number } = {
    name: typeof label === "string" ? label : "Error",
  };
  if (typeof code === "string" || typeof code === "number") {
    safe.code = code;
  }
  return safe;
}

export function createLogger(level: string, destination?: DestinationStream): Logger {
  return pino(
    {
      level,
      // Drop pid and hostname: nothing about the host is needed in request logs.
      base: undefined,
      serializers: { err: serializeError },
      // Defense in depth: request headers are not logged at all (see createHttpLogger).
      redact: {
        paths: ["req.headers.authorization", "req.headers.cookie", 'res.headers["set-cookie"]'],
        censor: "[redacted]",
      },
    },
    destination,
  );
}

/**
 * Request logs contain only: method, URL path (no query string), status code and responseTime.
 * No headers, IPs, remote addresses, cookies or bodies (bodies will hold survey answers).
 */
export function createHttpLogger(logger: Logger) {
  return pinoHttp({
    logger,
    // The default request id is not needed and would add a field.
    genReqId: () => "",
    serializers: {
      req: (req: LoggedRequest) => ({
        method: req.method,
        // originalUrl is not rewritten by sub-routers; strip the query string.
        url: (req.originalUrl ?? req.url ?? "").split("?")[0],
      }),
      res: (res: LoggedResponse) => ({ statusCode: res.statusCode }),
      err: serializeError,
    },
  });
}
