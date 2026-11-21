import {
  buildFallbackPlan,
  type ChildDto,
  type ChildInput,
  type PlanDto,
} from "@familyforward/shared";
import { mondayOf, toSurveyInput } from "@/features/plan/buildPlan";
import type { Api } from "./api";

export const DEMO_CODE = "123456";

/**
 * In-memory API for the dev menu's demo profile. Everything here is synthetic (an invented
 * nickname, fixed answers), so screenshots never contain real data. Nothing leaves the device.
 */
export function createDemoApi(): Api {
  let children: ChildDto[] = [];
  const plans = new Map<string, PlanDto>();
  let counter = 0;
  const nextId = () => `demo-${(counter += 1)}`;

  const make = (child: ChildDto, request: Parameters<Api["createPlan"]>[0]): PlanDto => {
    const survey = toSurveyInput(child, request.answers, request.language);
    const out = buildFallbackPlan(survey, { homeLanguages: child.homeLanguages });
    return {
      id: nextId(),
      childId: child.id,
      weekStart: mondayOf(new Date()),
      language: request.language,
      summary: out.summary,
      days: out.days.map((d) => ({ ...d, done: false, reaction: null })),
      worthNoticing: out.worthNoticing,
      resourceIds: out.resourceIds,
      checkIn: out.checkIn,
      checkInAnswers: [],
      closing: out.closing,
      source: "ai",
      createdAt: new Date().toISOString(),
    };
  };

  return {
    async requestCode() {},
    async verifyCode(_email, code) {
      return code === DEMO_CODE ? { status: "ok", token: "demo-token" } : { status: "wrong" };
    },
    async listChildren() {
      return children;
    },
    async createChild(input: ChildInput) {
      const child: ChildDto = { id: nextId(), ...input, createdAt: new Date().toISOString() };
      children = [...children, child];
      return child;
    },
    async updateChild(id, patch) {
      children = children.map((c) => (c.id === id ? { ...c, ...patch } : c));
      return children.find((c) => c.id === id) as ChildDto;
    },
    async deleteChild(id) {
      children = children.filter((c) => c.id !== id);
    },
    async createPlan(request) {
      const child = children.find((c) => c.id === request.childId) as ChildDto;
      const plan = make(child, request);
      plans.set(plan.id, plan);
      return { ...plan, noteIgnored: false };
    },
    async currentPlan(childId) {
      return [...plans.values()].filter((p) => p.childId === childId).pop() ?? null;
    },
    async pastPlans() {
      return [];
    },
    async updateActivity(planId, index, patch) {
      const plan = plans.get(planId) as PlanDto;
      const next = { ...plan, days: plan.days.map((d, i) => (i === index ? { ...d, ...patch } : d)) };
      plans.set(planId, next);
      return next;
    },
    async submitCheckIn(planId, answers) {
      const next = { ...(plans.get(planId) as PlanDto), checkInAnswers: answers };
      plans.set(planId, next);
      return next;
    },
    async deleteMe() {
      children = [];
      plans.clear();
    },
  };
}
