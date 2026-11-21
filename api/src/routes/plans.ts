import { Router } from "express";
import {
  ActivityPatchSchema,
  CheckInRequestSchema,
  FOCUS_AREAS,
  PlanRequestSchema,
  type FocusArea,
  type SurveyInput,
} from "@familyforward/shared";
import { ApiError } from "../lib/apiError";
import { objectId } from "../lib/ids";
import { mondayUtc } from "../lib/week";
import { feedbackFromPlan, fallbackSignals } from "../generation/feedbackFromPlan";
import { generatePlan, type GenerationEvent } from "../generation/plans.service";
import type { LlmClient } from "../generation/llmClient";
import { requireAuth } from "../middleware/requireAuth";
import { Child, Plan, Survey } from "../models";

export type PlansConfig = {
  jwtSecret: string;
  llm: LlmClient;
  dailyLimit: number;
  onGenerationEvent?: GenerationEvent;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_PAST_WEEKS = 52;
const PLAN_NOT_FOUND = { code: "plan_not_found", message: "We could not find that plan." } as const;

type PlanLike = {
  _id: unknown;
  childId?: unknown;
  weekStart: Date;
  language: string;
  summary: string;
  days: unknown;
  worthNoticing: unknown;
  resourceIds: string[];
  checkIn: string[];
  checkInAnswers?: string[];
  closing: string;
  source: string;
  createdAt: Date;
};

/** What clients receive. No parent or survey ids. */
export function planToDto(plan: PlanLike) {
  return {
    id: String(plan._id),
    childId: plan.childId ? String(plan.childId) : null,
    weekStart: plan.weekStart.toISOString().slice(0, 10),
    language: plan.language,
    summary: plan.summary,
    days: plan.days,
    worthNoticing: plan.worthNoticing,
    resourceIds: plan.resourceIds,
    checkIn: plan.checkIn,
    checkInAnswers: plan.checkInAnswers ?? [],
    closing: plan.closing,
    source: plan.source,
    createdAt: plan.createdAt.toISOString(),
  };
}

function childFilter(query: unknown): { childId?: string } {
  const value = (query as { childId?: unknown }).childId;
  return value === undefined ? {} : { childId: objectId(value, "child_not_found", "We could not find that child.") };
}

export function plansRouter(config: PlansConfig): Router {
  const router = Router();
  router.use(requireAuth(config.jwtSecret));

  router.post("/", async (req, res, next) => {
    try {
      const parentId = req.parentId as string;
      // The error never echoes the input: it can contain the note.
      const parsed = PlanRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ApiError(400, "invalid_survey", "Some survey answers are missing or not valid.");
      }
      const { note, childId, previousPlanId, regenerate, ...answers } = parsed.data;

      const child = await Child.findOne({ _id: objectId(childId, "child_not_found", "We could not find that child."), parentId });
      if (!child) {
        throw new ApiError(404, "child_not_found", "We could not find that child.");
      }

      const weekStart = mondayUtc(new Date());
      const existing = await Plan.find({ parentId, childId: child._id, weekStart, replacedAt: null });
      if (existing.length > 0 && !regenerate) {
        throw new ApiError(409, "plan_exists", "This week's plan already exists. Ask for a new one to replace it.");
      }

      const recent = await Plan.countDocuments({ parentId, createdAt: { $gt: new Date(Date.now() - DAY_MS) } });
      if (recent >= config.dailyLimit) {
        throw new ApiError(429, "plan_daily_limit", "You have made the most plans allowed for today. Please try again tomorrow.");
      }

      let feedback;
      let signals: { preferredFocuses: string[]; avoidActivityIds: string[] } | undefined;
      if (previousPlanId) {
        const previous = await Plan.findOne({ _id: objectId(previousPlanId, PLAN_NOT_FOUND.code, PLAN_NOT_FOUND.message), parentId, childId: child._id });
        if (!previous) {
          throw new ApiError(404, PLAN_NOT_FOUND.code, PLAN_NOT_FOUND.message);
        }
        feedback = feedbackFromPlan(previous);
        signals = fallbackSignals(previous);
      }

      // Age band and home languages come from the child record; the nickname is never used here.
      const survey: SurveyInput = { ...answers, ageBand: child.ageBand };
      const result = await generatePlan(survey, note, {
        llm: config.llm,
        onEvent: config.onGenerationEvent,
        homeLanguages: child.homeLanguages,
        feedback,
        fallbackOptions: signals
          ? {
              preferredFocuses: signals.preferredFocuses.filter((f): f is FocusArea => (FOCUS_AREAS as readonly string[]).includes(f)),
              avoidActivityIds: signals.avoidActivityIds,
            }
          : undefined,
      });

      // The note was used in memory only; it is not part of anything saved below.
      const saved = await Survey.create({ parentId, childId: child._id, ...survey });
      const plan = await Plan.create({
        parentId,
        childId: child._id,
        surveyId: saved._id,
        language: survey.language,
        weekStart,
        summary: result.plan.summary,
        days: result.plan.days.map((d) => ({ ...d, done: false, reaction: null })),
        worthNoticing: result.plan.worthNoticing,
        resourceIds: result.plan.resourceIds,
        checkIn: result.plan.checkIn,
        closing: result.plan.closing,
        source: result.source,
      });
      // Replace only after the new plan is safely saved. Old plans are marked, not deleted, so they still count toward the daily limit.
      if (existing.length > 0) {
        await Plan.updateMany({ _id: { $in: existing.map((p) => p._id) } }, { $set: { replacedAt: new Date() } });
      }
      // A flag only: the note text itself is never returned.
      res.status(201).json({ ...planToDto(plan), noteIgnored: result.noteIgnored });
    } catch (err) {
      next(err);
    }
  });

  // The latest plan made this week (optionally for one child with ?childId=).
  router.get("/current", async (req, res, next) => {
    try {
      const plan = await Plan.findOne({ parentId: req.parentId, weekStart: mondayUtc(new Date()), replacedAt: null, ...childFilter(req.query) }).sort({ createdAt: -1 });
      if (!plan) {
        throw new ApiError(404, "no_plan", "There is no plan for this week yet.");
      }
      res.json(planToDto(plan));
    } catch (err) {
      next(err);
    }
  });

  // Past weeks, newest first, the latest plan of each week.
  router.get("/", async (req, res, next) => {
    try {
      const plans = await Plan.find({ parentId: req.parentId, weekStart: { $lt: mondayUtc(new Date()) }, replacedAt: null, ...childFilter(req.query) })
        .sort({ weekStart: -1, createdAt: -1 })
        .limit(MAX_PAST_WEEKS * 5);
      const seen = new Set<string>();
      const weeks = plans.filter((p) => {
        const key = `${p.weekStart.getTime()}:${String(p.childId)}`;
        return seen.has(key) ? false : (seen.add(key), true);
      });
      res.json({ plans: weeks.slice(0, MAX_PAST_WEEKS).map(planToDto) });
    } catch (err) {
      next(err);
    }
  });

  router.patch("/:planId/activities/:index", async (req, res, next) => {
    try {
      const id = objectId(req.params.planId, PLAN_NOT_FOUND.code, PLAN_NOT_FOUND.message);
      const parsed = ActivityPatchSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ApiError(400, "invalid_update", "Send done and a reaction.");
      }
      const plan = await Plan.findOne({ _id: id, parentId: req.parentId });
      if (!plan) {
        throw new ApiError(404, PLAN_NOT_FOUND.code, PLAN_NOT_FOUND.message);
      }
      const index = Number(req.params.index);
      if (!Number.isInteger(index) || index < 0 || index >= plan.days.length) {
        throw new ApiError(404, "activity_not_found", "We could not find that activity.");
      }
      plan.days[index].done = parsed.data.done;
      plan.days[index].reaction = parsed.data.reaction;
      await plan.save();
      res.json(planToDto(plan));
    } catch (err) {
      next(err);
    }
  });

  router.post("/:planId/checkin", async (req, res, next) => {
    try {
      const id = objectId(req.params.planId, PLAN_NOT_FOUND.code, PLAN_NOT_FOUND.message);
      const parsed = CheckInRequestSchema.safeParse(req.body);
      const plan = await Plan.findOne({ _id: id, parentId: req.parentId });
      if (!plan) {
        throw new ApiError(404, PLAN_NOT_FOUND.code, PLAN_NOT_FOUND.message);
      }
      if (!parsed.success || parsed.data.answers.length !== plan.checkIn.length) {
        throw new ApiError(400, "invalid_checkin", "Answer every question with yes, somewhat or no.");
      }
      plan.checkInAnswers = parsed.data.answers;
      await plan.save();
      res.json(planToDto(plan));
    } catch (err) {
      next(err);
    }
  });

  return router;
}
