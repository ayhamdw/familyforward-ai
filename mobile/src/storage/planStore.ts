import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PastWeek, Plan } from "@/features/plan/types";
import { persistStorage } from "./createStore";

/** A plan is worth keeping in "Past weeks" once at least one activity was done. */
export function shouldArchive(plan: Plan | null): plan is Plan {
  return plan !== null && plan.items.some((item) => item.done);
}

export function toPastWeek(plan: Plan): PastWeek {
  return {
    id: plan.id,
    weekStart: plan.weekStart,
    activityCount: plan.items.filter((item) => item.done).length,
    focus: plan.focus,
  };
}

export function isPlanComplete(plan: Plan | null): boolean {
  return plan !== null && plan.items.length > 0 && plan.items.every((item) => item.done);
}

type PlanState = {
  current: Plan | null;
  pastWeeks: PastWeek[];
  hydrated: boolean;
  /** Replaces the current plan, archiving the old one first if the family did any of its activities. */
  setPlan: (plan: Plan) => void;
  markDone: (activityId: string) => void;
  setFit: (activityId: string, fit: boolean) => void;
  addPastWeeks: (weeks: PastWeek[]) => void;
  clear: () => void;
};

export const usePlanStore = create<PlanState>()(
  persist(
    (set) => ({
      current: null,
      pastWeeks: [],
      hydrated: false,
      setPlan: (plan) =>
        set((state) => ({
          current: plan,
          pastWeeks: shouldArchive(state.current) ? [toPastWeek(state.current), ...state.pastWeeks] : state.pastWeeks,
        })),
      markDone: (activityId) =>
        set((state) => ({
          current: state.current && {
            ...state.current,
            items: state.current.items.map((item) => (item.activityId === activityId ? { ...item, done: true } : item)),
          },
        })),
      setFit: (activityId, fit) =>
        set((state) => ({
          current: state.current && {
            ...state.current,
            items: state.current.items.map((item) => (item.activityId === activityId ? { ...item, fit } : item)),
          },
        })),
      addPastWeeks: (weeks) => set((state) => ({ pastWeeks: [...weeks, ...state.pastWeeks] })),
      clear: () => set({ current: null, pastWeeks: [] }),
    }),
    {
      name: "familyforward.plan",
      storage: persistStorage,
      partialize: (state) => ({ current: state.current, pastWeeks: state.pastWeeks }),
      onRehydrateStorage: () => () => {
        usePlanStore.setState({ hydrated: true });
      },
    },
  ),
);
