import { useSocket } from "../hooks/useSocket";

export default function AlertsPanel({ onSelect }) {
  const { alerts } = useSocket();

  // Ignore malformed items so one bad record can't crash the page
  const validAlerts = alerts.filter((tx) => tx && tx._id);

  return (
    <div style={{ fontFamily: "sans-serif", padding: "1rem" }}>
      <h2>🚨 Fraud Alerts</h2>
      <p>{validAlerts.length} flagged transactions</p>

      {validAlerts.length === 0 && (
        <p style={{ opacity: 0.6 }}>No alerts yet.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {validAlerts.map((tx) => (
          <div
            key={tx._id}
            onClick={() => onSelect(tx)}
            style={{
              border: `1px solid ${tx.status === "BLOCKED" ? "#dc2626" : "#ca8a04"}`,
              borderRadius: "8px",
              padding: "10px 14px",
              background: tx.status === "BLOCKED" ? "#2a1414" : "#2a2214",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{tx.userId ?? "unknown user"}</strong>
              <span>${Number(tx.amount ?? 0).toFixed(2)}</span>
            </div>
            <div
              style={{ fontSize: "0.85em", opacity: 0.85, marginTop: "4px" }}
            >
              Score {tx.finalScore ?? "n/a"} —{" "}
              {tx.rulesTriggered?.length
                ? tx.rulesTriggered.join(", ")
                : "ML anomaly only"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
