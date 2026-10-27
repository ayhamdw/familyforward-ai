import type { Language } from "@familyforward/shared";

const EASTERN_ARABIC_DIGITS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

/** Formats a number or digit string with Eastern Arabic digits for Arabic, plain digits otherwise. */
export function formatNumber(value: number | string, language: string): string {
  const text = String(value);
  if (language !== "ar") {
    return text;
  }
  return text.replace(/[0-9]/g, (digit) => EASTERN_ARABIC_DIGITS[Number(digit)]);
}

/** "2-3" becomes "2–3" (or "٢–٣"). */
export function formatAgeBand(ageBand: string, language: Language | string): string {
  return formatNumber(ageBand.replace("-", "–"), language);
}
