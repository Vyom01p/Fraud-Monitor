import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CreditCard, Gauge, Globe, TrendingUp } from "lucide-react";
import { api, errorMessage } from "../lib/api.js";
import { RULE_HELP, ruleLabel } from "../lib/format.js";
import { useAdmin } from "../context/AdminContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import {
  Button,
  Card,
  PageHeader,
  Skeleton,
  Switch,
} from "../components/ui.jsx";

const RULES = [
  {
    key: "velocity",
    name: "VELOCITY_SPIKE",
    icon: Gauge,
    params: [
      {
        field: "velocityMaxTxPerWindow",
        label: "Max transactions",
        unit: "tx",
      },
      { field: "velocityWindowSeconds", label: "Window", unit: "sec" },
    ],
  },
  {
    key: "amountAnomaly",
    name: "AMOUNT_ANOMALY",
    icon: TrendingUp,
    params: [
      {
        field: "amountAnomalyMultiplier",
        label: "Multiple of 30-day average",
        unit: "×",
        step: 0.5,
      },
    ],
  },
  { key: "geoFence", name: "BLOCKED_COUNTRY", icon: Globe, countries: true },
  {
    key: "cardTesting",
    name: "CARD_TESTING_PATTERN",
    icon: CreditCard,
    params: [
      {
        field: "cardTestingSmallAmountMax",
        label: "Small charge up to",
        unit: "$",
        step: 0.5,
      },
      {
        field: "cardTestingCountThreshold",
        label: "Charges to trigger",
        unit: "tx",
      },
    ],
  },
];

const toForm = (r) => ({
  velocityMaxTxPerWindow: r.velocityMaxTxPerWindow,
  velocityWindowSeconds: r.velocityWindowSeconds,
  amountAnomalyMultiplier: r.amountAnomalyMultiplier,
  cardTestingSmallAmountMax: r.cardTestingSmallAmountMax,
  cardTestingCountThreshold: r.cardTestingCountThreshold,
  reviewThreshold: r.reviewThreshold,
  blockThreshold: r.blockThreshold,
  mlBlockThreshold: r.mlBlockThreshold,
  blockedCountries: (r.blockedCountries ?? []).join(", "),
  hardBlockRules: r.hardBlockRules ?? [],
  enabled: { ...r.enabled },
});

const toPayload = (f) => ({
  ...f,
  blockedCountries: f.blockedCountries
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean),
});

function NumField({ label, unit, value, onChange, step = 1 }) {
  return (
    <label className="block">
      <span className="text-xs text-mute">{label}</span>
      <div className="mt-1 flex items-center rounded-xl border border-line bg-white/[0.03] focus-within:border-brand/60">
        <input
          type="number"
          step={step}
          value={value}
          onChange={(e) =>
            onChange(e.target.value === "" ? "" : Number(e.target.value))
          }
          className="w-full bg-transparent px-3 py-2 font-mono text-sm outline-none"
        />
        <span className="pr-3 text-xs text-mute">{unit}</span>
      </div>
    </label>
  );
}

export default function Rules() {
  const admin = useAdmin();
  const toast = useToast();
  const [initial, setInitial] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    api
      .get("/rules")
      .then(({ data }) => {
        const f = toForm(data.rules);
        setInitial(f);
        setForm(f);
      })
      .catch((err) => setLoadError(errorMessage(err)));
  }, []);

  const dirty = useMemo(
    () => form && JSON.stringify(form) !== JSON.stringify(initial),
    [form, initial],
  );

  if (loadError)
    return (
      <Card className="p-5 text-sm text-bad">
        Could not load rules: {loadError}
      </Card>
    );
  if (!form)
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const toggleEnabled = (key) =>
    setForm((f) => ({
      ...f,
      enabled: { ...f.enabled, [key]: !f.enabled[key] },
    }));
  const toggleHard = (name) =>
    setForm((f) => ({
      ...f,
      hardBlockRules: f.hardBlockRules.includes(name)
        ? f.hardBlockRules.filter((n) => n !== name)
        : [...f.hardBlockRules, name],
    }));

  async function save() {
    if (!admin.unlocked) return admin.setOpen(true);
    setSaving(true);
    try {
      const { data } = await api.put("/rules", toPayload(form), {
        headers: admin.headers,
      });
      const f = toForm(data.rules);
      setInitial(f);
      setForm(f);
      toast({
        title: "Rules saved",
        description: "Applied to the next transaction.",
        tone: "ok",
      });
    } catch (err) {
      toast({
        title:
          err.response?.status === 401
            ? "Wrong admin key"
            : "Could not save rules",
        description: errorMessage(err),
        tone: "bad",
      });
    } finally {
      setSaving(false);
    }
  }

  const review = Math.min(Math.max(Number(form.reviewThreshold) || 0, 0), 100);
  const block = Math.min(
    Math.max(Number(form.blockThreshold) || 0, review),
    100,
  );

  return (
    <>
      <PageHeader
        title="Rules"
        subtitle="Tune detection live. Changes apply to the next transaction, no redeploy needed."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {RULES.map((r) => (
          <Card key={r.key} className="p-5">
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand">
                <r.icon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{ruleLabel(r.name)}</p>
                <p className="text-xs text-mute">{RULE_HELP[r.name]}</p>
              </div>
              <Switch
                checked={form.enabled[r.key]}
                onChange={() => toggleEnabled(r.key)}
                label={`Enable ${ruleLabel(r.name)}`}
              />
            </div>

            <div
              className={`mt-4 grid gap-3 transition-opacity ${form.enabled[r.key] ? "" : "pointer-events-none opacity-40"} ${r.params?.length > 1 ? "grid-cols-2" : ""}`}
            >
              {r.params?.map((p) => (
                <NumField
                  key={p.field}
                  {...p}
                  value={form[p.field]}
                  onChange={(v) => set(p.field, v)}
                />
              ))}
              {r.countries && (
                <label className="block">
                  <span className="text-xs text-mute">
                    ISO country codes, comma separated
                  </span>
                  <input
                    value={form.blockedCountries}
                    onChange={(e) => set("blockedCountries", e.target.value)}
                    placeholder="KP, IR"
                    className="mt-1 w-full rounded-xl border border-line bg-white/[0.03] px-3 py-2 font-mono text-sm uppercase outline-none focus:border-brand/60"
                  />
                </label>
              )}
            </div>

            <label className="mt-4 flex items-center justify-between border-t border-line pt-4 text-sm">
              <span>
                Hard block
                <span className="block text-xs text-mute">
                  Block immediately when this rule fires
                </span>
              </span>
              <Switch
                checked={form.hardBlockRules.includes(r.name)}
                onChange={() => toggleHard(r.name)}
                label={`Hard block ${ruleLabel(r.name)}`}
              />
            </label>
          </Card>
        ))}
      </div>

      <Card className="mt-4 p-5">
        <h2 className="text-sm font-semibold">Decision thresholds</h2>
        <p className="text-xs text-mute">
          Rules add up to 60 points and the ML model up to 40.
        </p>

        <div className="mt-5 flex h-3 overflow-hidden rounded-full">
          <motion.div animate={{ width: `${review}%` }} className="bg-ok/70" />
          <motion.div
            animate={{ width: `${block - review}%` }}
            className="bg-warn/70"
          />
          <div className="flex-1 bg-bad/70" />
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-mute">
          <span>0 · Approve</span>
          <span>{review} · Review</span>
          <span>{block} · Block</span>
          <span>100</span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <NumField
            label="Review at score ≥"
            unit="pts"
            value={form.reviewThreshold}
            onChange={(v) => set("reviewThreshold", v)}
          />
          <NumField
            label="Block at score ≥"
            unit="pts"
            value={form.blockThreshold}
            onChange={(v) => set("blockThreshold", v)}
          />
          <div>
            <span className="text-xs text-mute">
              Auto-block when ML probability ≥
            </span>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="range"
                min="0.5"
                max="1"
                step="0.01"
                value={form.mlBlockThreshold}
                onChange={(e) =>
                  set("mlBlockThreshold", Number(e.target.value))
                }
                className="h-1.5 flex-1 cursor-pointer accent-brand"
                aria-label="ML auto-block threshold"
              />
              <span className="w-12 text-right font-mono text-sm">
                {Math.round(form.mlBlockThreshold * 100)}%
              </span>
            </div>
          </div>
        </div>
      </Card>

      <AnimatePresence>
        {dirty && (
          <div className="pointer-events-none fixed bottom-24 left-0 right-0 z-30 flex justify-center px-4 lg:bottom-6 lg:left-64">
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              className="card pointer-events-auto flex items-center gap-4 px-5 py-3 shadow-2xl"
            >
              <span className="text-sm">You have unsaved changes</span>
              <Button onClick={() => setForm(initial)}>Discard</Button>
              <Button variant="primary" loading={saving} onClick={save}>
                Save rules
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
