import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../config.js";

const STATS_URL = `${API_URL}/api/v1/transactions/stats`;

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
