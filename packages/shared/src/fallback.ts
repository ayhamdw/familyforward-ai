import type { Language } from "./index";
import { seedActivities, type Activity } from "./content/activities";
import { CLOSING_LINES } from "./content/plan-text";
import type { PlanActivity, PlanDay, PlanOutput, SurveyInput } from "./schemas";

/** Day of the week (1 = Monday) for each chosen number of days, spread across the week. */
export const DAY_SLOTS: Record<SurveyInput["daysPerWeek"], readonly number[]> = {
  2: [2, 5],
  3: [1, 3, 5],
  5: [1, 2, 3, 4, 5],
};

type FallbackInput = Pick<SurveyInput, "ageBand" | "focusAreas" | "minutesPerDay" | "daysPerWeek" | "materials">;

/** Lower is better: chosen focus first, then not longer than asked, then closest length. */
function rank(activity: Activity, survey: FallbackInput): [number, number, number] {
  return [
    survey.focusAreas.includes(activity.focus) ? 0 : 1,
    activity.minutes > survey.minutesPerDay ? 1 : 0,
    Math.abs(activity.minutes - survey.minutesPerDay),
  ];
}

/**
 * Picks seed activities for a survey: same age band, only activities whose materials the family
 * has, then chosen focus areas, then the closest length. Chosen focus areas take turns so a
 * two-focus week mixes both. Deterministic. One activity per day.
 */
export function selectFallbackActivities(
  survey: FallbackInput,
  activities: readonly Activity[] = seedActivities,
): Activity[] {
  const have = new Set(survey.materials);
  const pool = activities
    .filter((a) => a.ageBand === survey.ageBand && a.materialKeys.every((m) => have.has(m)))
    .map((a) => ({ a, r: rank(a, survey) }))
    .sort((x, y) => x.r[0] - y.r[0] || x.r[1] - y.r[1] || x.r[2] - y.r[2] || x.a.id.localeCompare(y.a.id))
    .map((entry) => entry.a);

  const wanted = survey.daysPerWeek;
  const picked: Activity[] = [];
  const used = new Set<string>();

  // Round one: take turns across the chosen focus areas, best match first.
  for (let turn = 0; picked.length < wanted && turn < wanted * survey.focusAreas.length; turn += 1) {
    const focus = survey.focusAreas[turn % survey.focusAreas.length];
    const next = pool.find((a) => !used.has(a.id) && a.focus === focus);
    if (next) {
      picked.push(next);
      used.add(next.id);
    }
  }
  // Fill any gap from the ranked pool, then repeat if the pool is smaller than the week.
  for (const a of pool) {
    if (picked.length >= wanted) break;
    if (!used.has(a.id)) {
      picked.push(a);
      used.add(a.id);
    }
  }
  for (let i = 0; picked.length < wanted && pool.length > 0; i += 1) {
    picked.push(pool[i % pool.length]);
  }
  return picked;
}

export function toPlanActivity(activity: Activity, language: Language): PlanActivity {
  const text = activity[language];
  return {
    id: activity.id,
    title: text.title,
    minutes: activity.minutes,
    materials: [...activity.materialKeys],
    steps: [...text.steps],
    why: text.why,
    safety: text.safety,
  };
}

/**
 * The ready-made plan used when the generator fails. Written straight from the seed file in the
 * survey language (never translated on the fly). Used by both the API and the mobile mock.
 */
export function buildFallbackPlan(survey: SurveyInput): PlanOutput {
  const chosen = selectFallbackActivities(survey);
  const slots = DAY_SLOTS[survey.daysPerWeek];
  const days: PlanDay[] = chosen.map((activity, index) => ({
    day: slots[index] ?? slots[slots.length - 1],
    activity: toPlanActivity(activity, survey.language),
  }));
  return { language: survey.language, days, closing: CLOSING_LINES[survey.language] };
}
