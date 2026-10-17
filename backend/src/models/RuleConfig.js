import mongoose from "mongoose";

const ruleConfigSchema = new mongoose.Schema({
  velocityMaxTxPerWindow: { type: Number, default: 3 },
  velocityWindowSeconds: { type: Number, default: 60 },

  amountAnomalyMultiplier: { type: Number, default: 3 },

  blockedCountries: { type: [String], default: ["XX", "YY"] },

  cardTestingSmallAmountMax: { type: Number, default: 2 },
  cardTestingCountThreshold: { type: Number, default: 3 },

  enabled: {
    velocity: { type: Boolean, default: true },
    amountAnomaly: { type: Boolean, default: true },
    geoFence: { type: Boolean, default: true },
    cardTesting: { type: Boolean, default: true },
  },

  hardBlockRules: { type: [String], default: ["BLOCKED_COUNTRY"] },
  reviewThreshold: { type: Number, default: 31 },
  blockThreshold: { type: Number, default: 71 },
  mlBlockThreshold: { type: Number, default: 0.95 },
});

export default mongoose.model("RuleConfig", ruleConfigSchema);
