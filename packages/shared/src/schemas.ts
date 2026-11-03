import { z } from "zod";
import {
  AGE_BANDS,
  DAYS_OPTIONS,
  FOCUS_AREAS,
  INTERESTS,
  MATERIALS,
  MAX_FOCUS_AREAS,
  MINUTES_OPTIONS,
  NOTE_MAX_LENGTH,
} from "./content/survey";

/** Same list as LANGUAGES in index.ts; kept here to avoid a circular import. */
export const LanguageSchema = z.enum(["en", "es", "ar"]);
export const AgeBandSchema = z.enum(AGE_BANDS);
export const FocusAreaSchema = z.enum(FOCUS_AREAS);
export const InterestSchema = z.enum(INTERESTS);
export const MaterialSchema = z.enum(MATERIALS);
export const MinutesSchema = z.union([z.literal(5), z.literal(10), z.literal(20)]);
export const DaysPerWeekSchema = z.union([z.literal(2), z.literal(3), z.literal(5)]);

// Compile-time guard: the literals above must match the option lists.
const _minutes: readonly (typeof MINUTES_OPTIONS)[number][] = [5, 10, 20];
const _days: readonly (typeof DAYS_OPTIONS)[number][] = [2, 3, 5];
void _minutes;
void _days;

/** The survey answers. There is no free-text field: the note is a separate request field. */
export const SurveyInputSchema = z.object({
  language: LanguageSchema,
  ageBand: AgeBandSchema,
  focusAreas: z.array(FocusAreaSchema).min(1).max(MAX_FOCUS_AREAS),
  interests: z.array(InterestSchema).max(INTERESTS.length),
  materials: z.array(MaterialSchema).max(MATERIALS.length),
  minutesPerDay: MinutesSchema,
  daysPerWeek: DaysPerWeekSchema,
});
export type SurveyInput = z.infer<typeof SurveyInputSchema>;

/**
 * POST /plans body. The note is length-checked here, handed to the prompt builder in memory
 * and then dropped. It is never stored or logged.
 */
export const PlanRequestSchema = SurveyInputSchema.extend({
  note: z.string().max(NOTE_MAX_LENGTH).optional(),
});
export type PlanRequest = z.infer<typeof PlanRequestSchema>;

/** One activity in a plan. Same fields as one language of an entry in seed-activities.json. */
export const ActivitySchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().min(1).max(120),
  minutes: MinutesSchema,
  /** Material keys the activity needs. Empty means nothing is needed. */
  materials: z.array(MaterialSchema).max(MATERIALS.length),
  steps: z.array(z.string().min(1).max(300)).min(3).max(5),
  why: z.string().min(1).max(300),
  safety: z.string().min(1).max(300),
});
export type PlanActivity = z.infer<typeof ActivitySchema>;

export const PlanDaySchema = z.object({
  /** 1-based position in the week. */
  day: z.number().int().min(1).max(7),
  activity: ActivitySchema,
});
export type PlanDay = z.infer<typeof PlanDaySchema>;

export const PLAN_SOURCES = ["ai", "fallback"] as const;
export const PlanSourceSchema = z.enum(PLAN_SOURCES);
export type PlanSource = z.infer<typeof PlanSourceSchema>;

/** What the model must return (JSON only). */
export const PlanOutputSchema = z.object({
  language: LanguageSchema,
  days: z.array(PlanDaySchema).min(1).max(5),
  /** Required closing line, in the plan language. */
  closing: z.string().min(1).max(300),
});
export type PlanOutput = z.infer<typeof PlanOutputSchema>;
