import mongoose from "mongoose";
export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MONGO CONNECTED");
  } catch (err) {
    console.error("MONGO CONNECTION FAILED", err.message);
    process.exit(1);
  }
}
