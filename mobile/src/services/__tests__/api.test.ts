import { ApiError } from "../http";
import { createRealApi } from "../api";
import { createDemoApi, DEMO_CODE } from "../demoApi";
import { ANSWERS, CHILD, serverPlan } from "@/test/fixtures";

function fakeHttp(handler: (method: string, path: string, body?: unknown, options?: unknown) => unknown) {
  const calls: { method: string; path: string; body?: unknown; options?: { timeoutMs?: number; auth?: boolean } }[] = [];
  return {
    calls,
    http: {
      request: async (method: string, path: string, body?: unknown, options?: { timeoutMs?: number; auth?: boolean }) => {
        calls.push({ method, path, body, options });
        const out = handler(method, path, body, options);
        if (out instanceof Error) throw out;
        return out;
      },
    },
  };
}

describe("real api", () => {
  it("requests a code without a token", async () => {
    const f = fakeHttp(() => ({ ok: true }));
    await createRealApi(f.http as never).requestCode("a@b.co");
    expect(f.calls[0]).toMatchObject({ method: "POST", path: "/auth/request-code", body: { email: "a@b.co" }, options: { auth: false } });
  });

  it("maps verify results: ok with token, wrong code, locked", async () => {
    expect(await createRealApi(fakeHttp(() => ({ token: "t" })).http as never).verifyCode("a@b.co", "123456")).toEqual({ status: "ok", token: "t" });
    expect(await createRealApi(fakeHttp(() => new ApiError("client", 400, "invalid_code")).http as never).verifyCode("a@b.co", "000000")).toEqual({ status: "wrong" });
    expect(await createRealApi(fakeHttp(() => new ApiError("client", 400, "code_expired")).http as never).verifyCode("a@b.co", "000000")).toEqual({ status: "locked" });
    expect(await createRealApi(fakeHttp(() => new ApiError("client", 429, "rate_limited")).http as never).verifyCode("a@b.co", "000000")).toEqual({ status: "locked" });
    await expect(createRealApi(fakeHttp(() => new ApiError("offline")).http as never).verifyCode("a@b.co", "1")).rejects.toMatchObject({ kind: "offline" });
  });

  it("creates a plan with the server's field names, trims the note, and waits up to 30 seconds", async () => {
    const f = fakeHttp(() => ({ ...serverPlan(), noteIgnored: false }));
    await createRealApi(f.http as never).createPlan({ childId: "c1", answers: ANSWERS, language: "es", note: "  le gustan los camiones ", regenerate: true, previousPlanId: "p0" });
    expect(f.calls[0].path).toBe("/plans");
    expect(f.calls[0].options?.timeoutMs).toBe(30_000);
    expect(f.calls[0].body).toEqual({
      childId: "c1",
      language: "es",
      focusAreas: ["talking"],
      interests: ["songs"],
      materials: ["paper", "kitchen"],
      minutesPerDay: 10,
      daysPerWeek: 3,
      note: "le gustan los camiones",
      previousPlanId: "p0",
      regenerate: true,
    });
  });

  it("omits an empty note, and never sends an age band or a nickname", async () => {
    const f = fakeHttp(() => serverPlan());
    await createRealApi(f.http as never).createPlan({ childId: "c1", answers: ANSWERS, language: "en", note: "   " });
    expect(f.calls[0].body).not.toHaveProperty("note");
    expect(JSON.stringify(f.calls[0].body)).not.toMatch(/ageBand|nickname|Sunny/);
  });

  it("returns null for no plan this week and rejects answers that do not match the contract", async () => {
    expect(await createRealApi(fakeHttp(() => new ApiError("client", 404, "no_plan")).http as never).currentPlan("c1")).toBeNull();
    await expect(createRealApi(fakeHttp(() => ({ nope: true })).http as never).currentPlan("c1")).rejects.toMatchObject({ kind: "server" });
    await expect(createRealApi(fakeHttp(() => ({ children: [{ id: 1 }] })).http as never).listChildren()).rejects.toMatchObject({ kind: "server" });
  });

  it("uses the documented routes for children, activities, check-in and delete", async () => {
    const f = fakeHttp((_m, path) => (path.startsWith("/children") ? CHILD : path === "/me" ? undefined : serverPlan()));
    const api = createRealApi(f.http as never);
    await api.createChild({ nickname: "Sunny", ageBand: "2-3", homeLanguages: ["en"] });
    await api.updateChild("c1", { nickname: "Sol" });
    await api.deleteChild("c1");
    await api.updateActivity("p1", 2, { done: true, reaction: "loved" });
    await api.submitCheckIn("p1", ["yes", "no", "somewhat"]);
    await api.deleteMe();
    expect(f.calls.map((c) => `${c.method} ${c.path}`)).toEqual([
      "POST /children",
      "PATCH /children/c1",
      "DELETE /children/c1",
      "PATCH /plans/p1/activities/2",
      "POST /plans/p1/checkin",
      "DELETE /me",
    ]);
  });
});

describe("demo api (synthetic profile)", () => {
  it("works fully in memory with invented data", async () => {
    const api = createDemoApi();
    expect(await api.verifyCode("x@y.z", DEMO_CODE)).toMatchObject({ status: "ok" });
    expect(await api.verifyCode("x@y.z", "000000")).toEqual({ status: "wrong" });
    const child = await api.createChild({ nickname: "Demo", ageBand: "2-3", homeLanguages: ["en"] });
    const plan = await api.createPlan({ childId: child.id, answers: ANSWERS, language: "en" });
    expect(plan.days.length).toBe(ANSWERS.days);
    const updated = await api.updateActivity(plan.id, 0, { done: true, reaction: "fine" });
    expect(updated.days[0]).toMatchObject({ done: true, reaction: "fine" });
    expect((await api.currentPlan(child.id))?.id).toBe(plan.id);
    await api.deleteMe();
    expect(await api.listChildren()).toEqual([]);
  });
});
