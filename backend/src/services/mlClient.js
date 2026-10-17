import axios from "axios";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

const client = axios.create({
  baseURL: env.ML_SERVICE_URL,
  timeout: env.ML_TIMEOUT_MS,
  headers: env.ML_API_KEY ? { "x-api-key": env.ML_API_KEY } : {},
});

const FALLBACK = { is_anomaly: false, risk_score: 0.5, mlServiceDown: true };

export async function getMlScore(features) {
  try {
    const { data } = await client.post("/predict", features);
    if (typeof data?.risk_score !== "number")
      throw new Error("Malformed ML response");
    return {
      is_anomaly: Boolean(data.is_anomaly),
      risk_score: data.risk_score,
      mlServiceDown: false,
    };
  } catch (err) {
    logger.error(
      { err: err.message },
      "ML service call failed, using fallback score",
    );
    return FALLBACK;
  }
}
