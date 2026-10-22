"""
SolarSense FastAPI Machine Learning Microservice
Exposes /health, /model/info, and /predict for the Node.js backend.
"""

import os
import time
import pandas as pd
import numpy as np
from contextlib import asynccontextmanager
from fastapi import FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .schemas import (
    PredictRequest,
    PredictResponse,
    PredictionItem,
    ModelInfoResponse,
    HealthResponse,
)
from .model_loader import ModelRegistry
from .features import extract_features_from_dict, FEATURE_NAMES

load_dotenv()

INTERNAL_KEY = os.getenv("ML_INTERNAL_KEY", "solarsense-dev-internal-key-super-secure-32")
MODEL_VERSION = os.getenv("ML_MODEL_VERSION", "v1.0.0")
START_TIME = time.time()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize model registry on startup
    registry = ModelRegistry.get_instance(version=MODEL_VERSION)
    if not registry.is_loaded:
        print("Warning: Model not loaded during startup. Check training artifacts.")
    yield


app = FastAPI(
    title="SolarSense ML Inference Microservice",
    version="1.0.0",
    description="Deterministic solar photovoltaic power forecasting engine.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def verify_internal_key(x_internal_key: str = Header(None, alias="X-Internal-Key")):
    if not x_internal_key or x_internal_key != INTERNAL_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Invalid or missing X-Internal-Key",
        )


@app.get("/health", response_model=HealthResponse)
async def health_check():
    registry = ModelRegistry.get_instance(version=MODEL_VERSION)
    return HealthResponse(
        status="ok",
        modelLoaded=registry.is_loaded,
        modelVersion=registry.metadata.get("version", MODEL_VERSION),
        uptimeSeconds=round(time.time() - START_TIME, 2),
    )


@app.get("/model/info", response_model=ModelInfoResponse)
async def get_model_info(x_internal_key: str = Header(None, alias="X-Internal-Key")):
    verify_internal_key(x_internal_key)
    registry = ModelRegistry.get_instance(version=MODEL_VERSION)

    if not registry.is_loaded:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model is not loaded or ready for inference",
        )

    meta = registry.metadata
    return ModelInfoResponse(
        name=meta.get("name", "GradientBoostingSolarEstimator"),
        version=meta.get("version", MODEL_VERSION),
        trainedAt=meta.get("trainedAt", ""),
        features=meta.get("featureList", FEATURE_NAMES),
        metrics=meta.get("metrics", {}),
        dataset=meta.get("datasetDescription", ""),
        hyperparameters=meta.get("hyperparameters", {}),
        baselineComparison=meta.get("baselineComparison", {}),
    )


@app.post("/predict", response_model=PredictResponse)
async def predict_power(
    request: PredictRequest,
    x_internal_key: str = Header(None, alias="X-Internal-Key"),
):
    verify_internal_key(x_internal_key)
    registry = ModelRegistry.get_instance(version=MODEL_VERSION)

    if not registry.is_loaded or registry.model is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model is not loaded or ready for inference",
        )

    t0 = time.time()

    try:
        feature_rows = []
        elevations = []
        timestamps = []

        for inst in request.instances:
            inst_dict = inst.model_dump()
            feat_dict = extract_features_from_dict(inst_dict)
            feature_rows.append(feat_dict)
            elevations.append(feat_dict["solarElevationDeg"])
            timestamps.append(inst.timestamp)

        X_df = pd.DataFrame(feature_rows)[FEATURE_NAMES]

        # Model outputs capacity factor [0.0, 1.0]
        raw_predictions = registry.model.predict(X_df)

        predictions: list[PredictionItem] = []
        capacity_kw = request.capacityKw

        for i, raw_cf in enumerate(raw_predictions):
            elev = elevations[i]
            ghi = feature_rows[i]["ghiWm2"]

            # Physical solar constraints:
            # At night (elevation <= 0.0 or GHI == 0.0), solar panels produce 0 kW.
            if elev <= 0.0 or ghi <= 0.0:
                cf = 0.0
            else:
                cf = float(np.clip(raw_cf, 0.0, 1.0))

            power_kw = round(float(np.clip(cf * capacity_kw, 0.0, capacity_kw)), 3)

            predictions.append(
                PredictionItem(
                    timestamp=timestamps[i],
                    powerKw=power_kw,
                    capacityFactor=round(cf, 4),
                    solarElevationDeg=round(elev, 2),
                )
            )

        duration_ms = round((time.time() - t0) * 1000.0, 2)

        return PredictResponse(
            model={
                "name": registry.metadata.get("name", "GradientBoostingSolarEstimator"),
                "version": registry.metadata.get("version", MODEL_VERSION),
            },
            predictions=predictions,
            durationMs=duration_ms,
        )

    except Exception as e:
        print(f"Prediction error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference execution failed: {str(e)}",
        )
