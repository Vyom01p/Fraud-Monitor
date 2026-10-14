import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";

export default function FraudChart({ stats }) {
  if (!stats) return null;

  const data = stats.series.map((p) => ({
    time: new Date(p.time).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    total: p.total,
    flagged: p.flagged,
  }));

  return (
    <div style={{ padding: "1rem", fontFamily: "sans-serif" }}>
      <h2>Transactions per Minute (last 30 min)</h2>
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="time" stroke="#888" />
            <YAxis stroke="#888" allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: "#111", border: "1px solid #333" }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="total"
              name="All"
              stroke="#3b82f6"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="flagged"
              name="Flagged"
              stroke="#ca8a04"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
