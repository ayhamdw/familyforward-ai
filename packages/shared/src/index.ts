export const LANGUAGES = ["en", "es", "ar"] as const;
export type Language = (typeof LANGUAGES)[number];

export * from "./content/survey";
export * from "./content/survey-labels";
export * from "./content/activities";
export * from "./health-words";
