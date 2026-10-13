import { useSocket } from "../hooks/useSocket";

export default function AlertsPanel() {
  const { alerts } = useSocket();

  return (
    <div style={{ fontFamily: "sans-serif", padding: "1rem" }}>
      <h2>🚨 Fraud Alerts</h2>
      <p>{alerts.length} flagged transactions</p>

      {alerts.length === 0 && <p style={{ opacity: 0.6 }}>No alerts yet.</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {alerts.map((tx) => (
          <div
            key={tx._id}
            style={{
              border: `1px solid ${tx.status === "BLOCKED" ? "#dc2626" : "#ca8a04"}`,
              borderRadius: "8px",
              padding: "10px 14px",
              background: tx.status === "BLOCKED" ? "#2a1414" : "#2a2214",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{tx.userId}</strong>
              <span>${tx.amount.toFixed(2)}</span>
            </div>
            <div
              style={{ fontSize: "0.85em", opacity: 0.85, marginTop: "4px" }}
            >
              Score {tx.finalScore} —{" "}
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
