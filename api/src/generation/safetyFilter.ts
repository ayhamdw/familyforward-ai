import { CLOSING_LINES, normalizeText, type PlanOutput } from "@familyforward/shared";
import { BLOCKLIST, type BlockReason } from "./contract";

export type FilterReason = BlockReason | "missing_closing";
export type FilterResult = { ok: true } | { ok: false; reason: FilterReason };

type Lang = "en" | "es" | "ar";

const ARABIC_LETTER = "\\u0621-\\u064A";
// Arabic attaches prefixes (and, with, the, to) and suffixes (his, her, plural) to words.
const AR_PREFIX = "(?:و|ب|ل|ف|ك|ال|وال|بال|لل|فال|كال)?";
const AR_SUFFIX = "(?:ه|ها|هم|هما|ان|ات|ين|ون|ي|ك|نا|ا)?";

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function build(term: string, lang: Lang): RegExp {
  const normalized = normalizeText(term).replace(/['’]/g, "");
  const body = escapeRegex(normalized).replace(/\s+/g, "\\s+");
  if (lang === "ar") {
    return new RegExp(`(?<![${ARABIC_LETTER}])${AR_PREFIX}${body}${AR_SUFFIX}(?![${ARABIC_LETTER}])`, "u");
  }
  // Whole words only, with an optional plural.
  return new RegExp(`(?<![a-z0-9])${body}(?:s|es)?(?![a-z0-9])`, "u");
}

type Rule = { reason: BlockReason; lang: Lang; pattern: RegExp };

const RULES: Rule[] = (Object.keys(BLOCKLIST) as BlockReason[]).flatMap((reason) =>
  (["en", "es", "ar"] as const).flatMap((lang) =>
    BLOCKLIST[reason][lang].map((term) => ({ reason, lang, pattern: build(term, lang) })),
  ),
);

/**
 * Checks text against the blocklist. Returns a reason code only, never the matched text.
 * All three languages are checked for every plan, so a term slipped into another language is caught.
 */
export function checkText(text: string, skip: readonly BlockReason[] = []): FilterResult {
  const normalized = normalizeText(text).replace(/['’]/g, "");
  for (const rule of RULES) {
    if (!skip.includes(rule.reason) && rule.pattern.test(normalized)) {
      return { ok: false, reason: rule.reason };
    }
  }
  return { ok: true };
}

export function safetyFilter(plan: PlanOutput): FilterResult {
  // The closing line is fixed text and is compared exactly; it is not scanned.
  if (plan.closing.trim() !== CLOSING_LINES[plan.language]) {
    return { ok: false, reason: "missing_closing" };
  }
  for (const { activity } of plan.days) {
    const instructions = checkText([activity.title, activity.why, ...activity.steps].join("\n"));
    if (!instructions.ok) {
      return instructions;
    }
    // The safety line may name hazards on purpose ("no knives or stove"), so unsafe_content is skipped there.
    const safety = checkText(activity.safety, ["unsafe_content"]);
    if (!safety.ok) {
      return safety;
    }
  }
  return { ok: true };
}
