import {
  CONCERN_RESOURCE_IDS,
  buildFallbackPlan,
  concernCard,
  publicHit,
  type FallbackOptions,
  type PlanOutput,
  type PlanSource,
  type PublicHit,
  type SurveyInput,
} from "@familyforward/shared";
import type { PlanFeedback } from "./feedback";
import type { LlmClient } from "./llmClient";
import { buildPrompt, retryInstruction } from "./promptBuilder";
import { safetyFilter } from "./safetyFilter";
import { validatePlan } from "./validator";

export type GenerationResult = {
  plan: PlanOutput;
  source: PlanSource;
  /** The note mentioned health or development: it was not used and the plan carries the fixed concern card. */
  concern: boolean;
  /** A note was given but not used for another reason (a fallback plan was returned). */
  noteIgnored: boolean;
};

/** Codes and ids only: never survey answers, notes, nicknames or model output. */
export type GenerationEvent = (event: {
  step: "provider" | "validator" | "filter";
  attempt: number;
  reason?: string;
  hits?: PublicHit[];
}) => void;

export const MAX_ATTEMPTS = 2;

export type GenerationDeps = {
  llm: LlmClient;
  onEvent?: GenerationEvent;
  homeLanguages?: FallbackOptions["homeLanguages"];
  feedback?: PlanFeedback;
  fallbackOptions?: FallbackOptions;
};

/**
 * Asks the model for a plan and only returns it if it passes the validator and the safety filter.
 * One retry on a bad answer; after a safety hit the retry names the offending terms. A provider
 * error or timeout goes straight to the fallback plan. The note is used to build the prompt and
 * nothing else; a note about health or development is not used at all.
 */
export async function generatePlan(
  survey: SurveyInput,
  note: string | undefined,
  deps: GenerationDeps,
): Promise<GenerationResult> {
  const prompt = buildPrompt(survey, note, { homeLanguages: deps.homeLanguages, feedback: deps.feedback });
  const withConcern = (plan: PlanOutput): PlanOutput =>
    prompt.concern
      ? {
          ...plan,
          worthNoticing: [concernCard(plan.language, survey.ageBand, [...CONCERN_RESOURCE_IDS[survey.ageBand]])],
        }
      : plan;
  const hasNote = (note ?? "").trim() !== "";

  let retryText = "";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    let raw: string;
    try {
      raw = await deps.llm.generate({ system: prompt.system, user: prompt.user + retryText, survey });
    } catch {
      deps.onEvent?.({ step: "provider", reason: "provider_error", attempt });
      break;
    }
    const validated = validatePlan(raw, survey);
    if (!validated.ok) {
      deps.onEvent?.({ step: "validator", reason: validated.reason, attempt });
      continue;
    }
    const filtered = safetyFilter(validated.plan);
    if (!filtered.ok) {
      deps.onEvent?.({ step: "filter", hits: filtered.hits.map(publicHit), attempt });
      retryText = retryInstruction(filtered.hits.map((h) => h.term));
      continue;
    }
    return { plan: withConcern(validated.plan), source: "ai", concern: prompt.concern, noteIgnored: false };
  }

  const fallback = buildFallbackPlan(survey, { ...deps.fallbackOptions, homeLanguages: deps.homeLanguages });
  return {
    plan: withConcern(fallback),
    source: "fallback",
    concern: prompt.concern,
    noteIgnored: hasNote && !prompt.concern,
  };
}
