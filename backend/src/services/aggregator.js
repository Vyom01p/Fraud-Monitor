// this file combines the rule-engine flags and ML risk score from 0-100 and a final status
export function aggregateScore(rulesTriggered, mlRiskScore) {
  const ruleScore = Math.min(rulesTriggered.length * 20, 60);

  //ML score 0-1 contributes upto 40 points
  const mlScore = mlRiskScore * 40;

  const finalScore = Math.round(ruleScore + mlScore); //0-100
  let status = "APPROVED";
  if (finalScore >= 71) status = "BLOCKED";
  else if (finalScore >= 31) status = "REVIEW";
  return { finalScore, status };
}
