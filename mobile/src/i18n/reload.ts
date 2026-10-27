import { DevSettings } from "react-native";
import * as Updates from "expo-updates";

/**
 * Reloads the JS bundle so a new I18nManager direction takes effect.
 * Tries expo-updates first, then falls back to DevSettings in development.
 */
export async function reloadApp(): Promise<void> {
  try {
    await Updates.reloadAsync();
    return;
  } catch {
    if (__DEV__) {
      DevSettings.reload();
    }
  }
}
