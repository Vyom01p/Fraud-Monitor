import os
import secrets

import joblib
import numpy as np
from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
API_KEY = os.getenv("ML_API_KEY")


def load(name):
    path = os.path.join(BASE_DIR, name)
    if not os.path.exists(path):
        raise RuntimeError(f"{name} not found. Run `python train_model.py` first.")
    return joblib.load(path)


model = load("fraud_detector_xgb.joblib")
amount_scaler = load("amount_scaler.joblib")
time_scaler = load("time_scaler.joblib")

app = FastAPI(title="Fraud Detection ML Service")


def verify_key(x_api_key: str | None = Header(default=None)):
    if API_KEY and not (x_api_key and secrets.compare_digest(x_api_key, API_KEY)):
        raise HTTPException(status_code=401, detail="Unauthorized")


class TransactionPayload(BaseModel):
    amount: float = Field(..., gt=0)
    time: float = Field(..., ge=0)
    v_features: list[float] = Field(
        default_factory=lambda: [0.0] * 28, min_length=28, max_length=28
    )


class PredictionResponse(BaseModel):
    is_anomaly: bool
    risk_score: float
    model_type: str


@app.get("/health")
def health():
    return {"status": "ok", "model_type": "xgboost"}


@app.post("/predict", response_model=PredictionResponse, dependencies=[Depends(verify_key)])
def predict(data: TransactionPayload):
    amount_scaled = amount_scaler.transform(np.array([[data.amount]]))[0][0]
    time_scaled = time_scaler.transform(np.array([[data.time]]))[0][0]
    row = np.array([data.v_features + [float(amount_scaled), float(time_scaled)]])

    risk_score = float(model.predict_proba(row)[0][1])
    return PredictionResponse(
        is_anomaly=risk_score >= 0.5,
        risk_score=round(risk_score, 4),
        model_type="xgboost",
    )