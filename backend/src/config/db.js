import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "./logger.js";

export async function connectDB() {
  try {
    await mongoose.connect(env.MONGO_URI);
    logger.info("MongoDB connected");
  } catch (err) {
    logger.fatal({ err: err.message }, "MongoDB connection failed");
    process.exit(1);
  }
}
