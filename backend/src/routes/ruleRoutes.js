import { Router } from "express";
import { env } from "../config/env.js";
import { validate } from "../middleware/validate.js";
import { requireKey } from "../middleware/requireKey.js";
import { ruleUpdateSchema } from "../validation/schemas.js";
import { getRules, updateRules } from "../controllers/ruleController.js";

export function ruleRoutes() {
  const router = Router();
  router.get("/", getRules);
  router.put(
    "/",
    requireKey("x-admin-key", env.ADMIN_API_KEY),
    validate(ruleUpdateSchema),
    updateRules,
  );
  return router;
}
