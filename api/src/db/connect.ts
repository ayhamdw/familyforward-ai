import mongoose from "mongoose";

const STATES: Record<number, string> = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

export async function connectDb(uri: string, dbName: string): Promise<void> {
  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 10_000 });
}

export async function disconnectDb(): Promise<void> {
  await mongoose.connection.close();
}

export function dbState(): string {
  return STATES[mongoose.connection.readyState] ?? "unknown";
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

/** Returns true only if the connection is up and MongoDB answers a ping. */
export async function pingDb(): Promise<boolean> {
  if (!isDbConnected() || !mongoose.connection.db) {
    return false;
  }
  try {
    await mongoose.connection.db.admin().ping();
    return true;
  } catch {
    return false;
  }
}
