import {
  ActivitySchema,
  LANGUAGES,
  PlanOutputSchema,
  CLOSING_LINES,
  buildFallbackPlan,
  isResourceId,
  seedActivities,
} from "@familyforward/shared";
import { validatePlan } from "../generation/validator";
import { SURVEY, allSurveys } from "./helpers/surveys";

describe("seed library", () => {
  it("has valid, complete activities in all three languages", () => {
    expect(seedActivities.length).toBe(30);
    for (const a of seedActivities) {
      for (const lang of LANGUAGES) {
        const t = a[lang];
        const parsed = ActivitySchema.safeParse({
          id: a.id, title: t.title, focus: a.focus, minutes: a.minutes, materials: a.materialKeys,
          steps: t.steps, why: t.why, safety: t.safety, easier: t.easier, harder: t.harder, noticeThis: t.noticeThis,
        });
        expect({ id: a.id, lang, ok: parsed.success }).toEqual({ id: a.id, lang, ok: true });
        for (const field of [t.easier, t.harder, t.noticeThis]) {
          expect(field.trim().split(/\s+/).length).toBeLessThanOrEqual(18);
        }
      }
    }
  });

  it("never says should, behind or other norm words in the new sentences", () => {
    for (const a of seedActivities) {
      for (const t of [a.en]) {
        for (const field of [t.easier, t.harder, t.noticeThis]) {
          expect(field).not.toMatch(/\b(should|behind|normal|typical|delayed|slow)\b/i);
        }
      }
    }
  });
});

describe("buildFallbackPlan", () => {
  it("returns a complete, strict plan for every survey combination", () => {
    for (const survey of allSurveys()) {
      const plan = buildFallbackPlan(survey, { homeLanguages: ["es"] });
      expect(PlanOutputSchema.safeParse(plan).success).toBe(true);
      expect(plan.days).toHaveLength(survey.daysPerWeek);
      expect(plan.closing).toBe(CLOSING_LINES[survey.language]);
      expect(plan.resourceIds.length).toBeGreaterThanOrEqual(2);
      expect(plan.resourceIds.every(isResourceId)).toBe(true);
      expect(plan.checkIn.length).toBeGreaterThanOrEqual(2);
      expect(plan.worthNoticing.length).toBeLessThanOrEqual(3);
      expect(plan.worthNoticing.every((w) => w.mentionTo === "none")).toBe(true);
      for (const d of plan.days) {
        expect(d.activity.materials.every((m) => survey.materials.includes(m))).toBe(true);
      }
      const v = validatePlan(JSON.stringify(plan), survey);
      // minutes can differ when the library has no match for that length, nothing else may fail
      if (!v.ok) expect(v.reason).toBe("minutes_mismatch");
    }
  });

  it("uses the age band, focus and minutes when the library has a match", () => {
    const plan = buildFallbackPlan({ ...SURVEY, focusAreas: ["talking"], minutesPerDay: 5, daysPerWeek: 2, materials: [] });
    expect(plan.days.every((d) => d.activity.minutes === 5)).toBe(true);
    expect(new Set(plan.days.map((d) => d.activity.id)).size).toBe(2);
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
    expect(JSON.stringify(a)).toMatch(/[\u0621-\u064A]/);
  });

  it("picks resources by age band and language", () => {
    const young = buildFallbackPlan({ ...SURVEY, ageBand: "2-3", language: "ar" });
    expect(young.resourceIds).toContain("211-metro-chicago");
    const en = buildFallbackPlan({ ...SURVEY, language: "en" });
    expect(en.resourceIds).toEqual(["chicago-public-library", "vroom", "pbs-kids-for-parents"]);
  });
});

describe("worthNoticing signal rules", () => {
  const cards = (over: object, opts = {}) => buildFallbackPlan({ ...SURVEY, materials: ["paper"], focusAreas: ["reading"], minutesPerDay: 10, ...over }, opts).worthNoticing;

  it("has no card when no signal applies", () => {
    expect(cards({})).toEqual([]);
  });
  it("adds a language card for a non-English home language", () => {
    expect(cards({}, { homeLanguages: ["en"] })).toEqual([]);
    expect(cards({}, { homeLanguages: ["es"] })).toHaveLength(1);
  });
  it("adds cards for 5 minutes, no materials and feelings or talking focus, at most three, in a fixed order", () => {
    const all = cards({ minutesPerDay: 5, materials: [], focusAreas: ["feelings", "talking"] }, { homeLanguages: ["ar"] });
    expect(all).toHaveLength(3);
    expect(all[0].resourceIds).toEqual(["chicago-public-library"]);
    expect(all.every((c) => c.mentionTo === "none")).toBe(true);
  });
  it("is in the plan language", () => {
    const es = cards({ language: "es", minutesPerDay: 5 });
    expect(es[0].observation).toMatch(/Cinco minutos/);
    const ar = cards({ language: "ar", minutesPerDay: 5 });
    expect(ar[0].observation).toMatch(/[\u0621-\u064A]/);
  });
});
