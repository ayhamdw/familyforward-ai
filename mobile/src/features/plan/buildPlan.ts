import { seedActivities, type Activity, type DaysOption } from "@familyforward/shared";
import type { SurveyAnswers } from "@/storage/surveyStore";
import type { Plan, PlanItem, Weekday } from "./types";

type CompleteAnswers = SurveyAnswers & { ageBand: NonNullable<SurveyAnswers["ageBand"]> };

export const WEEKDAY_SCHEDULE: Record<DaysOption, Weekday[]> = {
  2: ["mon", "thu"],
  3: ["mon", "wed", "fri"],
  5: ["mon", "tue", "wed", "thu", "fri"],
};

/**
 * Mock selection from the seed file: same age band, preferring the chosen focus areas, then
 * activities that fit the chosen minutes. One activity per chosen day.
 */
export function selectActivities(answers: CompleteAnswers, activities: readonly Activity[] = seedActivities): Activity[] {
  return activities
    .filter((activity) => activity.ageBand === answers.ageBand)
    .map((activity) => ({
      activity,
      focusMiss: answers.focus.includes(activity.focus) ? 0 : 1,
      tooLong: activity.minutes <= answers.minutes ? 0 : 1,
      distance: Math.abs(activity.minutes - answers.minutes),
    }))
    .sort(
      (a, b) =>
        a.focusMiss - b.focusMiss ||
        a.tooLong - b.tooLong ||
        a.distance - b.distance ||
        a.activity.id.localeCompare(b.activity.id),
    )
    .slice(0, answers.days)
    .map((entry) => entry.activity);
}

/** A ready-made plan for the chosen age band, ignoring focus. Used when a custom plan fails. */
export function selectFallbackActivities(answers: CompleteAnswers, activities: readonly Activity[] = seedActivities): Activity[] {
  return activities.filter((activity) => activity.ageBand === answers.ageBand).slice(0, answers.days);
}

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

type BuildOptions = {
  weekStart: string;
  source: Plan["source"];
  now?: Date;
};

export function buildMockPlan(answers: CompleteAnswers, { weekStart, source, now = new Date() }: BuildOptions): Plan {
  const chosen = source === "fallback" ? selectFallbackActivities(answers) : selectActivities(answers);
  const schedule = WEEKDAY_SCHEDULE[answers.days];
  const items: PlanItem[] = chosen.map((activity, index) => ({
    day: index + 1,
    weekday: schedule[index] ?? "fri",
    activityId: activity.id,
    done: false,
    fit: null,
  }));
  return {
    id: `${weekStart}-${now.getTime().toString(36)}`,
    weekStart,
    createdAt: now.toISOString(),
    source,
    ageBand: answers.ageBand,
    minutes: answers.minutes,
    days: answers.days,
    focus: [...answers.focus],
    items,
  };
}
