import { useEffect, useState } from "react";
import axios from "axios";

const STATS_URL = "http://localhost:5000/api/v1/transactions/stats";

export function useStats(intervalMs = 5000) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const { data } = await axios.get(STATS_URL);
        if (active) setStats(data);
      } catch (err) {
        console.error("Stats load failed:", err.message);
      }
    }

    load();
    const id = setInterval(load, intervalMs);

    return () => {
      active = false;
      clearInterval(id);
    };
  }, [intervalMs]);

  return stats;
}
