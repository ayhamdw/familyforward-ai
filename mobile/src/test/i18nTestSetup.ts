import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ar from "@/i18n/ar.json";
import en from "@/i18n/en.json";
import es from "@/i18n/es.json";

/** Initializes a plain i18next instance for component tests (no device locale, no storage). */
export async function setupTestI18n(language: "en" | "es" | "ar" = "en"): Promise<void> {
  if (!i18n.isInitialized) {
    await i18n.use(initReactI18next).init({
      resources: { en: { translation: en }, es: { translation: es }, ar: { translation: ar } },
      lng: language,
      fallbackLng: "en",
      interpolation: { escapeValue: false },
    });
  } else {
    await i18n.changeLanguage(language);
  }
}
