import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { handleUnauthorized, realApi } from "../api";
import { ApiError } from "../http";
import { deleteMyData, generatePlan, recordActivity, recordCheckIn, signInWithCode, signOutAll } from "../actions";
import { getToken, setToken } from "../session";
import { flushQueue } from "../sync";
import { useAuthStore } from "@/storage/authStore";
import { useChildrenStore } from "@/storage/childrenStore";
import { useDraftStore } from "@/storage/draftStore";
import { useNetStore } from "@/storage/netStore";
import { selectChildPlans, usePlanStore } from "@/storage/planStore";
import { useQueueStore } from "@/storage/queueStore";
import { useSurveyStore } from "@/storage/surveyStore";
import { ANSWERS, CHILD, serverPlan } from "@/test/fixtures";

const secure = (SecureStore as unknown as { __store: Map<string, string> }).__store;

async function fillEverything() {
  useAuthStore.getState().signIn("parent@example.com");
  useChildrenStore.getState().setChildren([CHILD]);
  usePlanStore.getState().setCurrent(CHILD.id, serverPlan({ id: "p1" }));
  usePlanStore.getState().setPast(CHILD.id, [serverPlan({ id: "old" })]);
  useSurveyStore.getState().loadForChild(CHILD.id);
  useSurveyStore.getState().toggleFocus("reading");
  useQueueStore.getState().enqueue({ type: "activity", planId: "p1", index: 0, done: true, reaction: null });
  await setToken("tok");
  await AsyncStorage.setItem("familyforward.language", "es");
  await AsyncStorage.setItem("something.else", "x");
  await new Promise((resolve) => setTimeout(resolve, 10));
}

beforeEach(async () => {
  jest.restoreAllMocks();
  await signOutAll();
  await AsyncStorage.clear();
  secure.clear();
});

describe("sign in", () => {
  it("keeps the token only in the secure store, never in AsyncStorage", async () => {
    jest.spyOn(realApi, "verifyCode").mockResolvedValue({ status: "ok", token: "secret-token-xyz" });
    jest.spyOn(realApi, "listChildren").mockResolvedValue([]);
    const result = await signInWithCode("parent@example.com", "123456");
    expect(result.status).toBe("ok");
    expect(await getToken()).toBe("secret-token-xyz");
    expect(secure.get("familyforward.token")).toBe("secret-token-xyz");
    expect(useAuthStore.getState().signedIn).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 20));
    const keys = await AsyncStorage.getAllKeys();
    const values = await AsyncStorage.multiGet(keys);
    expect(JSON.stringify(values)).not.toContain("secret-token-xyz");
  });

  it("does not sign in on a wrong code", async () => {
    jest.spyOn(realApi, "verifyCode").mockResolvedValue({ status: "wrong" });
    expect((await signInWithCode("a@b.co", "000000")).status).toBe("wrong");
    expect(useAuthStore.getState().signedIn).toBe(false);
    expect(await getToken()).toBeNull();
  });
});

describe("a 401 (session expired)", () => {
  it("clears the token and marks the session expired so the app shows the sign-in-again screen", async () => {
    await setToken("tok");
    useAuthStore.getState().signIn("a@b.co");
    handleUnauthorized();
    expect(useAuthStore.getState().sessionExpired).toBe(true);
    expect(useAuthStore.getState().signedIn).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(await getToken()).toBeNull();
  });
});

describe("generatePlan", () => {
  it("returns the server's plan and caches it", async () => {
    jest.spyOn(realApi, "createPlan").mockResolvedValue({ ...serverPlan({ id: "srv" }), noteIgnored: false });
    const { plan, noteIgnored } = await generatePlan({ child: CHILD, answers: ANSWERS, language: "en" });
    expect(plan.id).toBe("srv");
    expect(noteIgnored).toBe(false);
    expect(selectChildPlans(usePlanStore.getState().byChild, CHILD.id).current?.id).toBe("srv");
  });

  it("passes regenerate and the previous server plan, but never a local plan", async () => {
    const spy = jest.spyOn(realApi, "createPlan").mockResolvedValue({ ...serverPlan({ id: "n" }), noteIgnored: false });
    usePlanStore.getState().setCurrent(CHILD.id, serverPlan({ id: "prev" }));
    await generatePlan({ child: CHILD, answers: ANSWERS, language: "en", regenerate: true });
    expect(spy.mock.calls[0][0]).toMatchObject({ regenerate: true, previousPlanId: "prev" });
    usePlanStore.getState().setCurrent(CHILD.id, serverPlan({ id: "local-abc" }));
    await generatePlan({ child: CHILD, answers: ANSWERS, language: "en", regenerate: true });
    expect(spy.mock.calls[1][0].previousPlanId).toBeUndefined();
  });

  it.each([["offline"], ["timeout"], ["server"], ["client"]] as const)("silently uses a ready-made plan on the phone after a %s error", async (kind) => {
    jest.spyOn(realApi, "createPlan").mockRejectedValue(new ApiError(kind, kind === "server" ? 500 : 0));
    const { plan } = await generatePlan({ child: CHILD, answers: ANSWERS, language: "es" });
    expect(plan.source).toBe("fallback");
    expect(plan.id.startsWith("local-")).toBe(true);
    expect(plan.language).toBe("es");
    expect(selectChildPlans(usePlanStore.getState().byChild, CHILD.id).current?.id).toBe(plan.id);
  });

  it("does not hide an expired session", async () => {
    jest.spyOn(realApi, "createPlan").mockRejectedValue(new ApiError("unauthorized", 401));
    await expect(generatePlan({ child: CHILD, answers: ANSWERS, language: "en" })).rejects.toMatchObject({ kind: "unauthorized" });
  });

  it("shows the existing plan when the server says this week already has one", async () => {
    jest.spyOn(realApi, "createPlan").mockRejectedValue(new ApiError("client", 409, "plan_exists"));
    jest.spyOn(realApi, "currentPlan").mockResolvedValue(serverPlan({ id: "already" }));
    const { plan } = await generatePlan({ child: CHILD, answers: ANSWERS, language: "en" });
    expect(plan.id).toBe("already");
  });

  it("keeps the note out of storage: a health note gives the fixed card and no trace", async () => {
    jest.spyOn(realApi, "createPlan").mockRejectedValue(new ApiError("offline"));
    const { plan } = await generatePlan({ child: CHILD, answers: ANSWERS, language: "en", note: "she has autism, zzz-note" });
    expect(plan.worthNoticing).toHaveLength(1);
    await new Promise((resolve) => setTimeout(resolve, 20));
    const dump = JSON.stringify(await AsyncStorage.multiGet(await AsyncStorage.getAllKeys()));
    expect(dump).not.toMatch(/zzz-note|autism/);
  });
});

describe("offline writes", () => {
  it("shows the change at once, queues it while offline, and sends it later in order", async () => {
    usePlanStore.getState().setCurrent(CHILD.id, serverPlan({ id: "p1" }));
    const spy = jest.spyOn(realApi, "updateActivity").mockRejectedValue(new ApiError("offline"));
    await recordActivity("p1", 0, { done: true, reaction: null });
    await recordActivity("p1", 0, { done: true, reaction: "loved" });
    await recordActivity("p1", 1, { done: true, reaction: "fine" });
    // On screen straight away.
    const days = selectChildPlans(usePlanStore.getState().byChild, CHILD.id).current!.days;
    expect(days[0]).toMatchObject({ done: true, reaction: "loved" });
    // Queued: the newer write to activity 0 replaced the older one.
    expect(useQueueStore.getState().items.map((q) => q.type === "activity" && `${q.index}:${q.reaction}`)).toEqual(["0:loved", "1:fine"]);

    spy.mockReset().mockResolvedValue(serverPlan());
    await flushQueue();
    expect(spy.mock.calls.map((c) => `${c[1]}:${c[2].reaction}`)).toEqual(["0:loved", "1:fine"]);
    expect(useQueueStore.getState().items).toEqual([]);
  });

  it("queues a check-in too, and the queue survives a restart", async () => {
    usePlanStore.getState().setCurrent(CHILD.id, serverPlan({ id: "p1" }));
    jest.spyOn(realApi, "submitCheckIn").mockRejectedValue(new ApiError("offline"));
    await recordCheckIn("p1", ["yes", "somewhat", "no"]);
    expect(useQueueStore.getState().items).toHaveLength(1);
    await new Promise((resolve) => setTimeout(resolve, 10));
    const raw = (await AsyncStorage.getItem("familyforward.queue")) as string;
    useQueueStore.setState({ items: [] });
    await new Promise((resolve) => setTimeout(resolve, 10));
    await AsyncStorage.setItem("familyforward.queue", raw);
    await useQueueStore.persist.rehydrate();
    expect(useQueueStore.getState().items).toHaveLength(1);
    expect(JSON.stringify(useQueueStore.getState().items)).toMatch(/"answers":\["yes","somewhat","no"\]/);
  });

  it("does not queue changes to a plan that only exists on the phone", async () => {
    usePlanStore.getState().setCurrent(CHILD.id, serverPlan({ id: "local-1" }));
    await recordActivity("local-1", 0, { done: true, reaction: "loved" });
    expect(useQueueStore.getState().items).toEqual([]);
    expect(selectChildPlans(usePlanStore.getState().byChild, CHILD.id).current!.days[0].done).toBe(true);
  });

  it("stops at the first network failure and keeps the rest", async () => {
    usePlanStore.getState().setCurrent(CHILD.id, serverPlan({ id: "p1" }));
    useQueueStore.getState().enqueue({ type: "activity", planId: "p1", index: 0, done: true, reaction: null });
    useQueueStore.getState().enqueue({ type: "activity", planId: "p1", index: 1, done: true, reaction: null });
    const spy = jest.spyOn(realApi, "updateActivity").mockRejectedValue(new ApiError("timeout"));
    await flushQueue();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(useQueueStore.getState().items).toHaveLength(2);
  });

  it("drops a write the server refuses for good (for example the plan is gone)", async () => {
    useQueueStore.getState().enqueue({ type: "activity", planId: "gone", index: 0, done: true, reaction: null });
    jest.spyOn(realApi, "updateActivity").mockRejectedValue(new ApiError("client", 404, "plan_not_found"));
    await flushQueue();
    expect(useQueueStore.getState().items).toEqual([]);
  });

  it("keeps writes when the session expired, so they send after signing in again", async () => {
    useQueueStore.getState().enqueue({ type: "activity", planId: "p1", index: 0, done: true, reaction: null });
    jest.spyOn(realApi, "updateActivity").mockRejectedValue(new ApiError("unauthorized", 401));
    await flushQueue();
    expect(useQueueStore.getState().items).toHaveLength(1);
  });
});

describe("sign out", () => {
  it("clears the token, every store and everything saved on the phone, but keeps the language choice", async () => {
    await fillEverything();
    await signOutAll();
    expect(await getToken()).toBeNull();
    expect(secure.size).toBe(0);
    expect(useAuthStore.getState()).toMatchObject({ signedIn: false, email: null });
    expect(useChildrenStore.getState().children).toEqual([]);
    expect(usePlanStore.getState().byChild).toEqual({});
    expect(useQueueStore.getState().items).toEqual([]);
    expect(useDraftStore.getState().drafts).toEqual({});
    expect(useSurveyStore.getState().focus).toEqual([]);
    expect(await AsyncStorage.getAllKeys()).toEqual(["familyforward.language"]);
  });
});

describe("delete my data", () => {
  it("deletes on the server first, then clears the phone completely, including the language choice", async () => {
    await fillEverything();
    const order: string[] = [];
    jest.spyOn(realApi, "deleteMe").mockImplementation(async () => {
      order.push("server");
      // The phone is not cleared until the server answered.
      expect(useChildrenStore.getState().children).toHaveLength(1);
    });
    await deleteMyData();
    order.push("done");
    expect(order).toEqual(["server", "done"]);
    expect(realApi.deleteMe).toHaveBeenCalledTimes(1);
    expect(await getToken()).toBeNull();
    expect(secure.size).toBe(0);
    expect(useAuthStore.getState().signedIn).toBe(false);
    expect(useChildrenStore.getState().children).toEqual([]);
    expect(usePlanStore.getState().byChild).toEqual({});
    expect(useQueueStore.getState().items).toEqual([]);
    expect(useDraftStore.getState().drafts).toEqual({});
    expect(await AsyncStorage.getAllKeys()).toEqual([]);
    expect(useNetStore.getState().online).toBe(true);
  });

  it("clears nothing and reports the failure when the server could not delete", async () => {
    await fillEverything();
    jest.spyOn(realApi, "deleteMe").mockRejectedValue(new ApiError("offline"));
    await expect(deleteMyData()).rejects.toMatchObject({ kind: "offline" });
    expect(useChildrenStore.getState().children).toHaveLength(1);
    expect(usePlanStore.getState().byChild[CHILD.id]).toBeDefined();
    expect(await getToken()).toBe("tok");
    expect(useAuthStore.getState().signedIn).toBe(true);
  });
});
