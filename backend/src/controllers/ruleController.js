import { getRuleConfig } from "../services/ruleConfigService.js";

export async function getRules(req, res, next) {
  try {
    const rules = await getRuleConfig();
    res.json({ rules });
  } catch (err) {
    next(err);
  }
}

export async function updateRules(req, res, next) {
  try {
    const rules = await getRuleConfig();
    const { _id, __v, createdAt, updatedAt, ...safeUpdates } = req.body ?? {};
    rules.set(safeUpdates);
    await rules.save();
    res.json({ rules });
  } catch (err) {
    next(err);
  }
}
