import { Router } from "express";
import { hashEmail } from "../lib/crypto";
import { requireAuth } from "../middleware/requireAuth";
import { AuthCode, Parent, Plan, Survey } from "../models";

export function meRouter(config: { jwtSecret: string; codeHmacSecret: string }): Router {
  const router = Router();
  router.use(requireAuth(config.jwtSecret));

  // Deletes everything held about the parent. The parent row goes last so a failed run can be repeated.
  router.delete("/", async (req, res, next) => {
    try {
      const parentId = req.parentId as string;
      const parent = await Parent.findById(parentId);
      await Promise.all([Plan.deleteMany({ parentId }), Survey.deleteMany({ parentId })]);
      if (parent) {
        await AuthCode.deleteMany({ emailHash: hashEmail(config.codeHmacSecret, parent.email) });
        await Parent.deleteOne({ _id: parentId });
      }
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
