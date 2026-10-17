import { useState } from "react";
import { SocketProvider } from "./context/SocketContext.jsx";
import { useStats } from "./hooks/useStats";
import KpiCards from "./components/KpiCards";
import FraudChart from "./components/FraudChart";
import TransactionFeed from "./components/TransactionFeed";
import AlertsPanel from "./components/AlertsPanel";
import RiskDrawer from "./components/RiskDrawer";
import RuleManager from "./components/RuleManager";
import TryItPanel from "./components/TryItPanel";

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "try", label: "Try it" },
  { id: "rules", label: "Rules" },
];

function Dashboard() {
  const stats = useStats();
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState("dashboard");

  return (
    <div>
      <h1 style={{ fontFamily: "sans-serif", padding: "1rem 1rem 0" }}>
        Fraud Detection Dashboard
      </h1>

      <div
        style={{
          display: "flex",
          gap: "8px",
          padding: "0 1rem",
          fontFamily: "sans-serif",
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: tab === t.id ? "#3b82f6" : "transparent",
              color: "inherit",
              border: "1px solid #333",
              borderRadius: "6px",
              padding: "6px 16px",
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && (
        <>
          <KpiCards stats={stats} />
          <FraudChart stats={stats} />
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ flex: 2, minWidth: "500px" }}>
              <TransactionFeed onSelect={setSelected} />
            </div>
            <div style={{ flex: 1, minWidth: "300px" }}>
              <AlertsPanel onSelect={setSelected} />
            </div>
          </div>
        </>
      )}

      {tab === "try" && <TryItPanel onSelect={setSelected} />}
      {tab === "rules" && <RuleManager />}

      <RiskDrawer tx={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

export default function App() {
  return (
    <SocketProvider>
      <Dashboard />
    </SocketProvider>
  );
}
