import axios from "axios";
import mongoose from "mongoose";
import { env } from "../config/env.js";

export async function getSystemStatus(req, res) {
  const started = Date.now();
  let ml = { ok: false, latencyMs: null };

  try {
    await axios.get(`${env.ML_SERVICE_URL}/health`, { timeout: 2500 });
    ml = { ok: true, latencyMs: Date.now() - started };
  } catch {
    // leave ml.ok = false
  }

  res.json({
    api: { ok: true, uptimeSec: Math.round(process.uptime()) },
    db: { ok: mongoose.connection.readyState === 1 },
    ml,
    checkedAt: new Date().toISOString(),
  });
}
