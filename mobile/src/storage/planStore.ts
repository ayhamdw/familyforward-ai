import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PlanDto, Reaction } from "@familyforward/shared";
import { persistStorage } from "./createStore";

/** A plan is complete once every activity is done. */
export function isPlanComplete(plan: PlanDto | null): boolean {
  return plan !== null && plan.days.length > 0 && plan.days.every((d) => d.done);
}

type PerChild = { current: PlanDto | null; past: PlanDto[] };

type PlanState = {
  byChild: Record<string, PerChild>;
  hydrated: boolean;
  setCurrent: (childId: string, plan: PlanDto | null) => void;
  setPast: (childId: string, plans: PlanDto[]) => void;
  /** Optimistic update of one activity. Returns false when the plan is not in the cache. */
  patchActivity: (planId: string, index: number, patch: { done: boolean; reaction: Reaction | null }) => boolean;
  setCheckInAnswers: (planId: string, answers: PlanDto["checkInAnswers"]) => void;
  removeChild: (childId: string) => void;
  clear: () => void;
};

const EMPTY: PerChild = { current: null, past: [] };

export function selectChildPlans(byChild: Record<string, PerChild>, childId: string | null): PerChild {
  return (childId && byChild[childId]) || EMPTY;
}

/** Finds a plan by id in the current or past plans of any child. */
export function findPlan(byChild: Record<string, PerChild>, planId: string): PlanDto | null {
  for (const entry of Object.values(byChild)) {
    if (entry.current?.id === planId) return entry.current;
    const past = entry.past.find((p) => p.id === planId);
    if (past) return past;
  }
  return null;
}

function mapPlan(byChild: Record<string, PerChild>, planId: string, fn: (plan: PlanDto) => PlanDto): Record<string, PerChild> {
  const next: Record<string, PerChild> = {};
  for (const [childId, entry] of Object.entries(byChild)) {
    next[childId] = {
      current: entry.current?.id === planId ? fn(entry.current) : entry.current,
      past: entry.past.map((p) => (p.id === planId ? fn(p) : p)),
    };
  }
  return next;
}

export const usePlanStore = create<PlanState>()(
  persist(
    (set, get) => ({
      byChild: {},
      hydrated: false,
      setCurrent: (childId, plan) =>
        set((s) => ({ byChild: { ...s.byChild, [childId]: { ...selectChildPlans(s.byChild, childId), current: plan } } })),
      setPast: (childId, past) =>
        set((s) => ({ byChild: { ...s.byChild, [childId]: { ...selectChildPlans(s.byChild, childId), past } } })),
      patchActivity: (planId, index, patch) => {
        if (!findPlan(get().byChild, planId)) return false;
        set((s) => ({
          byChild: mapPlan(s.byChild, planId, (plan) => ({
            ...plan,
            days: plan.days.map((d, i) => (i === index ? { ...d, done: patch.done, reaction: patch.reaction } : d)),
          })),
        }));
        return true;
      },
      setCheckInAnswers: (planId, answers) =>
        set((s) => ({ byChild: mapPlan(s.byChild, planId, (plan) => ({ ...plan, checkInAnswers: answers })) })),
      removeChild: (childId) =>
        set((s) => {
          const { [childId]: _removed, ...rest } = s.byChild;
          void _removed;
          return { byChild: rest };
        }),
      clear: () => set({ byChild: {} }),
    }),
    {
      name: "familyforward.plans",
      version: 3,
      // Earlier versions kept a different plan shape that cannot be shown any more.
      migrate: () => ({ byChild: {} }) as unknown as PlanState,
      storage: persistStorage,
      partialize: (s) => ({ byChild: s.byChild }),
      onRehydrateStorage: () => () => {
        usePlanStore.setState({ hydrated: true });
      },
    },
  ),
);
