import TransactionFeed from "./components/TransactionFeed";

function App() {
  return (
    <div>
      <h1 style={{ fontFamily: "sans-serif", padding: "1rem 1rem 0" }}>
        Fraud Detection Dashboard
      </h1>
      <TransactionFeed />
    </div>
  );
}

export default App;
