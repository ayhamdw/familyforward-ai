import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  MAX_FOCUS_AREAS,
  type DaysOption,
  type FocusArea,
  type Interest,
  type Material,
  type MinutesOption,
  type SurveyAgeBand,
} from "@familyforward/shared";
import { persistStorage } from "./createStore";

export type SurveyAnswers = {
  ageBand: SurveyAgeBand | null;
  focus: FocusArea[];
  minutes: MinutesOption;
  days: DaysOption;
  interests: Interest[];
  materials: Material[];
};

export const INITIAL_ANSWERS: SurveyAnswers = {
  ageBand: null,
  focus: [],
  minutes: 10,
  days: 3,
  interests: [],
  materials: [],
};

/** Adds or removes a value. Adding is ignored once `max` values are selected. */
export function toggleInList<T>(list: readonly T[], value: T, max = Number.POSITIVE_INFINITY): T[] {
  if (list.includes(value)) {
    return list.filter((item) => item !== value);
  }
  return list.length >= max ? [...list] : [...list, value];
}

export function isSurveyComplete(answers: SurveyAnswers): answers is SurveyAnswers & { ageBand: SurveyAgeBand } {
  return answers.ageBand !== null && answers.focus.length >= 1;
}

type SurveyState = SurveyAnswers & {
  hydrated: boolean;
  setAgeBand: (ageBand: SurveyAgeBand) => void;
  toggleFocus: (focus: FocusArea) => void;
  setMinutes: (minutes: MinutesOption) => void;
  setDays: (days: DaysOption) => void;
  toggleInterest: (interest: Interest) => void;
  toggleMaterial: (material: Material) => void;
  reset: () => void;
};

// The optional note is never kept here: it stays in the note screen's own state and is never stored.
export const useSurveyStore = create<SurveyState>()(
  persist(
    (set) => ({
      ...INITIAL_ANSWERS,
      hydrated: false,
      setAgeBand: (ageBand) => set({ ageBand }),
      toggleFocus: (focus) => set((state) => ({ focus: toggleInList(state.focus, focus, MAX_FOCUS_AREAS) })),
      setMinutes: (minutes) => set({ minutes }),
      setDays: (days) => set({ days }),
      toggleInterest: (interest) => set((state) => ({ interests: toggleInList(state.interests, interest) })),
      toggleMaterial: (material) => set((state) => ({ materials: toggleInList(state.materials, material) })),
      reset: () => set({ ...INITIAL_ANSWERS }),
    }),
    {
      name: "familyforward.survey",
      storage: persistStorage,
      partialize: (state): SurveyAnswers => ({
        ageBand: state.ageBand,
        focus: state.focus,
        minutes: state.minutes,
        days: state.days,
        interests: state.interests,
        materials: state.materials,
      }),
      onRehydrateStorage: () => () => {
        useSurveyStore.setState({ hydrated: true });
      },
    },
  ),
);
