import { Router } from "express";
import { createTransactionHandler } from "../controllers/transactionController.js";
import { getStats, listTransactions } from "../controllers/statsController.js";

export function transactionRoutes(io) {
  const router = Router();
  router.get("/stats", getStats);
  router.get("/", listTransactions);
  router.post("/", createTransactionHandler(io));
  return router;
}
