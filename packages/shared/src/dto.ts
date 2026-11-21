import { z } from "zod";
import {
  AgeBandSchema,
  CheckInAnswerSchema,
  HomeLanguageSchema,
  LanguageSchema,
  PlanDaySchema,
  PlanSourceSchema,
  ReactionSchema,
  WorthNoticingSchema,
} from "./schemas";

/** A child as the API returns it. Nickname, age band and home languages only. */
export const ChildDtoSchema = z.object({
  id: z.string(),
  nickname: z.string(),
  ageBand: AgeBandSchema,
  homeLanguages: z.array(HomeLanguageSchema),
  createdAt: z.string(),
});
export type ChildDto = z.infer<typeof ChildDtoSchema>;

const PlanDayDtoSchema = PlanDaySchema.extend({ done: z.boolean(), reaction: ReactionSchema.nullable() });
export type PlanDayDto = z.infer<typeof PlanDayDtoSchema>;

/** A plan as the API returns it (and as the app caches it). Not strict: the server may add fields later. */
export const PlanDtoSchema = z.object({
  id: z.string(),
  childId: z.string().nullable(),
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  language: LanguageSchema,
  summary: z.string(),
  days: z.array(PlanDayDtoSchema).min(1),
  worthNoticing: z.array(WorthNoticingSchema),
  resourceIds: z.array(z.string()),
  checkIn: z.array(z.string()),
  checkInAnswers: z.array(CheckInAnswerSchema),
  closing: z.string(),
  source: PlanSourceSchema,
  createdAt: z.string(),
});
export type PlanDto = z.infer<typeof PlanDtoSchema>;

/** POST /plans also returns whether a clean note was left unused. */
export const CreatePlanResponseSchema = PlanDtoSchema.extend({ noteIgnored: z.boolean().optional() });
export type CreatePlanResponse = z.infer<typeof CreatePlanResponseSchema>;

/** Parse helpers so clients never need their own copy of zod. Each returns null when the data does not match. */
export const parseChild = (data: unknown): ChildDto | null => {
  const r = ChildDtoSchema.safeParse(data);
  return r.success ? r.data : null;
};
export const parseChildren = (data: unknown): ChildDto[] | null => {
  const r = z.array(ChildDtoSchema).safeParse(data);
  return r.success ? r.data : null;
};
export const parsePlan = (data: unknown): PlanDto | null => {
  const r = PlanDtoSchema.safeParse(data);
  return r.success ? r.data : null;
};
export const parsePlans = (data: unknown): PlanDto[] | null => {
  const r = z.array(PlanDtoSchema).safeParse(data);
  return r.success ? r.data : null;
};
export const parseCreatePlan = (data: unknown): CreatePlanResponse | null => {
  const r = CreatePlanResponseSchema.safeParse(data);
  return r.success ? r.data : null;
};
