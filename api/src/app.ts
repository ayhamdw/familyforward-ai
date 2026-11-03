import express, { type Express } from "express";
import type { DestinationStream } from "pino";
import helmet from "helmet";
import { createHttpLogger, createLogger } from "./lib/logger";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";
import { globalRateLimit } from "./middleware/rateLimit";
import type { LlmClient } from "./generation/llmClient";
import { authRouter, type AuthLimits } from "./routes/auth";
import { healthRouter } from "./routes/health";
import { meRouter } from "./routes/me";
import { plansRouter } from "./routes/plans";
import { AuthService } from "./services/auth.service";
import type { Mailer } from "./services/mailer";

export type AppConfig = {
  nodeEnv: string;
  logLevel: string;
  /** Where logs are written. Defaults to stdout; tests pass a stream to capture output. */
  logDestination?: DestinationStream;
  jwtSecret: string;
  codeHmacSecret: string;
  mailer: Mailer;
  llm: LlmClient;
  /** Plans each parent may create per 24 hours. */
  planDailyLimit: number;
  /** Overrides the auth rate limits (tests use small values). */
  authLimits?: AuthLimits;
};

export function createApp(config: AppConfig): Express {
  const app = express();
  const logger = createLogger(config.logLevel, config.logDestination);

  app.disable("x-powered-by");
  // Render sits behind one proxy; rate limiting needs the real client IP.
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(createHttpLogger(logger));
  app.use(globalRateLimit);
  app.use(express.json({ limit: "100kb" }));

  const auth = new AuthService({
    jwtSecret: config.jwtSecret,
    codeHmacSecret: config.codeHmacSecret,
    mailer: config.mailer,
    onMailError: (code) => logger.error({ errorCode: code }, "Could not send sign-in email"),
  });

  app.use("/health", healthRouter(config.nodeEnv));
  app.use("/auth", authRouter(auth, config.authLimits));
  app.use(
    "/plans",
    plansRouter({
      jwtSecret: config.jwtSecret,
      llm: config.llm,
      dailyLimit: config.planDailyLimit,
      // Reason codes only: never survey answers, notes or model output.
      onGenerationEvent: (event) => logger.warn(event, "Plan generation step failed"),
    }),
  );
  app.use("/me", meRouter({ jwtSecret: config.jwtSecret, codeHmacSecret: config.codeHmacSecret }));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
