import { Parent, Survey, AuthCode } from "../models";
import { startTestDb, stopTestDb } from "./helpers/testDb";
import { PlanRequestSchema, SurveyInputSchema, type SurveyInput } from "@familyforward/shared";

beforeAll(startTestDb);
afterAll(stopTestDb);

const survey: SurveyInput = {
  language: "en",
  ageBand: "2-3",
  focusAreas: ["talking"],
  interests: ["songs"],
  materials: ["paper"],
  minutesPerDay: 10,
  daysPerWeek: 3,
};

describe("models", () => {
  it("lowercases email and enforces uniqueness", async () => {
    await Parent.create({ email: "A@Example.com" });
    const found = await Parent.findOne({ email: "a@example.com" });
    expect(found).not.toBeNull();
    await expect(Parent.create({ email: "a@example.com" })).rejects.toThrow();
  });

  it("rejects more than two focus areas and unknown age bands", async () => {
    const parent = await Parent.create({ email: "b@example.com" });
    await expect(
      Survey.create({ ...survey, parentId: parent._id, focusAreas: ["talking", "reading", "counting"] }),
    ).rejects.toThrow();
    await expect(Survey.create({ ...survey, parentId: parent._id, ageBand: "6-7" } as never)).rejects.toThrow();
  });

  it("refuses a note field on Survey", async () => {
    const parent = await Parent.create({ email: "c@example.com" });
    await expect(Survey.create({ ...survey, parentId: parent._id, note: "hello" } as never)).rejects.toThrow();
  });

  it("creates the TTL index on AuthCode", async () => {
    const indexes = await AuthCode.collection.indexes();
    expect(indexes.some((i) => i.expireAfterSeconds === 0)).toBe(true);
  });
});

describe("shared schemas", () => {
  it("accepts a valid survey and rejects extras in values", () => {
    expect(SurveyInputSchema.safeParse(survey).success).toBe(true);
    expect(SurveyInputSchema.safeParse({ ...survey, minutesPerDay: 15 }).success).toBe(false);
    expect(SurveyInputSchema.safeParse({ ...survey, focusAreas: ["talking", "reading", "counting"] }).success).toBe(false);
  });

  it("limits the note to 140 characters", () => {
    expect(PlanRequestSchema.safeParse({ ...survey, note: "x".repeat(140) }).success).toBe(true);
    expect(PlanRequestSchema.safeParse({ ...survey, note: "x".repeat(141) }).success).toBe(false);
  });
});
