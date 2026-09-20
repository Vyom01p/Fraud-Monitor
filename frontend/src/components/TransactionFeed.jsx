import { useSocket } from "../hooks/useSocket";

const statusColor = {
  APPROVED: "#16a34a", // green
  REVIEW: "#ca8a04", // yellow
  BLOCKED: "#dc2626", // red
};

export default function TransactionFeed() {
  const { transactions } = useSocket();

  return (
    <div style={{ fontFamily: "sans-serif", padding: "1rem" }}>
      <h2>Live Transaction Feed</h2>
      <p>{transactions.length} transactions received</p>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "2px solid #333" }}>
            <th style={{ padding: "8px" }}>User</th>
            <th style={{ padding: "8px" }}>Amount</th>
            <th style={{ padding: "8px" }}>Score</th>
            <th style={{ padding: "8px" }}>Status</th>
            <th style={{ padding: "8px" }}>Rules Triggered</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx._id} style={{ borderBottom: "1px solid #222" }}>
              <td style={{ padding: "8px" }}>{tx.userId}</td>
              <td style={{ padding: "8px" }}>${tx.amount.toFixed(2)}</td>
              <td style={{ padding: "8px" }}>{tx.finalScore}</td>
              <td style={{ padding: "8px" }}>
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
              </td>
              <td style={{ padding: "8px" }}>
                {tx.rulesTriggered?.length ? tx.rulesTriggered.join(", ") : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
