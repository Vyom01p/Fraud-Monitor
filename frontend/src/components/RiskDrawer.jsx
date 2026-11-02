import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy, Lock, ShieldCheck, ShieldX, X } from "lucide-react";
import { api, errorMessage } from "../lib/api.js";
import {
  REVIEW_LABEL,
  RULE_HELP,
  STATUS,
  money,
  ruleLabel,
} from "../lib/format.js";
import { useAdmin } from "../context/AdminContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { Button, Chip, StatusPill } from "./ui.jsx";

function Gauge({ score, status }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const hex = STATUS[status]?.hex ?? "#7c83ff";
  return (
    <div className="relative size-36">
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="9"
        />
        <motion.circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={hex}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - Math.min(score, 100) / 100) }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 7px ${hex}99)` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="font-mono text-4xl font-semibold tabular-nums">
            {score}
          </div>
          <div className="text-[11px] uppercase tracking-wider text-mute">
            risk score
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="border-t border-line px-5 py-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-mute">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className="text-mute">{label}</span>
      <span className={mono ? "truncate font-mono text-xs" : "truncate"}>
        {value || "—"}
      </span>
    </div>
  );
}

export default function RiskDrawer({ tx, onClose, onChange }) {
  const admin = useAdmin();
  const toast = useToast();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => setNote(""), [tx?._id]);

  useEffect(() => {
    if (!tx) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tx, onClose]);

  async function decide(decision) {
    if (!admin.unlocked) return admin.setOpen(true);
    setBusy(decision);
    try {
      const { data } = await api.patch(
        `/transactions/${tx._id}/review`,
        { decision, note: note || undefined },
        { headers: admin.headers },
      );
      onChange(data.transaction);
      toast({
        title: "Review saved",
        description: REVIEW_LABEL[decision],
        tone: "ok",
      });
    } catch (err) {
      toast({
        title:
          err.response?.status === 401
            ? "Wrong admin key"
            : "Could not save review",
        description: errorMessage(err),
        tone: "bad",
      });
    } finally {
      setBusy(null);
    }
  }

  function copyId() {
    navigator.clipboard?.writeText(tx._id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const rules = tx?.rulesTriggered ?? [];
  const ruleScore = Math.min(rules.length * 20, 60);
  const mlScore = (tx?.mlRiskScore ?? 0) * 40;
  const reviewed = tx?.review?.decision;

  return (
    <AnimatePresence>
      {tx && (
        <motion.div
          key="scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        />
      )}
      {tx && (
        <motion.aside
          key="panel"
          role="dialog"
          aria-label="Transaction details"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 380, damping: 40 }}
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col overflow-y-auto border-l border-line bg-surface shadow-2xl"
        >
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <h2 className="text-base font-semibold">Transaction details</h2>
              <button
                onClick={copyId}
                className="mt-0.5 flex items-center gap-1.5 font-mono text-[11px] text-mute hover:text-ink"
              >
                {tx._id.slice(-10)}
                {copied ? (
                  <Check className="size-3 text-ok" />
                ) : (
                  <Copy className="size-3" />
                )}
              </button>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-2 text-mute hover:bg-white/5 hover:text-ink"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="flex flex-col items-center gap-3 px-5 pb-5">
            <Gauge key={tx._id} score={tx.finalScore} status={tx.status} />
            <StatusPill status={tx.status} />
            {tx.decisionReason && (
              <p className="text-center text-xs text-mute">
                {tx.decisionReason}
              </p>
            )}
          </div>

          <Section title="Score composition">
            <div className="flex h-2.5 overflow-hidden rounded-full bg-white/[0.07]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${ruleScore}%` }}
                transition={{ duration: 0.7 }}
                className="bg-brand"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${mlScore}%` }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="bg-cyan"
              />
            </div>
            <div className="mt-3 flex justify-between text-xs">
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-brand" />
                Rules {ruleScore.toFixed(0)} / 60
              </span>
              <span className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-cyan" />
                ML {mlScore.toFixed(1)} / 40
              </span>
            </div>
          </Section>

          <Section title="Rules triggered">
            {rules.length === 0 ? (
              <p className="text-sm text-mute">No rules fired.</p>
            ) : (
              <ul className="space-y-2.5">
                {rules.map((r) => (
                  <li key={r}>
                    <p className="text-sm font-medium">{ruleLabel(r)}</p>
                    <p className="text-xs text-mute">
                      {RULE_HELP[r] ?? "Custom rule"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="ML model">
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-mute">Fraud probability</span>
              <span className="font-mono">
                {((tx.mlRiskScore ?? 0) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.07]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(tx.mlRiskScore ?? 0) * 100}%` }}
                transition={{ duration: 0.7 }}
                className="h-full rounded-full bg-cyan"
              />
            </div>
            {tx.mlAvailable === false && (
              <p className="mt-3 rounded-lg bg-warn/10 p-2.5 text-xs text-warn">
                The ML service was unreachable, so a neutral fallback score was
                used.
              </p>
            )}
          </Section>

          <Section title="Details">
            <Row label="User" value={tx.userId} mono />
            <Row label="Amount" value={money(tx.amount)} />
            <Row label="Country" value={tx.billingCountry} />
            <Row label="IP address" value={tx.ip} mono />
            <Row label="Card token" value={tx.cardToken} mono />
            <Row label="Source" value={tx.source} />
            <Row label="Time" value={new Date(tx.createdAt).toLocaleString()} />
          </Section>

          <Section title="Analyst review">
            {reviewed ? (
              <div className="rounded-xl border border-line bg-white/[0.03] p-3">
                <p
                  className={`text-sm font-medium ${reviewed === "CONFIRMED_FRAUD" ? "text-bad" : "text-ok"}`}
                >
                  {REVIEW_LABEL[reviewed]}
                </p>
                {tx.review.note && (
                  <p className="mt-1 text-xs text-mute">{tx.review.note}</p>
                )}
                <Chip className="mt-2">
                  {new Date(tx.review.reviewedAt).toLocaleString()}
                </Chip>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={500}
                  placeholder="Optional note"
                  rows={2}
                  className="w-full resize-none rounded-xl border border-line bg-white/[0.03] p-3 text-sm outline-none placeholder:text-mute focus:border-brand/60"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="danger"
                    icon={ShieldX}
                    loading={busy === "CONFIRMED_FRAUD"}
                    onClick={() => decide("CONFIRMED_FRAUD")}
                  >
                    Confirm fraud
                  </Button>
                  <Button
                    variant="success"
                    icon={ShieldCheck}
                    loading={busy === "FALSE_POSITIVE"}
                    onClick={() => decide("FALSE_POSITIVE")}
                  >
                    False positive
                  </Button>
                </div>
                {!admin.unlocked && (
                  <p className="flex items-center gap-1.5 text-xs text-mute">
                    <Lock className="size-3" /> Unlock admin access to save a
                    decision.
                  </p>
                )}
              </div>
            )}
          </Section>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
