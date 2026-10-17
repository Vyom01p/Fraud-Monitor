import { Router } from "express";
import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import { validate } from "../middleware/validate.js";
import { requireKey } from "../middleware/requireKey.js";
import { transactionSchema, demoSchema } from "../validation/schemas.js";
import { createTransactionHandler } from "../controllers/transactionController.js";
import { createDemoHandler } from "../controllers/demoController.js";
import { getStats, listTransactions } from "../controllers/statsController.js";

export function transactionRoutes(io) {
  const router = Router();

  const demoLimiter = rateLimit({
    windowMs: 60_000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many demo requests, slow down" },
  });

  router.get("/stats", getStats);
  router.post(
    "/demo",
    demoLimiter,
    validate(demoSchema),
    createDemoHandler(io),
  );
  router.get("/", listTransactions);
  router.post(
    "/",
    requireKey("x-api-key", env.INGEST_API_KEY),
    validate(transactionSchema),
    createTransactionHandler(io),
  );

  return router;
}
