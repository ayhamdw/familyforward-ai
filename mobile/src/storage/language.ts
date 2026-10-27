import AsyncStorage from "@react-native-async-storage/async-storage";
import { LANGUAGES, type Language } from "@familyforward/shared";

const LANGUAGE_KEY = "familyforward.language";
const DIRECTION_RELOAD_KEY = "familyforward.directionReloadFor";

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

/** The language we last reloaded for, so a reload that does not flip the direction cannot loop. */
export async function loadDirectionReload(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(DIRECTION_RELOAD_KEY);
  } catch {
    return null;
  }
}

export async function saveDirectionReload(language: Language | null): Promise<void> {
  try {
    if (language === null) {
      await AsyncStorage.removeItem(DIRECTION_RELOAD_KEY);
    } else {
      await AsyncStorage.setItem(DIRECTION_RELOAD_KEY, language);
    }
  } catch {
    // Non-fatal: worst case the guard is skipped.
  }
}
