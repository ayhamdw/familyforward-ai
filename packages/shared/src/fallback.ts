import type { Language } from "./index";
import { seedActivities, type Activity } from "./content/activities";
import { CLOSING_LINES } from "./content/plan-text";
import type { FocusArea } from "./content/survey";
import type { PlanActivity, PlanDay, PlanOutput, SurveyInput } from "./schemas";

/** Day of the week (1 = Monday) for each chosen number of days, spread across the week. */
export const DAY_SLOTS: Record<SurveyInput["daysPerWeek"], readonly number[]> = {
  2: [2, 5],
  3: [1, 3, 5],
  5: [1, 2, 3, 4, 5],
};

type FallbackInput = Pick<SurveyInput, "ageBand" | "focusAreas" | "minutesPerDay" | "daysPerWeek" | "materials">;

/**
 * How well an activity fits one slot of the week whose target focus is `focus`. Lower is better.
 *   0: same age band and same focus
 *   1: same focus, other age band
 *   2: same age band, other focus (other chosen focus areas first)
 *   3: anything else the family's materials allow
 * Within a tier the nearest length wins, shorter before longer on a tie.
 */
export function fallbackRank(
  activity: Activity,
  survey: FallbackInput,
  focus: FocusArea,
): [number, number, number, number] {
  const sameAge = activity.ageBand === survey.ageBand;
  const sameFocus = activity.focus === focus;
  const tier = sameAge && sameFocus ? 0 : sameFocus ? 1 : sameAge ? 2 : 3;
  return [
    tier,
    tier >= 2 && !survey.focusAreas.includes(activity.focus) ? 1 : 0,
    Math.abs(activity.minutes - survey.minutesPerDay),
    activity.minutes > survey.minutesPerDay ? 1 : 0,
  ];
}

function compareRank(a: number[], b: number[]): number {
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

/**
 * Picks seed activities for a survey, one per day. Only activities whose materials the family has
 * are used. Chosen focus areas take turns, and each day takes the best fit by `fallbackRank`.
 * An activity is not used twice unless the family's pool is smaller than the week. Deterministic.
 */
export function selectFallbackActivities(
  survey: FallbackInput,
  activities: readonly Activity[] = seedActivities,
): Activity[] {
  const have = new Set(survey.materials);
  const pool = activities
    .filter((a) => a.materialKeys.every((m) => have.has(m)))
    .sort((x, y) => x.id.localeCompare(y.id));
  const picked: Activity[] = [];
  const used = new Set<string>();

  for (let slot = 0; slot < survey.daysPerWeek && pool.length > 0; slot += 1) {
    const focus = survey.focusAreas[slot % survey.focusAreas.length];
    const candidates = pool.filter((a) => !used.has(a.id));
    // Every activity was used already: start over rather than leave a day empty.
    const from = candidates.length > 0 ? candidates : pool;
    const best = from
      .map((a) => ({ a, r: fallbackRank(a, survey, focus) }))
      .sort((x, y) => compareRank(x.r, y.r))[0].a;
    picked.push(best);
    used.add(best.id);
    if (used.size === pool.length) used.clear();
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
