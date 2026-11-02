const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const usd0 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const int = new Intl.NumberFormat("en-US");

const safeNum = (n) => {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
};

export const money = (n) => {
  const v = safeNum(n);
  return (v >= 10000 ? usd0 : usd).format(v);
};

export const num = (n) => int.format(safeNum(n));

export const pct = (n, d = 1) => `${safeNum(n).toFixed(d)}%`;

export function timeAgo(date) {
  const ts = new Date(date).getTime();
  if (Number.isNaN(ts)) return "just now";
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function fmtUptime(sec) {
  const s = safeNum(sec);
  if (s < 60) return `${Math.floor(s)}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400)
    return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  return `${Math.floor(s / 86400)}d`;
}

export const RULE_LABELS = {
  VELOCITY_SPIKE: "Velocity spike",
  AMOUNT_ANOMALY: "Amount anomaly",
  BLOCKED_COUNTRY: "Blocked country",
  CARD_TESTING_PATTERN: "Card testing",
};

export const RULE_HELP = {
  VELOCITY_SPIKE: "Too many transactions from this user in a short window",
  AMOUNT_ANOMALY: "Amount is far above this user's 30-day average",
  BLOCKED_COUNTRY: "Billing country is on the blocklist",
  CARD_TESTING_PATTERN:
    "Several tiny charges in a row, typical of card testing",
};

export const ruleLabel = (r) => RULE_LABELS[r] ?? r ?? "Unknown rule";

export const STATUS = {
  APPROVED: {
    label: "Approved",
    text: "text-ok",
    bg: "bg-ok/10",
    ring: "ring-ok/25",
    dot: "bg-ok",
    hex: "#34d399",
  },
  REVIEW: {
    label: "Review",
    text: "text-warn",
    bg: "bg-warn/10",
    ring: "ring-warn/25",
    dot: "bg-warn",
    hex: "#fbbf24",
  },
  BLOCKED: {
    label: "Blocked",
    text: "text-bad",
    bg: "bg-bad/10",
    ring: "ring-bad/25",
    dot: "bg-bad",
    hex: "#fb7185",
  },
};

export const REVIEW_LABEL = {
  CONFIRMED_FRAUD: "Confirmed fraud",
  FALSE_POSITIVE: "False positive",
};
