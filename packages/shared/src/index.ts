export const LANGUAGES = ["en", "es", "ar"] as const;
export type Language = (typeof LANGUAGES)[number];

export const AGE_BANDS = ["2-3", "3-5", "6-8", "9-11", "12"] as const;
export type AgeBand = (typeof AGE_BANDS)[number];
