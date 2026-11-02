import { motion } from "motion/react";
import {
  Activity,
  CheckCircle2,
  DollarSign,
  Flag,
  ShieldBan,
  TriangleAlert,
} from "lucide-react";
import { useStats } from "../context/StatsContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import { useDrawer } from "../context/DrawerContext.jsx";
import { money, num, pct, timeAgo } from "../lib/format.js";
import {
  ActivityChart,
  DecisionDonut,
  RuleBars,
  ScoreHistogram,
} from "../components/charts.jsx";
import LiveFeed from "../components/LiveFeed.jsx";
import SystemStatus from "../components/SystemStatus.jsx";
import {
  AnimatedNumber,
  Card,
  EmptyState,
  PageHeader,
  Reveal,
  Segmented,
  Skeleton,
  StatusPill,
} from "../components/ui.jsx";

const RANGES = [
  { value: "30m", label: "30 min" },
  { value: "6h", label: "6 hours" },
  { value: "24h", label: "24 hours" },
];

function Kpi({ label, icon: Icon, value, format, sub, accent, delay }) {
  return (
    <Reveal delay={delay}>
      <motion.div
        whileHover={{ y: -3 }}
        transition={{ type: "spring", stiffness: 400, damping: 24 }}
        className="card relative overflow-hidden p-5"
      >
        <div
          className="absolute -right-6 -top-6 size-24 rounded-full opacity-20 blur-2xl"
          style={{ background: accent }}
        />
        <div className="flex items-center justify-between">
          <p className="text-sm text-mute">{label}</p>
          <div
            className="grid size-9 place-items-center rounded-xl bg-white/[0.05]"
            style={{ color: accent }}
          >
            <Icon className="size-[18px]" />
          </div>
        </div>
        <p className="mt-3 font-mono text-3xl font-semibold tabular-nums tracking-tight">
          <AnimatedNumber value={value} format={format} />
        </p>
        <p className="mt-1 text-xs text-mute">{sub}</p>
      </motion.div>
    </Reveal>
  );
}

function Quality({ stats }) {
  const reviewed = stats.confirmedFraud + stats.falsePositive;
  const precision = reviewed ? (stats.confirmedFraud / reviewed) * 100 : null;
  return (
    <Card className="p-5">
      <h2 className="text-sm font-semibold">Detection quality</h2>
      <p className="text-xs text-mute">
        From analyst decisions on flagged transactions
      </p>
      {precision === null ? (
        <p className="mt-4 rounded-xl bg-white/[0.03] p-3 text-xs text-mute">
          No decisions yet. Review flagged transactions to measure real
          precision.
        </p>
      ) : (
        <p className="mt-3 font-mono text-4xl font-semibold tabular-nums text-gradient">
          {precision.toFixed(0)}%
        </p>
      )}
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          ["Confirmed", stats.confirmedFraud, "text-bad"],
          ["False pos.", stats.falsePositive, "text-ok"],
          ["Pending", stats.pendingReview, "text-warn"],
        ].map(([l, v, c]) => (
          <div
            key={l}
            className="rounded-xl border border-line bg-white/[0.03] py-2.5"
          >
            <p className={`font-mono text-lg font-semibold tabular-nums ${c}`}>
              {num(v)}
            </p>
            <p className="text-[11px] text-mute">{l}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RecentAlerts() {
  const { alerts } = useSocket();
  const { open } = useDrawer();
  const list = alerts.filter((a) => !a.review?.decision).slice(0, 5);
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="text-sm font-semibold">Needs attention</h2>
        <a href="#/review" className="text-xs text-brand hover:underline">
          Open queue
        </a>
      </div>
      {list.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="All clear"
          hint="No flagged transactions waiting for review."
        />
      ) : (
        <ul className="divide-y divide-line">
          {list.map((tx) => (
            <li
              key={tx._id}
              onClick={() => open(tx)}
              className="flex cursor-pointer items-center gap-3 px-5 py-3 hover:bg-white/[0.035]"
            >
              <TriangleAlert
                className={`size-4 shrink-0 ${tx.status === "BLOCKED" ? "text-bad" : "text-warn"}`}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-sm">{tx.userId}</p>
                <p className="text-xs text-mute">
                  {money(tx.amount)} · {timeAgo(tx.createdAt)}
                </p>
              </div>
              <StatusPill status={tx.status} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function Overview() {
  const { stats, range, setRange, error } = useStats();

  return (
    <>
      <PageHeader
        title="Overview"
        subtitle="Live risk scoring across every transaction"
        actions={
          <Segmented
            id="range"
            options={RANGES}
            value={range}
            onChange={setRange}
          />
        }
      />

      {error && !stats && (
        <Card className="mb-4 border-bad/30 p-4 text-sm text-bad">
          Could not load stats: {error}. The server may be waking up, retrying
          automatically.
        </Card>
      )}

      {!stats ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi
              delay={0}
              label="Transactions"
              icon={Activity}
              value={stats.total}
              sub={`${num(stats.approved)} approved`}
              accent="#7c83ff"
            />
            <Kpi
              delay={0.05}
              label="Volume screened"
              icon={DollarSign}
              value={stats.volume}
              format={(n) => money(n)}
              sub={`Average risk score ${stats.avgScore.toFixed(1)}`}
              accent="#38d9f5"
            />
            <Kpi
              delay={0.1}
              label="Flag rate"
              icon={Flag}
              value={stats.flaggedRate}
              format={(n) => `${n.toFixed(1)}%`}
              sub={`${num(stats.review)} sent to review`}
              accent="#fbbf24"
            />
            <Kpi
              delay={0.15}
              label="Blocked"
              icon={ShieldBan}
              value={stats.blocked}
              sub={`${pct(stats.blockedRate)} of all traffic`}
              accent="#fb7185"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <ActivityChart stats={stats} className="xl:col-span-2" />
            <DecisionDonut stats={stats} />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <RuleBars stats={stats} />
            <ScoreHistogram stats={stats} />
            <Quality stats={stats} />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <LiveFeed />
            </div>
            <div className="space-y-4">
              <RecentAlerts />
              <SystemStatus />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
