import { Schema, model, type InferSchemaType } from "mongoose";
import { AGE_BANDS, DAYS_OPTIONS, FOCUS_AREAS, INTERESTS, LANGUAGES, MATERIALS, MAX_FOCUS_AREAS, MINUTES_OPTIONS } from "@familyforward/shared";

// There is deliberately no free-text field here. The optional survey note is never stored.
const surveySchema = new Schema({
  parentId: { type: Schema.Types.ObjectId, ref: "Parent", required: true, index: true },
  language: { type: String, enum: LANGUAGES, required: true },
  ageBand: { type: String, enum: AGE_BANDS, required: true },
  focusAreas: {
    type: [{ type: String, enum: FOCUS_AREAS }],
    validate: { validator: (v: string[]) => v.length >= 1 && v.length <= MAX_FOCUS_AREAS, message: "focusAreas" },
  },
  interests: [{ type: String, enum: INTERESTS }],
  materials: [{ type: String, enum: MATERIALS }],
  minutesPerDay: { type: Number, enum: MINUTES_OPTIONS, required: true },
  daysPerWeek: { type: Number, enum: DAYS_OPTIONS, required: true },
  createdAt: { type: Date, required: true, default: () => new Date() },
}, { strict: "throw" });

export type SurveyDoc = InferSchemaType<typeof surveySchema>;
export const Survey = model("Survey", surveySchema);
