import { normalizeText } from "../health-words";
import type { PlanOutput } from "../schemas";
import { allowlist } from "./allowlist";
import { blocklistAr } from "./blocklist.ar";
import { blocklistEn } from "./blocklist.en";
import { blocklistEs } from "./blocklist.es";
import type { BlocklistFile } from "./types";
import { BLOCKLIST_VERSION } from "./version";

/**
 * A blocklist hit. `termId` names the list entry (for example "en.autism"); `term` is the list
 * entry itself, used only to tell the model what to avoid. Never log `term` with a plan, and
 * never log or store the text that matched: use `publicHit` for logs.
 */
export type FilterHit = { termId: string; listVersion: string; fieldPath: string; term: string };
export type PublicHit = Omit<FilterHit, "term">;

export function publicHit({ termId, listVersion, fieldPath }: FilterHit): PublicHit {
  return { termId, listVersion, fieldPath };
}

const ARABIC_LETTER = "\\u0621-\\u064A";
// Arabic attaches prefixes (and, with, the, to) and suffixes (his, her, plural) to words.
const AR_PREFIX = "(?:و|ب|ل|ف|ك|ال|وال|بال|لل|فال|كال)?";
const AR_SUFFIX = "(?:ه|ها|هم|هما|ان|ات|ين|ون|ي|ك|نا|ا)?";

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function slug(term: string): string {
  return normalizeText(term).replace(/\s+/g, "_");
}

type Rule = { termId: string; term: string; pattern: RegExp; caseSensitive: boolean };

function compile(file: BlocklistFile): Rule[] {
  const rules: Rule[] = [];
  for (const term of file.terms) {
    const body = escapeRegex(normalizeText(term).replace(/['’]/g, "")).replace(/\s+/g, "\\s+");
    const pattern =
      file.lang === "ar"
        ? new RegExp(`(?<![${ARABIC_LETTER}])${AR_PREFIX}${body}${AR_SUFFIX}(?![${ARABIC_LETTER}])`, "gu")
        : new RegExp(`(?<![\\p{L}\\p{N}])${body}(?:s|es)?(?![\\p{L}\\p{N}])`, "gu");
    rules.push({ termId: `${file.lang}.${slug(term)}`, term, pattern, caseSensitive: false });
  }
  for (const token of file.uppercaseOnly) {
    // Matched on the original text, so "add" and "odd" never hit but "ADD" does.
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegex(token)}(?![\\p{L}\\p{N}])`, "gu");
    rules.push({ termId: `${file.lang}.${slug(token)}_uppercase`, term: token, pattern, caseSensitive: true });
  }
  return rules;
}

const RULES: Rule[] = [blocklistEn, blocklistEs, blocklistAr].flatMap(compile);

const ALLOW: RegExp[] = allowlist.map((entry) => {
  const body = escapeRegex(normalizeText(entry.phrase)).replace(/\s+/g, "\\s+");
  return entry.lang === "ar"
    ? new RegExp(`(?<![${ARABIC_LETTER}])${body}(?![${ARABIC_LETTER}])`, "gu")
    : new RegExp(`(?<![\\p{L}\\p{N}])${body}(?![\\p{L}\\p{N}])`, "gu");
});

function spans(pattern: RegExp, text: string): [number, number][] {
  pattern.lastIndex = 0;
  const out: [number, number][] = [];
  for (let m = pattern.exec(text); m !== null; m = pattern.exec(text)) {
    out.push([m.index, m.index + m[0].length]);
    if (m[0].length === 0) pattern.lastIndex += 1;
  }
  return out;
}

/** All blocklist hits in one text. All three languages are checked, so a term slipped into another language is caught. */
export function scanText(text: string, fieldPath: string): FilterHit[] {
  const normalized = normalizeText(text).replace(/['’]/g, "");
  const allowed = ALLOW.flatMap((p) => spans(p, normalized));
  const hits: FilterHit[] = [];
  for (const rule of RULES) {
    const haystack = rule.caseSensitive ? text : normalized;
    const found = spans(rule.pattern, haystack);
    // Allow-list spans exist only for the normalized text; uppercase acronyms are never allow-listed.
    const real = rule.caseSensitive ? found : found.filter(([s, e]) => !allowed.some(([as, ae]) => s >= as && e <= ae));
    if (real.length > 0) {
      hits.push({ termId: rule.termId, listVersion: BLOCKLIST_VERSION, fieldPath, term: rule.term });
    }
  }
  return hits;
}

/** Every text field the parent can read, with its path. */
export function planTextFields(plan: PlanOutput): { path: string; text: string }[] {
  const fields: { path: string; text: string }[] = [{ path: "summary", text: plan.summary }];
  plan.days.forEach((d, i) => {
    const a = d.activity;
    const base = `days[${i}].activity`;
    fields.push(
      { path: `${base}.title`, text: a.title },
      { path: `${base}.why`, text: a.why },
      { path: `${base}.safety`, text: a.safety },
      { path: `${base}.easier`, text: a.easier },
      { path: `${base}.harder`, text: a.harder },
      { path: `${base}.noticeThis`, text: a.noticeThis },
    );
    a.steps.forEach((step, j) => fields.push({ path: `${base}.steps[${j}]`, text: step }));
  });
  plan.worthNoticing.forEach((w, i) => {
    fields.push(
      { path: `worthNoticing[${i}].observation`, text: w.observation },
      { path: `worthNoticing[${i}].tryThis`, text: w.tryThis },
    );
  });
  plan.checkIn.forEach((q, i) => fields.push({ path: `checkIn[${i}]`, text: q }));
  fields.push({ path: "closing", text: plan.closing });
  return fields;
}

/** Scans every text field of a plan. Empty array means the plan is clean. */
export function scanPlan(plan: PlanOutput): FilterHit[] {
  return planTextFields(plan).flatMap((f) => scanText(f.text, f.path));
}
