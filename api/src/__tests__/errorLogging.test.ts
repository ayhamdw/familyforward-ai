import express from "express";
import request from "supertest";
import { createHttpLogger, createLogger } from "../lib/logger";
import { errorHandler } from "../middleware/errorHandler";

const SURVEY_TEXT = "my son Mateo is afraid of the dark and wets the bed";

function setup() {
  const lines: string[] = [];
  const destination = { write: (chunk: string) => void lines.push(chunk) };
  const app = express();
  app.use(createHttpLogger(createLogger("info", destination)));
  app.get("/boom", () => {
    const err = new Error(`validation failed: ${SURVEY_TEXT}`, { cause: new Error(SURVEY_TEXT) });
    Object.assign(err, {
      code: "E_BOOM",
      errors: [{ message: SURVEY_TEXT }],
      value: SURVEY_TEXT,
    });
    throw err;
  });
  app.get("/boom-async", async () => {
    throw new TypeError(SURVEY_TEXT);
  });
  app.get("/boom-string", () => {
    throw SURVEY_TEXT;
  });
  app.use(errorHandler);
  return { app, lines };
}

async function waitForLog(lines: string[], count: number): Promise<void> {
  for (let i = 0; i < 50 && lines.length < count; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

describe("error logging", () => {
  it("logs only name, code, status and path, and never survey text", async () => {
    const { app, lines } = setup();
    const res = await request(app).get("/boom?answer=" + encodeURIComponent(SURVEY_TEXT));
    await waitForLog(lines, 2);

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });

    const entries = lines.map((line) => JSON.parse(line) as Record<string, unknown>);
    const errorEntry = entries.find((entry) => entry.msg === "Unhandled error");
    expect(errorEntry).toBeDefined();
    expect(errorEntry?.err).toEqual({ name: "Error", code: "E_BOOM" });
    expect(errorEntry?.status).toBe(500);
    expect(errorEntry?.path).toBe("/boom");

    const output = lines.join("");
    for (const forbidden of [
      SURVEY_TEXT,
      "Mateo",
      "validation failed",
      "answer=",
      "stack",
      "cause",
      "errors",
      "value",
      "node_modules",
      ".ts:",
    ]) {
      expect(output).not.toContain(forbidden);
    }
  });

  it("is safe for async errors and non-Error throws", async () => {
    const { app, lines } = setup();
    await request(app).get("/boom-async");
    await request(app).get("/boom-string");
    await waitForLog(lines, 4);

    const output = lines.join("");
    expect(output).not.toContain(SURVEY_TEXT);
    expect(output).not.toContain("Mateo");
    expect(output).toContain('"name":"TypeError"');
    expect(output).toContain('"name":"NonError"');
  });
});
