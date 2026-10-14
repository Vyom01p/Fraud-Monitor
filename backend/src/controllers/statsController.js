import Transaction from "../models/Transaction.js";

export async function getStats(req, res) {
  try {
    const [totals] = await Transaction.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          volume: { $sum: "$amount" },
          approved: {
            $sum: { $cond: [{ $eq: ["$status", "APPROVED"] }, 1, 0] },
          },
          review: { $sum: { $cond: [{ $eq: ["$status", "REVIEW"] }, 1, 0] } },
          blocked: { $sum: { $cond: [{ $eq: ["$status", "BLOCKED"] }, 1, 0] } },
        },
      },
    ]);

    const since = new Date(Date.now() - 30 * 60 * 1000);
    const series = await Transaction.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateTrunc: { date: "$createdAt", unit: "minute" } },
          total: { $sum: 1 },
          flagged: {
            $sum: { $cond: [{ $ne: ["$status", "APPROVED"] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const t = totals || {
      total: 0,
      volume: 0,
      approved: 0,
      review: 0,
      blocked: 0,
    };

    res.json({
      total: t.total,
      volume: t.volume,
      approved: t.approved,
      review: t.review,
      blocked: t.blocked,
      blockedRate: t.total ? (t.blocked / t.total) * 100 : 0,
      flaggedRate: t.total ? ((t.review + t.blocked) / t.total) * 100 : 0,
      series: series.map((p) => ({
        time: p._id,
        total: p.total,
        flagged: p.flagged,
      })),
    });
  } catch (err) {
    console.error("Stats failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

export async function listTransactions(req, res) {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const transactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json({ transactions });
  } catch (err) {
    console.error("List transactions failed:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
