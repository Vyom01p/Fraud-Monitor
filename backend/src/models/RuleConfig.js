import mongoose from "mongoose";

const ruleConfigSchema = new mongoose.Schema({
  velocityMaxTxPerWindow: { type: Number, default: 3 },
  velocityWindowSeconds: { type: Number, default: 60 },

  amountAnomalyMultiplier: { type: Number, default: 3 },

  blockedCountries: [{ type: String }],

  cardTestingSmallAmountMax: { type: Number, default: 2 },
  cardTestingCountThreshold: { type: Number, default: 3 },

  enabled: {
    velocity: { type: Boolean, default: true },
    amountAnomaly: { type: Boolean, default: true },
    geoFence: { type: Boolean, default: true },
    cardTesting: { type: Boolean, default: true },
  },
});

export default mongoose.model("RuleConfig", ruleConfigSchema);
