import AsyncStorage from "@react-native-async-storage/async-storage";
import { LANGUAGES, type Language } from "@familyforward/shared";

const LANGUAGE_KEY = "familyforward.language";

export function isLanguage(value: string | null | undefined): value is Language {
  return LANGUAGES.some((language) => language === value);
}

export async function loadLanguage(): Promise<Language | null> {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
    return isLanguage(stored) ? stored : null;
  } catch {
    return null;
  }
}

export async function saveLanguage(language: Language): Promise<void> {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    // Storage failure is non-fatal: the choice just won't survive a restart.
  }
}
