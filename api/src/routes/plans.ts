import { Router } from "express";
import { PlanRequestSchema } from "@familyforward/shared";
import { ApiError } from "../lib/apiError";
import { mondayUtc } from "../lib/week";
import { generatePlan, type GenerationEvent } from "../generation/plans.service";
import type { LlmClient } from "../generation/llmClient";
import { requireAuth } from "../middleware/requireAuth";
import { Plan, Survey } from "../models";

export type PlansConfig = {
  jwtSecret: string;
  llm: LlmClient;
  dailyLimit: number;
  onGenerationEvent?: GenerationEvent;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_PAST_WEEKS = 52;

type PlanLike = {
  _id: unknown;
  weekStart: Date;
  language: string;
  days: unknown;
  closing: string;
  source: string;
  createdAt: Date;
};

/** What clients receive. No parent or survey ids. */
function toDto(plan: PlanLike) {
  return {
    id: String(plan._id),
    weekStart: plan.weekStart.toISOString().slice(0, 10),
    language: plan.language,
    days: plan.days,
    closing: plan.closing,
    source: plan.source,
    createdAt: plan.createdAt.toISOString(),
  };
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
      const { note, ...survey } = parsed.data;

      const recent = await Plan.countDocuments({ parentId, createdAt: { $gt: new Date(Date.now() - DAY_MS) } });
      if (recent >= config.dailyLimit) {
        throw new ApiError(429, "plan_daily_limit", "You have made the most plans allowed for today. Please try again tomorrow.");
      }

      // The note goes to the prompt builder in memory and is not used after this call.
      const result = await generatePlan(survey, note, { llm: config.llm, onEvent: config.onGenerationEvent });

      const saved = await Survey.create({ parentId, ...survey });
      const plan = await Plan.create({
        parentId,
        surveyId: saved._id,
        language: survey.language,
        weekStart: mondayUtc(new Date()),
        days: result.plan.days,
        closing: result.plan.closing,
        source: result.source,
      });
      // A flag only: the note text itself is never returned.
      res.status(201).json({ ...toDto(plan), noteIgnored: result.noteIgnored });
    } catch (err) {
      next(err);
    }
  });

  // The latest plan made this week.
  router.get("/current", async (req, res, next) => {
    try {
      const plan = await Plan.findOne({ parentId: req.parentId, weekStart: mondayUtc(new Date()) }).sort({ createdAt: -1 });
      if (!plan) {
        throw new ApiError(404, "no_plan", "There is no plan for this week yet.");
      }
      res.json(toDto(plan));
    } catch (err) {
      next(err);
    }
  });

  // Past weeks, newest first, the latest plan of each week.
  router.get("/", async (req, res, next) => {
    try {
      const plans = await Plan.find({ parentId: req.parentId, weekStart: { $lt: mondayUtc(new Date()) } })
        .sort({ weekStart: -1, createdAt: -1 })
        .limit(MAX_PAST_WEEKS * 5);
      const seen = new Set<number>();
      const weeks = plans.filter((p) => {
        const key = p.weekStart.getTime();
        return seen.has(key) ? false : (seen.add(key), true);
      });
      res.json({ plans: weeks.slice(0, MAX_PAST_WEEKS).map(toDto) });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
