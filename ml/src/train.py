"""
SolarSense Model Training Pipeline
Trains baseline and Gradient Boosting estimators using chronological time-series splitting
and serializes model weights and evaluation metadata.
"""

import argparse
import json
import os
import sys
import yaml
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timezone
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import LinearRegression

from .features import FEATURE_NAMES, prepare_feature_dataframe
from .generate_dataset import generate_benchmark_dataset


def load_config(config_path: str) -> dict:
    with open(config_path, "r") as f:
        return yaml.safe_load(f)


def train_and_evaluate(config_path: str = "config/train.yaml"):
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    full_config_path = os.path.join(base_dir, config_path)
    cfg = load_config(full_config_path)

    raw_path = os.path.join(base_dir, cfg["data"]["raw_path"])
    if not os.path.exists(raw_path):
        print(f"Raw dataset not found at {raw_path}. Generating benchmark dataset...")
        generate_benchmark_dataset(output_path=raw_path)

    print(f"Loading raw dataset from {raw_path}...")
    raw_df = pd.read_csv(raw_path)
    raw_df["timestamp"] = pd.to_datetime(raw_df["timestamp"], utc=True)
    raw_df = raw_df.sort_values("timestamp").reset_index(drop=True)

    print("Extracting physical and cyclical features...")
    X_all = prepare_feature_dataframe(raw_df)
    y_all = raw_df[cfg["target"]].values

    # Chronological Split (No random shuffling to prevent data leakage)
    n_total = len(raw_df)
    test_size = float(cfg["data"].get("test_size", 0.2))
    n_train = int(n_total * (1.0 - test_size))

    X_train, X_test = X_all.iloc[:n_train], X_all.iloc[n_train:]
    y_train, y_test = y_all[:n_train], y_all[n_train:]
    test_df = raw_df.iloc[n_train:]

    print(f"Dataset split: Train samples={len(X_train)}, Test samples={len(X_test)}")

    # 1. Baseline Model: Linear Regression on GHI
    print("Training Baseline Linear Regression on GHI...")
    baseline = LinearRegression()
    baseline.fit(X_train[["ghiWm2"]], y_train)
    y_pred_base = np.clip(baseline.predict(X_test[["ghiWm2"]]), 0.0, 1.0)
    base_mae = mean_absolute_error(y_test, y_pred_base)
    base_rmse = np.sqrt(mean_squared_error(y_test, y_pred_base))
    base_r2 = r2_score(y_test, y_pred_base)
    print(f"Baseline -> MAE: {base_mae:.4f}, RMSE: {base_rmse:.4f}, R²: {base_r2:.4f}")

    # 2. Candidate Model: Gradient Boosting Regressor
    print("Training Gradient Boosting Estimator...")
    params = cfg.get("hyperparameters", {})
    gbr = GradientBoostingRegressor(
        n_estimators=params.get("n_estimators", 150),
        max_depth=params.get("max_depth", 6),
        learning_rate=params.get("learning_rate", 0.08),
        min_samples_split=params.get("min_samples_split", 5),
        random_state=params.get("random_state", 42),
    )
    gbr.fit(X_train, y_train)

    y_pred_gbr = gbr.predict(X_test)

    # Apply physical constraints on test predictions
    # If solar elevation is <= 0, enforce 0 capacity factor
    elev_test = X_test["solarElevationDeg"].values
    y_pred_gbr[elev_test <= 0.0] = 0.0
    y_pred_gbr = np.clip(y_pred_gbr, 0.0, 1.0)

    gbr_mae = mean_absolute_error(y_test, y_pred_gbr)
    gbr_rmse = np.sqrt(mean_squared_error(y_test, y_pred_gbr))
    gbr_r2 = r2_score(y_test, y_pred_gbr)
    gbr_nmae = (gbr_mae / 1.0) * 100.0  # normalized percentage against 1.0 capacity factor

    print(f"Gradient Boosting -> MAE: {gbr_mae:.4f}, RMSE: {gbr_rmse:.4f}, R²: {gbr_r2:.4f}, nMAE: {gbr_nmae:.2f}%")

    # Save output artifacts
    output_dir = os.path.join(base_dir, cfg["output_dir"])
    os.makedirs(output_dir, exist_ok=True)
    model_path = os.path.join(output_dir, "model.joblib")
    meta_path = os.path.join(output_dir, "metadata.json")

    joblib.dump(gbr, model_path)
    print(f"Saved trained model to {model_path}")

    metadata = {
        "name": cfg["model_name"],
        "version": cfg["version"],
        "trainedAt": datetime.now(timezone.utc).isoformat(),
        "datasetDescription": (
            "Annual 8,760-hour hourly meteorological and photovoltaic output benchmark dataset "
            "for a 50 kW commercial PV array in New Delhi, India (28.6139°N, 77.2090°E). "
            "Includes GHI, DNI, DHI, temperature, cloud cover, relative humidity, wind speed, "
            "and astronomical solar elevation."
        ),
        "target": cfg["target"],
        "featureList": FEATURE_NAMES,
        "hyperparameters": params,
        "metrics": {
            "mae": round(float(gbr_mae), 4),
            "rmse": round(float(gbr_rmse), 4),
            "r2": round(float(gbr_r2), 4),
            "nmae": round(float(gbr_nmae), 2),
        },
        "baselineComparison": {
            "model": "LinearRegression(GHI)",
            "mae": round(float(base_mae), 4),
            "rmse": round(float(base_rmse), 4),
            "r2": round(float(base_r2), 4),
        },
        "testSplit": {
            "testSize": test_size,
            "testSamples": len(X_test),
            "testPeriodStart": str(test_df["timestamp"].min()),
            "testPeriodEnd": str(test_df["timestamp"].max()),
        },
        "physicalConstraintsApplied": [
            "Solar elevation <= 0.0 forces power = 0.0 kW",
            "Output strictly bounded within [0, capacityKw]",
            "Linear system capacity scaling"
        ]
    }

    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved model metadata to {meta_path}")

    # Also update 'latest' pointer
    latest_dir = os.path.join(base_dir, "models/latest")
    os.makedirs(latest_dir, exist_ok=True)
    joblib.dump(gbr, os.path.join(latest_dir, "model.joblib"))
    with open(os.path.join(latest_dir, "metadata.json"), "w") as f:
        json.dump(metadata, f, indent=2)

    return metadata


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", default="config/train.yaml", help="Path to train config")
    args = parser.parse_args()
    train_and_evaluate(args.config)
