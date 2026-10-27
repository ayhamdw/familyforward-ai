import {
  AGE_BANDS,
  FOCUS_AREAS,
  FOCUS_AREA_LABELS,
  FOCUS_AREA_SHORT_LABELS,
  INTERESTS,
  INTEREST_LABELS,
  LANGUAGES,
  MATERIALS,
  MATERIAL_LABELS,
  seedActivities,
} from "@familyforward/shared";

const groups = [
  ["focus", FOCUS_AREAS, FOCUS_AREA_LABELS],
  ["focus (short)", FOCUS_AREAS, FOCUS_AREA_SHORT_LABELS],
  ["interests", INTERESTS, INTEREST_LABELS],
  ["materials", MATERIALS, MATERIAL_LABELS],
] as const;

describe("survey option labels", () => {
  it.each(groups)("%s has a non-empty label in every language for every option", (_name, ids, labels) => {
    for (const id of ids) {
      for (const language of LANGUAGES) {
        expect((labels as Record<string, Record<string, string>>)[id][language].trim()).not.toBe("");
      }
    }
  });

  it("has the option counts from the design", () => {
    expect(FOCUS_AREAS).toHaveLength(6);
    expect(INTERESTS).toHaveLength(7);
    expect(MATERIALS).toHaveLength(6);
  });
});

describe("age bands", () => {
  it("are the two survey bands", () => {
    expect([...AGE_BANDS]).toEqual(["2-3", "4-5"]);
  });

  it("match every seed activity", () => {
    expect(seedActivities.every((activity) => (AGE_BANDS as readonly string[]).includes(activity.ageBand))).toBe(true);
  });

  it("cover every focus area used by the seed activities", () => {
    expect(seedActivities.every((activity) => (FOCUS_AREAS as readonly string[]).includes(activity.focus))).toBe(true);
  });
});
