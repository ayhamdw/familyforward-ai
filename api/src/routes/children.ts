import { Router } from "express";
import { ChildInputSchema, ChildPatchSchema, MAX_CHILDREN } from "@familyforward/shared";
import { ApiError } from "../lib/apiError";
import { objectId } from "../lib/ids";
import { requireAuth } from "../middleware/requireAuth";
import { Child, Plan, Survey } from "../models";

type ChildLike = { _id: unknown; nickname: string; ageBand: string; homeLanguages: string[]; createdAt: Date };

export function childToDto(child: ChildLike) {
  return {
    id: String(child._id),
    nickname: child.nickname,
    ageBand: child.ageBand,
    homeLanguages: child.homeLanguages,
    createdAt: child.createdAt.toISOString(),
  };
}

const NOT_FOUND = { code: "child_not_found", message: "We could not find that child." } as const;

/** Parent-owned children. Every query is scoped to the signed-in parent, so someone else's id is a plain 404. */
export function childrenRouter(config: { jwtSecret: string }): Router {
  const router = Router();
  router.use(requireAuth(config.jwtSecret));

  router.post("/", async (req, res, next) => {
    try {
      const parentId = req.parentId as string;
      const parsed = ChildInputSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new ApiError(400, "invalid_child", "Check the nickname, age and languages.");
      }
      if ((await Child.countDocuments({ parentId })) >= MAX_CHILDREN) {
        throw new ApiError(409, "child_limit", `You can add up to ${MAX_CHILDREN} children.`);
      }
      const child = await Child.create({ parentId, ...parsed.data });
      res.status(201).json(childToDto(child));
    } catch (err) {
      next(err);
    }
  });

  router.get("/", async (req, res, next) => {
    try {
      const children = await Child.find({ parentId: req.parentId }).sort({ createdAt: 1 });
      res.json({ children: children.map(childToDto) });
    } catch (err) {
      next(err);
    }
  });

  router.patch("/:childId", async (req, res, next) => {
    try {
      const id = objectId(req.params.childId, NOT_FOUND.code, NOT_FOUND.message);
      const parsed = ChildPatchSchema.safeParse(req.body);
      if (!parsed.success || Object.keys(parsed.data).length === 0) {
        throw new ApiError(400, "invalid_child", "Check the nickname, age and languages.");
      }
      const child = await Child.findOneAndUpdate({ _id: id, parentId: req.parentId }, { $set: parsed.data }, { returnDocument: "after", runValidators: true });
      if (!child) {
        throw new ApiError(404, NOT_FOUND.code, NOT_FOUND.message);
      }
      res.json(childToDto(child));
    } catch (err) {
      next(err);
    }
  });

  // Deleting a child also deletes their surveys and plans.
  router.delete("/:childId", async (req, res, next) => {
    try {
      const id = objectId(req.params.childId, NOT_FOUND.code, NOT_FOUND.message);
      const parentId = req.parentId as string;
      const child = await Child.findOne({ _id: id, parentId });
      if (!child) {
        throw new ApiError(404, NOT_FOUND.code, NOT_FOUND.message);
      }
      await Promise.all([Plan.deleteMany({ parentId, childId: id }), Survey.deleteMany({ parentId, childId: id })]);
      await Child.deleteOne({ _id: id, parentId });
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
