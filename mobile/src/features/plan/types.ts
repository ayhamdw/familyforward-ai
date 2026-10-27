import type { DaysOption, FocusArea, MinutesOption, AgeBand } from "@familyforward/shared";

export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri";

export type PlanItem = {
  /** 1-based position in the week. */
  day: number;
  weekday: Weekday;
  activityId: string;
  done: boolean;
  /** null until the parent answers "Was this activity a good fit?". */
  fit: boolean | null;
};

export type Plan = {
  id: string;
  /** Monday of the plan's week, as YYYY-MM-DD. */
  weekStart: string;
  createdAt: string;
  /** "fallback" is a ready-made plan used when a custom plan could not be made. */
  source: "custom" | "fallback";
  ageBand: AgeBand;
  minutes: MinutesOption;
  days: DaysOption;
  focus: FocusArea[];
  items: PlanItem[];
};

export type PastWeek = {
  id: string;
  weekStart: string;
  activityCount: number;
  focus: FocusArea[];
};
