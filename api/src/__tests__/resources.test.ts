import { ResourceSchema, resources, RESOURCE_IDS, CONCERN_RESOURCE_IDS, isResourceId } from "@familyforward/shared";

describe("resource directory", () => {
  it("has at least 28 entries and validates against the schema", () => {
    expect(resources.length).toBeGreaterThanOrEqual(28);
    for (const r of resources) {
      expect(ResourceSchema.safeParse(r).success).toBe(true);
    }
  });

  it("has unique ids and unique urls", () => {
    expect(new Set(RESOURCE_IDS).size).toBe(RESOURCE_IDS.length);
    expect(new Set(resources.map((r) => r.url)).size).toBe(resources.length);
  });

  it("has at least 25 entries for each age band", () => {
    expect(resources.filter((r) => r.ageBands.includes("2-3")).length).toBeGreaterThanOrEqual(25);
    expect(resources.filter((r) => r.ageBands.includes("4-5")).length).toBeGreaterThanOrEqual(25);
  });

  it("lists Chicago entries first and uses only https urls", () => {
    const firstNational = resources.findIndex((r) => r.area === "national");
    expect(resources.slice(firstNational).every((r) => r.area === "national")).toBe(true);
    expect(resources.every((r) => r.url.startsWith("https://"))).toBe(true);
  });

  it("only has a checked date when it is a real date, and phones only as digits and dashes", () => {
    for (const r of resources) {
      if (r.checkedOn) expect(Number.isNaN(Date.parse(r.checkedOn))).toBe(false);
      if (r.phone) expect(r.phone).toMatch(/^[0-9()+\- ]{7,}$/);
    }
  });

  it("has every offer text in all three languages", () => {
    for (const r of resources) {
      expect(r.offers.en.length).toBeGreaterThan(10);
      expect(r.offers.es.length).toBeGreaterThan(10);
      expect(r.offers.ar).toMatch(/[ء-ي]/);
    }
  });

  it("rejects entries with extra or missing fields", () => {
    expect(ResourceSchema.safeParse({ ...resources[0], extra: 1 }).success).toBe(false);
    const { name, ...rest } = resources[0];
    void name;
    expect(ResourceSchema.safeParse(rest).success).toBe(false);
  });

  it("contains the resources the concern card points to", () => {
    for (const id of [...CONCERN_RESOURCE_IDS["2-3"], ...CONCERN_RESOURCE_IDS["4-5"]]) {
      expect(isResourceId(id)).toBe(true);
    }
  });
});
