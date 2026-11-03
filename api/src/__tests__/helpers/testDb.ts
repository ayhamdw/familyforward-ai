import os from "node:os";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

/** Test database name. Never the dev or prod database. */
export const TEST_DB_NAME = "familyforward_test";

let server: MongoMemoryServer | undefined;

/** Starts an in-memory MongoDB and connects mongoose to it. */
export async function startTestDb(): Promise<void> {
  server = await MongoMemoryServer.create();
  // Jest's VM cannot run the driver's dynamic import of "os", so pass it in directly.
  await mongoose.connect(server.getUri(), {
    dbName: TEST_DB_NAME,
    runtimeAdapters: { os },
  });
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
}

export async function clearTestDb(): Promise<void> {
  await Promise.all(Object.values(mongoose.models).map((m) => m.deleteMany({})));
}

export async function stopTestDb(): Promise<void> {
  await mongoose.disconnect();
  await server?.stop();
  server = undefined;
}
