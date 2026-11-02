import Transaction from "../models/Transaction.js";

const RANGES = {
  "30m": { ms: 30 * 60 * 1000, unit: "minute", binSize: 1 },
  "6h": { ms: 6 * 60 * 60 * 1000, unit: "minute", binSize: 10 },
  "24h": { ms: 24 * 60 * 60 * 1000, unit: "hour", binSize: 1 },
};

const count = (cond) => ({ $sum: { $cond: [cond, 1, 0] } });

export async function getStats(req, res) {
  const { range } = res.locals.query;
  const { ms, unit, binSize } = RANGES[range];
  const since = new Date(Date.now() - ms);

  const flagged = { $ne: ["$status", "APPROVED"] };
  const unreviewed = { $eq: [{ $type: "$review.decision" }, "missing"] };

  const [[totals], series, ruleCounts, scoreBuckets] = await Promise.all([
    Transaction.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          volume: { $sum: "$amount" },
          avgScore: { $avg: "$finalScore" },
          approved: count({ $eq: ["$status", "APPROVED"] }),
          review: count({ $eq: ["$status", "REVIEW"] }),
          blocked: count({ $eq: ["$status", "BLOCKED"] }),
          confirmedFraud: count({
            $eq: ["$review.decision", "CONFIRMED_FRAUD"],
          }),
          falsePositive: count({ $eq: ["$review.decision", "FALSE_POSITIVE"] }),
          pendingReview: count({ $and: [flagged, unreviewed] }),
        },
      },
    ]),
    Transaction.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateTrunc: { date: "$createdAt", unit, binSize } },
          total: { $sum: 1 },
          flagged: count(flagged),
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Transaction.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $unwind: "$rulesTriggered" },
      { $group: { _id: "$rulesTriggered", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Transaction.aggregate([
      {
        $match: { createdAt: { $gte: since }, finalScore: { $type: "number" } },
      },
      {
        $bucket: {
          groupBy: "$finalScore",
          boundaries: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 101],
          default: "other",
          output: { count: { $sum: 1 } },
        },
      },
    ]),
  ]);

  const t = totals || {};
  const total = t.total ?? 0;

  res.json({
    range,
    total,
    volume: t.volume ?? 0,
    avgScore: t.avgScore ?? 0,
    approved: t.approved ?? 0,
    review: t.review ?? 0,
    blocked: t.blocked ?? 0,
    blockedRate: total ? ((t.blocked ?? 0) / total) * 100 : 0,
    flaggedRate: total
      ? (((t.review ?? 0) + (t.blocked ?? 0)) / total) * 100
      : 0,
    confirmedFraud: t.confirmedFraud ?? 0,
    falsePositive: t.falsePositive ?? 0,
    pendingReview: t.pendingReview ?? 0,
    series: series.map((p) => ({
      time: p._id,
      total: p.total,
      flagged: p.flagged,
    })),
    ruleCounts: ruleCounts.map((r) => ({ rule: r._id, count: r.count })),
    scoreBuckets: scoreBuckets
      .filter((b) => typeof b._id === "number")
      .map((b) => ({ from: b._id, count: b.count })),
  });
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function buildFilter(q) {
  const filter = {};
  if (q.status) filter.status = q.status;
  if (q.q) filter.userId = { $regex: `^${escapeRegex(q.q)}`, $options: "i" };
  if (q.review === "pending") {
    filter["review.decision"] = { $exists: false };
    if (!q.status) filter.status = { $in: ["REVIEW", "BLOCKED"] };
  }
  if (q.review === "reviewed") filter["review.decision"] = { $exists: true };
  return filter;
}

export async function listTransactions(req, res) {
  const q = res.locals.query;
  const filter = buildFilter(q);

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip((q.page - 1) * q.limit)
      .limit(q.limit),
    Transaction.countDocuments(filter),
  ]);

  res.json({
    transactions,
    total,
    page: q.page,
    pages: Math.max(1, Math.ceil(total / q.limit)),
  });
}

const CSV_HEADERS = [
  "createdAt",
  "userId",
  "amount",
  "billingCountry",
  "ip",
  "status",
  "finalScore",
  "mlRiskScore",
  "rulesTriggered",
  "decisionReason",
  "review",
];

function csvCell(value) {
  if (value === undefined || value === null) return "";
  let s = Array.isArray(value) ? value.join("|") : String(value);
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function exportTransactions(req, res) {
  const rows = await Transaction.find(buildFilter(res.locals.query))
    .sort({ createdAt: -1 })
    .limit(5000)
    .lean();

  const lines = [CSV_HEADERS.join(",")];
  for (const t of rows) {
    lines.push(
      [
        t.createdAt?.toISOString(),
        t.userId,
        t.amount,
        t.billingCountry,
        t.ip,
        t.status,
        t.finalScore,
        t.mlRiskScore,
        t.rulesTriggered,
        t.decisionReason,
        t.review?.decision,
      ]
        .map(csvCell)
        .join(","),
    );
  }

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="transactions.csv"',
  );
  res.send(lines.join("\n"));
}
