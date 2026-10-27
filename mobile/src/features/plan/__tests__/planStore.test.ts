import { INITIAL_ANSWERS } from "@/storage/surveyStore";
import { isPlanComplete, shouldArchive, usePlanStore } from "@/storage/planStore";
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
});
