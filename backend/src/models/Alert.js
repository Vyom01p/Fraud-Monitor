import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ["MEDIUM", "HIGH"],
      required: true,
    },
    resolved: { type: Boolean, default: false },
  },
  {
    //Defines CreatedAt automatically
    timestamps: true,
  },
);

export default mongoose.model("Alert", alertSchema);
