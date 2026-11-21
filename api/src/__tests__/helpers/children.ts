import type { Express } from "express";
import request from "supertest";
import type { SurveyAnswers } from "@familyforward/shared";

export const ANSWERS: SurveyAnswers = {
  language: "en",
  focusAreas: ["talking"],
  interests: ["songs"],
  materials: ["paper", "kitchen"],
  minutesPerDay: 10,
  daysPerWeek: 3,
};

export async function createChild(
  app: Express,
  token: string,
  overrides: Record<string, unknown> = {},
): Promise<string> {
  const res = await request(app)
    .post("/children")
    .set("authorization", `Bearer ${token}`)
    .send({ nickname: "Sunny", ageBand: "2-3", homeLanguages: ["en"], ...overrides });
  if (res.status !== 201) throw new Error(`child create failed: ${res.status}`);
  return res.body.id as string;
}

export const auth = (token: string) => ({ authorization: `Bearer ${token}` });
