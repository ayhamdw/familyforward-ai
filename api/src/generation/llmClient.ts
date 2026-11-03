import Anthropic from "@anthropic-ai/sdk";
import { CLOSING_LINES, buildFallbackPlan, type SurveyInput } from "@familyforward/shared";

export type LlmRequest = {
  system: string;
  user: string;
  /** Structured survey, for the mock client only. Real providers use the prompt. */
  survey: SurveyInput;
};

export interface LlmClient {
  /** Returns the model's raw text. Throws on provider errors and timeouts. */
  generate(req: LlmRequest): Promise<string>;
}

export type MockMode = "valid" | "invalid_json" | "blocked" | "error";

/** Seed content shaped to pass the validator: the seed has no activity for every length, so minutes are set. */
function mockPlan(survey: SurveyInput) {
  const plan = buildFallbackPlan(survey);
  for (const day of plan.days) {
    day.activity.minutes = survey.minutesPerDay;
  }
  return plan;
}

/** Deterministic client for development and tests. Takes one mode per call; the last one repeats. */
export class MockLlmClient implements LlmClient {
  calls = 0;
  private readonly modes: MockMode[];

  constructor(modes: MockMode | MockMode[] = "valid") {
    this.modes = Array.isArray(modes) ? modes : [modes];
  }

  async generate(req: LlmRequest): Promise<string> {
    const mode = this.modes[Math.min(this.calls, this.modes.length - 1)];
    this.calls += 1;
    switch (mode) {
      case "error":
        throw new Error("mock provider error");
      case "invalid_json":
        return '{"language": "en", "days": [';
      case "blocked": {
        const plan = mockPlan(req.survey);
        plan.days[0].activity.why = {
          en: "Shows whether your child is behind other children.",
          es: "Muestra si su hijo está atrasado respecto a otros niños.",
          ar: "يبين هل طفلك متأخر عن الأطفال الآخرين.",
        }[plan.language];
        return JSON.stringify(plan);
      }
      default:
        return JSON.stringify({ ...mockPlan(req.survey), closing: CLOSING_LINES[req.survey.language] });
    }
  }
}

export const CLAUDE_TIMEOUT_MS = 20_000;
export const CLAUDE_MAX_TOKENS = 4_000;

/** Anthropic Messages API. One non-streaming call, 20 second timeout, no SDK retries. */
export class ClaudeLlmClient implements LlmClient {
  private readonly client: Anthropic;

  constructor(
    apiKey: string,
    private readonly model: string,
  ) {
    // maxRetries 0: the plan service decides whether to retry, so the total wait stays bounded.
    this.client = new Anthropic({ apiKey, timeout: CLAUDE_TIMEOUT_MS, maxRetries: 0 });
  }

  async generate(req: LlmRequest): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: CLAUDE_MAX_TOKENS,
      system: req.system,
      messages: [{ role: "user", content: req.user }],
    });
    if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") {
      throw new Error(`llm_${response.stop_reason}`);
    }
    return response.content.map((block) => (block.type === "text" ? block.text : "")).join("");
  }
}

export function createLlmClient(env: {
  LLM_PROVIDER: "mock" | "claude";
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL?: string;
}): LlmClient {
  if (env.LLM_PROVIDER === "claude") {
    if (!env.ANTHROPIC_API_KEY || !env.ANTHROPIC_MODEL) {
      throw new Error("ANTHROPIC_API_KEY and ANTHROPIC_MODEL are required for LLM_PROVIDER=claude");
    }
    return new ClaudeLlmClient(env.ANTHROPIC_API_KEY, env.ANTHROPIC_MODEL);
  }
  return new MockLlmClient("valid");
}
