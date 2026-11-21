import { scanPlan, type FilterHit, type PlanOutput } from "@familyforward/shared";

export type FilterResult = { ok: true } | { ok: false; hits: FilterHit[] };

/**
 * Runs the versioned blocklist (packages/shared/src/safety) over every text field of the plan,
 * including worthNoticing and checkIn. Hits carry a term id, the list version and a field path.
 * Never log a hit's `term` together with anything else, and never log or store the matched text.
 */
export function safetyFilter(plan: PlanOutput): FilterResult {
  const hits = scanPlan(plan);
  return hits.length === 0 ? { ok: true } : { ok: false, hits };
}
