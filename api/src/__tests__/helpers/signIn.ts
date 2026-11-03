import type { Express } from "express";
import request from "supertest";
import type { FakeMailer } from "./testApp";

/** Runs the real email-code flow and returns the token. */
export async function signIn(app: Express, mailer: FakeMailer, email: string): Promise<string> {
  await request(app).post("/auth/request-code").send({ email });
  const res = await request(app).post("/auth/verify").send({ email, code: mailer.lastCode() });
  return res.body.token as string;
}
