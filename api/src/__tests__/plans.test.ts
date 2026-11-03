import mongoose from "mongoose";
import request from "supertest";
import { createApp } from "../app";
import { MockLlmClient, type MockMode } from "../generation/llmClient";
import { AuthCode, Parent, Plan, Survey } from "../models";
import type { AuthLimits } from "../routes/auth";
import { signIn } from "./helpers/signIn";
import { SURVEY } from "./helpers/surveys";
import { FakeMailer, testAppConfig } from "./helpers/testApp";
import { clearTestDb, startTestDb, stopTestDb } from "./helpers/testDb";

const BIG: AuthLimits = { windowMs: 60_000, requestCodePerIp: 1000, requestCodePerEmail: 1000, verifyPerIp: 1000, verifyPerEmail: 1000 };

function setup(modes: MockMode | MockMode[] = "valid", planDailyLimit = 5) {
  const mailer = new FakeMailer();
  const llm = new MockLlmClient(modes);
  const app = createApp(testAppConfig({ mailer, llm, planDailyLimit, authLimits: BIG }));
  return { app, mailer, llm };
}

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(clearTestDb);

describe("POST /plans", () => {
  it("requires sign in", async () => {
    const { app } = setup();
    const res = await request(app).post("/plans").send(SURVEY);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("unauthorized");
  });

  it("creates and returns a plan, and saves the survey without a note", async () => {
    const { app, mailer } = setup();
    const token = await signIn(app, mailer, "a@example.com");
    const res = await request(app).post("/plans").set("authorization", `Bearer ${token}`).send({ ...SURVEY, note: "loves trucks" });
    expect(res.status).toBe(201);
    expect(res.body.source).toBe("ai");
    expect(res.body.days).toHaveLength(SURVEY.daysPerWeek);
    expect(res.body.closing).toMatch(/simple ideas/);
    expect(res.body.parentId).toBeUndefined();

    const survey = await Survey.collection.findOne({});
    expect(survey).not.toBeNull();
    expect(Object.keys(survey!).sort()).toEqual(
      ["__v", "_id", "ageBand", "createdAt", "daysPerWeek", "focusAreas", "interests", "language", "materials", "minutesPerDay", "parentId"].sort(),
    );
    expect(await Plan.countDocuments()).toBe(1);
  });

  it("flags noteIgnored when the note mentions health, without returning or storing the note", async () => {
    const { app, mailer, llm } = setup();
    const token = await signIn(app, mailer, "a@example.com");
    const post = (note?: string) =>
      request(app).post("/plans").set("authorization", `Bearer ${token}`).send(note === undefined ? SURVEY : { ...SURVEY, note });

    const health = await post("she has a speech delay, qwerty-note-text");
    expect(health.status).toBe(201);
    expect(health.body.noteIgnored).toBe(true);
    expect(JSON.stringify(health.body)).not.toMatch(/qwerty-note-text|speech delay/);
    expect(await mongoose.connection.db!.collection("plans").countDocuments({ noteIgnored: { $exists: true } })).toBe(0);

    // The note never reached the model.
    expect(llm.calls).toBe(1);

    const clean = await post("loves trucks");
    expect(clean.body.noteIgnored).toBe(false);
    expect((await post()).body.noteIgnored).toBe(false);
    expect((await post("   ")).body.noteIgnored).toBe(false);
  });

  it("still flags noteIgnored when the provider fails and a fallback plan is returned", async () => {
    const { app, mailer } = setup("error");
    const token = await signIn(app, mailer, "a@example.com");
    const res = await request(app).post("/plans").set("authorization", `Bearer ${token}`).send({ ...SURVEY, note: "autism" });
    expect(res.body.source).toBe("fallback");
    expect(res.body.noteIgnored).toBe(true);
  });

  it("returns a fallback plan when the provider fails", async () => {
    const { app, mailer } = setup("error");
    const token = await signIn(app, mailer, "a@example.com");
    const res = await request(app).post("/plans").set("authorization", `Bearer ${token}`).send(SURVEY);
    expect(res.status).toBe(201);
    expect(res.body.source).toBe("fallback");
  });

  it("rejects bad surveys and long notes without echoing them", async () => {
    const { app, mailer } = setup();
    const token = await signIn(app, mailer, "a@example.com");
    const bad = await request(app).post("/plans").set("authorization", `Bearer ${token}`).send({ ...SURVEY, minutesPerDay: 15, note: "secret-note-text" });
    expect(bad.status).toBe(400);
    expect(bad.body).toEqual({ error: { code: "invalid_survey", message: expect.any(String) } });
    expect(JSON.stringify(bad.body)).not.toContain("secret-note-text");
    const long = await request(app).post("/plans").set("authorization", `Bearer ${token}`).send({ ...SURVEY, note: "x".repeat(141) });
    expect(long.status).toBe(400);
    expect(await Plan.countDocuments()).toBe(0);
  });

  it("enforces the daily limit per parent with a clear code", async () => {
    const { app, mailer } = setup("valid", 2);
    const token = await signIn(app, mailer, "a@example.com");
    const post = (t: string) => request(app).post("/plans").set("authorization", `Bearer ${t}`).send(SURVEY);
    expect((await post(token)).status).toBe(201);
    expect((await post(token)).status).toBe(201);
    const limited = await post(token);
    expect(limited.status).toBe(429);
    expect(limited.body.error.code).toBe("plan_daily_limit");
    // Another parent is not affected.
    const other = await signIn(app, mailer, "b@example.com");
    expect((await post(other)).status).toBe(201);
    // Plans older than a day stop counting.
    await Plan.updateMany({}, { $set: { createdAt: new Date(Date.now() - 25 * 3600_000) } });
    expect((await post(token)).status).toBe(201);
  });
});

describe("GET /plans/current and GET /plans", () => {
  it("returns 404 before any plan, then the latest plan of this week", async () => {
    const { app, mailer } = setup();
    const token = await signIn(app, mailer, "a@example.com");
    const auth = { authorization: `Bearer ${token}` };
    const none = await request(app).get("/plans/current").set(auth);
    expect(none.status).toBe(404);
    expect(none.body.error.code).toBe("no_plan");
    const created = await request(app).post("/plans").set(auth).send(SURVEY);
    const current = await request(app).get("/plans/current").set(auth);
    expect(current.status).toBe(200);
    expect(current.body.id).toBe(created.body.id);
  });

  it("lists past weeks newest first, one per week, only for this parent", async () => {
    const { app, mailer } = setup();
    const token = await signIn(app, mailer, "a@example.com");
    const otherToken = await signIn(app, mailer, "b@example.com");
    const auth = { authorization: `Bearer ${token}` };
    await request(app).post("/plans").set(auth).send(SURVEY);
    await request(app).post("/plans").set({ authorization: `Bearer ${otherToken}` }).send(SURVEY);

    const mine = await Parent.findOne({ email: "a@example.com" });
    const template = await Plan.findOne({ parentId: mine!._id });
    const base = template!.toObject();
    const weeks = ["2026-10-05", "2026-10-19", "2026-10-12"];
    for (const w of weeks) {
      const { _id, ...rest } = base;
      void _id;
      await Plan.create({ ...rest, weekStart: new Date(`${w}T00:00:00Z`), createdAt: new Date() });
    }
    // A second plan in the same past week: only the latest one is listed.
    const { _id, ...rest } = base;
    void _id;
    await Plan.create({ ...rest, weekStart: new Date("2026-10-19T00:00:00Z"), createdAt: new Date(Date.now() + 1000), source: "fallback" });

    const res = await request(app).get("/plans").set(auth);
    expect(res.status).toBe(200);
    expect(res.body.plans.map((p: { weekStart: string }) => p.weekStart)).toEqual(["2026-10-19", "2026-10-12", "2026-10-05"]);
    expect(res.body.plans[0].source).toBe("fallback");
  });
});

describe("DELETE /me", () => {
  it("deletes the parent, surveys, plans and codes, and keeps other parents", async () => {
    const { app, mailer } = setup();
    const token = await signIn(app, mailer, "a@example.com");
    const otherToken = await signIn(app, mailer, "b@example.com");
    for (const t of [token, otherToken]) {
      await request(app).post("/plans").set("authorization", `Bearer ${t}`).send(SURVEY);
    }
    await request(app).post("/auth/request-code").send({ email: "a@example.com" });
    expect(await AuthCode.countDocuments()).toBe(1);

    const res = await request(app).delete("/me").set("authorization", `Bearer ${token}`);
    expect(res.status).toBe(204);

    const a = await Parent.findOne({ email: "a@example.com" });
    expect(a).toBeNull();
    expect(await Parent.countDocuments()).toBe(1);
    expect(await Plan.countDocuments()).toBe(1);
    expect(await Survey.countDocuments()).toBe(1);
    expect(await AuthCode.countDocuments()).toBe(0);

    // The old token no longer works.
    const again = await request(app).get("/plans/current").set("authorization", `Bearer ${token}`);
    expect(again.status).toBe(401);
  });

  it("requires sign in", async () => {
    const { app } = setup();
    expect((await request(app).delete("/me")).status).toBe(401);
  });
});

describe("error format", () => {
  it("uses {error:{code,message}} with no stack traces", async () => {
    const { app, mailer } = setup();
    const token = await signIn(app, mailer, "a@example.com");
    const cases = [
      await request(app).get("/nope"),
      await request(app).post("/plans").set("authorization", `Bearer ${token}`).set("content-type", "application/json").send("{bad"),
      await request(app).get("/plans/current").set("authorization", "Bearer x"),
      await request(app).post("/auth/request-code").send({ email: "nope" }),
    ];
    for (const res of cases) {
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(Object.keys(res.body)).toEqual(["error"]);
      expect(Object.keys(res.body.error).sort()).toEqual(["code", "message"]);
      expect(JSON.stringify(res.body)).not.toMatch(/stack|node_modules|\.ts:/);
    }
  });
});
