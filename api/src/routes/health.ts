import { Router } from "express";
import { pingDb } from "../db/connect";

export function healthRouter(nodeEnv: string): Router {
  const router = Router();

  // Liveness: the process is up. Does not touch the database.
  router.get("/", (_req, res) => {
    res.status(200).json({ status: "ok", env: nodeEnv, uptimeSeconds: Math.floor(process.uptime()) });
  });

  // Readiness: MongoDB answers a ping.
  router.get("/db", async (_req, res) => {
    const up = await pingDb();
    res.status(up ? 200 : 503).json({ db: up ? "up" : "down" });
  });

  return router;
}
