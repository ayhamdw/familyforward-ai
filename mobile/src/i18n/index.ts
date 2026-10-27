import { I18nManager } from "react-native";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import type { Language } from "@familyforward/shared";
import {
  isLanguage,
  loadDirectionReload,
  loadLanguage,
  saveDirectionReload,
  saveLanguage,
} from "@/storage/language";
import { reloadApp } from "./reload";
import en from "./en.json";
import es from "./es.json";
import ar from "./ar.json";

const FALLBACK_LANGUAGE: Language = "en";

// Language names are shown in their own language on purpose, in every locale.
export const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English",
  es: "Español",
  ar: "العربية",
};

export function isRtlLanguage(language: Language): boolean {
  return language === "ar";
}

function deviceLanguage(): Language {
  const code = getLocales()[0]?.languageCode;
  return isLanguage(code) ? code : FALLBACK_LANGUAGE;
}

/** Applies the layout direction. Returns true if it changed and a reload is needed. */
function applyDirection(language: Language): boolean {
  const rtl = isRtlLanguage(language);
  I18nManager.allowRTL(rtl);
  if (I18nManager.isRTL === rtl) {
    return false;
  }
  I18nManager.forceRTL(rtl);
  return true;
}

export async function initI18n(): Promise<void> {
  const language = (await loadLanguage()) ?? deviceLanguage();
  await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      ar: { translation: ar },
    },
    lng: language,
    fallbackLng: FALLBACK_LANGUAGE,
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  if (applyDirection(language)) {
    // Reload at most once per language, so a reload that does not flip the direction cannot loop.
    if ((await loadDirectionReload()) !== language) {
      await saveDirectionReload(language);
      await reloadApp();
    }
  } else {
    await saveDirectionReload(null);
  }
}

export async function changeLanguage(language: Language): Promise<void> {
  await saveLanguage(language);
  await i18n.changeLanguage(language);
  if (applyDirection(language)) {
    await saveDirectionReload(language);
    await reloadApp();
  } else {
    await saveDirectionReload(null);
  }
}

export default i18n;
