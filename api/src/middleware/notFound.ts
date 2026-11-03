import type { RequestHandler } from "express";
import { errorBody } from "../lib/apiError";

export const notFound: RequestHandler = (_req, res) => {
  res.locals.errorCode = "not_found";
  res.status(404).json(errorBody("not_found", "Not found"));
};
