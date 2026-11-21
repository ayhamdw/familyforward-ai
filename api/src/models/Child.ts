import { Schema, model, type InferSchemaType } from "mongoose";
import { AGE_BANDS, HOME_LANGUAGES, NICKNAME_MAX_LENGTH } from "@familyforward/shared";

// A nickname, an age band and home languages. No name, birth date or school, ever.
const childSchema = new Schema({
  parentId: { type: Schema.Types.ObjectId, ref: "Parent", required: true, index: true },
  nickname: { type: String, required: true, trim: true, minlength: 1, maxlength: NICKNAME_MAX_LENGTH },
  ageBand: { type: String, enum: AGE_BANDS, required: true },
  homeLanguages: [{ type: String, enum: HOME_LANGUAGES }],
  createdAt: { type: Date, required: true, default: () => new Date() },
}, { strict: "throw" });

export type ChildDoc = InferSchemaType<typeof childSchema>;
export const Child = model("Child", childSchema);
