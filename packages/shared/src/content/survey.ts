export const SURVEY_AGE_BANDS = ["2-3", "4-5"] as const;
export type SurveyAgeBand = (typeof SURVEY_AGE_BANDS)[number];

export const FOCUS_AREAS = ["talking", "reading", "counting", "feelings", "movement", "routines"] as const;
export type FocusArea = (typeof FOCUS_AREAS)[number];
export const MAX_FOCUS_AREAS = 2;

export const MINUTES_OPTIONS = [5, 10, 20] as const;
export type MinutesOption = (typeof MINUTES_OPTIONS)[number];

export const DAYS_OPTIONS = [2, 3, 5] as const;
export type DaysOption = (typeof DAYS_OPTIONS)[number];

export const INTERESTS = ["songs", "books", "building", "drawing", "outdoors", "pretend", "cooking"] as const;
export type Interest = (typeof INTERESTS)[number];

export const MATERIALS = ["paper", "books", "kitchen", "toys", "phone", "outdoor"] as const;
export type Material = (typeof MATERIALS)[number];

export const NOTE_MAX_LENGTH = 140;
