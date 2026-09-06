import Transaction from "../models/Transaction.js";

/**
 * Runs all deterministic rules against an incoming transaction.
 * Returns an array of rule-name strings that were triggered.
 */
export async function runRules(tx, ruleConfig) {
  const triggered = [];

  // 1. Velocity check: too many tx from this user in the configured window
  if (ruleConfig.enabled.velocity) {
    const windowStart = new Date(
      Date.now() - ruleConfig.velocityWindowSeconds * 1000,
    );
    const recentCount = await Transaction.countDocuments({
      userId: tx.userId,
      createdAt: { $gte: windowStart },
    });
    if (recentCount >= ruleConfig.velocityMaxTxPerWindow) {
      triggered.push("VELOCITY_SPIKE");
    }
  }

  // 2. Amount anomaly: current amount vs this user's 30-day average
  if (ruleConfig.enabled.amountAnomaly) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const history = await Transaction.aggregate([
      { $match: { userId: tx.userId, createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, avgAmount: { $avg: "$amount" } } },
    ]);
    const avgAmount = history[0]?.avgAmount;
    if (
      avgAmount &&
      tx.amount > avgAmount * ruleConfig.amountAnomalyMultiplier
    ) {
      triggered.push("AMOUNT_ANOMALY");
    }
  }

  // 3. Geo-fencing: billing country in the blocked list
  if (
    ruleConfig.enabled.geoFence &&
    ruleConfig.blockedCountries.includes(tx.billingCountry)
  ) {
    triggered.push("BLOCKED_COUNTRY");
  }

  // 4. Card testing pattern: several small transactions from this user recently
  if (ruleConfig.enabled.cardTesting) {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const smallTxCount = await Transaction.countDocuments({
      userId: tx.userId,
      amount: { $lte: ruleConfig.cardTestingSmallAmountMax },
      createdAt: { $gte: fiveMinAgo },
    });
    if (smallTxCount >= ruleConfig.cardTestingCountThreshold) {
      triggered.push("CARD_TESTING_PATTERN");
    }
  }

  return triggered;
}
