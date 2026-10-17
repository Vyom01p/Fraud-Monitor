import Transaction from "../models/Transaction.js";
import Alert from "../models/Alert.js";
import { getRuleConfig } from "./ruleConfigService.js";
import { runRules } from "./ruleEngine.js";
import { buildFeatures } from "./featureBuilder.js";
import { getMlScore } from "./mlClient.js";
import { aggregateScore } from "./aggregator.js";

export async function processTransaction(input, io, source = "api") {
  const { userId, amount, ip, billingCountry, cardToken, mlFeatures } = input;

  const draftTx = {
    userId,
    amount,
    ip,
    billingCountry,
    cardToken,
    createdAt: new Date(),
  };

  const features = buildFeatures(draftTx, mlFeatures);

  // Run the rule pipeline and ML scoring concurrently to reduce latency
  const [ruleConfig, ml] = await Promise.all([
    getRuleConfig(),
    getMlScore(features),
  ]);

  const rulesTriggered = (await runRules(draftTx, ruleConfig)) ?? [];

  const { finalScore, status, decisionReason } = aggregateScore(
    rulesTriggered,
    ml?.risk_score ?? null,
    ruleConfig,
  );

  const transaction = await Transaction.create({
    userId,
    amount,
    ip,
    billingCountry,
    cardToken,
    createdAt: draftTx.createdAt,
    rulesTriggered,
    mlRiskScore: ml?.risk_score ?? null,
    isAnomaly: Boolean(ml?.is_anomaly),
    mlAvailable: !ml?.mlServiceDown,
    finalScore,
    decisionReason,
    status,
    source,
  });

  let alert = null;
  if (status !== "APPROVED") {
    const formattedMlScore =
      typeof ml?.risk_score === "number" ? ml.risk_score.toFixed(3) : "N/A";

    alert = await Alert.create({
      transaction: transaction._id,
      reason: `${decisionReason}; rules: ${rulesTriggered.join(", ") || "none"}; ml: ${formattedMlScore}`,
      severity: status === "BLOCKED" ? "HIGH" : "MEDIUM",
    });
  }

  io?.emit("transaction_processed", transaction);
  if (alert) {
    io?.emit("fraud_alert", alert);
  }

  return transaction;
}
