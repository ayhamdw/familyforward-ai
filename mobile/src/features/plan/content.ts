import { findActivity, type Activity, type ActivityText, type Language } from "@familyforward/shared";
import { isLanguage } from "@/storage/language";

export function currentLanguage(language: string): Language {
  return isLanguage(language) ? language : "en";
}

/** Activity text in the given UI language. The seed text is used as written. */
export function activityText(activity: Activity, language: string): ActivityText {
  return activity[currentLanguage(language)];
}

export function activityById(id: string | undefined): Activity | undefined {
  return id === undefined ? undefined : findActivity(id);
}
