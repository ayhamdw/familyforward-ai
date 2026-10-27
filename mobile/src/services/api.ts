import type { Language } from "@familyforward/shared";
import { addDays, buildMockPlan, mondayOf } from "@/features/plan/buildPlan";
import type { Plan } from "@/features/plan/types";
import { useDevStore } from "@/storage/devStore";
import type { SurveyAnswers } from "@/storage/surveyStore";

export type VerifyResult =
  | { status: "ok" }
  | { status: "wrong"; triesLeft: number }
  | { status: "locked" };

export type PlanRequest = {
  answers: SurveyAnswers & { ageBand: NonNullable<SurveyAnswers["ageBand"]> };
  language: Language;
  /** Monday of the week to plan, as YYYY-MM-DD. */
  weekStart?: string;
};

export class ApiError extends Error {
  constructor(public readonly kind: "offline" | "failed") {
    super(kind);
    this.name = "ApiError";
  }
}

/** Everything the app needs from the server. Next week, swap the implementation for real HTTP calls. */
export interface Api {
  requestCode(email: string): Promise<void>;
  verifyCode(email: string, code: string): Promise<VerifyResult>;
  buildPlan(request: PlanRequest): Promise<Plan>;
}

export const MOCK_VALID_CODE = "123456";
export const MAX_CODE_TRIES = 5;

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function createMockApi(latencyMs = 400): Api {
  const attempts = new Map<string, number>();
  return {
    async requestCode(email) {
      await delay(latencyMs);
      attempts.set(email, 0);
    },
    async verifyCode(email, code) {
      await delay(latencyMs);
      const used = attempts.get(email) ?? 0;
      if (used >= MAX_CODE_TRIES) {
        return { status: "locked" };
      }
      if (code === MOCK_VALID_CODE) {
        attempts.set(email, 0);
        return { status: "ok" };
      }
      attempts.set(email, used + 1);
      const triesLeft = MAX_CODE_TRIES - (used + 1);
      return triesLeft <= 0 ? { status: "locked" } : { status: "wrong", triesLeft };
    },
    async buildPlan({ answers, weekStart }) {
      await delay(latencyMs);
      const dev = useDevStore.getState();
      if (dev.forceOffline) {
        throw new ApiError("offline");
      }
      if (dev.forcePlanFailure) {
        throw new ApiError("failed");
      }
      return buildMockPlan(answers, { weekStart: weekStart ?? mondayOf(new Date()), source: "custom" });
    },
  };
}

export const api: Api = createMockApi();

/** Monday of the week after `weekStart`. */
export function nextWeekStart(weekStart: string): string {
  return addDays(weekStart, 7);
}
