import pino, { type Logger } from "pino";
import pinoHttp from "pino-http";

export function createLogger(level: string): Logger {
  return pino({
    level,
    // Request bodies are never logged: they will contain survey answers.
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'res.headers["set-cookie"]',
      ],
      censor: "[redacted]",
    },
  });
}

export function createHttpLogger(logger: Logger) {
  return pinoHttp({ logger });
}
