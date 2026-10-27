/**
 * Simple client-side check for health or development words in the optional survey note.
 * It only decides whether to show a notice. The note text is never sent or stored.
 * TODO: needs native review for the Spanish and Arabic lists.
 */

/** Lowercases, strips Latin accents, Arabic marks and normalizes Arabic letter variants. */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه");
}

// English and Spanish: a word that starts with one of these stems.
const LATIN_STEMS = [
  // English
  "diagnos", "autis", "adhd", "asperger", "dyslex", "disab", "disorder", "syndrome", "therap",
  "medicat", "medicin", "symptom", "anxi", "depress", "seizure", "epilep", "stutter", "stammer",
  "delay", "develop", "deaf", "blind", "worr", "concern", "behavior", "behaviour", "speech",
  // Spanish
  "diagnost", "tdah", "dislex", "discapac", "trastorn", "sindrom", "terap", "medic", "sintom",
  "ansied", "depres", "convuls", "epilep", "tartamud", "retras", "sordo", "ciego", "desarroll",
  "preocup", "conducta", "lenguaje",
];

// Multi-word phrases, matched anywhere in the normalized text.
const PHRASES = [
  "special needs", "not talk", "doesnt talk", "does not talk", "wont talk", "late talker",
  "no habla", "no hablaba", "habla poco", "necesidades especiales",
  "لا يتكلم", "لا ينطق", "لا يتحدث",
];

// Arabic: normalized stems matched anywhere in the text (Arabic attaches prefixes to words).
const ARABIC_STEMS = [
  "تشخيص", // diagnosis
  "توحد", // autism
  "تاخر", // delay
  "تلعثم", // stutter
  "اضطراب", // disorder
  "اعاقه", // disability
  "علاج", // treatment
  "اعراض", // symptoms
  "قلق", // worry
  "اكتئاب", // depression
  "صرع", // epilepsy
  "نوبات", // seizures
  "فرط الحركه", // hyperactivity
  "مشكله في النطق", // speech problem
  "نموه", // his development
  "النطق", // speech
  "صمم", // deafness
].map(normalizeText);

export function hasHealthWords(text: string): boolean {
  const normalized = normalizeText(text).replace(/['’]/g, "");
  if (normalized.trim() === "") {
    return false;
  }
  if (PHRASES.some((phrase) => normalized.includes(normalizeText(phrase)))) {
    return true;
  }
  if (ARABIC_STEMS.some((stem) => normalized.includes(stem))) {
    return true;
  }
  const words = normalized.split(/[^a-z0-9]+/).filter(Boolean);
  return words.some((word) => LATIN_STEMS.some((stem) => word.startsWith(stem)));
}
