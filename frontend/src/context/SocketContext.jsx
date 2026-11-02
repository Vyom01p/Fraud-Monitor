import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../config.js";
import { api } from "../lib/api.js";
import { money } from "../lib/format.js";
import { useToast } from "./ToastContext.jsx";

const SocketContext = createContext(null);
const MAX_TX = 200;
const MAX_ALERTS = 50;

const mergeUnique = (prev, incoming, max) => {
  const ids = new Set(prev.map((t) => t._id));
  return [...prev, ...incoming.filter((t) => !ids.has(t._id))].slice(0, max);
};
const replaceOne = (list, tx) => list.map((t) => (t._id === tx._id ? tx : t));

export function SocketProvider({ children }) {
  const toast = useToast();
  const lastToast = useRef(0);
  const [transactions, setTransactions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [connected, setConnected] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [ticks, setTicks] = useState({ tx: 0, alert: 0 });

  useEffect(() => {
    let active = true;

    api
      .get("/transactions", { params: { limit: 100 } })
      .then(({ data }) => {
        if (!active) return;
        setTransactions((p) => mergeUnique(p, data.transactions, MAX_TX));
        setAlerts((p) =>
          mergeUnique(
            p,
            data.transactions.filter((t) => t.status !== "APPROVED"),
            MAX_ALERTS,
          ),
        );
      })
      .catch(() => {})
      .finally(() => active && setHistoryLoaded(true));

    const socket = io(API_URL);

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("transaction_processed", (tx) => {
      setTransactions((p) => [tx, ...p].slice(0, MAX_TX));
      setTicks((t) => ({ ...t, tx: t.tx + 1 }));
    });

    socket.on("fraud_alert", (tx) => {
      setAlerts((p) => [tx, ...p].slice(0, MAX_ALERTS));
      setTicks((t) => ({ ...t, alert: t.alert + 1 }));
      if (tx.status === "BLOCKED" && Date.now() - lastToast.current > 2500) {
        lastToast.current = Date.now();
        toast({
          title: "Transaction blocked",
          description: `${tx.userId} · ${money(tx.amount)} · score ${tx.finalScore}`,
          tone: "bad",
        });
      }
    });

    socket.on("transaction_updated", (tx) => {
      setTransactions((p) => replaceOne(p, tx));
      setAlerts((p) => replaceOne(p, tx));
      setTicks((t) => ({ ...t, alert: t.alert + 1 }));
    });

    return () => {
      active = false;
      socket.disconnect();
    };
  }, [toast]);

  return (
    <SocketContext.Provider
      value={{ transactions, alerts, connected, historyLoaded, ticks }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
