export type Lang = "en" | "es" | "ar";

export type BlocklistFile = {
  lang: Lang;
  /** Whole words or phrases, matched case-insensitively (Latin: accent-insensitive; Arabic: marks and letter forms normalized). */
  terms: readonly string[];
  /** Short acronyms matched only as UPPERCASE whole tokens, so ordinary words like "add" never match. */
  uppercaseOnly: readonly string[];
};

export type AllowEntry = { lang: Lang; phrase: string };
