import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, ShieldQuestion } from "lucide-react";
import { STATUS, num, ruleLabel } from "../lib/format.js";
import { Card, EmptyState } from "./ui.jsx";

const AXIS = {
  stroke: "#5b617a",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

function Tip({ active, payload, label, unit = "" }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 text-xs shadow-xl">
      {label !== undefined && <p className="mb-1 text-mute">{label}</p>}
      {payload.map((p) => (
        <p key={p.dataKey ?? p.name} className="flex items-center gap-2">
          <span
            className="size-2 rounded-full"
            style={{ background: p.color ?? p.payload?.fill }}
          />
          <span className="text-mute">{p.name}</span>
          <span className="ml-auto font-mono">
            {num(p.value)}
            {unit}
          </span>
        </p>
      ))}
    </div>
  );
}

const fmtTime = (iso, range) =>
  new Date(iso).toLocaleTimeString(
    [],
    range === "24h"
      ? { hour: "numeric" }
      : { hour: "2-digit", minute: "2-digit" },
  );

export function ActivityChart({ stats, className = "" }) {
  const data = stats.series.map((p) => ({
    time: fmtTime(p.time, stats.range),
    All: p.total,
    Flagged: p.flagged,
  }));
  return (
    <Card className={`p-5 ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Transaction activity</h2>
        <div className="flex gap-4 text-xs text-mute">
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-brand" />
            All
          </span>
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-warn" />
            Flagged
          </span>
        </div>
      </div>
      {data.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activity in this range"
          hint="Start the simulator to see traffic."
        />
      ) : (
        <div className="h-64">
          <ResponsiveContainer>
            <AreaChart data={data} margin={{ left: -18, right: 4, top: 4 }}>
              <defs>
                <linearGradient id="gAll" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c83ff" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#7c83ff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gFlag" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="time" {...AXIS} minTickGap={28} />
              <YAxis {...AXIS} allowDecimals={false} />
              <Tooltip
                content={<Tip />}
                cursor={{ stroke: "rgba(255,255,255,0.12)" }}
              />
              <Area
                type="monotone"
                dataKey="All"
                stroke="#7c83ff"
                strokeWidth={2}
                fill="url(#gAll)"
              />
              <Area
                type="monotone"
                dataKey="Flagged"
                stroke="#fbbf24"
                strokeWidth={2}
                fill="url(#gFlag)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

export function DecisionDonut({ stats }) {
  const data = ["APPROVED", "REVIEW", "BLOCKED"].map((k) => ({
    name: STATUS[k].label,
    value: stats[k.toLowerCase()],
    fill: STATUS[k].hex,
  }));
  const empty = data.every((d) => d.value === 0);
  return (
    <Card className="p-5">
      <h2 className="mb-2 text-sm font-semibold">Decisions</h2>
      {empty ? (
        <EmptyState icon={ShieldQuestion} title="No decisions yet" />
      ) : (
        <>
          <div className="relative h-48">
            <ResponsiveContainer>
              <PieChart>
                <Tooltip content={<Tip />} />
                <Pie
                  data={data}
                  dataKey="value"
                  innerRadius="68%"
                  outerRadius="92%"
                  paddingAngle={3}
                  stroke="none"
                  cornerRadius={6}
                >
                  {data.map((d) => (
                    <Cell key={d.name} fill={d.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="font-mono text-2xl font-semibold tabular-nums">
                  {num(stats.total)}
                </p>
                <p className="text-[11px] uppercase tracking-wider text-mute">
                  total
                </p>
              </div>
            </div>
          </div>
          <div className="mt-2 space-y-2">
            {data.map((d) => (
              <div
                key={d.name}
                className="flex items-center justify-between text-xs"
              >
                <span className="flex items-center gap-2 text-mute">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: d.fill }}
                  />
                  {d.name}
                </span>
                <span className="font-mono">{num(d.value)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

export function RuleBars({ stats }) {
  const data = stats.ruleCounts.map((r) => ({
    name: ruleLabel(r.rule),
    Triggers: r.count,
  }));
  return (
    <Card className="p-5">
      <h2 className="mb-3 text-sm font-semibold">Rule triggers</h2>
      {data.length === 0 ? (
        <EmptyState
          icon={ShieldQuestion}
          title="No rules fired in this range"
        />
      ) : (
        <div className="h-52">
          <ResponsiveContainer>
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 8, right: 8 }}
            >
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={110} {...AXIS} />
              <Tooltip
                content={<Tip />}
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
              />
              <Bar
                dataKey="Triggers"
                fill="#7c83ff"
                radius={[0, 6, 6, 0]}
                barSize={14}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

const bucketColor = (from) =>
  from >= 70 ? "#fb7185" : from >= 30 ? "#fbbf24" : "#34d399";

export function ScoreHistogram({ stats }) {
  const map = new Map(stats.scoreBuckets.map((b) => [b.from, b.count]));
  const data = Array.from({ length: 10 }, (_, i) => ({
    range: `${i * 10}`,
    Count: map.get(i * 10) ?? 0,
    from: i * 10,
  }));
  return (
    <Card className="p-5">
      <h2 className="mb-3 text-sm font-semibold">Risk score distribution</h2>
      <div className="h-52">
        <ResponsiveContainer>
          <BarChart data={data} margin={{ left: -22, right: 4 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="range" {...AXIS} />
            <YAxis {...AXIS} allowDecimals={false} />
            <Tooltip
              content={<Tip />}
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
            />
            <Bar dataKey="Count" radius={[5, 5, 0, 0]}>
              {data.map((d) => (
                <Cell key={d.from} fill={bucketColor(d.from)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
