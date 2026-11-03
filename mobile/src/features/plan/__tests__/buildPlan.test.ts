import { buildFallbackPlan, seedActivities } from "@familyforward/shared";
import { INITIAL_ANSWERS, type SurveyAnswers } from "@/storage/surveyStore";
import { addDays, buildMockPlan, mondayOf, selectActivities, selectFallbackActivities } from "../buildPlan";

type Complete = SurveyAnswers & { ageBand: NonNullable<SurveyAnswers["ageBand"]> };

const answers = (overrides: Partial<Complete> = {}): Complete => ({
  ...INITIAL_ANSWERS,
  ageBand: "2-3",
  focus: ["counting"],
  ...overrides,
});

describe("selectActivities", () => {
  it("returns one activity per chosen day", () => {
    expect(selectActivities(answers({ days: 2 }))).toHaveLength(2);
    expect(selectActivities(answers({ days: 3 }))).toHaveLength(3);
    expect(selectActivities(answers({ days: 5 }))).toHaveLength(5);
  });

  it("only uses activities for the chosen age band", () => {
    for (const band of ["2-3", "4-5"] as const) {
      const chosen = selectActivities(answers({ ageBand: band, days: 5 }));
      expect(chosen.every((activity) => activity.ageBand === band)).toBe(true);
    }
  });

  it("prefers the chosen focus areas", () => {
    const chosen = selectActivities(answers({ ageBand: "4-5", focus: ["feelings"], days: 2 }));
    expect(chosen[0].focus).toBe("feelings");
  });

  it("prefers activities that fit the chosen minutes", () => {
    const chosen = selectActivities(answers({ ageBand: "2-3", focus: ["talking"], minutes: 5, days: 3 }));
    expect(chosen[0].focus).toBe("talking");
    expect(chosen[0].minutes).toBeLessThanOrEqual(5);
  });

  it("never repeats an activity and is deterministic", () => {
    const first = selectActivities(answers({ days: 5 })).map((activity) => activity.id);
    const second = selectActivities(answers({ days: 5 })).map((activity) => activity.id);
    expect(new Set(first).size).toBe(first.length);
    expect(second).toEqual(first);
  });

  it("only picks activities that exist in the seed file", () => {
    const ids = new Set(seedActivities.map((activity) => activity.id));
    expect(selectActivities(answers({ days: 5 })).every((activity) => ids.has(activity.id))).toBe(true);
  });
});

describe("selectFallbackActivities", () => {
  it("fills the days, prefers the age band and focus, and only uses materials the family has", () => {
    const chosen = selectFallbackActivities(answers({ ageBand: "4-5", focus: ["counting"], days: 3, materials: [] }));
    expect(chosen).toHaveLength(3);
    expect(new Set(chosen.map((activity) => activity.id)).size).toBe(3);
    // Two 4-5 counting activities need no materials; the third day takes the same focus from the other age band.
    expect(chosen.slice(0, 2).every((activity) => activity.ageBand === "4-5" && activity.focus === "counting")).toBe(true);
    expect(chosen[2].focus).toBe("counting");
    expect(chosen.every((activity) => activity.materialKeys.length === 0)).toBe(true);
  });

  it("gives the same activities as the shared fallback plan", () => {
    const survey = answers({ ageBand: "2-3", focus: ["talking"], minutes: 5, days: 2 });
    const ids = selectFallbackActivities(survey).map((activity) => activity.id);
    const plan = buildFallbackPlan({
      language: "en",
      ageBand: "2-3",
      focusAreas: ["talking"],
      interests: [],
      materials: [],
      minutesPerDay: 5,
      daysPerWeek: 2,
    });
    expect(plan.days.map((day) => day.activity.id)).toEqual(ids);
  });
});

describe("buildMockPlan", () => {
  it("spreads days across the week and starts with nothing done", () => {
    const plan = buildMockPlan(answers({ days: 3 }), { weekStart: "2026-10-26", source: "custom", now: new Date("2026-10-27T10:00:00Z") });
    expect(plan.items.map((item) => item.weekday)).toEqual(["mon", "wed", "fri"]);
    expect(plan.items.map((item) => item.day)).toEqual([1, 2, 3]);
    expect(plan.items.every((item) => !item.done && item.fit === null)).toBe(true);
    expect(plan.source).toBe("custom");
    expect(plan.weekStart).toBe("2026-10-26");
  });

  it("marks fallback plans", () => {
    const plan = buildMockPlan(answers(), { weekStart: "2026-10-26", source: "fallback" });
    expect(plan.source).toBe("fallback");
  });

  it("does not store any free text", () => {
    const plan = buildMockPlan(answers(), { weekStart: "2026-10-26", source: "custom" });
    expect(Object.keys(plan).sort()).toEqual(["ageBand", "createdAt", "days", "focus", "id", "items", "minutes", "source", "weekStart"]);
  });
});

describe("week helpers", () => {
  it("finds the Monday of a week", () => {
    expect(mondayOf(new Date("2026-10-27T12:00:00Z"))).toBe("2026-10-26");
    expect(mondayOf(new Date("2026-11-01T12:00:00Z"))).toBe("2026-10-26");
    expect(mondayOf(new Date("2026-10-26T00:00:00Z"))).toBe("2026-10-26");
  });

  it("adds days across month ends", () => {
    expect(addDays("2026-10-26", 7)).toBe("2026-11-02");
    expect(addDays("2026-10-26", -7)).toBe("2026-10-19");
  });
});
