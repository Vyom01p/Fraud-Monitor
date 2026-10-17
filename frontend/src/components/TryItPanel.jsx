import { useState } from "react";
import axios from "axios";
import { API_URL } from "../config.js";

const SCENARIOS = [
  {
    id: "normal",
    label: "Normal purchase",
    help: "A real legitimate transaction from the held-out test set",
  },
  {
    id: "ml_fraud",
    label: "Known fraud pattern",
    help: "A real held-out fraud transaction the model flags with high confidence",
  },
  {
    id: "blocked_country",
    label: "Blocked country",
    help: "Triggers a hard-block rule",
  },
  {
    id: "card_testing",
    label: "Card-testing burst",
    help: "Five tiny charges in a row",
  },
];

const statusColor = {
  APPROVED: "#16a34a",
  REVIEW: "#ca8a04",
  BLOCKED: "#dc2626",
};

export default function TryItPanel({ onSelect }) {
  const [busy, setBusy] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  async function run(id) {
    setBusy(id);
    setError("");
    try {
      const { data } = await axios.post(`${API_URL}/api/v1/transactions/demo`, {
        scenario: id,
      });
      setResults(data.transactions);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      style={{ fontFamily: "sans-serif", padding: "1rem", maxWidth: "760px" }}
    >
      <h2>Try it</h2>
      <p style={{ opacity: 0.7, marginTop: 0 }}>
        Send a test transaction through the live pipeline. It appears in the
        dashboard in real time.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "12px",
        }}
      >
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            onClick={() => run(s.id)}
            disabled={busy !== null}
            style={{
              textAlign: "left",
              background: "#1a1d24",
              color: "inherit",
              border: "1px solid #333",
              borderRadius: "8px",
              padding: "12px 14px",
              cursor: busy ? "wait" : "pointer",
            }}
          >
            <strong>{busy === s.id ? "Running..." : s.label}</strong>
            <div style={{ fontSize: "0.8em", opacity: 0.65, marginTop: "4px" }}>
              {s.help}
            </div>
          </button>
        ))}
      </div>

      {error && <p style={{ color: "#dc2626" }}>{error}</p>}

      {results.length > 0 && (
        <div style={{ marginTop: "18px" }}>
          <h3>Result</h3>
          {results.map((tx) => (
            <div
              key={tx._id}
              onClick={() => onSelect && onSelect(tx)}
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
                padding: "8px 0",
                borderBottom: "1px solid #222",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  background: statusColor[tx.status],
                  color: "white",
                  padding: "2px 10px",
                  borderRadius: "999px",
                  fontSize: "0.8em",
                }}
              >
                {tx.status}
              </span>
              <span>score {tx.finalScore}</span>
              <span>${tx.amount.toFixed(2)}</span>
              <span style={{ opacity: 0.7, fontSize: "0.85em" }}>
                {tx.rulesTriggered.length
                  ? tx.rulesTriggered.join(", ")
                  : "no rules"}{" "}
                | ML {tx.mlRiskScore?.toFixed(3)}
              </span>
            </div>
          ))}
          <p style={{ fontSize: "0.8em", opacity: 0.6 }}>
            Click a row to see the full breakdown.
          </p>
        </div>
      )}
    </div>
  );
}
