import { CONCERN_RESOURCE_IDS, PlanOutputSchema, scanPlan } from "@familyforward/shared";
import { CHILD, ANSWERS } from "@/test/fixtures";
import { addDays, buildLocalPlan, isLocalPlan, mondayOf, toSurveyInput } from "../buildPlan";

describe("date helpers", () => {
  it("finds the Monday of a week", () => {
    expect(mondayOf(new Date("2026-11-04T10:00:00Z"))).toBe("2026-11-02");
    expect(mondayOf(new Date("2026-11-08T23:00:00Z"))).toBe("2026-11-02");
    expect(mondayOf(new Date("2026-11-09T00:00:00Z"))).toBe("2026-11-09");
  });
  it("adds days across a month end", () => {
    expect(addDays("2026-10-26", 7)).toBe("2026-11-02");
  });
});

describe("buildLocalPlan", () => {
  const now = new Date("2026-11-04T10:00:00Z");

  it("builds a complete, valid plan on the phone, marked as a fallback with a local id", () => {
    const plan = buildLocalPlan(CHILD, ANSWERS, "en", { now });
    expect(isLocalPlan(plan)).toBe(true);
    expect(plan.source).toBe("fallback");
    expect(plan.weekStart).toBe("2026-11-02");
    expect(plan.days).toHaveLength(ANSWERS.days);
    expect(plan.days.every((d) => !d.done && d.reaction === null)).toBe(true);
    expect(plan.resourceIds.length).toBeGreaterThanOrEqual(2);
    const { id, childId, weekStart, source, createdAt, checkInAnswers, ...output } = plan;
    void [id, childId, weekStart, source, createdAt, checkInAnswers];
    expect(PlanOutputSchema.safeParse({ ...output, days: output.days.map(({ day, activity }) => ({ day, activity })) }).success).toBe(true);
  });

  it("uses the child's age band and home languages", () => {
    const older = buildLocalPlan({ ...CHILD, ageBand: "4-5", homeLanguages: ["ar"] }, ANSWERS, "en", { now });
    expect(toSurveyInput({ ageBand: "4-5" }, ANSWERS, "en").ageBand).toBe("4-5");
    // A home language other than English gives the language note.
    expect(older.worthNoticing.some((c) => c.resourceIds.includes("chicago-public-library"))).toBe(true);
  });

  it("is written in the plan language and passes the safety filter in all three", () => {
    for (const language of ["en", "es", "ar"] as const) {
      const plan = buildLocalPlan(CHILD, ANSWERS, language, { now });
      expect(plan.language).toBe(language);
      const { id, childId, weekStart, source, createdAt, checkInAnswers, days, ...rest } = plan;
      void [id, childId, weekStart, source, createdAt, checkInAnswers];
      expect(scanPlan({ ...rest, days: days.map(({ day, activity }) => ({ day, activity })) })).toEqual([]);
    }
  });

  it("shows the one fixed card for a health note, and keeps no trace of the note", () => {
    const plan = buildLocalPlan(CHILD, ANSWERS, "en", { now, note: "he has a speech delay, zzz-secret" });
    expect(plan.worthNoticing).toHaveLength(1);
    expect(plan.worthNoticing[0].mentionTo).toBe("pediatrician");
    expect(plan.worthNoticing[0].resourceIds).toEqual([...CONCERN_RESOURCE_IDS["2-3"]]);
    expect(JSON.stringify(plan)).not.toMatch(/zzz-secret|speech delay/);
    const older = buildLocalPlan({ ...CHILD, ageBand: "4-5" }, ANSWERS, "es", { now, note: "autismo" });
    expect(older.worthNoticing[0].mentionTo).toBe("teacher");
    expect(older.worthNoticing[0].resourceIds).toEqual([...CONCERN_RESOURCE_IDS["4-5"]]);
  });

  it("leaves the cards alone for an ordinary note", () => {
    const plan = buildLocalPlan(CHILD, ANSWERS, "en", { now, note: "loves trucks" });
    expect(plan.worthNoticing.every((c) => c.mentionTo === "none")).toBe(true);
  });
});
