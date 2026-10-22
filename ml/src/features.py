"""
SolarSense Feature Engineering Module
Single source of truth for feature engineering used in both training and inference.
"""

import math
import numpy as np
import pandas as pd
from typing import Dict, Any, List

FEATURE_NAMES = [
    "ghiWm2",
    "dniWm2",
    "dhiWm2",
    "temperatureC",
    "cloudCoverPct",
    "humidityPct",
    "windSpeedMs",
    "solarElevationDeg",
    "hourSin",
    "hourCos",
    "daySin",
    "dayCos",
]


def calculate_solar_position(
    dt_utc: pd.Timestamp, latitude: float, longitude: float
) -> float:
    """
    Computes solar elevation angle (degrees) using standard solar astronomical geometry.
    Positive indicates the sun is above the horizon.
    """
    day_of_year = dt_utc.dayofyear
    hour = dt_utc.hour + dt_utc.minute / 60.0 + dt_utc.second / 3600.0

    # Fractional year in radians
    gamma = 2.0 * math.pi / 365.0 * (day_of_year - 1 + (hour - 12.0) / 24.0)

    # Equation of time in minutes
    eqtime = 229.18 * (
        0.000075
        + 0.001868 * math.cos(gamma)
        - 0.032077 * math.sin(gamma)
        - 0.014615 * math.cos(2.0 * gamma)
        - 0.040849 * math.sin(2.0 * gamma)
    )

    # Solar declination angle (radians)
    decl = (
        0.006918
        - 0.399912 * math.cos(gamma)
        + 0.070257 * math.sin(gamma)
        - 0.006758 * math.cos(2.0 * gamma)
        + 0.000907 * math.sin(2.0 * gamma)
        - 0.002697 * math.cos(3.0 * gamma)
        + 0.001480 * math.sin(3.0 * gamma)
    )

    # True solar time
    time_offset = eqtime + 4.0 * longitude
    tst = (hour * 60.0 + time_offset) % 1440.0
    ha = math.radians((tst / 4.0) - 180.0)

    lat_rad = math.radians(latitude)

    # Solar zenith angle
    cos_zenith = math.sin(lat_rad) * math.sin(decl) + math.cos(
        lat_rad
    ) * math.cos(decl) * math.cos(ha)
    cos_zenith = max(-1.0, min(1.0, cos_zenith))
    zenith_deg = math.degrees(math.acos(cos_zenith))
    elevation_deg = 90.0 - zenith_deg

    return elevation_deg


def extract_features_from_dict(
    instance: Dict[str, Any], default_lat: float = 28.6139, default_lon: float = 77.2090
) -> Dict[str, float]:
    """
    Transforms a raw input dictionary (from API request or dataset row) into the model's feature vector.
    """
    timestamp_raw = instance.get("timestamp")
    if isinstance(timestamp_raw, str):
        dt = pd.to_datetime(timestamp_raw, utc=True)
    elif isinstance(timestamp_raw, pd.Timestamp):
        dt = timestamp_raw.tz_convert("UTC") if timestamp_raw.tz else timestamp_raw.tz_localize("UTC")
    else:
        dt = pd.Timestamp.now(tz="UTC")

    lat = float(instance.get("latitude", default_lat))
    lon = float(instance.get("longitude", default_lon))

    # Calculate or retrieve solar elevation
    if "solarElevationDeg" in instance and instance["solarElevationDeg"] is not None:
        elev = float(instance["solarElevationDeg"])
    else:
        elev = calculate_solar_position(dt, lat, lon)

    hour = dt.hour + dt.minute / 60.0
    day = dt.dayofyear

    hour_sin = math.sin(2.0 * math.pi * hour / 24.0)
    hour_cos = math.cos(2.0 * math.pi * hour / 24.0)
    day_sin = math.sin(2.0 * math.pi * day / 365.25)
    day_cos = math.cos(2.0 * math.pi * day / 365.25)

    ghi = max(0.0, float(instance.get("ghiWm2", 0.0)))
    dni = max(0.0, float(instance.get("dniWm2", 0.0)))
    dhi = max(0.0, float(instance.get("dhiWm2", 0.0)))
    temp = float(instance.get("temperatureC", 25.0))
    cloud = max(0.0, min(100.0, float(instance.get("cloudCoverPct", 0.0))))
    humidity = max(0.0, min(100.0, float(instance.get("humidityPct", 50.0))))
    wind = max(0.0, float(instance.get("windSpeedMs", 2.0)))

    return {
        "ghiWm2": ghi,
        "dniWm2": dni,
        "dhiWm2": dhi,
        "temperatureC": temp,
        "cloudCoverPct": cloud,
        "humidityPct": humidity,
        "windSpeedMs": wind,
        "solarElevationDeg": elev,
        "hourSin": hour_sin,
        "hourCos": hour_cos,
        "daySin": day_sin,
        "dayCos": day_cos,
    }


def prepare_feature_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transforms a DataFrame with raw meteorological columns into model features.
    """
    records = []
    for _, row in df.iterrows():
        records.append(extract_features_from_dict(row.to_dict()))
    return pd.DataFrame(records)[FEATURE_NAMES]
