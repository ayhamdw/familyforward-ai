import { PlanOutputSchema, type PlanOutput, type SurveyInput } from "@familyforward/shared";

export type ValidationReason =
  | "invalid_json"
  | "schema_invalid"
  | "language_mismatch"
  | "days_mismatch"
  | "minutes_mismatch"
  | "materials_mismatch";

export type ValidationResult = { ok: true; plan: PlanOutput } | { ok: false; reason: ValidationReason };

const ARABIC_LETTERS = /[ء-ي]/g;
const LATIN_LETTERS = /[A-Za-z]/g;

/** Rough script check: Arabic plans are mostly Arabic letters, other plans have almost none. */
function scriptMatches(plan: PlanOutput): boolean {
  const text = plan.days
    .flatMap((d) => [d.activity.title, d.activity.why, d.activity.safety, ...d.activity.steps])
    .join(" ");
  const arabic = (text.match(ARABIC_LETTERS) ?? []).length;
  const latin = (text.match(LATIN_LETTERS) ?? []).length;
  return plan.language === "ar" ? arabic > latin * 3 : arabic === 0 && latin > 0;
}

function stripFence(raw: string): string {
  const text = raw.trim();
  const match = /^```(?:json)?\s*([\s\S]*?)\s*```$/.exec(text);
  return match ? match[1] : text;
}

export function validatePlan(raw: string, survey: SurveyInput): ValidationResult {
  let data: unknown;
  try {
    data = JSON.parse(stripFence(raw));
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
  const parsed = PlanOutputSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, reason: "schema_invalid" };
  }
  const plan = parsed.data;
  if (plan.language !== survey.language || !scriptMatches(plan)) {
    return { ok: false, reason: "language_mismatch" };
  }
  const dayNumbers = plan.days.map((d) => d.day);
  if (plan.days.length !== survey.daysPerWeek || new Set(dayNumbers).size !== dayNumbers.length) {
    return { ok: false, reason: "days_mismatch" };
  }
  if (plan.days.some((d) => d.activity.minutes !== survey.minutesPerDay)) {
    return { ok: false, reason: "minutes_mismatch" };
  }
  const have = new Set<string>(survey.materials);
  if (plan.days.some((d) => d.activity.materials.some((m) => !have.has(m)))) {
    return { ok: false, reason: "materials_mismatch" };
  }
  return { ok: true, plan };
}
