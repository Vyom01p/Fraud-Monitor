import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { API_URL } from "../config.js";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [transactions, setTransactions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/v1/transactions?limit=100`)
      .then(({ data }) => {
        const history = data.transactions;
        setTransactions((prev) => {
          const ids = new Set(prev.map((t) => t._id));
          return [...prev, ...history.filter((t) => !ids.has(t._id))].slice(
            0,
            100,
          );
        });
        setAlerts((prev) => {
          const ids = new Set(prev.map((t) => t._id));
          const flagged = history.filter(
            (t) => t.status !== "APPROVED" && !ids.has(t._id),
          );
          return [...prev, ...flagged].slice(0, 50);
        });
      })
      .catch((err) => console.error("History load failed:", err.message));

    const socket = io(API_URL);

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("transaction_processed", (tx) => {
      if (!tx || !tx._id) return;

      setTransactions((prev) => {
        if (prev.some((t) => t._id === tx._id)) return prev;
        return [tx, ...prev].slice(0, 100);
      });

      if (tx.status !== "APPROVED") {
        setAlerts((prev) => {
          if (prev.some((a) => a._id === tx._id)) return prev;
          return [tx, ...prev].slice(0, 50);
        });
      }
    });

    return () => socket.disconnect();
  }, []);

  return (
    <SocketContext.Provider value={{ transactions, alerts, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
