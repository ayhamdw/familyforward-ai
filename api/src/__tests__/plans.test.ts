import mongoose from "mongoose";
import request from "supertest";
import { createApp } from "../app";
import { MockLlmClient, type MockMode } from "../generation/llmClient";
import { Child, Parent, Plan, Survey } from "../models";
import type { AuthLimits } from "../routes/auth";
import { ANSWERS, auth, createChild } from "./helpers/children";
import { signIn } from "./helpers/signIn";
import { FakeMailer, testAppConfig } from "./helpers/testApp";
import { clearTestDb, startTestDb, stopTestDb } from "./helpers/testDb";

const BIG: AuthLimits = { windowMs: 60_000, requestCodePerIp: 1000, requestCodePerEmail: 1000, verifyPerIp: 1000, verifyPerEmail: 1000 };

function setup(modes: MockMode | MockMode[] = "valid", planDailyLimit = 5) {
  const mailer = new FakeMailer();
  const llm = new MockLlmClient(modes);
  const app = createApp(testAppConfig({ mailer, llm, planDailyLimit, authLimits: BIG }));
  return { app, mailer, llm };
}

async function start(modes: MockMode | MockMode[] = "valid", planDailyLimit = 5, email = "a@example.com") {
  const ctx = setup(modes, planDailyLimit);
  const token = await signIn(ctx.app, ctx.mailer, email);
  const childId = await createChild(ctx.app, token);
  return { ...ctx, token, childId };
}

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(clearTestDb);

describe("POST /plans", () => {
  it("requires sign in", async () => {
    const { app } = setup();
    const res = await request(app).post("/plans").send({ ...ANSWERS, childId: "x" });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("unauthorized");
  });

  it("requires a childId and rejects an age band in the body", async () => {
    const { app, token, childId } = await start();
    const noChild = await request(app).post("/plans").set(auth(token)).send(ANSWERS);
    expect(noChild.status).toBe(400);
    expect(noChild.body.error.code).toBe("invalid_survey");
    const withAge = await request(app).post("/plans").set(auth(token)).send({ ...ANSWERS, childId, ageBand: "4-5" });
    expect(withAge.status).toBe(400);
  });

  it("creates a complete plan using the child's age band, and saves the survey without a note", async () => {
    const { app, token, childId } = await start();
    const res = await request(app).post("/plans").set(auth(token)).send({ ...ANSWERS, childId, note: "loves trucks" });
    expect(res.status).toBe(201);
    expect(res.body.source).toBe("ai");
    expect(res.body.childId).toBe(childId);
    expect(res.body.days).toHaveLength(ANSWERS.daysPerWeek);
    expect(res.body.days[0]).toMatchObject({ done: false, reaction: null });
    expect(res.body.summary.length).toBeGreaterThan(10);
    expect(res.body.resourceIds.length).toBeGreaterThanOrEqual(2);
    expect(res.body.checkIn.length).toBeGreaterThanOrEqual(2);
    expect(res.body.closing).toMatch(/simple ideas/);
    expect(res.body.parentId).toBeUndefined();

    const survey = await Survey.collection.findOne({});
    expect(survey!.ageBand).toBe("2-3");
    expect(Object.keys(survey!).sort()).toEqual(
      ["__v", "_id", "ageBand", "childId", "createdAt", "daysPerWeek", "focusAreas", "interests", "language", "materials", "minutesPerDay", "parentId"].sort(),
    );
    expect(await Plan.countDocuments()).toBe(1);
  });

  it("gives the model the child's age band and home languages, never the nickname", async () => {
    const prompts: string[] = [];
    const mailer = new FakeMailer();
    const inner = new MockLlmClient("valid");
    const llm = { calls: 0, generate: (r: Parameters<MockLlmClient["generate"]>[0]) => (prompts.push(r.user), inner.generate(r)) };
    const app = createApp(testAppConfig({ mailer, llm: llm as unknown as MockLlmClient, authLimits: BIG }));
    const token = await signIn(app, mailer, "a@example.com");
    const childId = await createChild(app, token, { nickname: "Zebrito", ageBand: "4-5", homeLanguages: ["es", "other"] });
    await request(app).post("/plans").set(auth(token)).send({ ...ANSWERS, childId });
    expect(prompts).toHaveLength(1);
    expect(prompts[0]).toMatch(/"ageBand": "4-5"/);
    expect(prompts[0]).toMatch(/"es"/);
    expect(prompts[0]).not.toMatch(/Zebrito/);
  });

  it("returns a fallback plan when the provider fails", async () => {
    const { app, token, childId } = await start("error");
    const res = await request(app).post("/plans").set(auth(token)).send({ ...ANSWERS, childId });
    expect(res.status).toBe(201);
    expect(res.body.source).toBe("fallback");
  });

  it("rejects bad surveys and long notes without echoing them", async () => {
    const { app, token, childId } = await start();
    const bad = await request(app).post("/plans").set(auth(token)).send({ ...ANSWERS, childId, minutesPerDay: 15, note: "secret-note-text" });
    expect(bad.status).toBe(400);
    expect(bad.body).toEqual({ error: { code: "invalid_survey", message: expect.any(String) } });
    expect(JSON.stringify(bad.body)).not.toContain("secret-note-text");
    const long = await request(app).post("/plans").set(auth(token)).send({ ...ANSWERS, childId, note: "x".repeat(141) });
    expect(long.status).toBe(400);
    const extra = await request(app).post("/plans").set(auth(token)).send({ ...ANSWERS, childId, riskLevel: "low" });
    expect(extra.status).toBe(400);
    expect(await Plan.countDocuments()).toBe(0);
  });

  it("only works for the parent's own child", async () => {
    const { app, mailer, token, childId } = await start();
    const other = await signIn(app, mailer, "b@example.com");
    const res = await request(app).post("/plans").set(auth(other)).send({ ...ANSWERS, childId });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("child_not_found");
    const bogus = await request(app).post("/plans").set(auth(token)).send({ ...ANSWERS, childId: "not-an-id" });
    expect(bogus.status).toBe(404);
    expect(await Plan.countDocuments()).toBe(0);
  });

  it("refuses a second plan for the week unless regenerate is true, and regenerate replaces it", async () => {
    const { app, token, childId } = await start();
    const first = await request(app).post("/plans").set(auth(token)).send({ ...ANSWERS, childId });
    const again = await request(app).post("/plans").set(auth(token)).send({ ...ANSWERS, childId });
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe("plan_exists");
    const regen = await request(app).post("/plans").set(auth(token)).send({ ...ANSWERS, childId, regenerate: true });
    expect(regen.status).toBe(201);
    expect(regen.body.id).not.toBe(first.body.id);
    // The old plan is kept but marked replaced, so only the new one is current.
    expect(await Plan.countDocuments({ replacedAt: null })).toBe(1);
    const current = await request(app).get(`/plans/current?childId=${childId}`).set(auth(token));
    expect(current.body.id).toBe(regen.body.id);
  });

  it("enforces the daily limit per parent, counting regenerates, with a clear code", async () => {
    const { app, mailer, token, childId } = await start("valid", 2);
    const post = (t: string, c: string, regenerate = false) => request(app).post("/plans").set(auth(t)).send({ ...ANSWERS, childId: c, regenerate });
    expect((await post(token, childId)).status).toBe(201);
    expect((await post(token, childId, true)).status).toBe(201);
    const limited = await post(token, childId, true);
    expect(limited.status).toBe(429);
    expect(limited.body.error.code).toBe("plan_daily_limit");
    // The current plan is untouched when a regenerate is refused.
    expect(await Plan.countDocuments({ replacedAt: null })).toBe(1);
    // Another parent is not affected.
    const other = await signIn(app, mailer, "b@example.com");
    const otherChild = await createChild(app, other);
    expect((await post(other, otherChild)).status).toBe(201);
    // Plans older than a day stop counting.
    await Plan.updateMany({}, { $set: { createdAt: new Date(Date.now() - 25 * 3600_000) } });
    expect((await post(token, childId, true)).status).toBe(201);
  });
});

describe("concern handling", () => {
  it("replaces the note with one fixed card, never uses, stores or returns the note", async () => {
    const { app, token, childId, llm } = await start();
    const res = await request(app).post("/plans").set(auth(token)).send({ ...ANSWERS, childId, note: "she has a speech delay, qwerty-note-text" });
    expect(res.status).toBe(201);
    expect(res.body.noteIgnored).toBe(false);
    expect(res.body.worthNoticing).toHaveLength(1);
    expect(res.body.worthNoticing[0]).toEqual({
      observation: "Thanks for telling us. We can't give advice about development, but this is worth mentioning to your child's teacher or pediatrician.",
      tryThis: "I have a question about how my child is learning. Can we talk about it?",
      mentionTo: "pediatrician",
      resourceIds: ["illinois-early-intervention", "cps-child-find", "211-metro-chicago"],
    });
    expect(JSON.stringify(res.body)).not.toMatch(/qwerty-note-text|speech delay/);
    expect(llm.calls).toBe(1);
  });

  it("uses the 4-5 resources and the teacher for an older child, in Spanish", async () => {
    const { app, token } = await start();
    const older = await createChild(app, token, { nickname: "Max", ageBand: "4-5" });
    const res = await request(app).post("/plans").set(auth(token)).send({ ...ANSWERS, language: "es", childId: older, note: "autismo" });
    expect(res.body.worthNoticing).toHaveLength(1);
    expect(res.body.worthNoticing[0].mentionTo).toBe("teacher");
    expect(res.body.worthNoticing[0].resourceIds).toEqual(["cps-child-find", "211-metro-chicago", "chicago-public-library"]);
    expect(res.body.worthNoticing[0].observation).toMatch(/^Gracias por contárnoslo/);
  });

  it("flags noteIgnored for a clean note when a fallback plan is returned", async () => {
    const { app, token, childId } = await start("error");
    const res = await request(app).post("/plans").set(auth(token)).send({ ...ANSWERS, childId, note: "loves trucks" });
    expect(res.body.source).toBe("fallback");
    expect(res.body.noteIgnored).toBe(true);
  });
});

describe("feedback and previousPlanId", () => {
  async function plannedWeek() {
    const ctx = await start();
    const first = await request(ctx.app).post("/plans").set(auth(ctx.token)).send({ ...ANSWERS, childId: ctx.childId });
    return { ...ctx, first };
  }

  it("builds the prompt feedback from counts only", async () => {
    const prompts: string[] = [];
    const mailer = new FakeMailer();
    const inner = new MockLlmClient("valid");
    const llm = { generate: (r: Parameters<MockLlmClient["generate"]>[0]) => (prompts.push(r.user), inner.generate(r)) };
    const app = createApp(testAppConfig({ mailer, llm: llm as unknown as MockLlmClient, authLimits: BIG }));
    const token = await signIn(app, mailer, "a@example.com");
    const childId = await createChild(app, token);
    const first = await request(app).post("/plans").set(auth(token)).send({ ...ANSWERS, childId });
    await request(app).patch(`/plans/${first.body.id}/activities/0`).set(auth(token)).send({ done: true, reaction: "loved" });
    await request(app).patch(`/plans/${first.body.id}/activities/1`).set(auth(token)).send({ done: true, reaction: "didnt_work" });
    await request(app).post(`/plans/${first.body.id}/checkin`).set(auth(token)).send({ answers: ["yes", "somewhat", "no"] });
    await request(app).post("/plans").set(auth(token)).send({ ...ANSWERS, childId, regenerate: true, previousPlanId: first.body.id });
    const block = prompts[1].slice(prompts[1].indexOf("Last week (counts only):"));
    expect(block).toMatch(/completed in talking: 2/);
    expect(block).toMatch(/reactions in talking: loved=1, didnt_work=1/);
    expect(block).toMatch(/didnt_work=1/);
    expect(block).toMatch(/check-in answers: yes=1, somewhat=1, no=1/);
    // No activity titles or any other free text from the old plan.
    for (const day of first.body.days) expect(block).not.toContain(day.activity.title);
    expect(prompts[0]).not.toMatch(/Last week/);
  });

  it("the fallback leans on loved focus areas and skips activities that did not work", async () => {
    const { app, token, childId, first } = await plannedWeek();
    // Rate the first activity "didn't work" and mark a different focus loved by editing the stored plan.
    await request(app).patch(`/plans/${first.body.id}/activities/0`).set(auth(token)).send({ done: true, reaction: "didnt_work" });
    const avoidId = first.body.days[0].activity.id as string;
    await Plan.updateOne({ _id: first.body.id }, { $set: { "days.1.activity.focus": "movement", "days.1.reaction": "loved" } });
    const llmFails = createApp(testAppConfig({ mailer: new FakeMailer(), llm: new MockLlmClient("error"), authLimits: BIG }));
    void llmFails;
    // Use the same app but a failing provider by swapping through a new app on the same database.
    const mailer = new FakeMailer();
    const app2 = createApp(testAppConfig({ mailer, llm: new MockLlmClient("error"), authLimits: BIG }));
    const token2 = await signIn(app2, mailer, "a@example.com");
    const res = await request(app2)
      .post("/plans")
      .set(auth(token2))
      .send({ ...ANSWERS, focusAreas: ["talking", "reading"], materials: ["paper", "kitchen", "toys", "books"], daysPerWeek: 3, childId, regenerate: true, previousPlanId: first.body.id });
    expect(res.status).toBe(201);
    expect(res.body.source).toBe("fallback");
    const ids = res.body.days.map((d: { activity: { id: string } }) => d.activity.id);
    expect(ids).not.toContain(avoidId);
    expect(res.body.days[0].activity.focus).toBe("talking");
  });

  it("only accepts the same parent's plan for that child", async () => {
    const { app, mailer, token, childId, first } = await plannedWeek();
    const bogus = await request(app).post("/plans").set(auth(token)).send({ ...ANSWERS, childId, regenerate: true, previousPlanId: "not-an-id" });
    expect(bogus.status).toBe(404);
    const other = await signIn(app, mailer, "b@example.com");
    const otherChild = await createChild(app, other);
    const stolen = await request(app).post("/plans").set(auth(other)).send({ ...ANSWERS, childId: otherChild, previousPlanId: first.body.id });
    expect(stolen.status).toBe(404);
    expect(stolen.body.error.code).toBe("plan_not_found");
  });
});

describe("PATCH /plans/:planId/activities/:index", () => {
  it("saves done and a reaction, and clears the reaction with null", async () => {
    const { app, token, childId } = await start();
    const plan = await request(app).post("/plans").set(auth(token)).send({ ...ANSWERS, childId });
    const set = await request(app).patch(`/plans/${plan.body.id}/activities/1`).set(auth(token)).send({ done: true, reaction: "loved" });
    expect(set.status).toBe(200);
    expect(set.body.days[1]).toMatchObject({ done: true, reaction: "loved" });
    expect(set.body.days[0]).toMatchObject({ done: false, reaction: null });
    const clear = await request(app).patch(`/plans/${plan.body.id}/activities/1`).set(auth(token)).send({ done: false, reaction: null });
    expect(clear.body.days[1]).toMatchObject({ done: false, reaction: null });
  });

  it("rejects bad bodies, bad indexes and other parents' plans", async () => {
    const { app, mailer, token, childId } = await start();
    const plan = await request(app).post("/plans").set(auth(token)).send({ ...ANSWERS, childId });
    const url = (i: number | string) => `/plans/${plan.body.id}/activities/${i}`;
    expect((await request(app).patch(url(0)).set(auth(token)).send({ done: true, reaction: "great" })).status).toBe(400);
    expect((await request(app).patch(url(0)).set(auth(token)).send({ done: true })).status).toBe(400);
    expect((await request(app).patch(url(0)).set(auth(token)).send({ done: true, reaction: null, note: "hi" })).status).toBe(400);
    expect((await request(app).patch(url(9)).set(auth(token)).send({ done: true, reaction: null })).status).toBe(404);
    expect((await request(app).patch(url("x")).set(auth(token)).send({ done: true, reaction: null })).status).toBe(404);
    const other = await signIn(app, mailer, "b@example.com");
    const foreign = await request(app).patch(url(0)).set(auth(other)).send({ done: true, reaction: "loved" });
    expect(foreign.status).toBe(404);
    expect((await Plan.findById(plan.body.id))!.days[0].done).toBe(false);
  });
});

describe("POST /plans/:planId/checkin", () => {
  it("saves one answer per question and rejects wrong lengths and values", async () => {
    const { app, mailer, token, childId } = await start();
    const plan = await request(app).post("/plans").set(auth(token)).send({ ...ANSWERS, childId });
    const n = plan.body.checkIn.length as number;
    const url = `/plans/${plan.body.id}/checkin`;
    const ok = await request(app).post(url).set(auth(token)).send({ answers: Array(n).fill("somewhat") });
    expect(ok.status).toBe(200);
    expect(ok.body.checkInAnswers).toEqual(Array(n).fill("somewhat"));
    expect((await request(app).post(url).set(auth(token)).send({ answers: Array(n + 1).fill("yes").slice(0, 3) })).status).toBe(n === 3 ? 200 : 400);
    expect((await request(app).post(url).set(auth(token)).send({ answers: ["yes"] })).status).toBe(400);
    expect((await request(app).post(url).set(auth(token)).send({ answers: Array(n).fill("maybe") })).status).toBe(400);
    expect((await request(app).post(url).set(auth(token)).send({ answers: Array(n).fill("yes"), extra: 1 })).status).toBe(400);
    const other = await signIn(app, mailer, "b@example.com");
    expect((await request(app).post(url).set(auth(other)).send({ answers: Array(n).fill("yes") })).status).toBe(404);
  });
});

describe("GET /plans/current and GET /plans", () => {
  it("returns 404 before any plan, then the plan of this week", async () => {
    const { app, token, childId } = await start();
    const none = await request(app).get("/plans/current").set(auth(token));
    expect(none.status).toBe(404);
    expect(none.body.error.code).toBe("no_plan");
    const created = await request(app).post("/plans").set(auth(token)).send({ ...ANSWERS, childId });
    const current = await request(app).get("/plans/current").set(auth(token));
    expect(current.status).toBe(200);
    expect(current.body.id).toBe(created.body.id);
  });

  it("lists past weeks newest first, one per week and child, only for this parent", async () => {
    const { app, mailer, token, childId } = await start();
    const otherToken = await signIn(app, mailer, "b@example.com");
    const otherChild = await createChild(app, otherToken);
    await request(app).post("/plans").set(auth(token)).send({ ...ANSWERS, childId });
    await request(app).post("/plans").set(auth(otherToken)).send({ ...ANSWERS, childId: otherChild });

    const mine = await Parent.findOne({ email: "a@example.com" });
    const template = (await Plan.findOne({ parentId: mine!._id }))!.toObject();
    for (const w of ["2026-10-05", "2026-10-19", "2026-10-12"]) {
      const { _id, ...rest } = template;
      void _id;
      await Plan.create({ ...rest, weekStart: new Date(`${w}T00:00:00Z`), createdAt: new Date() });
    }
    const { _id, ...rest } = template;
    void _id;
    await Plan.create({ ...rest, weekStart: new Date("2026-10-19T00:00:00Z"), createdAt: new Date(Date.now() + 1000), source: "fallback" });

    const res = await request(app).get("/plans").set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.plans.map((p: { weekStart: string }) => p.weekStart)).toEqual(["2026-10-19", "2026-10-12", "2026-10-05"]);
    expect(res.body.plans[0].source).toBe("fallback");
    const filtered = await request(app).get(`/plans?childId=${childId}`).set(auth(token));
    expect(filtered.body.plans).toHaveLength(3);
    const none = await request(app).get(`/plans?childId=${otherChild}`).set(auth(token));
    expect(none.body.plans).toHaveLength(0);
  });
});

describe("DELETE /me", () => {
  it("deletes the parent, children, surveys, plans and codes, leaving the database empty for that parent", async () => {
    const { app, mailer, token, childId } = await start();
    const otherToken = await signIn(app, mailer, "b@example.com");
    const otherChild = await createChild(app, otherToken);
    for (const [t, c] of [[token, childId], [otherToken, otherChild]] as const) {
      await request(app).post("/plans").set(auth(t)).send({ ...ANSWERS, childId: c });
    }
    await createChild(app, token, { nickname: "Second", ageBand: "4-5" });
    await request(app).post("/auth/request-code").send({ email: "a@example.com" });

    const mine = (await Parent.findOne({ email: "a@example.com" }))!._id;
    expect(await Child.countDocuments({ parentId: mine })).toBe(2);

    const res = await request(app).delete("/me").set(auth(token));
    expect(res.status).toBe(204);

    const db = mongoose.connection.db!;
    for (const name of ["parents", "children", "surveys", "plans"]) {
      const key = name === "parents" ? "_id" : "parentId";
      expect({ name, count: await db.collection(name).countDocuments({ [key]: mine }) }).toEqual({ name, count: 0 });
    }
    expect(await db.collection("authcodes").countDocuments({})).toBe(0);
    // The other parent's data is intact.
    expect(await Parent.countDocuments()).toBe(1);
    expect(await Child.countDocuments()).toBe(1);
    expect(await Plan.countDocuments()).toBe(1);
    expect(await Survey.countDocuments()).toBe(1);
    expect((await request(app).get("/plans/current").set(auth(token))).status).toBe(401);
  });

  it("requires sign in", async () => {
    const { app } = setup();
    expect((await request(app).delete("/me")).status).toBe(401);
  });
});

describe("error format", () => {
  it("uses {error:{code,message}} with no stack traces", async () => {
    const { app, token } = await start();
    const cases = [
      await request(app).get("/nope"),
      await request(app).post("/plans").set(auth(token)).set("content-type", "application/json").send("{bad"),
      await request(app).get("/plans/current").set("authorization", "Bearer x"),
      await request(app).post("/auth/request-code").send({ email: "nope" }),
      await request(app).get("/children/zzz").set(auth(token)),
    ];
    for (const res of cases) {
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(Object.keys(res.body)).toEqual(["error"]);
      expect(Object.keys(res.body.error).sort()).toEqual(["code", "message"]);
      expect(JSON.stringify(res.body)).not.toMatch(/stack|node_modules|\.ts:/);
    }
  });
});
