import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DaysOption, FocusArea, Interest, Material, MinutesOption } from "@familyforward/shared";
import { persistStorage } from "./createStore";

/** Survey answers saved midway for one child. There is no note field: the note is never saved. */
export type SurveyDraft = {
  focus: FocusArea[];
  minutes: MinutesOption;
  days: DaysOption;
  interests: Interest[];
  materials: Material[];
  /** The furthest step reached (1 to 5), so the survey can resume. */
  step: number;
};

export const EMPTY_DRAFT: SurveyDraft = { focus: [], minutes: 10, days: 3, interests: [], materials: [], step: 1 };

type DraftState = {
  drafts: Record<string, SurveyDraft>;
  hydrated: boolean;
  save: (childId: string, draft: SurveyDraft) => void;
  discard: (childId: string) => void;
  clear: () => void;
};

export const useDraftStore = create<DraftState>()(
  persist(
    (set) => ({
      drafts: {},
      hydrated: false,
      save: (childId, draft) => set((s) => ({ drafts: { ...s.drafts, [childId]: pick(draft) } })),
      discard: (childId) =>
        set((s) => {
          const { [childId]: _gone, ...rest } = s.drafts;
          void _gone;
          return { drafts: rest };
        }),
      clear: () => set({ drafts: {} }),
    }),
    {
      name: "familyforward.drafts",
      storage: persistStorage,
      partialize: (s) => ({ drafts: s.drafts }),
      onRehydrateStorage: () => () => {
        useDraftStore.setState({ hydrated: true });
      },
    },
  ),
);

/** Copies only the known fields, so nothing else (like a note) can ever be saved by accident. */
function pick(d: SurveyDraft): SurveyDraft {
  return { focus: d.focus, minutes: d.minutes, days: d.days, interests: d.interests, materials: d.materials, step: d.step };
}
