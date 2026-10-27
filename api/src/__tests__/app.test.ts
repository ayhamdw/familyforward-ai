import request from "supertest";
import { createApp } from "../app";

const app = createApp({ nodeEnv: "test", logLevel: "silent" });

describe("API", () => {
  it("GET /health returns 200 with status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.env).toBe("test");
    expect(typeof res.body.uptimeSeconds).toBe("number");
  });

  it("GET /health/db returns 503 when MongoDB is not connected", async () => {
    const res = await request(app).get("/health/db");
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ db: "down" });
  });

  it("returns a JSON 404 for unknown routes", async () => {
    const res = await request(app).get("/nope");
    expect(res.status).toBe(404);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(res.body).toEqual({ error: "Not found" });
  });

  it("returns a generic 400 for malformed JSON without leaking details", async () => {
    const res = await request(app)
      .post("/health")
      .set("content-type", "application/json")
      .send("{bad");
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(JSON.stringify(res.body)).not.toMatch(/stack|node_modules/i);
  });

  it("does not send x-powered-by", async () => {
    const res = await request(app).get("/health");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});
