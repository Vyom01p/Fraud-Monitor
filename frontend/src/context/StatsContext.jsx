import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { api, errorMessage } from "../lib/api.js";

const StatsContext = createContext(null);

export function StatsProvider({ children }) {
  const [range, setRange] = useState("30m");
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const ctrl = new AbortController();

    async function load() {
      try {
        const { data } = await api.get("/transactions/stats", {
          params: { range },
          signal: ctrl.signal,
        });
        if (active) {
          setStats(data);
          setError("");
        }
      } catch (err) {
        if (active && !axios.isCancel(err)) setError(errorMessage(err));
      }
    }

    load();
    const id = setInterval(load, 6000);
    return () => {
      active = false;
      ctrl.abort();
      clearInterval(id);
    };
  }, [range]);

  return (
    <StatsContext.Provider value={{ stats, range, setRange, error }}>
      {children}
    </StatsContext.Provider>
  );
}

export const useStats = () => useContext(StatsContext);
