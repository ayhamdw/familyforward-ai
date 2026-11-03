import { Schema, model, type InferSchemaType } from "mongoose";

const organizationSchema = new Schema({
  name: { type: String, required: true },
  // TODO: placeholder until partner organizations are confirmed.
  contact: { type: String, default: "" },
});

export type OrganizationDoc = InferSchemaType<typeof organizationSchema>;
export const Organization = model("Organization", organizationSchema);
