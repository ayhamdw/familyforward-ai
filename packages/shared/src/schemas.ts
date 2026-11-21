import { z } from "zod";
import {
  AGE_BANDS,
  FOCUS_AREAS,
  HOME_LANGUAGES,
  INTERESTS,
  MATERIALS,
  MAX_FOCUS_AREAS,
  NICKNAME_MAX_LENGTH,
  NOTE_MAX_LENGTH,
} from "./content/survey";
import { RESOURCE_IDS } from "./content/resources";

/** Same list as LANGUAGES in index.ts; kept here to avoid a circular import. */
export const LanguageSchema = z.enum(["en", "es", "ar"]);
export const AgeBandSchema = z.enum(AGE_BANDS);
export const FocusAreaSchema = z.enum(FOCUS_AREAS);
export const InterestSchema = z.enum(INTERESTS);
export const MaterialSchema = z.enum(MATERIALS);
export const HomeLanguageSchema = z.enum(HOME_LANGUAGES);
export const MinutesSchema = z.union([z.literal(5), z.literal(10), z.literal(20)]);
export const DaysPerWeekSchema = z.union([z.literal(2), z.literal(3), z.literal(5)]);

/** What the app sends in the survey. The age band is not asked here: it comes from the child. */
export const SurveyAnswersSchema = z
  .object({
    language: LanguageSchema,
    focusAreas: z.array(FocusAreaSchema).min(1).max(MAX_FOCUS_AREAS),
    interests: z.array(InterestSchema).max(INTERESTS.length),
    materials: z.array(MaterialSchema).max(MATERIALS.length),
    minutesPerDay: MinutesSchema,
    daysPerWeek: DaysPerWeekSchema,
  })
  .strict();
export type SurveyAnswers = z.infer<typeof SurveyAnswersSchema>;

/** Survey answers plus the child's age band. This is what the generator and fallback work from. */
export const SurveyInputSchema = SurveyAnswersSchema.extend({ ageBand: AgeBandSchema }).strict();
export type SurveyInput = z.infer<typeof SurveyInputSchema>;

/** A child profile. Only a nickname, an age band and home languages: never a name, birth date or school. */
export const ChildInputSchema = z
  .object({
    nickname: z.string().trim().min(1).max(NICKNAME_MAX_LENGTH),
    ageBand: AgeBandSchema,
    homeLanguages: z.array(HomeLanguageSchema).max(HOME_LANGUAGES.length),
  })
  .strict();
export type ChildInput = z.infer<typeof ChildInputSchema>;
export const ChildPatchSchema = ChildInputSchema.partial().strict();

export const REACTIONS = ["loved", "fine", "didnt_work"] as const;
export const ReactionSchema = z.enum(REACTIONS);
export type Reaction = z.infer<typeof ReactionSchema>;

export const CHECKIN_ANSWERS = ["yes", "somewhat", "no"] as const;
export const CheckInAnswerSchema = z.enum(CHECKIN_ANSWERS);
export type CheckInAnswer = z.infer<typeof CheckInAnswerSchema>;

/**
 * POST /plans body. The note is length-checked here, handed to the prompt builder in memory
 * and then dropped. It is never stored or logged.
 */
export const PlanRequestSchema = SurveyAnswersSchema.extend({
  childId: z.string().min(1).max(40),
  note: z.string().max(NOTE_MAX_LENGTH).optional(),
  previousPlanId: z.string().min(1).max(40).optional(),
  regenerate: z.boolean().optional(),
}).strict();
export type PlanRequest = z.infer<typeof PlanRequestSchema>;

export const ActivityPatchSchema = z
  .object({ done: z.boolean(), reaction: ReactionSchema.nullable() })
  .strict();
export const CheckInRequestSchema = z.object({ answers: z.array(CheckInAnswerSchema).min(2).max(3) }).strict();

/**
 * One activity in a plan. Field mapping to the brief: `why` is the brief's `purpose` and `focus`
 * is its `domain`. Strict: unknown fields are rejected, so there is nowhere to put a label,
 * score, percentile, risk level or comparison.
 */
export const ActivitySchema = z
  .object({
    id: z.string().min(1).max(80),
    title: z.string().min(1).max(120),
    focus: FocusAreaSchema,
    minutes: MinutesSchema,
    /** Material keys the activity needs. Empty means nothing is needed. */
    materials: z.array(MaterialSchema).max(MATERIALS.length),
    steps: z.array(z.string().min(1).max(300)).min(3).max(6),
    why: z.string().min(1).max(300),
    safety: z.string().min(1).max(300),
    easier: z.string().min(1).max(200),
    harder: z.string().min(1).max(200),
    noticeThis: z.string().min(1).max(200),
  })
  .strict();
export type PlanActivity = z.infer<typeof ActivitySchema>;

export const PlanDaySchema = z
  .object({
    /** 1-based position in the week. */
    day: z.number().int().min(1).max(7),
    activity: ActivitySchema,
  })
  .strict();
export type PlanDay = z.infer<typeof PlanDaySchema>;

const ResourceIdSchema = z.string().refine((id) => RESOURCE_IDS.includes(id), { message: "unknown resource" });

export const MENTION_TO = ["teacher", "pediatrician", "none"] as const;

/** A gentle note for the parent. It never names, labels or interprets anything. */
export const WorthNoticingSchema = z
  .object({
    observation: z.string().min(1).max(300),
    tryThis: z.string().min(1).max(300),
    mentionTo: z.enum(MENTION_TO),
    resourceIds: z.array(ResourceIdSchema).max(4),
  })
  .strict();
export type WorthNoticing = z.infer<typeof WorthNoticingSchema>;

export const PLAN_SOURCES = ["ai", "fallback"] as const;
export const PlanSourceSchema = z.enum(PLAN_SOURCES);
export type PlanSource = z.infer<typeof PlanSourceSchema>;

/** What the model must return (JSON only). */
export const PlanOutputSchema = z
  .object({
    language: LanguageSchema,
    /** Two sentences for the parent. */
    summary: z.string().min(1).max(400),
    days: z.array(PlanDaySchema).min(1).max(5),
    worthNoticing: z.array(WorthNoticingSchema).max(3),
    resourceIds: z.array(ResourceIdSchema).min(2).max(4),
    /** Two or three questions for next week, each answered yes / somewhat / no. */
    checkIn: z.array(z.string().min(1).max(200)).min(2).max(3),
    /** Required closing line, in the plan language. */
    closing: z.string().min(1).max(300),
  })
  .strict();
export type PlanOutput = z.infer<typeof PlanOutputSchema>;
