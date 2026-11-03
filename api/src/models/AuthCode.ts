import { Schema, model, type InferSchemaType } from "mongoose";

/** One row per email hash. Only hashes are stored: never the email or the code. */
const authCodeSchema = new Schema({
  emailHash: { type: String, required: true, unique: true },
  codeHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, required: true, default: 0 },
});

// TTL index: MongoDB removes the row once expiresAt has passed.
authCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type AuthCodeDoc = InferSchemaType<typeof authCodeSchema>;
export const AuthCode = model("AuthCode", authCodeSchema);
