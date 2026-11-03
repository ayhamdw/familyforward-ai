import { Schema, model, type InferSchemaType } from "mongoose";
import { LANGUAGES, MATERIALS, MINUTES_OPTIONS, PLAN_SOURCES } from "@familyforward/shared";

const activitySchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  minutes: { type: Number, enum: MINUTES_OPTIONS, required: true },
  materials: [{ type: String, enum: MATERIALS }],
  steps: [{ type: String, required: true }],
  why: { type: String, required: true },
  safety: { type: String, required: true },
}, { _id: false });

const daySchema = new Schema({
  day: { type: Number, required: true },
  activity: { type: activitySchema, required: true },
}, { _id: false });

const planSchema = new Schema({
  parentId: { type: Schema.Types.ObjectId, ref: "Parent", required: true },
  surveyId: { type: Schema.Types.ObjectId, ref: "Survey", required: true },
  language: { type: String, enum: LANGUAGES, required: true },
  weekStart: { type: Date, required: true },
  days: { type: [daySchema], required: true },
  closing: { type: String, required: true },
  source: { type: String, enum: PLAN_SOURCES, required: true },
  createdAt: { type: Date, required: true, default: () => new Date() },
}, { strict: "throw" });

planSchema.index({ parentId: 1, createdAt: -1 });

export type PlanDoc = InferSchemaType<typeof planSchema>;
export const Plan = model("Plan", planSchema);
