import request from "supertest";
import { createApp } from "../app";
import { Child, Plan, Survey } from "../models";
import type { AuthLimits } from "../routes/auth";
import { ANSWERS, auth, createChild } from "./helpers/children";
import { signIn } from "./helpers/signIn";
import { FakeMailer, testAppConfig } from "./helpers/testApp";
import { clearTestDb, startTestDb, stopTestDb } from "./helpers/testDb";

const BIG: AuthLimits = { windowMs: 60_000, requestCodePerIp: 1000, requestCodePerEmail: 1000, verifyPerIp: 1000, verifyPerEmail: 1000 };
const mailer = new FakeMailer();
const app = createApp(testAppConfig({ mailer, authLimits: BIG }));

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(clearTestDb);

const body = { nickname: "Sunny", ageBand: "2-3", homeLanguages: ["en", "es"] };

describe("/children", () => {
  it("requires sign in on every route", async () => {
    for (const res of [
      await request(app).get("/children"),
      await request(app).post("/children").send(body),
      await request(app).patch("/children/abc").send(body),
      await request(app).delete("/children/abc"),
    ]) {
      expect(res.status).toBe(401);
    }
  });

  it("creates, lists, updates and deletes a child", async () => {
    const token = await signIn(app, mailer, "a@example.com");
    const created = await request(app).post("/children").set(auth(token)).send(body);
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ nickname: "Sunny", ageBand: "2-3", homeLanguages: ["en", "es"] });
    expect(Object.keys(created.body).sort()).toEqual(["ageBand", "createdAt", "homeLanguages", "id", "nickname"]);

    const list = await request(app).get("/children").set(auth(token));
    expect(list.body.children).toHaveLength(1);

    const patched = await request(app).patch(`/children/${created.body.id}`).set(auth(token)).send({ nickname: "Sol", ageBand: "4-5" });
    expect(patched.status).toBe(200);
    expect(patched.body).toMatchObject({ nickname: "Sol", ageBand: "4-5", homeLanguages: ["en", "es"] });

    const del = await request(app).delete(`/children/${created.body.id}`).set(auth(token));
    expect(del.status).toBe(204);
    expect((await request(app).get("/children").set(auth(token))).body.children).toHaveLength(0);
  });

  it("validates the nickname, age band and languages, and rejects extra fields", async () => {
    const token = await signIn(app, mailer, "a@example.com");
    const bad: unknown[] = [
      { ...body, nickname: "" },
      { ...body, nickname: "   " },
      { ...body, nickname: "x".repeat(21) },
      { ...body, ageBand: "6-7" },
      { ...body, homeLanguages: ["fr"] },
      { ...body, birthDate: "2022-01-01" },
      { ...body, school: "Lincoln" },
      { nickname: "A" },
    ];
    for (const b of bad) {
      const res = await request(app).post("/children").set(auth(token)).send(b as object);
      expect({ b, status: res.status, code: res.body.error?.code }).toEqual({ b, status: 400, code: "invalid_child" });
    }
    expect((await request(app).post("/children").set(auth(token)).send({ ...body, nickname: "x".repeat(20) })).status).toBe(201);
    const id = (await request(app).get("/children").set(auth(token))).body.children[0].id;
    expect((await request(app).patch(`/children/${id}`).set(auth(token)).send({})).status).toBe(400);
    expect((await request(app).patch(`/children/${id}`).set(auth(token)).send({ school: "x" })).status).toBe(400);
  });

  it("allows at most 4 children per parent", async () => {
    const token = await signIn(app, mailer, "a@example.com");
    for (let i = 0; i < 4; i += 1) await createChild(app, token, { nickname: `Kid${i}` });
    const fifth = await request(app).post("/children").set(auth(token)).send(body);
    expect(fifth.status).toBe(409);
    expect(fifth.body.error.code).toBe("child_limit");
    // Another parent has their own limit.
    const other = await signIn(app, mailer, "b@example.com");
    expect((await request(app).post("/children").set(auth(other)).send(body)).status).toBe(201);
  });

  it("scopes every route to the owner: someone else's child is a plain 404", async () => {
    const a = await signIn(app, mailer, "a@example.com");
    const b = await signIn(app, mailer, "b@example.com");
    const id = await createChild(app, a);
    const patch = await request(app).patch(`/children/${id}`).set(auth(b)).send({ nickname: "Hacked" });
    expect(patch.status).toBe(404);
    expect(patch.body.error.code).toBe("child_not_found");
    expect((await request(app).delete(`/children/${id}`).set(auth(b))).status).toBe(404);
    expect((await request(app).get("/children").set(auth(b))).body.children).toEqual([]);
    expect((await Child.findById(id))!.nickname).toBe("Sunny");
    expect((await request(app).patch("/children/not-an-id").set(auth(a)).send({ nickname: "X" })).status).toBe(404);
  });

  it("deleting a child deletes their surveys and plans but not a sibling's", async () => {
    const token = await signIn(app, mailer, "a@example.com");
    const one = await createChild(app, token, { nickname: "One" });
    const two = await createChild(app, token, { nickname: "Two" });
    for (const childId of [one, two]) {
      await request(app).post("/plans").set(auth(token)).send({ ...ANSWERS, childId });
    }
    expect(await Plan.countDocuments()).toBe(2);
    await request(app).delete(`/children/${one}`).set(auth(token));
    expect(await Plan.countDocuments()).toBe(1);
    expect(await Survey.countDocuments()).toBe(1);
    expect((await Plan.findOne())!.childId!.toString()).toBe(two);
  });
});
