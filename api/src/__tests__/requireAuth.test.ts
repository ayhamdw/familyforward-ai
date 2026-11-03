import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { errorHandler } from "../middleware/errorHandler";
import { requireAuth } from "../middleware/requireAuth";
import { Parent } from "../models";
import { createMailer } from "../services/mailer";
import { TEST_JWT_SECRET } from "./helpers/testApp";
import { clearTestDb, startTestDb, stopTestDb } from "./helpers/testDb";

const app = express();
app.get("/protected", requireAuth(TEST_JWT_SECRET), (req, res) => {
  res.json({ parentId: req.parentId });
});
app.use(errorHandler);

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(clearTestDb);

describe("requireAuth", () => {
  it("accepts a valid token and sets parentId", async () => {
    const parent = await Parent.create({ email: "a@example.com" });
    const token = jwt.sign({}, TEST_JWT_SECRET, { subject: String(parent._id), expiresIn: "1h" });
    const res = await request(app).get("/protected").set("authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.parentId).toBe(String(parent._id));
  });

  it("rejects missing, malformed, expired, wrong-secret and unsigned tokens with one error", async () => {
    const parent = await Parent.create({ email: "a@example.com" });
    const sub = String(parent._id);
    const bad = [
      undefined,
      "Bearer",
      "Bearer not-a-jwt",
      `Bearer ${jwt.sign({}, TEST_JWT_SECRET, { subject: sub, expiresIn: -10 })}`,
      `Bearer ${jwt.sign({}, "x".repeat(40), { subject: sub })}`,
      `Bearer ${jwt.sign({}, "", { subject: sub, algorithm: "none" })}`,
      `Bearer ${jwt.sign({}, TEST_JWT_SECRET, { subject: "not-an-object-id" })}`,
    ];
    for (const header of bad) {
      const req = request(app).get("/protected");
      const res = await (header ? req.set("authorization", header) : req);
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: { code: "unauthorized", message: "Please sign in again." } });
    }
  });

  it("rejects a valid token whose parent was deleted", async () => {
    const parent = await Parent.create({ email: "a@example.com" });
    const token = jwt.sign({}, TEST_JWT_SECRET, { subject: String(parent._id), expiresIn: "1h" });
    await Parent.deleteOne({ _id: parent._id });
    const res = await request(app).get("/protected").set("authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
  });
});

describe("createMailer", () => {
  it("never falls back to the console outside development", () => {
    expect(() => createMailer({ NODE_ENV: "production" })).toThrow();
    expect(() => createMailer({ NODE_ENV: "test" })).toThrow();
  });

  it("uses the console only in development without a key", async () => {
    const mailer = createMailer({ NODE_ENV: "development" });
    expect(mailer.constructor.name).toBe("ConsoleMailer");
    const withKey = createMailer({ NODE_ENV: "development", RESEND_API_KEY: "k", MAIL_FROM: "a@b.co" });
    expect(withKey.constructor.name).toBe("ResendMailer");
  });
});
