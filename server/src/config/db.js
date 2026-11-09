import mongoose from "mongoose";
import { config } from "./env.js";

let memoryServer = null;

/**
 * Connects to MongoDB. If MONGO_URI is empty, starts a throwaway in-memory MongoDB
 * so the app runs with zero setup. Data is lost when the server stops.
 */
export async function connectDB() {
  let uri = config.mongoUri;

  if (!uri) {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri("yojana-mitra");
    console.warn("[db] MONGO_URI not set: using an in-memory database (data resets on restart)");
  }

  await mongoose.connect(uri);
  console.log("[db] connected");
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}
