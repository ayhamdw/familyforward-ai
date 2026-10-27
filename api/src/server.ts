import { createApp } from "./app";
import { EnvError, parseEnv, type Env } from "./config/env";
import { connectDb, disconnectDb } from "./db/connect";
import { createLogger } from "./lib/logger";

const SHUTDOWN_TIMEOUT_MS = 10_000;

function loadEnv(): Env {
  try {
    return parseEnv(process.env);
  } catch (err) {
    if (err instanceof EnvError) {
      process.stderr.write(`${err.message}\n`);
      process.exit(1);
    }
    throw err;
  }
}

async function main(): Promise<void> {
  const env = loadEnv();
  const logger = createLogger(env.LOG_LEVEL);

  try {
    await connectDb(env.MONGODB_URI, env.DB_NAME);
  } catch (err) {
    // Log only the error name: connection errors can contain host details.
    logger.fatal({ errName: err instanceof Error ? err.name : "unknown" }, "Failed to connect to MongoDB");
    process.exit(1);
  }
  logger.info({ db: env.DB_NAME }, "Connected to MongoDB");

  const app = createApp({ nodeEnv: env.NODE_ENV, logLevel: env.LOG_LEVEL });
  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, "Server listening");
  });

  let shuttingDown = false;
  const shutdown = (signal: string): void => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;
    logger.info({ signal }, "Shutting down");
    setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS).unref();
    server.close(() => {
      disconnectDb()
        .catch(() => logger.error("Error closing MongoDB connection"))
        .finally(() => process.exit(0));
    });
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

void main();
