import TransactionFeed from "./components/TransactionFeed";
import AlertsPanel from "./components/AlertsPanel";

function App() {
  return (
    <div>
      <h1 style={{ fontFamily: "sans-serif", padding: "1rem 1rem 0" }}>
        Fraud Detection Dashboard
      </h1>
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

export default App;
