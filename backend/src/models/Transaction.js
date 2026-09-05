import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    userID: {
      type: String,
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    ip: {
      type: String,
    },
    billingCountry: {
      type: String,
    },
    cardToken: {
      type: String,
    },
    rulesTriggered: [{ type: String }],
    myRiskScore: {
      type: Number,
    },
    isAnomaly: { type: Boolean },
    finalScore: { type: Number },
    status: {
      type: String,
      enum: ["APPROVED", "REVIEW", "BLOCKED"],
      default: ["APPROVED"],
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("Transactions", transactionSchema);
