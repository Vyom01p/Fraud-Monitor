function Card({ label, value, accent }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: "180px",
        border: "1px solid #333",
        borderTop: `3px solid ${accent}`,
        borderRadius: "8px",
        padding: "12px 16px",
      }}
    >
      <div style={{ fontSize: "0.8em", opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: "1.7em", fontWeight: 600, marginTop: "4px" }}>
        {value}
      </div>
    </div>
  );
}

export default function KpiCards({ stats }) {
  if (!stats) return <p style={{ padding: "1rem" }}>Loading stats...</p>;

  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
        padding: "1rem",
        fontFamily: "sans-serif",
      }}
    >
      <Card
        label="Total Transactions"
        value={stats.total.toLocaleString()}
        accent="#3b82f6"
      />
      <Card
        label="Total Volume"
        value={`$${stats.volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        accent="#8b5cf6"
      />
      <Card
        label="Flagged Rate"
        value={`${stats.flaggedRate.toFixed(1)}%`}
        accent="#ca8a04"
      />
      <Card
        label="Blocked Rate"
        value={`${stats.blockedRate.toFixed(1)}%`}
        accent="#dc2626"
      />
    </div>
  );
}
