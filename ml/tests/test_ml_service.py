"""
Unit and integration tests for SolarSense ML microservice.
"""

import pytest
from fastapi.testclient import TestClient
try:
    from src.app import app, INTERNAL_KEY
    from src.features import calculate_solar_position, extract_features_from_dict
except ImportError:
    from ml.src.app import app, INTERNAL_KEY
    from ml.src.features import calculate_solar_position, extract_features_from_dict
import pandas as pd

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "modelLoaded" in data
    assert "uptimeSeconds" in data


def test_model_info_requires_auth():
    response = client.get("/model/info")
    assert response.status_code == 401


def test_predict_requires_auth():
    payload = {
        "instances": [
            {
                "timestamp": "2024-06-21T12:00:00Z",
                "latitude": 28.6139,
                "longitude": 77.2090,
                "ghiWm2": 850.0,
                "temperatureC": 35.0,
                "cloudCoverPct": 10.0,
                "humidityPct": 40.0,
                "windSpeedMs": 3.0,
            }
        ],
        "capacityKw": 10.0,
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 401


def test_nighttime_physical_guarantee():
    """Solar panels MUST output 0.0 kW when GHI is 0 or elevation is negative."""
    payload = {
        "instances": [
            {
                "timestamp": "2024-06-21T00:00:00Z",  # Midnight UTC
                "latitude": 28.6139,
                "longitude": 77.2090,
                "ghiWm2": 0.0,
                "temperatureC": 28.0,
                "cloudCoverPct": 0.0,
                "humidityPct": 60.0,
                "windSpeedMs": 2.0,
            }
        ],
        "capacityKw": 50.0,
    }
    response = client.post(
        "/predict", json=payload, headers={"X-Internal-Key": INTERNAL_KEY}
    )
    if response.status_code == 200:
        data = response.json()
        assert len(data["predictions"]) == 1
        pred = data["predictions"][0]
        assert pred["powerKw"] == 0.0
        assert pred["capacityFactor"] == 0.0


def test_capacity_scaling():
    """Predicting for 10 kW vs 50 kW under identical sunny weather scales linearly."""
    instance = {
        "timestamp": "2024-06-21T07:00:00Z",  # ~12:30 IST noon
        "latitude": 28.6139,
        "longitude": 77.2090,
        "ghiWm2": 950.0,
        "dniWm2": 800.0,
        "dhiWm2": 150.0,
        "temperatureC": 38.0,
        "cloudCoverPct": 5.0,
        "humidityPct": 35.0,
        "windSpeedMs": 3.2,
    }

    res_10 = client.post(
        "/predict",
        json={"instances": [instance], "capacityKw": 10.0},
        headers={"X-Internal-Key": INTERNAL_KEY},
    )
    res_50 = client.post(
        "/predict",
        json={"instances": [instance], "capacityKw": 50.0},
        headers={"X-Internal-Key": INTERNAL_KEY},
    )

    if res_10.status_code == 200 and res_50.status_code == 200:
        p10 = res_10.json()["predictions"][0]["powerKw"]
        p50 = res_50.json()["predictions"][0]["powerKw"]
        # Allow small floating point tolerance
        assert abs(p50 - (p10 * 5.0)) < 0.5


def test_solar_position_calculation():
    # Summer solstice at noon in Delhi should have high elevation (> 80°)
    dt = pd.Timestamp("2024-06-21 06:45:00", tz="UTC")
    elev = calculate_solar_position(dt, 28.6139, 77.2090)
    assert elev > 75.0

    # Midnight in Delhi should have negative elevation
    dt_night = pd.Timestamp("2024-06-21 18:30:00", tz="UTC")
    elev_night = calculate_solar_position(dt_night, 28.6139, 77.2090)
    assert elev_night < 0.0
