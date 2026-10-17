import json
import os

import joblib
import numpy as np
import pandas as pd
from imblearn.over_sampling import SMOTE
from sklearn.ensemble import IsolationForest
from sklearn.metrics import classification_report, precision_score, recall_score, roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

DATA_PATH = "data/creditcard.csv"
DEMO_MIN_PROB = 0.9

print("Loading data...")
df = pd.read_csv(DATA_PATH)
print(f"Loaded {len(df)} rows. Fraud cases: {df['Class'].sum()} ({df['Class'].mean() * 100:.3f}%)")

v_cols = [c for c in df.columns if c.startswith("V")]

train_idx, test_idx = train_test_split(
    df.index, test_size=0.2, random_state=42, stratify=df["Class"]
)
train_df = df.loc[train_idx].copy()
test_df = df.loc[test_idx].copy()

# Separate scalers, fitted on the training split only
amount_scaler = StandardScaler().fit(train_df[["Amount"]].values)
time_scaler = StandardScaler().fit(train_df[["Time"]].values)


def make_features(frame):
    out = frame[v_cols].copy()
    out["Amount_scaled"] = amount_scaler.transform(frame[["Amount"]].values).ravel()
    out["Time_scaled"] = time_scaler.transform(frame[["Time"]].values).ravel()
    return out


X_train = make_features(train_df).to_numpy()
X_test = make_features(test_df).to_numpy()
y_train = train_df["Class"].to_numpy()
y_test = test_df["Class"].to_numpy()
feature_cols = v_cols + ["Amount_scaled", "Time_scaled"]

print("\n--- Isolation Forest (unsupervised baseline) ---")
iso = IsolationForest(n_estimators=200, contamination=float(y_train.mean()), random_state=42)
iso.fit(X_train)
iso_preds = np.where(iso.predict(X_test) == -1, 1, 0)
print(classification_report(y_test, iso_preds, digits=3, zero_division=0))

print("\n--- XGBoost (supervised, SMOTE) ---")
X_bal, y_bal = SMOTE(random_state=42).fit_resample(X_train, y_train)
print(f"After SMOTE: {len(X_bal)} rows, {y_bal.mean() * 100:.1f}% fraud")

xgb = XGBClassifier(
    n_estimators=200,
    max_depth=5,
    learning_rate=0.1,
    eval_metric="logloss",
    random_state=42,
)
xgb.fit(X_bal, y_bal)

probs = xgb.predict_proba(X_test)[:, 1]
print(classification_report(y_test, (probs >= 0.5).astype(int), digits=3, zero_division=0))
print(f"ROC-AUC: {roc_auc_score(y_test, probs):.4f}")

print("\nThreshold sweep (use this to choose mlBlockThreshold):")
for t in [0.5, 0.8, 0.9, 0.95, 0.99]:
    preds = (probs >= t).astype(int)
    p = precision_score(y_test, preds, zero_division=0)
    r = recall_score(y_test, preds, zero_division=0)
    print(f"  threshold={t:<5} precision={p:.3f} recall={r:.3f}")

joblib.dump(xgb, "fraud_detector_xgb.joblib")
joblib.dump(amount_scaler, "amount_scaler.joblib")
joblib.dump(time_scaler, "time_scaler.joblib")
joblib.dump(feature_cols, "feature_cols.joblib")
joblib.dump(iso, "fraud_detector_isoforest.joblib")

# Held-out rows for the simulator (the model never trained on these)
os.makedirs("data", exist_ok=True)
test_df[["Time"] + v_cols + ["Amount", "Class"]].to_csv("data/replay_holdout.csv", index=False)

# Small demo sample set for the dashboard "Try it" panel
test_df["prob"] = probs


def to_samples(frame, n):
    sample = frame.sample(n=min(n, len(frame)), random_state=42)
    return [
        {
            "time": float(r["Time"]),
            "amount": float(r["Amount"]),
            "v": [float(r[c]) for c in v_cols],
        }
        for _, r in sample.iterrows()
    ]


fraud_pool = test_df[(test_df["Class"] == 1) & (test_df["prob"] >= DEMO_MIN_PROB) & (test_df["Amount"] > 0)]
normal_pool = test_df[(test_df["Class"] == 0) & (test_df["prob"] < 0.1) & (test_df["Amount"] > 0)]

with open("data/demo_samples.json", "w") as f:
    json.dump({"fraud": to_samples(fraud_pool, 20), "normal": to_samples(normal_pool, 20)}, f)

print("\nSaved: model, scalers, data/replay_holdout.csv, data/demo_samples.json")