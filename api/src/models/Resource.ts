import { Schema, model, type InferSchemaType } from "mongoose";

/** Free local help links. nameKey is an i18n key, not display text. */
const resourceSchema = new Schema({
  kind: { type: String, required: true },
  nameKey: { type: String, required: true },
  url: { type: String, required: true },
  free: { type: Boolean, required: true, default: true, validate: (v: boolean) => v === true },
});

export type ResourceDoc = InferSchemaType<typeof resourceSchema>;
export const Resource = model("Resource", resourceSchema);
