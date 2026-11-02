import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import Alert from "../models/Alert.js";

export function createReviewHandler(io) {
  return async function reviewTransaction(req, res) {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid transaction id" });
    }

    const { decision, note } = req.body;
    const review = {
      decision,
      reviewedAt: new Date(),
      ...(note ? { note } : {}),
    };

    const transaction = await Transaction.findByIdAndUpdate(
      id,
      { $set: { review } },
      { new: true },
    );
    if (!transaction)
      return res.status(404).json({ error: "Transaction not found" });

    await Alert.updateMany(
      { transaction: transaction._id },
      { $set: { resolved: true } },
    );

    io.emit("transaction_updated", transaction);
    res.json({ transaction });
  };
}
