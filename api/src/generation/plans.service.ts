import { buildFallbackPlan, type PlanOutput, type PlanSource, type SurveyInput } from "@familyforward/shared";
import type { LlmClient } from "./llmClient";
import { buildPrompt } from "./promptBuilder";
import { safetyFilter } from "./safetyFilter";
import { validatePlan } from "./validator";

export type GenerationResult = {
  plan: PlanOutput;
  source: PlanSource;
  /** The note was left out of the prompt because it mentions health or development. */
  noteIgnored: boolean;
};

/** Called with short reason codes only. Never receives survey text, notes or model output. */
export type GenerationEvent = (event: { step: "provider" | "validator" | "filter"; reason: string; attempt: number }) => void;

export const MAX_ATTEMPTS = 2;

/**
 * Asks the model for a plan and only returns it if it passes the validator and the safety filter.
 * One retry on a bad answer. A provider error or timeout goes straight to the fallback plan.
 * The note is used to build the prompt and nothing else.
 */
export async function generatePlan(
  survey: SurveyInput,
  note: string | undefined,
  deps: { llm: LlmClient; onEvent?: GenerationEvent },
): Promise<GenerationResult> {
  const { noteIgnored, ...prompt } = buildPrompt(survey, note);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    let raw: string;
    try {
      raw = await deps.llm.generate({ ...prompt, survey });
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
      deps.onEvent?.({ step: "filter", reason: filtered.reason, attempt });
      continue;
    }
    return { plan: validated.plan, source: "ai", noteIgnored };
  }
  return { plan: buildFallbackPlan(survey), source: "fallback", noteIgnored };
}
