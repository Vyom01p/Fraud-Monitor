from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import joblib
import numpy as np
import os

app = FastAPI(title="Fraud Detection ML Service")

FEATURE_COLS = joblib.load("feature_cols.joblib")
SCALER = joblib.load("scaler.joblib")

USE_XGB = os.path.exists("fraud_detector_xgb.joblib")
if USE_XGB:
    model = joblib.load("fraud_detector_xgb.joblib")
    MODEL_TYPE = "xgboost"
else:
    model = joblib.load("fraud_detector_isoforest.joblib")
    MODEL_TYPE = "isolation_forest"

print(f"Loaded model type: {MODEL_TYPE}")


class TransactionPayload(BaseModel):
    amount: float = Field(..., gt=0)
    time: float
    v_features: list[float] = Field(default_factory=lambda: [0.0] * 28)


class PredictionResponse(BaseModel):
    is_anomaly: bool
    risk_score: float
    model_type: str


@app.get("/health")
def health():
    return {"status": "ok", "model_type": MODEL_TYPE}


@app.post("/predict", response_model=PredictionResponse)
def predict_fraud(data: TransactionPayload):
    try:
        amount_scaled = SCALER.transform([[data.amount]])[0][0]
        time_scaled = SCALER.transform([[data.time]])[0][0]
        row = data.v_features + [amount_scaled, time_scaled]
        features = np.array([row])

        if MODEL_TYPE == "xgboost":
            risk_score = float(model.predict_proba(features)[0][1])
            is_anomaly = risk_score >= 0.5
        else:
            raw_score = model.decision_function(features)[0]
            risk_score = float(np.clip(0.5 - raw_score, 0.0, 1.0))
            is_anomaly = bool(model.predict(features)[0] == -1)

        return PredictionResponse(
            is_anomaly=is_anomaly,
            risk_score=round(risk_score, 3),
            model_type=MODEL_TYPE,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))