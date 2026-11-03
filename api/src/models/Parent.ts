import { Schema, model, type InferSchemaType } from "mongoose";

const parentSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  createdAt: { type: Date, required: true, default: () => new Date() },
  lastLoginAt: { type: Date },
});

export type ParentDoc = InferSchemaType<typeof parentSchema>;
export const Parent = model("Parent", parentSchema);
