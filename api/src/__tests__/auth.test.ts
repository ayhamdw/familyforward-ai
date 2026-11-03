import jwt from "jsonwebtoken";
import request from "supertest";
import { createApp } from "../app";
import { hashEmail } from "../lib/crypto";
import { AuthCode, Parent } from "../models";
import type { AuthLimits } from "../routes/auth";
import { MAX_ATTEMPTS } from "../services/auth.service";
import { FakeMailer, TEST_CODE_SECRET, TEST_JWT_SECRET, testAppConfig } from "./helpers/testApp";
import { clearTestDb, startTestDb, stopTestDb } from "./helpers/testDb";

const EMAIL = "Parent@Example.com";
const BIG: AuthLimits = {
  windowMs: 60_000,
  requestCodePerIp: 1000,
  requestCodePerEmail: 1000,
  verifyPerIp: 1000,
  verifyPerEmail: 1000,
};

function setup(limits: AuthLimits = BIG) {
  const mailer = new FakeMailer();
  const app = createApp(testAppConfig({ mailer, authLimits: limits }));
  return { app, mailer };
}

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(clearTestDb);

describe("POST /auth/request-code", () => {
  it("answers 200 with the same body for new and known emails", async () => {
    const { app } = setup();
    await Parent.create({ email: "known@example.com" });
    const a = await request(app).post("/auth/request-code").send({ email: "known@example.com" });
    const b = await request(app).post("/auth/request-code").send({ email: "stranger@example.com" });
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    expect(a.body).toEqual(b.body);
  });

  it("answers the same even when the mail provider fails", async () => {
    const { app, mailer } = setup();
    mailer.fail = true;
    const res = await request(app).post("/auth/request-code").send({ email: EMAIL });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("rejects an invalid email", async () => {
    const { app } = setup();
    const res = await request(app).post("/auth/request-code").send({ email: "not-an-email" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_email");
  });

  it("stores only hashes: no code and no email in the auth code row", async () => {
    const { app, mailer } = setup();
    await request(app).post("/auth/request-code").send({ email: EMAIL });
    const code = mailer.lastCode();
    expect(code).toMatch(/^\d{6}$/);
    const rows = await AuthCode.collection.find({}).toArray();
    expect(rows).toHaveLength(1);
    const dump = JSON.stringify(rows);
    expect(dump).not.toContain(code);
    expect(dump.toLowerCase()).not.toContain("parent@example.com");
    expect(rows[0].emailHash).toBe(hashEmail(TEST_CODE_SECRET, EMAIL));
    expect(rows[0].codeHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("expires the code in 10 minutes and replaces older codes", async () => {
    const { app, mailer } = setup();
    const before = Date.now();
    await request(app).post("/auth/request-code").send({ email: EMAIL });
    const first = mailer.lastCode();
    const row = await AuthCode.findOne();
    const ttl = row!.expiresAt.getTime() - before;
    expect(ttl).toBeGreaterThan(9 * 60_000);
    expect(ttl).toBeLessThanOrEqual(10 * 60_000 + 5_000);

    await request(app).post("/auth/request-code").send({ email: EMAIL });
    expect(await AuthCode.countDocuments()).toBe(1);
    const second = mailer.lastCode();
    if (first !== second) {
      const old = await request(app).post("/auth/verify").send({ email: EMAIL, code: first });
      expect(old.status).toBe(400);
    }
    const ok = await request(app).post("/auth/verify").send({ email: EMAIL, code: second });
    expect(ok.status).toBe(200);
  });
});

describe("POST /auth/verify", () => {
  async function requestCode(app: ReturnType<typeof setup>["app"], mailer: FakeMailer, email = EMAIL) {
    await request(app).post("/auth/request-code").send({ email });
    return mailer.lastCode();
  }

  it("signs in, creates the parent, deletes the code and returns a 30-day token", async () => {
    const { app, mailer } = setup();
    const code = await requestCode(app, mailer);
    const res = await request(app).post("/auth/verify").send({ email: "parent@example.com", code });
    expect(res.status).toBe(200);

    const parent = await Parent.findOne({ email: "parent@example.com" });
    expect(parent).not.toBeNull();
    expect(parent!.lastLoginAt).toBeInstanceOf(Date);
    expect(await AuthCode.countDocuments()).toBe(0);

    const payload = jwt.verify(res.body.token, TEST_JWT_SECRET) as jwt.JwtPayload;
    expect(payload.sub).toBe(String(parent!._id));
    expect(payload.exp! - payload.iat!).toBe(30 * 24 * 60 * 60);
  });

  it("reuses the parent on a second sign in", async () => {
    const { app, mailer } = setup();
    for (let i = 0; i < 2; i += 1) {
      const code = await requestCode(app, mailer);
      expect((await request(app).post("/auth/verify").send({ email: EMAIL, code })).status).toBe(200);
    }
    expect(await Parent.countDocuments()).toBe(1);
  });

  it("does not accept the same code twice", async () => {
    const { app, mailer } = setup();
    const code = await requestCode(app, mailer);
    await request(app).post("/auth/verify").send({ email: EMAIL, code });
    const again = await request(app).post("/auth/verify").send({ email: EMAIL, code });
    expect(again.status).toBe(400);
    expect(again.body.error.code).toBe("code_expired");
  });

  it("rejects a wrong code and locks after 5 attempts, even for the right code", async () => {
    const { app, mailer } = setup();
    const code = await requestCode(app, mailer);
    const wrong = code === "000000" ? "111111" : "000000";
    for (let i = 0; i < MAX_ATTEMPTS; i += 1) {
      const res = await request(app).post("/auth/verify").send({ email: EMAIL, code: wrong });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("invalid_code");
    }
    const locked = await request(app).post("/auth/verify").send({ email: EMAIL, code });
    expect(locked.status).toBe(400);
    expect(locked.body.error.code).toBe("code_expired");
    expect(await Parent.countDocuments()).toBe(0);
  });

  it("rejects an expired code", async () => {
    const { app, mailer } = setup();
    const code = await requestCode(app, mailer);
    await AuthCode.updateMany({}, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    const res = await request(app).post("/auth/verify").send({ email: EMAIL, code });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("code_expired");
  });

  it("gives the same answer for an email that never asked for a code", async () => {
    const { app } = setup();
    const res = await request(app).post("/auth/verify").send({ email: "nobody@example.com", code: "123456" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("code_expired");
  });

  it("rejects malformed input", async () => {
    const { app } = setup();
    const res = await request(app).post("/auth/verify").send({ email: EMAIL, code: "12ab56" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_input");
  });
});

describe("rate limits", () => {
  const SMALL: AuthLimits = { ...BIG, requestCodePerEmail: 2, requestCodePerIp: 4, verifyPerEmail: 2, verifyPerIp: 4 };

  it("limits request-code per email, case-insensitively", async () => {
    const { app } = setup(SMALL);
    await request(app).post("/auth/request-code").send({ email: "a@example.com" });
    await request(app).post("/auth/request-code").send({ email: "A@example.com" });
    const res = await request(app).post("/auth/request-code").send({ email: "a@EXAMPLE.com" });
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe("rate_limited");
    // A different email from the same IP is still allowed.
    const other = await request(app).post("/auth/request-code").send({ email: "b@example.com" });
    expect(other.status).toBe(200);
  });

  it("limits request-code per IP", async () => {
    const { app } = setup(SMALL);
    const statuses: number[] = [];
    for (let i = 0; i < 5; i += 1) {
      statuses.push((await request(app).post("/auth/request-code").send({ email: `u${i}@example.com` })).status);
    }
    expect(statuses).toEqual([200, 200, 200, 200, 429]);
  });

  it("limits verify per email and per IP", async () => {
    const { app } = setup(SMALL);
    const body = { email: "a@example.com", code: "123456" };
    expect((await request(app).post("/auth/verify").send(body)).status).toBe(400);
    expect((await request(app).post("/auth/verify").send(body)).status).toBe(400);
    expect((await request(app).post("/auth/verify").send(body)).status).toBe(429);

    const { app: app2 } = setup(SMALL);
    const statuses: number[] = [];
    for (let i = 0; i < 5; i += 1) {
      statuses.push(
        (await request(app2).post("/auth/verify").send({ email: `u${i}@example.com`, code: "123456" })).status,
      );
    }
    expect(statuses).toEqual([400, 400, 400, 400, 429]);
  });

  it("uses the client IP from X-Forwarded-For (trust proxy 1)", async () => {
    const { app } = setup(SMALL);
    for (let i = 0; i < 4; i += 1) {
      await request(app).post("/auth/request-code").set("x-forwarded-for", "203.0.113.1").send({ email: `v${i}@example.com` });
    }
    const blocked = await request(app).post("/auth/request-code").set("x-forwarded-for", "203.0.113.1").send({ email: "v9@example.com" });
    const otherIp = await request(app).post("/auth/request-code").set("x-forwarded-for", "203.0.113.2").send({ email: "v9@example.com" });
    expect(blocked.status).toBe(429);
    expect(otherIp.status).toBe(200);
  });
});
