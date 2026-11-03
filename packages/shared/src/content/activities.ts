import seed from "./seed-activities.json";
import type { Language } from "../index";
import type { FocusArea, MinutesOption, AgeBand, Material } from "./survey";

export type ActivityText = {
  title: string;
  materials: string;
  steps: string[];
  why: string;
  safety: string;
};

export type Activity = {
  id: string;
  ageBand: AgeBand;
  minutes: MinutesOption;
  focus: FocusArea;
  /** Material keys the activity needs. Empty means it needs nothing from the survey list. */
  materialKeys: Material[];
} & Record<Language, ActivityText>;

export const seedActivities = seed.activities as unknown as readonly Activity[];

export function findActivity(id: string): Activity | undefined {
  return seedActivities.find((activity) => activity.id === id);
}
