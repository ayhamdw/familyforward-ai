import { ActivitySchema, LANGUAGES, PlanOutputSchema, CLOSING_LINES, buildFallbackPlan, seedActivities } from "@familyforward/shared";
import { safetyFilter, checkText } from "../generation/safetyFilter";
import { validatePlan } from "../generation/validator";
import { SURVEY, allSurveys } from "./helpers/surveys";

describe("seed library", () => {
  it("has valid activities in all three languages", () => {
    expect(seedActivities.length).toBe(30);
    for (const a of seedActivities) {
      for (const lang of LANGUAGES) {
        const t = a[lang];
        const parsed = ActivitySchema.safeParse({
          id: a.id, title: t.title, minutes: a.minutes, materials: a.materialKeys, steps: t.steps, why: t.why, safety: t.safety,
        });
        expect(parsed.success).toBe(true);
      }
    }
  });

  it("passes the safety filter in every language (no false positives)", () => {
    for (const a of seedActivities) {
      for (const lang of LANGUAGES) {
        const t = a[lang];
        const result = checkText([t.title, t.why, ...t.steps].join("\n"));
        expect(checkText(t.safety, ["unsafe_content"])).toEqual({ ok: true });
        expect({ id: a.id, lang, result }).toEqual({ id: a.id, lang, result: { ok: true } });
      }
    }
  });
});

describe("buildFallbackPlan", () => {
  it("is valid, passes the validator and filter for every survey combination", () => {
    for (const survey of allSurveys()) {
      const plan = buildFallbackPlan(survey);
      expect(PlanOutputSchema.safeParse(plan).success).toBe(true);
      expect(plan.days).toHaveLength(survey.daysPerWeek);
      expect(plan.closing).toBe(CLOSING_LINES[survey.language]);
      expect(safetyFilter(plan)).toEqual({ ok: true });
      // Materials always fit the family.
      for (const d of plan.days) {
        expect(d.activity.materials.every((m) => survey.materials.includes(m))).toBe(true);
      }
      const v = validatePlan(JSON.stringify(plan), { ...survey });
      // minutes can differ when the library has no match for that length, nothing else may fail
      if (!v.ok) expect(v.reason).toBe("minutes_mismatch");
    }
  });

  it("uses the age band, focus and minutes when the library has a match", () => {
    const plan = buildFallbackPlan({ ...SURVEY, focusAreas: ["talking"], minutesPerDay: 5, daysPerWeek: 2, materials: [] });
    expect(plan.days.every((d) => d.activity.minutes === 5)).toBe(true);
    const ids = plan.days.map((d) => d.activity.id);
    expect(new Set(ids).size).toBe(2);
    for (const id of ids) {
      const seed = seedActivities.find((a) => a.id === id)!;
      expect(seed.ageBand).toBe("2-3");
      expect(seed.focus).toBe("talking");
    }
  });

  it("only uses materials the family has", () => {
    const plan = buildFallbackPlan({ ...SURVEY, materials: [], daysPerWeek: 5 });
    expect(plan.days.every((d) => d.activity.materials.length === 0)).toBe(true);
  });

  it("is deterministic, one activity per chosen day, in the survey language", () => {
    const a = buildFallbackPlan({ ...SURVEY, language: "ar", daysPerWeek: 5 });
    const b = buildFallbackPlan({ ...SURVEY, language: "ar", daysPerWeek: 5 });
    expect(a).toEqual(b);
    expect(a.days.map((d) => d.day)).toEqual([1, 2, 3, 4, 5]);
    expect(a.language).toBe("ar");
    expect(JSON.stringify(a)).toMatch(/[ء-ي]/);
  });

  it("mixes two chosen focus areas", () => {
    const plan = buildFallbackPlan({ ...SURVEY, focusAreas: ["movement", "counting"], daysPerWeek: 2, materials: ["paper", "kitchen", "toys", "books"] });
    const focus = plan.days.map((d) => seedActivities.find((a) => a.id === d.activity.id)!.focus);
    expect(new Set(focus)).toEqual(new Set(["movement", "counting"]));
  });
});
