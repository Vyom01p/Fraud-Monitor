import axios from "axios";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";

/**
 * Calls the Python FastAPI microservice with the built features.
 */
export async function getMlScore(features) {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict`, features, {
      timeout: 3000,
    });
    return response.data; // { is_anomaly, risk_score, model_type }
  } catch (err) {
    console.error("ML service call failed:", err.message);
    // Fail-safe: if ML is down, don't crash the whole pipeline —
    // fall back to a neutral score and let the rule engine still work.
    return { is_anomaly: false, risk_score: 0.5, mlServiceDown: true };
  }
}
