import {
  parseChild,
  parseChildren,
  parseCreatePlan,
  parsePlan,
  parsePlans,
  type ChildDto,
  type ChildInput,
  type CheckInAnswer,
  type CreatePlanResponse,
  type Language,
  type PlanDto,
  type Reaction,
} from "@familyforward/shared";
import { useAuthStore } from "@/storage/authStore";
import { useDevStore } from "@/storage/devStore";
import { useNetStore } from "@/storage/netStore";
import type { SurveyAnswers } from "@/storage/surveyStore";
import { PLAN_TIMEOUT_MS } from "./config";
import { ApiError, createHttpClient, type HttpClient } from "./http";
import { clearToken, getToken } from "./session";
import { createDemoApi } from "./demoApi";

export { ApiError } from "./http";

export type VerifyResult = { status: "ok"; token: string } | { status: "wrong" } | { status: "locked" };

export type PlanRequest = {
  childId: string;
  answers: SurveyAnswers;
  language: Language;
  /** Used for this one request only. Never stored. */
  note?: string;
  previousPlanId?: string;
  regenerate?: boolean;
};

/** Everything the app needs from the server. */
export interface Api {
  requestCode(email: string): Promise<void>;
  verifyCode(email: string, code: string): Promise<VerifyResult>;
  listChildren(): Promise<ChildDto[]>;
  createChild(input: ChildInput): Promise<ChildDto>;
  updateChild(id: string, patch: Partial<ChildInput>): Promise<ChildDto>;
  deleteChild(id: string): Promise<void>;
  createPlan(request: PlanRequest): Promise<CreatePlanResponse>;
  currentPlan(childId: string): Promise<PlanDto | null>;
  pastPlans(childId: string): Promise<PlanDto[]>;
  updateActivity(planId: string, index: number, patch: { done: boolean; reaction: Reaction | null }): Promise<PlanDto>;
  submitCheckIn(planId: string, answers: CheckInAnswer[]): Promise<PlanDto>;
  deleteMe(): Promise<void>;
}

/** A server answer that does not match the contract is treated as a server error. */
function must<T>(value: T | null): T {
  if (value === null) {
    throw new ApiError("server");
  }
  return value;
}

export function createRealApi(http: HttpClient): Api {
  return {
    async requestCode(email) {
      await http.request("POST", "/auth/request-code", { email }, { auth: false });
    },
    async verifyCode(email, code) {
      try {
        const data = await http.request<{ token?: unknown }>("POST", "/auth/verify", { email, code }, { auth: false });
        if (typeof data.token !== "string") throw new ApiError("server");
        return { status: "ok", token: data.token };
      } catch (error) {
        if (error instanceof ApiError && error.kind === "client") {
          if (error.code === "invalid_code") return { status: "wrong" };
          return { status: "locked" };
        }
        if (error instanceof ApiError && error.status === 429) return { status: "locked" };
        throw error;
      }
    },
    async listChildren() {
      const data = await http.request<{ children?: unknown }>("GET", "/children");
      return must(parseChildren(data.children));
    },
    async createChild(input) {
      return must(parseChild(await http.request("POST", "/children", input)));
    },
    async updateChild(id, patch) {
      return must(parseChild(await http.request("PATCH", `/children/${id}`, patch)));
    },
    async deleteChild(id) {
      await http.request("DELETE", `/children/${id}`);
    },
    async createPlan({ childId, answers, language, note, previousPlanId, regenerate }) {
      const body = {
        childId,
        language,
        focusAreas: answers.focus,
        interests: answers.interests,
        materials: answers.materials,
        minutesPerDay: answers.minutes,
        daysPerWeek: answers.days,
        ...(note && note.trim() !== "" ? { note: note.trim() } : {}),
        ...(previousPlanId ? { previousPlanId } : {}),
        ...(regenerate ? { regenerate: true } : {}),
      };
      return must(parseCreatePlan(await http.request("POST", "/plans", body, { timeoutMs: PLAN_TIMEOUT_MS })));
    },
    async currentPlan(childId) {
      try {
        return must(parsePlan(await http.request("GET", `/plans/current?childId=${childId}`)));
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
    async pastPlans(childId) {
      const data = await http.request<{ plans?: unknown }>("GET", `/plans?childId=${childId}`);
      return must(parsePlans(data.plans));
    },
    async updateActivity(planId, index, patch) {
      return must(parsePlan(await http.request("PATCH", `/plans/${planId}/activities/${index}`, patch)));
    },
    async submitCheckIn(planId, answers) {
      return must(parsePlan(await http.request("POST", `/plans/${planId}/checkin`, { answers })));
    },
    async deleteMe() {
      await http.request("DELETE", "/me");
    },
  };
}

/** The 401 handler: forget the token and send the parent to the "please sign in again" screen. */
export function handleUnauthorized(): void {
  void clearToken();
  useAuthStore.getState().expireSession();
}

export const realApi: Api = createRealApi(
  createHttpClient({
    getToken,
    onUnauthorized: handleUnauthorized,
    onReachable: (reachable) => useNetStore.getState().setOnline(reachable),
  }),
);

const demoApi: Api = createDemoApi();

/** The demo profile (dev menu) uses synthetic data in memory, so screenshots never contain real data. */
const METHODS: (keyof Api)[] = [
  "requestCode", "verifyCode", "listChildren", "createChild", "updateChild", "deleteChild",
  "createPlan", "currentPlan", "pastPlans", "updateActivity", "submitCheckIn", "deleteMe",
];

export const api: Api = Object.fromEntries(
  METHODS.map((name) => [
    name,
    (...args: unknown[]) => {
      const dev = useDevStore.getState();
      // Dev switches: pretend there is no connection, or that plan making fails.
      if (dev.forceOffline) {
        useNetStore.getState().setOnline(false);
        return Promise.reject(new ApiError("offline"));
      }
      if (dev.forcePlanFailure && name === "createPlan") {
        return Promise.reject(new ApiError("server"));
      }
      const target = dev.demo ? demoApi : realApi;
      return (target[name] as (...a: unknown[]) => unknown)(...args);
    },
  ]),
) as unknown as Api;
