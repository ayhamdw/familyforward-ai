import express, { type Express } from "express";
import type { DestinationStream } from "pino";
import helmet from "helmet";
import { createHttpLogger, createLogger } from "./lib/logger";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
import { globalRateLimit } from "./middleware/rateLimit";
import { healthRouter } from "./routes/health";

export type AppConfig = {
  nodeEnv: string;
  logLevel: string;
  /** Where logs are written. Defaults to stdout; tests pass a stream to capture output. */
  logDestination?: DestinationStream;
};

export function createApp(config: AppConfig): Express {
  const app = express();

  app.disable("x-powered-by");
  // Render sits behind one proxy; rate limiting needs the real client IP.
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(createHttpLogger(createLogger(config.logLevel, config.logDestination)));
  app.use(globalRateLimit);
  app.use(express.json({ limit: "100kb" }));

  app.use("/health", healthRouter(config.nodeEnv));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
