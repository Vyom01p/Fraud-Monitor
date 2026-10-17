import RuleConfig from "../models/RuleConfig.js";

export async function getRuleConfig() {
  const existing = await RuleConfig.findOne();
  if (existing) return existing;
  return RuleConfig.create({});
}
