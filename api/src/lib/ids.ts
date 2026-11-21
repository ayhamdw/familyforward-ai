import mongoose from "mongoose";
import { ApiError } from "./apiError";

/** Parses an id from a URL or body. A malformed id is the same as a missing one: 404, never a hint. */
export function objectId(value: unknown, code: string, message: string): string {
  if (typeof value !== "string" || !mongoose.isValidObjectId(value) || value.length !== 24) {
    throw new ApiError(404, code, message);
  }
  return value;
}
