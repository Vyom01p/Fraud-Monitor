import { SocketProvider } from "./context/SocketContext.jsx";
import { useStats } from "./hooks/useStats";
import KpiCards from "./components/KpiCards";
import FraudChart from "./components/FraudChart";
import TransactionFeed from "./components/TransactionFeed";
import AlertsPanel from "./components/AlertsPanel";

function Dashboard() {
  const stats = useStats();

  return (
    <div>
      <h1 style={{ fontFamily: "sans-serif", padding: "1rem 1rem 0" }}>
        Fraud Detection Dashboard
      </h1>
      <KpiCards stats={stats} />
      <FraudChart stats={stats} />
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ flex: 2, minWidth: "500px" }}>
          <TransactionFeed />
        </div>
        <div style={{ flex: 1, minWidth: "300px" }}>
          <AlertsPanel />
        </div>
      </div>
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
