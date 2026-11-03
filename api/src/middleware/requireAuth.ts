import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { ApiError } from "../lib/apiError";
import { Parent } from "../models";

declare module "express-serve-static-core" {
  interface Request {
    /** Set by requireAuth. */
    parentId?: string;
  }
}

const UNAUTHORIZED = () => new ApiError(401, "unauthorized", "Please sign in again.");

export function requireAuth(jwtSecret: string): RequestHandler {
  return async (req, _res, next) => {
    try {
      const header = req.headers.authorization ?? "";
      const [scheme, token] = header.split(" ");
      if (scheme !== "Bearer" || !token) {
        throw UNAUTHORIZED();
      }
      let sub: unknown;
      try {
        sub = jwt.verify(token, jwtSecret, { algorithms: ["HS256"] }).sub;
      } catch {
        throw UNAUTHORIZED();
      }
      if (typeof sub !== "string" || !mongoose.isValidObjectId(sub)) {
        throw UNAUTHORIZED();
      }
      // A deleted account must not keep working until the token expires.
      if (!(await Parent.exists({ _id: sub }))) {
        throw UNAUTHORIZED();
      }
      req.parentId = sub;
      next();
    } catch (err) {
      next(err);
    }
  };
}
