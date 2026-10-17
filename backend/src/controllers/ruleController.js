import { getRuleConfig } from "../services/ruleConfigService.js";

export async function getRules(req, res) {
  const rules = await getRuleConfig();
  res.json({ rules });
}

export async function updateRules(req, res) {
  const rules = await getRuleConfig();
  rules.set(req.body);
  await rules.save();
  res.json({ rules });
}
