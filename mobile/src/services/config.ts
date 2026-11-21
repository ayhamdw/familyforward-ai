/** Base URL of the API, set per build profile (see eas.json) or in mobile/.env for local work. */
export const API_URL: string = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

export const REQUEST_TIMEOUT_MS = 15_000;
/** Plan generation can take a while (the server waits up to 20 seconds for the model). */
export const PLAN_TIMEOUT_MS = 30_000;
