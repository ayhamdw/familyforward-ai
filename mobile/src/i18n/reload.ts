import * as Updates from "expo-updates";

/**
 * Reloads the app so a new I18nManager direction takes effect.
 *
 * In development (Expo Go) a programmatic reload right after forceRTL() crashes the
 * runtime ("Cannot find native module"), while a manual reload works. So in development
 * this does nothing and the direction applies on the next manual reload.
 * Release builds use expo-updates.
 */
export async function reloadApp(): Promise<void> {
  if (__DEV__) {
    return;
  }
  await Updates.reloadAsync();
}
