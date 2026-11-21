import {
  CONCERN_RESOURCE_IDS,
  buildFallbackPlan,
  concernCard,
  hasHealthWords,
  type ChildDto,
  type FallbackOptions,
  type Language,
  type PlanDto,
  type SurveyInput,
} from "@familyforward/shared";
import type { SurveyAnswers } from "@/storage/surveyStore";

export function toDateString(date: Date): string {
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}-${day}`;
}

/** Monday of the week containing `date`, as YYYY-MM-DD (UTC). */
export function mondayOf(date: Date): string {
  const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const offset = (copy.getUTCDay() + 6) % 7;
  copy.setUTCDate(copy.getUTCDate() - offset);
  return toDateString(copy);
}

export function addDays(dateString: string, days: number): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return toDateString(date);
}

/** The survey in the shape the shared fallback expects. */
export function toSurveyInput(child: Pick<ChildDto, "ageBand">, answers: SurveyAnswers, language: Language): SurveyInput {
  return {
    language,
    ageBand: child.ageBand,
    focusAreas: answers.focus,
    interests: answers.interests,
    materials: answers.materials,
    minutesPerDay: answers.minutes,
    daysPerWeek: answers.days,
  };
}

/**
 * A ready-made plan built on the phone when the server cannot be reached. It uses the same shared
 * fallback as the API, including the same fixed card when the note mentions health or development.
 * The note is only checked here and never kept.
 */
export function buildLocalPlan(
  child: ChildDto,
  answers: SurveyAnswers,
  language: Language,
  options: { note?: string; fallback?: FallbackOptions; now?: Date } = {},
): PlanDto {
  const now = options.now ?? new Date();
  const survey = toSurveyInput(child, answers, language);
  const output = buildFallbackPlan(survey, { ...options.fallback, homeLanguages: child.homeLanguages });
  const worthNoticing = hasHealthWords(options.note ?? "")
    ? [concernCard(language, child.ageBand, [...CONCERN_RESOURCE_IDS[child.ageBand]])]
    : output.worthNoticing;
  return {
    id: `local-${now.getTime().toString(36)}`,
    childId: child.id,
    weekStart: mondayOf(now),
    language,
    summary: output.summary,
    days: output.days.map((d) => ({ ...d, done: false, reaction: null })),
    worthNoticing,
    resourceIds: output.resourceIds,
    checkIn: output.checkIn,
    checkInAnswers: [],
    closing: output.closing,
    source: "fallback",
    createdAt: now.toISOString(),
  };
}

export const isLocalPlan = (plan: Pick<PlanDto, "id">): boolean => plan.id.startsWith("local-");
