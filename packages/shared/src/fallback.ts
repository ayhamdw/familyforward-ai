import type { Language } from "./index";
import { seedActivities, type Activity } from "./content/activities";
import {
  CLOSING_LINES,
  FALLBACK_CHECKIN,
  FALLBACK_SUMMARY,
  signalCards,
} from "./content/plan-text";
import { resources } from "./content/resources";
import type { FocusArea, HomeLanguage } from "./content/survey";
import type { PlanActivity, PlanDay, PlanOutput, SurveyInput } from "./schemas";

/** Day of the week (1 = Monday) for each chosen number of days, spread across the week. */
export const DAY_SLOTS: Record<SurveyInput["daysPerWeek"], readonly number[]> = {
  2: [2, 5],
  3: [1, 3, 5],
  5: [1, 2, 3, 4, 5],
};

type FallbackInput = Pick<SurveyInput, "ageBand" | "focusAreas" | "minutesPerDay" | "daysPerWeek" | "materials">;

/** Optional signals. All come from counts and enums, never from free text. */
export type FallbackOptions = {
  homeLanguages?: readonly HomeLanguage[];
  /** Activities rated "didn't work" last week. Skipped when another choice exists. */
  avoidActivityIds?: readonly string[];
  /** Focus areas rated "loved" last week. Tried first. */
  preferredFocuses?: readonly FocusArea[];
};

/**
 * How well an activity fits one slot of the week whose target focus is `focus`. Lower is better.
 *   0: same age band and same focus
 *   1: same focus, other age band
 *   2: same age band, other focus (other chosen or loved focus areas first)
 *   3: anything else the family's materials allow
 * Within a tier the nearest length wins, shorter before longer on a tie.
 */
export function fallbackRank(
  activity: Activity,
  survey: FallbackInput,
  focus: FocusArea,
  preferred: readonly FocusArea[] = [],
): [number, number, number, number] {
  const sameAge = activity.ageBand === survey.ageBand;
  const sameFocus = activity.focus === focus;
  const tier = sameAge && sameFocus ? 0 : sameFocus ? 1 : sameAge ? 2 : 3;
  const wanted = survey.focusAreas.includes(activity.focus) || preferred.includes(activity.focus);
  return [
    tier,
    tier >= 2 && !wanted ? 1 : 0,
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
 * are used. Chosen focus areas take turns (loved ones first), and each day takes the best fit by
 * `fallbackRank`. An activity is not used twice unless the family's pool is smaller than the week.
 * Deterministic.
 */
export function selectFallbackActivities(
  survey: FallbackInput,
  activities: readonly Activity[] = seedActivities,
  options: FallbackOptions = {},
): Activity[] {
  const have = new Set(survey.materials);
  const avoid = new Set(options.avoidActivityIds ?? []);
  const preferred = options.preferredFocuses ?? [];
  const fits = activities
    .filter((a) => a.materialKeys.every((m) => have.has(m)))
    .sort((x, y) => x.id.localeCompare(y.id));
  // Skip activities that did not work, unless that would leave too few to fill the week.
  const kept = fits.filter((a) => !avoid.has(a.id));
  const pool = kept.length >= survey.daysPerWeek ? kept : fits;
  const order = [...survey.focusAreas].sort((a, b) => Number(preferred.includes(b)) - Number(preferred.includes(a)));

  const picked: Activity[] = [];
  const used = new Set<string>();
  for (let slot = 0; slot < survey.daysPerWeek && pool.length > 0; slot += 1) {
    const focus = order[slot % order.length];
    const candidates = pool.filter((a) => !used.has(a.id));
    // Every activity was used already: start over rather than leave a day empty.
    const from = candidates.length > 0 ? candidates : pool;
    const best = from
      .map((a) => ({ a, r: fallbackRank(a, survey, focus, preferred) }))
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
    focus: activity.focus,
    minutes: activity.minutes,
    materials: [...activity.materialKeys],
    steps: [...text.steps],
    why: text.why,
    safety: text.safety,
    easier: text.easier,
    harder: text.harder,
    noticeThis: text.noticeThis,
  };
}

// Preferred order for the general plan resources; the first ones that fit the age band and language win.
const PLAN_RESOURCE_ORDER = [
  "chicago-public-library",
  "vroom",
  "pbs-kids-for-parents",
  "sesame-workshop",
  "chicago-early-learning",
  "illinois-early-learning-project",
  "colorin-colorado",
  "211-metro-chicago",
] as const;

/** Two to four free resources for a plan, by age band and language. */
export function planResourceIds(ageBand: SurveyInput["ageBand"], language: Language, count = 3): string[] {
  const usable = PLAN_RESOURCE_ORDER.map((id) => resources.find((r) => r.id === id)).filter(
    (r): r is NonNullable<typeof r> => r !== undefined && r.ageBands.includes(ageBand),
  );
  const inLanguage = usable.filter((r) => r.languages.includes(language));
  const chosen = inLanguage.length >= 2 ? inLanguage : usable;
  return chosen.slice(0, count).map((r) => r.id);
}

/**
 * The ready-made plan used when the generator fails. A complete plan written straight from the
 * seed file in the survey language (never translated on the fly). Used by both the API and the
 * mobile app.
 */
export function buildFallbackPlan(survey: SurveyInput, options: FallbackOptions = {}): PlanOutput {
  const chosen = selectFallbackActivities(survey, seedActivities, options);
  const slots = DAY_SLOTS[survey.daysPerWeek];
  const days: PlanDay[] = chosen.map((activity, index) => ({
    day: slots[index] ?? slots[slots.length - 1],
    activity: toPlanActivity(activity, survey.language),
  }));
  return {
    language: survey.language,
    summary: FALLBACK_SUMMARY[survey.language],
    days,
    worthNoticing: signalCards({
      language: survey.language,
      homeLanguages: options.homeLanguages ?? [],
      minutesPerDay: survey.minutesPerDay,
      materials: survey.materials,
      focusAreas: survey.focusAreas,
    }),
    resourceIds: planResourceIds(survey.ageBand, survey.language),
    checkIn: [...FALLBACK_CHECKIN[survey.language]],
    closing: CLOSING_LINES[survey.language],
  };
}
