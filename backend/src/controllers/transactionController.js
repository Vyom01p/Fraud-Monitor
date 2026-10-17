import { processTransaction } from "../services/pipeline.js";

export function createTransactionHandler(io) {
  return async function handleTransaction(req, res) {
    const transaction = await processTransaction(req.body, io, "api");
    res.status(201).json({ success: true, transaction });
  };
}
