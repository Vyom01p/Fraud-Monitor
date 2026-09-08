import { Router } from "express";
import { createTransactionHandler } from "../controllers/transactionController.js";

export function transactionRoutes(io) {
  const router = Router();
  router.post("/", createTransactionHandler(io));
  return router;
}
