import { useState } from "react";
import { motion } from "motion/react";
import { Brain, Globe, ShoppingCart, Zap } from "lucide-react";
import { api, errorMessage } from "../lib/api.js";
import { money, ruleLabel } from "../lib/format.js";
import { useDrawer } from "../context/DrawerContext.jsx";
import {
  Card,
  Chip,
  PageHeader,
  Reveal,
  StatusPill,
  cx,
} from "../components/ui.jsx";

const SCENARIOS = [
  {
    id: "normal",
    label: "Normal purchase",
    icon: ShoppingCart,
    tone: "text-ok bg-ok/10",
    help: "A real legitimate transaction from the held-out test set.",
  },
  {
    id: "ml_fraud",
    label: "Known fraud pattern",
    icon: Brain,
    tone: "text-bad bg-bad/10",
    help: "A real held-out fraud transaction the model flags with high confidence.",
  },
  {
    id: "blocked_country",
    label: "Blocked country",
    icon: Globe,
    tone: "text-warn bg-warn/10",
    help: "Billing country is on the blocklist, which triggers a hard block.",
  },
  {
    id: "card_testing",
    label: "Card-testing burst",
    icon: Zap,
    tone: "text-brand bg-brand/10",
    help: "Five tiny charges in a row from one user.",
  },
];

export default function TryIt() {
  const { open } = useDrawer();
  const [busy, setBusy] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  async function run(id) {
    setBusy(id);
    setError("");
    try {
      const { data } = await api.post("/transactions/demo", { scenario: id });
      setResults(data.transactions);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Try it"
        subtitle="Send a test transaction through the live pipeline. Open Overview in another tab to watch it arrive."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {SCENARIOS.map((s, i) => (
          <Reveal key={s.id} delay={i * 0.05}>
            <motion.button
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => run(s.id)}
              disabled={busy !== null}
              className="card flex w-full items-start gap-4 p-5 text-left transition hover:border-brand/40 disabled:cursor-wait disabled:opacity-70"
            >
              <div
                className={cx(
                  "grid size-11 shrink-0 place-items-center rounded-xl",
                  s.tone,
                )}
              >
                <s.icon className="size-5" />
              </div>
              <div>
                <p className="font-medium">
                  {busy === s.id ? "Running…" : s.label}
                </p>
                <p className="mt-1 text-sm text-mute">{s.help}</p>
              </div>
            </motion.button>
          </Reveal>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-bad">{error}</p>}

      {results.length > 0 && (
        <Card className="mt-6 overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-sm font-semibold">Result</h2>
          </div>
          <ul className="divide-y divide-line">
            {results.map((tx, i) => (
              <motion.li
                key={tx._id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => open(tx)}
                className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 hover:bg-white/[0.035]"
              >
                <StatusPill status={tx.status} />
                <span className="font-mono text-sm">score {tx.finalScore}</span>
                <span className="font-mono text-sm tabular-nums">
                  {money(tx.amount)}
                </span>
                <span className="flex flex-wrap gap-1">
                  {tx.rulesTriggered.length ? (
                    tx.rulesTriggered.map((r) => (
                      <Chip key={r}>{ruleLabel(r)}</Chip>
                    ))
                  ) : (
                    <Chip>no rules</Chip>
                  )}
                </span>
                <span className="ml-auto text-xs text-mute">
                  ML {(tx.mlRiskScore * 100).toFixed(1)}%
                </span>
              </motion.li>
            ))}
          </ul>
          <p className="border-t border-line px-5 py-3 text-xs text-mute">
            Click a row for the full breakdown.
          </p>
        </Card>
      )}
    </>
  );
}
