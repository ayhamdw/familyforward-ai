import { findActivity, type Activity, type ActivityText } from "@familyforward/shared";
import { currentLanguage } from "@/i18n/language";

/** Activity text in the given UI language. The seed text is used as written. */
export function activityText(activity: Activity, language: string): ActivityText {
  return activity[currentLanguage(language)];
}

export function activityById(id: string | undefined): Activity | undefined {
  return id === undefined ? undefined : findActivity(id);
}
