import Transaction from "../models/Transaction.js";
import Alert from "../models/Alert.js";
import RuleConfig from "../models/RuleConfig.js";
import { runRules } from "../services/ruleEngine.js";
import { buildFeatures } from "../services/featureBuilder.js";
import { getMlScore } from "../services/mlClient.js";
import { aggregateScore } from "../services/aggregator.js";
export function createTransactionHandler(io) {
  return async function handleTransaction(req, res) {
    try {
      const { userId, ip, billingCountry, cardToken, amount } = req.body;

      if (!userId || amount == undefined) {
        return res
          .status(400)
          .json({ error: "userId and amount are required" });
      }
      //get the single active rule config document
      let ruleConfig = await RuleConfig.findOne();
      if (!ruleConfig) ruleConfig = await RuleConfig.create({});

      //drafttransaction object for the rule engine to check against
      const draftTx = {
        userId,
        amount,
        ip,
        billingCountry,
        cardToken,
        createdAt: new Date(),
      };

      //1) Rule engine
      const rulesTriggered = await runRules(draftTx, ruleConfig);
      //2) Feature Building + ML Score
      const features = await buildFeatures(draftTx);
      const { risk_score, is_anomaly } = await getMlScore(features);

      //3) Aggregate into final decision
      const { finalScore, status } = aggregateScore(rulesTriggered, risk_score);
      //4) Persist
      const transaction = await Transaction.create({
        userId,
        amount,
        ip,
        billingCountry,
        cardToken,
        rulesTriggered,
        mlRiskScore: risk_score,
        isAnomaly: is_anomaly,
        finalScore,
        status,
      });

      //5) ALERT if needed
      if (status !== "APPROVED") {
        await Alert.create({
          transaction: transaction._id,
          reason: rulesTriggered.length
            ? `${rulesTriggered.join(",")} + ML score ${risk_score}`
            : `ML anomaly score ${risk_score}`,
          severity: status === "BLOCKED" ? "HIGH" : "MEDIUM",
        });
      }
      //6) Broadcast to all connected dashBoard
      io.emit("transaction_processed", transaction);
      if (status !== "APPROVED") {
        io.emit("fraud_alert", transaction);
      }
      return res.status(201).json({ success: true, transaction });
    } catch (err) {
      console.error("Transaction handling failed:", err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  };
}
