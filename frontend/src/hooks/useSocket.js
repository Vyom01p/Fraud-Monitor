import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

export function useSocket() {
  const [transactions, setTransactions] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on("connect", () => {
      console.log("Connected to backend:", socket.id);
    });

    socket.on("transaction_processed", (tx) => {
      setTransactions((prev) => [tx, ...prev].slice(0, 100));
    });

    socket.on("fraud_alert", (tx) => {
      setAlerts((prev) => [tx, ...prev].slice(0, 50));
    });

    return () => socket.disconnect();
  }, []);

  return { transactions, alerts };
}
