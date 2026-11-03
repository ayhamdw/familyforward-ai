import { z } from "zod";

const baseSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  MONGODB_URI: z.string().min(1),
  DB_NAME: z.string().min(1),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  JWT_SECRET: z.string().min(32),
  CODE_HMAC_SECRET: z.string().min(32),
  // Optional in development: without a key the sign-in code is printed to the console.
  RESEND_API_KEY: z.string().min(1).optional(),
  MAIL_FROM: z.string().min(1).optional(),
  LLM_PROVIDER: z.enum(["mock", "claude"]).default("mock"),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_MODEL: z.string().min(1).optional(),
  PLAN_DAILY_LIMIT: z.coerce.number().int().min(1).max(1000).default(5),
});

const envSchema = baseSchema.superRefine((env, ctx) => {
  const require = (name: keyof typeof env, when: boolean): void => {
    if (when && !env[name]) {
      ctx.addIssue({ code: "custom", path: [name], message: "required" });
    }
  };
  // Production must be able to send email; the console fallback is development only.
  require("RESEND_API_KEY", env.NODE_ENV === "production");
  require("MAIL_FROM", env.NODE_ENV === "production" || Boolean(env.RESEND_API_KEY));
  require("ANTHROPIC_API_KEY", env.LLM_PROVIDER === "claude");
  require("ANTHROPIC_MODEL", env.LLM_PROVIDER === "claude");
});

export type Env = z.infer<typeof envSchema>;

/** Thrown when the environment is invalid. Only variable names are exposed, never values. */
export class EnvError extends Error {
  constructor(public readonly variables: string[]) {
    super(`Invalid or missing environment variables: ${variables.join(", ")}`);
    this.name = "EnvError";
  }
}

export function parseEnv(source: NodeJS.ProcessEnv): Env {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const names = new Set(result.error.issues.map((issue) => String(issue.path[0])));
    throw new EnvError([...names]);
  }
  return result.data;
}
