import { create } from "zustand";
import {
  MAX_FOCUS_AREAS,
  type DaysOption,
  type FocusArea,
  type Interest,
  type Material,
  type MinutesOption,
} from "@familyforward/shared";
import { activeChild, useChildrenStore } from "./childrenStore";
import { EMPTY_DRAFT, useDraftStore, type SurveyDraft } from "./draftStore";

export type SurveyAnswers = {
  focus: FocusArea[];
  minutes: MinutesOption;
  days: DaysOption;
  interests: Interest[];
  materials: Material[];
};

export const INITIAL_ANSWERS: SurveyAnswers = {
  focus: [],
  minutes: EMPTY_DRAFT.minutes,
  days: EMPTY_DRAFT.days,
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

export function isSurveyComplete(answers: SurveyAnswers): boolean {
  return answers.focus.length >= 1;
}

type SurveyState = SurveyAnswers & {
  /** The furthest step reached for the child being planned (1 to 5). */
  step: number;
  /** The child these answers belong to. */
  childId: string | null;
  /** Loads the saved draft for a child, or empty answers. */
  loadForChild: (childId: string) => void;
  reachStep: (step: number) => void;
  toggleFocus: (focus: FocusArea) => void;
  setMinutes: (minutes: MinutesOption) => void;
  setDays: (days: DaysOption) => void;
  toggleInterest: (interest: Interest) => void;
  toggleMaterial: (material: Material) => void;
  /** Marks the survey done. The answers stay saved as next week's starting point. */
  finish: () => void;
  reset: () => void;
};

function toDraft(s: SurveyState): SurveyDraft {
  return { focus: s.focus, minutes: s.minutes, days: s.days, interests: s.interests, materials: s.materials, step: s.step };
}

// The optional note is never kept here: it stays in the note screen's own state and is never saved.
export const useSurveyStore = create<SurveyState>()((set, get) => {
  const update = (patch: Partial<SurveyAnswers & { step: number }>) => {
    set(patch);
    const { childId } = get();
    // Save midway, per child, so a parent who leaves can come back.
    if (childId) useDraftStore.getState().save(childId, toDraft(get()));
  };
  return {
    ...INITIAL_ANSWERS,
    step: 1,
    childId: null,
    loadForChild: (childId) => {
      const draft = useDraftStore.getState().drafts[childId] ?? EMPTY_DRAFT;
      set({ childId, focus: draft.focus, minutes: draft.minutes, days: draft.days, interests: draft.interests, materials: draft.materials, step: draft.step });
    },
    reachStep: (step) => {
      if (step > get().step) update({ step });
    },
    toggleFocus: (focus) => update({ focus: toggleInList(get().focus, focus, MAX_FOCUS_AREAS) }),
    setMinutes: (minutes) => update({ minutes }),
    setDays: (days) => update({ days }),
    toggleInterest: (interest) => update({ interests: toggleInList(get().interests, interest) }),
    toggleMaterial: (material) => update({ materials: toggleInList(get().materials, material) }),
    finish: () => {
      // Keep the answers as next week's starting point (at the last step), but never the note.
      update({ step: 5 });
    },
    reset: () => set({ ...INITIAL_ANSWERS, step: 1, childId: null }),
  };
});

/** The child the next plan is for. */
export function currentChild() {
  return activeChild(useChildrenStore.getState());
}
