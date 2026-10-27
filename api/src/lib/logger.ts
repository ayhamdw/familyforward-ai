import pino, { type DestinationStream, type Logger } from "pino";
import pinoHttp from "pino-http";

type LoggedRequest = { method?: string; originalUrl?: string; url?: string };
type LoggedResponse = { statusCode?: number };

export function createLogger(level: string, destination?: DestinationStream): Logger {
  return pino(
    {
      level,
      // Drop pid and hostname: nothing about the host is needed in request logs.
      base: undefined,
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
    },
  });
}
