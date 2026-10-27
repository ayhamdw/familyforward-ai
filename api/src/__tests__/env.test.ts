import { EnvError, parseEnv } from "../config/env";

const valid = {
  NODE_ENV: "development",
  MONGODB_URI: "mongodb://example.invalid/placeholder",
  DB_NAME: "familyforward_dev",
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
    expect((error as EnvError).variables.sort()).toEqual(["DB_NAME", "MONGODB_URI"]);
  });

  it("does not echo values in the error message", () => {
    expect(() => parseEnv({ ...valid, NODE_ENV: "super-secret-value" })).toThrow(/NODE_ENV/);
    expect(() => parseEnv({ ...valid, NODE_ENV: "super-secret-value" })).not.toThrow(/super-secret-value/);
  });

  it("rejects an invalid PORT", () => {
    expect(() => parseEnv({ ...valid, PORT: "abc" })).toThrow(/PORT/);
  });
});
