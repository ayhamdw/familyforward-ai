import request from "supertest";
import { createApp } from "../app";

function setup() {
  const lines: string[] = [];
  const destination = { write: (chunk: string) => void lines.push(chunk) };
  const app = createApp({ nodeEnv: "test", logLevel: "info", logDestination: destination });
  return { app, lines };
}

async function waitForLog(lines: string[]): Promise<void> {
  for (let i = 0; i < 50 && lines.length === 0; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

describe("request logging", () => {
  it("logs only method, path, status code and responseTime", async () => {
    const { app, lines } = setup();
    await request(app).get("/health").set("user-agent", "test-agent");
    await waitForLog(lines);

    const entry = JSON.parse(lines[0]) as Record<string, unknown>;
    expect(entry.req).toEqual({ method: "GET", url: "/health" });
    expect(entry.res).toEqual({ statusCode: 200 });
    expect(typeof entry.responseTime).toBe("number");
    expect(Object.keys(entry).sort()).toEqual(["level", "msg", "req", "res", "responseTime", "time"]);
  });

  it("never logs query strings, forwarded IPs, cookies or other headers", async () => {
    const { app, lines } = setup();
    await request(app)
      .get("/health?token=secret-token-123&email=parent@example.com")
      .set("x-forwarded-for", "203.0.113.9")
      .set("cf-connecting-ip", "198.51.100.7")
      .set("cookie", "session=cookie-value-456")
      .set("authorization", "Bearer bearer-value-789");
    await request(app).get("/nope?q=another-secret").set("x-forwarded-for", "203.0.113.10");
    await waitForLog(lines);

    const output = lines.join("");
    expect(lines.length).toBeGreaterThanOrEqual(2);
    for (const forbidden of [
      "secret-token-123",
      "parent@example.com",
      "another-secret",
      "token=",
      "?",
      "203.0.113.9",
      "203.0.113.10",
      "198.51.100.7",
      "x-forwarded-for",
      "cf-connecting-ip",
      "cookie",
      "authorization",
      "bearer-value-789",
      "remoteAddress",
      "127.0.0.1",
      "::1",
    ]) {
      expect(output).not.toContain(forbidden);
    }
    const urls = lines.map((line) => (JSON.parse(line) as { req: { url: string } }).req.url);
    expect(urls).toEqual(["/health", "/nope"]);
  });

  it("never logs request bodies", async () => {
    const { app, lines } = setup();
    await request(app).post("/health").send({ answer: "child-name-xyz" });
    await waitForLog(lines);
    expect(lines.join("")).not.toContain("child-name-xyz");
  });
});
