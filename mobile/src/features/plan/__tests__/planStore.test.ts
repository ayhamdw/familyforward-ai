import { INITIAL_ANSWERS } from "@/storage/surveyStore";
import { isPlanComplete, migratePlanState, shouldArchive, toPastWeek, usePlanStore } from "@/storage/planStore";
import { buildMockPlan } from "../buildPlan";

const plan = (weekStart: string) =>
  buildMockPlan({ ...INITIAL_ANSWERS, ageBand: "2-3", focus: ["talking"] }, { weekStart, source: "custom" });

beforeEach(() => {
  usePlanStore.getState().clear();
});

describe("plan store", () => {
  it("marks activities done and records fit", () => {
    const first = plan("2026-10-26");
    usePlanStore.getState().setPlan(first);
    const id = first.items[0].activityId;
    usePlanStore.getState().markDone(id);
    usePlanStore.getState().setFit(id, false);
    const item = usePlanStore.getState().current?.items[0];
    expect(item?.done).toBe(true);
    expect(item?.fit).toBe(false);
  });

  it("detects a complete week", () => {
    const first = plan("2026-10-26");
    usePlanStore.getState().setPlan(first);
    expect(isPlanComplete(usePlanStore.getState().current)).toBe(false);
    first.items.forEach((item) => usePlanStore.getState().markDone(item.activityId));
    expect(isPlanComplete(usePlanStore.getState().current)).toBe(true);
  });

  it("archives the old plan only if something was done", () => {
    const first = plan("2026-10-26");
    usePlanStore.getState().setPlan(first);
    usePlanStore.getState().setPlan(plan("2026-11-02"));
    expect(usePlanStore.getState().pastWeeks).toHaveLength(0);

    usePlanStore.getState().markDone(usePlanStore.getState().current?.items[0].activityId ?? "");
    usePlanStore.getState().setPlan(plan("2026-11-09"));
    expect(usePlanStore.getState().pastWeeks).toHaveLength(1);
    expect(usePlanStore.getState().pastWeeks[0].activityCount).toBe(1);
  });

  it("shouldArchive handles no plan", () => {
    expect(shouldArchive(null)).toBe(false);
  });

  it("keeps a full snapshot of the archived plan so it can be opened read-only", () => {
    const first = plan("2026-10-26");
    usePlanStore.getState().setPlan(first);
    usePlanStore.getState().markDone(first.items[0].activityId);
    usePlanStore.getState().setPlan(plan("2026-11-02"));
    const [week] = usePlanStore.getState().pastWeeks;
    expect(week.plan.id).toBe(first.id);
    expect(week.plan.items[0].done).toBe(true);
    expect(week.plan.items).toHaveLength(first.items.length);
  });

  it("toPastWeek summarizes the plan", () => {
    const first = plan("2026-10-26");
    const week = toPastWeek({ ...first, items: first.items.map((item) => ({ ...item, done: true })) });
    expect(week.activityCount).toBe(first.items.length);
    expect(week.weekStart).toBe("2026-10-26");
    expect(week.focus).toEqual(first.focus);
  });
});

describe("migratePlanState", () => {
  it("drops old past weeks that have no plan snapshot and keeps the rest", () => {
    const current = plan("2026-11-02");
    const kept = toPastWeek(plan("2026-10-26"));
    const migrated = migratePlanState({
      current,
      pastWeeks: [{ id: "old", weekStart: "2026-10-19", activityCount: 3, focus: ["talking"] }, kept],
    });
    expect(migrated.current?.id).toBe(current.id);
    expect(migrated.pastWeeks).toEqual([kept]);
  });

  it("handles empty or missing state", () => {
    expect(migratePlanState(undefined)).toEqual({ current: null, pastWeeks: [] });
  });
});
