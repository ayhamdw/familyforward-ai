import type { Language } from "@familyforward/shared";
import { isLanguage } from "@/storage/language";

/** Narrows i18n's language string (which can be "en-US" or unset) to a supported language. */
export function currentLanguage(language: string): Language {
  return isLanguage(language) ? language : "en";
}
