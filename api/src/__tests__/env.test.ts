import { EnvError, parseEnv } from "../config/env";

const valid = {
  NODE_ENV: "development",
  MONGODB_URI: "mongodb://example.invalid/placeholder",
  DB_NAME: "familyforward_dev",
  JWT_SECRET: "j".repeat(32),
  CODE_HMAC_SECRET: "c".repeat(32),
};

describe("parseEnv", () => {
  it("accepts a valid environment and applies defaults", () => {
    const env = parseEnv(valid);
    expect(env.PORT).toBe(3000);
    expect(env.LOG_LEVEL).toBe("info");
    expect(env.DB_NAME).toBe("familyforward_dev");
  });

  it("rejects missing variables and lists only their names", () => {
    let error: unknown;
    try {
      parseEnv({ NODE_ENV: "development" });
    } catch (err) {
      error = err;
    }
    expect(error).toBeInstanceOf(EnvError);
    expect((error as EnvError).variables.sort()).toEqual(["CODE_HMAC_SECRET", "DB_NAME", "JWT_SECRET", "MONGODB_URI"]);
  });

  it("does not echo values in the error message", () => {
    expect(() => parseEnv({ ...valid, NODE_ENV: "super-secret-value" })).toThrow(/NODE_ENV/);
    expect(() => parseEnv({ ...valid, NODE_ENV: "super-secret-value" })).not.toThrow(/super-secret-value/);
  });

  it("rejects an invalid PORT", () => {
    expect(() => parseEnv({ ...valid, PORT: "abc" })).toThrow(/PORT/);
  });

  it("applies defaults for the generation settings", () => {
    const env = parseEnv(valid);
    expect(env.LLM_PROVIDER).toBe("mock");
    expect(env.PLAN_DAILY_LIMIT).toBe(5);
    expect(env.RESEND_API_KEY).toBeUndefined();
  });

  it("rejects a short JWT_SECRET", () => {
    expect(() => parseEnv({ ...valid, JWT_SECRET: "short" })).toThrow(/JWT_SECRET/);
  });

  it("requires the Anthropic key and model only when LLM_PROVIDER=claude", () => {
    expect(() => parseEnv({ ...valid, LLM_PROVIDER: "claude" })).toThrow(/ANTHROPIC_API_KEY, ANTHROPIC_MODEL/);
    expect(
      parseEnv({ ...valid, LLM_PROVIDER: "claude", ANTHROPIC_API_KEY: "k", ANTHROPIC_MODEL: "m" }).LLM_PROVIDER,
    ).toBe("claude");
  });

  it("requires Resend settings in production but not in development", () => {
    expect(() => parseEnv({ ...valid, NODE_ENV: "production" })).toThrow(/RESEND_API_KEY/);
    expect(parseEnv({ ...valid, NODE_ENV: "production", RESEND_API_KEY: "k", MAIL_FROM: "a@b.co" }).NODE_ENV).toBe(
      "production",
    );
    expect(() => parseEnv({ ...valid, RESEND_API_KEY: "k" })).toThrow(/MAIL_FROM/);
  });
});
