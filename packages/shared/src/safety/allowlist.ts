import type { AllowEntry } from "./types";

/**
 * Benign phrases that contain a blocked word. A blocklist hit inside one of these phrases is ignored.
 * Keep this list short and specific: every entry weakens the filter a little.
 */
export const allowlist: readonly AllowEntry[] = [
  { lang: "en", phrase: "delay bedtime" },
  { lang: "en", phrase: "delayed bedtime" },
  { lang: "en", phrase: "in good condition" },
  { lang: "en", phrase: "weather condition" },
  { lang: "en", phrase: "weather conditions" },
  { lang: "en", phrase: "on one condition" },
  { lang: "es", phrase: "en buenas condiciones" },
  { lang: "es", phrase: "en buena condición" },
  { lang: "es", phrase: "condiciones del clima" },
  { lang: "es", phrase: "retrasar la hora de dormir" },
  { lang: "ar", phrase: "في حالة جيدة" },
  { lang: "ar", phrase: "تأخير موعد النوم" },
];
