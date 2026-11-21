import type { PlanFeedback } from "./feedback";

type PlanForFeedback = {
  days: { activity: { id: string; focus: string }; done: boolean; reaction?: string | null }[];
  checkInAnswers?: string[];
};

/** Counts from last week's plan. Only enums and counts leave this function. */
export function feedbackFromPlan(plan: PlanForFeedback): PlanFeedback {
  const feedback: PlanFeedback = { completedByFocus: {}, reactionsByFocus: {}, checkIn: {} };
  for (const day of plan.days) {
    const focus = day.activity.focus as keyof PlanFeedback["completedByFocus"];
    if (day.done) {
      feedback.completedByFocus[focus] = (feedback.completedByFocus[focus] ?? 0) + 1;
    }
    if (day.reaction === "loved" || day.reaction === "fine" || day.reaction === "didnt_work") {
      const counts = (feedback.reactionsByFocus[focus] ??= {});
      counts[day.reaction] = (counts[day.reaction] ?? 0) + 1;
    }
  }
  for (const answer of plan.checkInAnswers ?? []) {
    if (answer === "yes" || answer === "somewhat" || answer === "no") {
      feedback.checkIn[answer] = (feedback.checkIn[answer] ?? 0) + 1;
    }
  }
  return feedback;
}

/** What the fallback should lean on: loved focus areas first, and activities that did not work are skipped. */
export function fallbackSignals(plan: PlanForFeedback): { preferredFocuses: string[]; avoidActivityIds: string[] } {
  const loved = new Map<string, number>();
  const avoid: string[] = [];
  for (const day of plan.days) {
    if (day.reaction === "loved") loved.set(day.activity.focus, (loved.get(day.activity.focus) ?? 0) + 1);
    if (day.reaction === "didnt_work") avoid.push(day.activity.id);
  }
  const preferredFocuses = [...loved.entries()].sort((a, b) => b[1] - a[1]).map(([focus]) => focus);
  return { preferredFocuses, avoidActivityIds: avoid };
}
