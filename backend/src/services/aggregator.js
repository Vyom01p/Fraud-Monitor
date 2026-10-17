const DEFAULTS = {
  reviewThreshold: 31,
  blockThreshold: 71,
  mlBlockThreshold: 0.95,
  hardBlockRules: ["BLOCKED_COUNTRY"],
};

const POINTS_PER_RULE = 20;
const MAX_RULE_POINTS = 60;
const ML_MAX_POINTS = 40;

export function aggregateScore(rulesTriggered, mlRiskScore, config = {}) {
  const reviewThreshold = config.reviewThreshold ?? DEFAULTS.reviewThreshold;
  const blockThreshold = config.blockThreshold ?? DEFAULTS.blockThreshold;
  const mlBlockThreshold = config.mlBlockThreshold ?? DEFAULTS.mlBlockThreshold;
  const hardBlockRules = config.hardBlockRules ?? DEFAULTS.hardBlockRules;

  const hardHit = rulesTriggered.find((rule) => hardBlockRules.includes(rule));
  if (hardHit) {
    return {
      finalScore: 100,
      status: "BLOCKED",
      decisionReason: `Hard-block rule: ${hardHit}`,
    };
  }

  const ruleScore = Math.min(
    rulesTriggered.length * POINTS_PER_RULE,
    MAX_RULE_POINTS,
  );
  const mlScore = mlRiskScore * ML_MAX_POINTS;
  const finalScore = Math.round(ruleScore + mlScore);

  if (mlRiskScore >= mlBlockThreshold) {
    return {
      finalScore: Math.max(finalScore, blockThreshold),
      status: "BLOCKED",
      decisionReason: "High-confidence ML score",
    };
  }

  let status = "APPROVED";
  if (finalScore >= blockThreshold) status = "BLOCKED";
  else if (finalScore >= reviewThreshold) status = "REVIEW";

  return { finalScore, status, decisionReason: "Score threshold" };
}
