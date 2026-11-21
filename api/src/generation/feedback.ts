import type { CheckInAnswer, FocusArea, Reaction } from "@familyforward/shared";

/** What happened last week, as counts only. Never free text. */
export type PlanFeedback = {
  completedByFocus: Partial<Record<FocusArea, number>>;
  reactionsByFocus: Partial<Record<FocusArea, Partial<Record<Reaction, number>>>>;
  checkIn: Partial<Record<CheckInAnswer, number>>;
};

/** Short, fixed-format text for the prompt. Built only from the counts above. */
export function feedbackBlock(f: PlanFeedback): string {
  const lines: string[] = ["Last week (counts only):"];
  for (const [focus, n] of Object.entries(f.completedByFocus)) {
    lines.push(`- completed in ${focus}: ${n}`);
  }
  for (const [focus, counts] of Object.entries(f.reactionsByFocus)) {
    const parts = Object.entries(counts ?? {}).map(([reaction, n]) => `${reaction}=${n}`);
    lines.push(`- reactions in ${focus}: ${parts.join(", ")}`);
  }
  const answers = Object.entries(f.checkIn).map(([a, n]) => `${a}=${n}`);
  if (answers.length > 0) lines.push(`- check-in answers: ${answers.join(", ")}`);
  lines.push("Build more on the focus areas the child loved. Do not repeat what did not work.");
  return lines.join("\n");
}
