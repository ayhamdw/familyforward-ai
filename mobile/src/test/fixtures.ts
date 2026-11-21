import type { ChildDto, PlanDto } from "@familyforward/shared";
import { buildLocalPlan } from "@/features/plan/buildPlan";
import type { SurveyAnswers } from "@/storage/surveyStore";

export const CHILD: ChildDto = { id: "c1", nickname: "Sunny", ageBand: "2-3", homeLanguages: ["en", "es"], createdAt: "2026-11-01T00:00:00.000Z" };

export const ANSWERS: SurveyAnswers = { focus: ["talking"], minutes: 10, days: 3, interests: ["songs"], materials: ["paper", "kitchen"] };

/** A server-shaped plan (id without the local- prefix). */
export function serverPlan(overrides: Partial<PlanDto> = {}, language: "en" | "es" | "ar" = "en"): PlanDto {
  const plan = buildLocalPlan(CHILD, ANSWERS, language, { now: new Date("2026-11-04T10:00:00Z") });
  return { ...plan, id: "p1", source: "ai", ...overrides };
}
