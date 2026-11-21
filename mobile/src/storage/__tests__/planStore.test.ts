import AsyncStorage from "@react-native-async-storage/async-storage";
import { findPlan, isPlanComplete, selectChildPlans, usePlanStore } from "../planStore";
import { serverPlan } from "@/test/fixtures";

beforeEach(() => {
  usePlanStore.getState().clear();
});

describe("planStore", () => {
  it("keeps the current plan and past weeks per child", () => {
    const s = usePlanStore.getState();
    s.setCurrent("c1", serverPlan({ id: "a" }));
    s.setPast("c1", [serverPlan({ id: "old", weekStart: "2026-10-26" })]);
    s.setCurrent("c2", serverPlan({ id: "b", childId: "c2" }));
    const byChild = usePlanStore.getState().byChild;
    expect(selectChildPlans(byChild, "c1").current?.id).toBe("a");
    expect(selectChildPlans(byChild, "c1").past).toHaveLength(1);
    expect(selectChildPlans(byChild, "c2").current?.id).toBe("b");
    expect(selectChildPlans(byChild, "nope")).toEqual({ current: null, past: [] });
    expect(findPlan(byChild, "old")?.weekStart).toBe("2026-10-26");
    expect(findPlan(byChild, "missing")).toBeNull();
  });

  it("updates one activity at once (optimistic) and reports a missing plan", () => {
    usePlanStore.getState().setCurrent("c1", serverPlan({ id: "a" }));
    expect(usePlanStore.getState().patchActivity("a", 1, { done: true, reaction: "loved" })).toBe(true);
    const plan = selectChildPlans(usePlanStore.getState().byChild, "c1").current!;
    expect(plan.days[1]).toMatchObject({ done: true, reaction: "loved" });
    expect(plan.days[0]).toMatchObject({ done: false, reaction: null });
    expect(usePlanStore.getState().patchActivity("zzz", 0, { done: true, reaction: null })).toBe(false);
  });

  it("knows when a plan is complete", () => {
    const plan = serverPlan();
    expect(isPlanComplete(null)).toBe(false);
    expect(isPlanComplete(plan)).toBe(false);
    expect(isPlanComplete({ ...plan, days: plan.days.map((d) => ({ ...d, done: true })) })).toBe(true);
  });

  it("saves check-in answers on the cached plan", () => {
    usePlanStore.getState().setCurrent("c1", serverPlan({ id: "a" }));
    usePlanStore.getState().setCheckInAnswers("a", ["yes", "no", "somewhat"]);
    expect(selectChildPlans(usePlanStore.getState().byChild, "c1").current?.checkInAnswers).toEqual(["yes", "no", "somewhat"]);
  });

  it("caches plans on the phone so they can be read offline", async () => {
    usePlanStore.getState().setCurrent("c1", serverPlan({ id: "cached" }));
    usePlanStore.getState().setPast("c1", [serverPlan({ id: "past" })]);
    await new Promise((resolve) => setTimeout(resolve, 10));
    const raw = await AsyncStorage.getItem("familyforward.plans");
    expect(raw).toContain("cached");
    expect(raw).toContain("past");
    // A fresh start reads it back from the phone.
    usePlanStore.setState({ byChild: {} });
    await new Promise((resolve) => setTimeout(resolve, 10));
    await AsyncStorage.setItem("familyforward.plans", raw as string);
    await usePlanStore.persist.rehydrate();
    expect(selectChildPlans(usePlanStore.getState().byChild, "c1").current?.id).toBe("cached");
  });
});
