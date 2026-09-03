import pandas as pd
import numpy as np
import joblib
from sklearn.ensemble import IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier
from imblearn.over_sampling import SMOTE

DATA_PATH = "data/creditcard.csv"

print("Loading data...")
df = pd.read_csv(DATA_PATH)
print(f"Loaded {len(df)} rows. Fraud cases: {df['Class'].sum()} ({df['Class'].mean()*100:.3f}%)")

scaler = StandardScaler()
df["Amount_scaled"] = scaler.fit_transform(df[["Amount"]])
df["Time_scaled"] = scaler.fit_transform(df[["Time"]])

feature_cols = [c for c in df.columns if c.startswith("V")] + ["Amount_scaled", "Time_scaled"]
X = df[feature_cols]
y = df["Class"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

#  MODEL 1: Isolation Forest (unsupervised) 
print("\n--- Training Isolation Forest ---")
iso_forest = IsolationForest(
    n_estimators=200,
    contamination=float(y_train.mean()),
    random_state=42,
)
iso_forest.fit(X_train)

iso_preds = iso_forest.predict(X_test)
iso_preds_binary = np.where(iso_preds == -1, 1, 0)
print(classification_report(y_test, iso_preds_binary, digits=3))

joblib.dump(iso_forest, "fraud_detector_isoforest.joblib")
joblib.dump(scaler, "scaler.joblib")
joblib.dump(feature_cols, "feature_cols.joblib")

# MODEL 2: XGBoost (supervised, with SMOTE) 
print("\n--- Training XGBoost ---")
smote = SMOTE(random_state=42)
X_train_bal, y_train_bal = smote.fit_resample(X_train, y_train)
print(f"After SMOTE: {len(X_train_bal)} rows, {y_train_bal.mean()*100:.1f}% fraud")

xgb_model = XGBClassifier(
    n_estimators=200,
    max_depth=5,
    learning_rate=0.1,
    eval_metric="logloss",
    random_state=42,
)
xgb_model.fit(X_train_bal, y_train_bal)

xgb_probs = xgb_model.predict_proba(X_test)[:, 1]
xgb_preds = (xgb_probs >= 0.5).astype(int)

print(classification_report(y_test, xgb_preds, digits=3))
print(f"ROC-AUC: {roc_auc_score(y_test, xgb_probs):.4f}")

joblib.dump(xgb_model, "fraud_detector_xgb.joblib")
print("\n✅ Both models trained and saved.")