import { Schema, model, type InferSchemaType } from "mongoose";
import { CHECKIN_ANSWERS, FOCUS_AREAS, LANGUAGES, MATERIALS, MENTION_TO, MINUTES_OPTIONS, PLAN_SOURCES, REACTIONS } from "@familyforward/shared";

const activitySchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  focus: { type: String, enum: FOCUS_AREAS, required: true },
  minutes: { type: Number, enum: MINUTES_OPTIONS, required: true },
  materials: [{ type: String, enum: MATERIALS }],
  steps: [{ type: String, required: true }],
  why: { type: String, required: true },
  safety: { type: String, required: true },
  easier: { type: String, required: true },
  harder: { type: String, required: true },
  noticeThis: { type: String, required: true },
}, { _id: false });

const daySchema = new Schema({
  day: { type: Number, required: true },
  activity: { type: activitySchema, required: true },
  // What the parent tells us afterwards. Enums only, never free text.
  done: { type: Boolean, required: true, default: false },
  reaction: { type: String, enum: [...REACTIONS, null], default: null },
}, { _id: false });

const worthNoticingSchema = new Schema({
  observation: { type: String, required: true },
  tryThis: { type: String, required: true },
  mentionTo: { type: String, enum: MENTION_TO, required: true },
  resourceIds: [{ type: String }],
}, { _id: false });

const planSchema = new Schema({
  parentId: { type: Schema.Types.ObjectId, ref: "Parent", required: true },
  childId: { type: Schema.Types.ObjectId, ref: "Child" },
  surveyId: { type: Schema.Types.ObjectId, ref: "Survey", required: true },
  language: { type: String, enum: LANGUAGES, required: true },
  weekStart: { type: Date, required: true },
  summary: { type: String, required: true },
  days: { type: [daySchema], required: true },
  worthNoticing: { type: [worthNoticingSchema], default: [] },
  resourceIds: [{ type: String }],
  checkIn: [{ type: String }],
  checkInAnswers: [{ type: String, enum: CHECKIN_ANSWERS }],
  closing: { type: String, required: true },
  source: { type: String, enum: PLAN_SOURCES, required: true },
  createdAt: { type: Date, required: true, default: () => new Date() },
  // Set when a newer plan replaces this one. Kept so the daily limit still counts it.
  replacedAt: { type: Date, default: null },
}, { strict: "throw" });

planSchema.index({ parentId: 1, createdAt: -1 });

export type PlanDoc = InferSchemaType<typeof planSchema>;
export const Plan = model("Plan", planSchema);
