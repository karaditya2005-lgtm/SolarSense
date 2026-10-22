"""
SolarSense Evaluation Script
Loads an existing model and re-computes performance metrics on the test split.
"""

import argparse
import json
import os
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from .features import prepare_feature_dataframe

def evaluate_model(version: str = "v1.0.0"):
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model_dir = os.path.join(base_dir, f"models/{version}")
    model_path = os.path.join(model_dir, "model.joblib")
    meta_path = os.path.join(model_dir, "metadata.json")

    if not os.path.exists(model_path) or not os.path.exists(meta_path):
        raise FileNotFoundError(f"Model or metadata for version {version} not found in {model_dir}")

    model = joblib.load(model_path)
    with open(meta_path, "r") as f:
        meta = json.load(f)

    raw_path = os.path.join(base_dir, "data/raw/solar_generation_dataset.csv")
    raw_df = pd.read_csv(raw_path)
    raw_df["timestamp"] = pd.to_datetime(raw_df["timestamp"], utc=True)
    raw_df = raw_df.sort_values("timestamp").reset_index(drop=True)

    X_all = prepare_feature_dataframe(raw_df)
    y_all = raw_df["capacityFactor"].values

    test_size = meta.get("testSplit", {}).get("testSize", 0.2)
    n_train = int(len(raw_df) * (1.0 - test_size))

    X_test = X_all.iloc[n_train:]
    y_test = y_all[n_train:]

    y_pred = model.predict(X_test)
    elev_test = X_test["solarElevationDeg"].values
    y_pred[elev_test <= 0.0] = 0.0
    y_pred = np.clip(y_pred, 0.0, 1.0)

    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    nmae = mae * 100.0

    print(f"=== Re-Evaluation Report for {version} ===")
    print(f"MAE:  {mae:.4f}")
    print(f"RMSE: {rmse:.4f}")
    print(f"R²:   {r2:.4f}")
    print(f"nMAE: {nmae:.2f}%")

    return {"mae": mae, "rmse": rmse, "r2": r2, "nmae": nmae}

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--version", default="v1.0.0", help="Model version to evaluate")
    args = parser.parse_args()
    evaluate_model(args.version)
