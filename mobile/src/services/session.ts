import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "familyforward.token";
let cached: string | null | undefined;

/** The sign-in token lives only in the device's secure store, never in AsyncStorage. */
export async function getToken(): Promise<string | null> {
  if (cached !== undefined) {
    return cached;
  }
  try {
    cached = await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    cached = null;
  }
  return cached;
}

export async function setToken(token: string): Promise<void> {
  cached = token;
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  cached = null;
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // Nothing more to do: the in-memory copy is already cleared.
  }
}
