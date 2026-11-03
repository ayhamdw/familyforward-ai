import { selectFallbackActivities, type Activity, type AgeBand, type FocusArea, type Material, type MinutesOption } from "@familyforward/shared";

const text = { title: "t", materials: "m", steps: ["a", "b", "c"], why: "w", safety: "s" };
function act(id: string, ageBand: AgeBand, focus: FocusArea, minutes: MinutesOption, materialKeys: Material[] = []): Activity {
  return { id, ageBand, focus, minutes, materialKeys, en: text, es: text, ar: text };
}
const survey = {
  ageBand: "2-3" as AgeBand,
  focusAreas: ["reading"] as FocusArea[],
  minutesPerDay: 10 as MinutesOption,
  daysPerWeek: 2 as 2 | 3 | 5,
  materials: [] as Material[],
};
const ids = (list: Activity[]) => list.map((a) => a.id);

describe("selectFallbackActivities tiers", () => {
  it("exact match comes first", () => {
    const lib = [act("near", "2-3", "reading", 5), act("exact", "2-3", "reading", 10)];
    expect(ids(selectFallbackActivities({ ...survey, daysPerWeek: 2 }, lib))[0]).toBe("exact");
  });

  it("tier a: same age band and focus, nearest minutes, beats every other tier", () => {
    const lib = [
      act("a-far", "2-3", "reading", 20),
      act("a-near", "2-3", "reading", 5),
      act("b-exact", "4-5", "reading", 10),
      act("c-exact", "2-3", "talking", 10),
    ];
    expect(ids(selectFallbackActivities({ ...survey, daysPerWeek: 2 }, lib))).toEqual(["a-near", "a-far"]);
  });

  it("tier b: same focus in the other age band comes before same age band with another focus", () => {
    const lib = [
      act("b-20", "4-5", "reading", 20),
      act("b-5", "4-5", "reading", 5),
      act("c-exact", "2-3", "talking", 10),
      act("d-exact", "4-5", "talking", 10),
    ];
    // Nearest minutes within the tier: 5 (distance 5) before 20 (distance 10).
    expect(ids(selectFallbackActivities({ ...survey, daysPerWeek: 2 }, lib))).toEqual(["b-5", "b-20"]);
  });

  it("tier c: same age band with another focus comes before the other age band with another focus", () => {
    const lib = [act("d-exact", "4-5", "talking", 10), act("c-20", "2-3", "talking", 20), act("c-5", "2-3", "movement", 5)];
    expect(ids(selectFallbackActivities({ ...survey, daysPerWeek: 2 }, lib))).toEqual(["c-5", "c-20"]);
  });

  it("walks the tiers in order a, b, c across one week", () => {
    const lib = [
      act("c1", "2-3", "talking", 10),
      act("b1", "4-5", "reading", 10),
      act("a1", "2-3", "reading", 20),
      act("d1", "4-5", "talking", 10),
    ];
    expect(ids(selectFallbackActivities({ ...survey, daysPerWeek: 5 }, lib))).toEqual(["a1", "b1", "c1", "d1", "a1"]);
  });

  it("nearest minutes picks the shorter activity on a tie", () => {
    const lib = [act("long", "2-3", "reading", 20), act("short", "2-3", "reading", 5)];
    expect(ids(selectFallbackActivities({ ...survey, minutesPerDay: 10, daysPerWeek: 2 }, lib))[0]).toBe("short");
  });

  it("always respects the family's materials, in every tier", () => {
    const lib = [
      act("a-books", "2-3", "reading", 10, ["books"]),
      act("b-books", "4-5", "reading", 10, ["books"]),
      act("c-ok", "2-3", "talking", 10),
      act("d-ok", "4-5", "talking", 10),
    ];
    expect(ids(selectFallbackActivities({ ...survey, daysPerWeek: 2 }, lib))).toEqual(["c-ok", "d-ok"]);
    expect(ids(selectFallbackActivities({ ...survey, daysPerWeek: 2, materials: ["books"] }, lib))).toEqual(["a-books", "b-books"]);
  });

  it("does not repeat an activity while an alternative exists, and repeats only when the pool runs out", () => {
    const lib = [act("x", "2-3", "reading", 10), act("y", "4-5", "talking", 10)];
    expect(ids(selectFallbackActivities({ ...survey, daysPerWeek: 2 }, lib))).toEqual(["x", "y"]);
    const five = ids(selectFallbackActivities({ ...survey, daysPerWeek: 5 }, lib));
    expect(five.slice(0, 2)).toEqual(["x", "y"]);
    expect(five).toHaveLength(5);
  });

  it("returns nothing only when the materials rule out every activity", () => {
    expect(selectFallbackActivities(survey, [act("only-books", "2-3", "reading", 10, ["books"])])).toEqual([]);
  });

  it("two focus areas take turns, each using the tiers for its own focus", () => {
    const lib = [
      act("r-same", "2-3", "reading", 10),
      act("t-other-age", "4-5", "talking", 10),
      act("filler", "2-3", "movement", 10),
    ];
    const list = selectFallbackActivities({ ...survey, focusAreas: ["reading", "talking"], daysPerWeek: 3 }, lib);
    expect(ids(list)).toEqual(["r-same", "t-other-age", "filler"]);
  });
});
