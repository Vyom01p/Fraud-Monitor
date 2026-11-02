import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    amount: { type: Number, required: true },
    ip: { type: String },
    billingCountry: { type: String },
    cardToken: { type: String },

    rulesTriggered: [{ type: String }],

    mlRiskScore: { type: Number },
    isAnomaly: { type: Boolean },
    mlAvailable: { type: Boolean, default: true },

    finalScore: { type: Number },
    decisionReason: { type: String },
    status: {
      type: String,
      enum: ["APPROVED", "REVIEW", "BLOCKED"],
      default: "APPROVED",
    },
    source: { type: String, enum: ["api", "demo"], default: "api" },

    review: {
      decision: { type: String, enum: ["CONFIRMED_FRAUD", "FALSE_POSITIVE"] },
      note: { type: String, maxlength: 500 },
      reviewedAt: { type: Date },
    },
  },
  { timestamps: true },
);

transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Transaction", transactionSchema);
