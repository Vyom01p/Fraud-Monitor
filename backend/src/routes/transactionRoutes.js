import { Router } from "express";
import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import { validate, validateQuery } from "../middleware/validate.js";
import { requireKey } from "../middleware/requireKey.js";
import {
  transactionSchema,
  demoSchema,
  reviewSchema,
  listQuerySchema,
  statsQuerySchema,
} from "../validation/schemas.js";
import { createTransactionHandler } from "../controllers/transactionController.js";
import { createDemoHandler } from "../controllers/demoController.js";
import { createReviewHandler } from "../controllers/reviewController.js";
import {
  getStats,
  listTransactions,
  exportTransactions,
} from "../controllers/statsController.js";

export function transactionRoutes(io) {
  const router = Router();
  const adminOnly = requireKey("x-admin-key", env.ADMIN_API_KEY);

  const demoLimiter = rateLimit({
    windowMs: 60_000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many demo requests, slow down" },
  });

  router.get("/stats", validateQuery(statsQuerySchema), getStats);
  router.get(
    "/export",
    adminOnly,
    validateQuery(listQuerySchema),
    exportTransactions,
  );
  router.post(
    "/demo",
    demoLimiter,
    validate(demoSchema),
    createDemoHandler(io),
  );
  router.get("/", validateQuery(listQuerySchema), listTransactions);
  router.post(
    "/",
    requireKey("x-api-key", env.INGEST_API_KEY),
    validate(transactionSchema),
    createTransactionHandler(io),
  );
  router.patch(
    "/:id/review",
    adminOnly,
    validate(reviewSchema),
    createReviewHandler(io),
  );

  return router;
}
