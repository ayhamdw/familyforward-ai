import mongoose from "mongoose";
import request from "supertest";
import { createApp } from "../app";
import { MockLlmClient, type LlmRequest } from "../generation/llmClient";
import type { AuthLimits } from "../routes/auth";
import { signIn } from "./helpers/signIn";
import { ANSWERS, auth, createChild } from "./helpers/children";
import { FakeMailer, testAppConfig } from "./helpers/testApp";
import { clearTestDb, startTestDb, stopTestDb } from "./helpers/testDb";

const NOTE = "zebra-pajama-marker loves the xylophone";
const NICKNAME = "Quillfeather";
const BIG: AuthLimits = { windowMs: 60_000, requestCodePerIp: 1000, requestCodePerEmail: 1000, verifyPerIp: 1000, verifyPerEmail: 1000 };

/** Records the prompts it receives, then behaves like the mock. */
class RecordingLlm extends MockLlmClient {
  prompts: string[] = [];
  async generate(req: LlmRequest): Promise<string> {
    this.prompts.push(req.user);
    return super.generate(req);
  }
}

/** Everything stored, optionally leaving out some collections. */
async function dumpDatabase(skip: string[] = []): Promise<string> {
  const db = mongoose.connection.db!;
  const collections = (await db.listCollections().toArray()).filter((c) => !skip.includes(c.name));
  const rows = await Promise.all(collections.map((c) => db.collection(c.name).find({}).toArray()));
  return JSON.stringify(rows);
}

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(clearTestDb);

describe("survey note privacy", () => {
  async function run(mode: "valid" | "invalid_json" | "blocked" | "error") {
    const lines: string[] = [];
    const logDestination = { write: (chunk: string) => void lines.push(chunk) };
    const mailer = new FakeMailer();
    const llm = new RecordingLlm(mode);
    const app = createApp(testAppConfig({ mailer, llm, logLevel: "debug", logDestination, authLimits: BIG }));
    const token = await signIn(app, mailer, "a@example.com");
    const childId = await createChild(app, token, { nickname: NICKNAME });
    const res = await request(app).post("/plans").set(auth(token)).send({ ...ANSWERS, childId, note: NOTE });
    // A failing request that carries the note.
    const bad = await request(app)
      .post("/plans")
      .set(auth(token))
      .send({ ...ANSWERS, childId, minutesPerDay: 99, note: NOTE });
    await new Promise((resolve) => setTimeout(resolve, 50));
    return { res, bad, lines, llm };
  }

  it.each(["valid", "invalid_json", "blocked", "error"] as const)(
    "never reaches the database, logs or responses (model mode: %s)",
    async (mode) => {
      const { res, bad, lines, llm } = await run(mode);
      expect(res.status).toBe(201);
      expect(bad.status).toBe(400);

      // It is used for the prompt, in memory.
      expect(llm.prompts.length).toBeGreaterThan(0);
      expect(llm.prompts[0]).toContain(NOTE);

      // And nowhere else.
      const markers = ["zebra-pajama-marker", "xylophone"];
      const everything = [await dumpDatabase(), lines.join("\n"), JSON.stringify(res.body), JSON.stringify(bad.body)];
      // The nickname is stored only on the child record (for its owner) and nowhere else.
      expect(await dumpDatabase(["children"])).not.toContain(NICKNAME);
      expect(llm.prompts.join("\n")).not.toContain(NICKNAME);
      expect(lines.join("\n")).not.toContain(NICKNAME);
      expect(JSON.stringify(res.body)).not.toContain(NICKNAME);
      for (const haystack of everything) {
        for (const marker of markers) {
          expect(haystack).not.toContain(marker);
        }
      }
      // Logs also carry no emails, codes or tokens.
      const logs = lines.join("\n");
      expect(logs).not.toContain("a@example.com");
      expect(logs).not.toMatch(/Bearer|eyJ/);
    },
  );
});
