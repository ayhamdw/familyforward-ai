import { CLOSING_LINES, buildFallbackPlan, type PlanOutput, type SurveyInput } from "@familyforward/shared";
import { validatePlan } from "../generation/validator";
import { SURVEY } from "./helpers/surveys";

const survey: SurveyInput = { ...SURVEY, minutesPerDay: 10, daysPerWeek: 3, materials: ["paper", "kitchen", "toys"] };

function good(): PlanOutput {
  const plan = buildFallbackPlan(survey);
  // Make the fixture independent of library coverage.
  for (const d of plan.days) d.activity.minutes = 10;
  return plan;
}
const run = (plan: unknown, s: SurveyInput = survey) => validatePlan(JSON.stringify(plan), s);

describe("validatePlan", () => {
  it("accepts a good plan, also inside a json code fence", () => {
    expect(run(good()).ok).toBe(true);
    expect(validatePlan("```json\n" + JSON.stringify(good()) + "\n```", survey).ok).toBe(true);
  });

  it("rejects invalid JSON and wrong shapes", () => {
    expect(validatePlan("not json", survey)).toEqual({ ok: false, reason: "invalid_json" });
    expect(validatePlan('{"a":1}', survey)).toEqual({ ok: false, reason: "schema_invalid" });
    expect(validatePlan("Here is your plan: " + JSON.stringify(good()), survey)).toEqual({ ok: false, reason: "invalid_json" });
  });

  it("requires 3 to 5 steps", () => {
    const p = good();
    p.days[0].activity.steps = ["one", "two"];
    expect(run(p)).toEqual({ ok: false, reason: "schema_invalid" });
    const q = good();
    q.days[0].activity.steps = ["1", "2", "3", "4", "5", "6"];
    expect(run(q)).toEqual({ ok: false, reason: "schema_invalid" });
  });

  it("rejects materials the family did not list", () => {
    const p = good();
    p.days[0].activity.materials = ["phone"];
    expect(run(p)).toEqual({ ok: false, reason: "materials_mismatch" });
  });

  it("requires the chosen minutes and day count", () => {
    const p = good();
    p.days[1].activity.minutes = 20;
    expect(run(p)).toEqual({ ok: false, reason: "minutes_mismatch" });
    const q = good();
    q.days.pop();
    expect(run(q)).toEqual({ ok: false, reason: "days_mismatch" });
    const r = good();
    r.days[1].day = r.days[0].day;
    expect(run(r)).toEqual({ ok: false, reason: "days_mismatch" });
  });

  it("requires the plan language, both the field and the script", () => {
    const p = good();
    expect(run(p, { ...survey, language: "es" })).toEqual({ ok: false, reason: "language_mismatch" });
    const arSurvey: SurveyInput = { ...survey, language: "ar" };
    const arPlan = buildFallbackPlan(arSurvey);
    for (const d of arPlan.days) d.activity.minutes = 10;
    expect(run(arPlan, arSurvey).ok).toBe(true);
    // Says "ar" but is written in English.
    const fake = { ...good(), language: "ar", closing: CLOSING_LINES.ar };
    expect(run(fake, arSurvey)).toEqual({ ok: false, reason: "language_mismatch" });
  });
});
