import { useEffect } from "react";

const statusColor = {
  APPROVED: "#16a34a",
  REVIEW: "#ca8a04",
  BLOCKED: "#dc2626",
};

const ruleInfo = {
  VELOCITY_SPIKE: "Too many transactions from this user in a short window",
  AMOUNT_ANOMALY: "Amount is far above this user's 30-day average",
  BLOCKED_COUNTRY: "Billing country is on the blocklist",
  CARD_TESTING_PATTERN:
    "Several tiny charges in a row, typical of card testing",
};

function Bar({ label, value, max, color }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: "14px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.85em",
        }}
      >
        <span>{label}</span>
        <span>
          {value.toFixed(1)} / {max}
        </span>
      </div>
      <div
        style={{
          background: "#2a2d35",
          borderRadius: "4px",
          height: "8px",
          marginTop: "4px",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            background: color,
            height: "100%",
            borderRadius: "4px",
          }}
        />
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "4px 0",
        fontSize: "0.9em",
      }}
    >
      <span style={{ opacity: 0.6 }}>{label}</span>
      <span>{value || "—"}</span>
    </div>
  );
}

export default function RiskDrawer({ tx, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!tx) return null;

  const rules = tx.rulesTriggered || [];
  const ruleScore = Math.min(rules.length * 20, 60);
  const mlScore = (tx.mlRiskScore ?? 0) * 40;
  const mlDown = tx.mlAvailable === false;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 10,
        }}
      />
      <aside
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "380px",
          maxWidth: "100%",
          background: "#1a1d24",
          borderLeft: "1px solid #333",
          padding: "1.25rem",
          overflowY: "auto",
          zIndex: 11,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0 }}>Risk Breakdown</h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "inherit",
              fontSize: "1.4em",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            margin: "16px 0",
          }}
        >
          <span style={{ fontSize: "2.4em", fontWeight: 600 }}>
            {tx.finalScore}
          </span>
          <span
            style={{
              background: statusColor[tx.status],
              color: "white",
              padding: "3px 12px",
              borderRadius: "999px",
              fontSize: "0.85em",
            }}
          >
            {tx.status}
          </span>
        </div>
        {tx.decisionReason && (
          <p style={{ fontSize: "0.85em", opacity: 0.8, marginTop: 0 }}>
            Decision: {tx.decisionReason}
          </p>
        )}
        <h3 style={{ marginBottom: "8px" }}>Score contribution</h3>
        <Bar label="Rule engine" value={ruleScore} max={60} color="#3b82f6" />
        <Bar label="ML model" value={mlScore} max={40} color="#8b5cf6" />

        <h3 style={{ marginBottom: "8px" }}>Rules triggered</h3>
        {rules.length === 0 && (
          <p style={{ opacity: 0.6, marginTop: 0 }}>No rules fired.</p>
        )}
        {rules.map((r) => (
          <div key={r} style={{ marginBottom: "8px" }}>
            <strong style={{ fontSize: "0.9em" }}>{r}</strong>
            <div style={{ fontSize: "0.82em", opacity: 0.7 }}>
              {ruleInfo[r] || "Custom rule"}
            </div>
          </div>
        ))}

        <h3 style={{ marginBottom: "8px" }}>ML model</h3>
        <Row label="Fraud probability" value={tx.mlRiskScore?.toFixed(3)} />
        <Row label="Flagged as anomaly" value={tx.isAnomaly ? "Yes" : "No"} />
        {mlDown && (
          <p style={{ fontSize: "0.8em", color: "#ca8a04" }}>
            The ML service was unreachable for this transaction, so a neutral
            fallback score was used.
          </p>
        )}

        <h3 style={{ marginBottom: "8px" }}>Transaction</h3>
        <Row label="User" value={tx.userId} />
        <Row label="Amount" value={`$${tx.amount.toFixed(2)}`} />
        <Row label="IP" value={tx.ip} />
        <Row label="Billing country" value={tx.billingCountry} />
        <Row label="Card token" value={tx.cardToken} />
        <Row label="Time" value={new Date(tx.createdAt).toLocaleString()} />
      </aside>
    </>
  );
}
