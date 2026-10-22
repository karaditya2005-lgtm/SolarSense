"""
Pydantic schemas for the SolarSense ML FastAPI Microservice.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator


class WeatherInstance(BaseModel):
    timestamp: str = Field(..., description="ISO 8601 UTC timestamp")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude in degrees")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude in degrees")
    ghiWm2: float = Field(..., ge=0.0, le=1600.0, description="Global Horizontal Irradiance in W/m²")
    dniWm2: Optional[float] = Field(default=0.0, ge=0.0, le=1400.0, description="Direct Normal Irradiance in W/m²")
    dhiWm2: Optional[float] = Field(default=0.0, ge=0.0, le=1000.0, description="Diffuse Horizontal Irradiance in W/m²")
    temperatureC: float = Field(..., ge=-60.0, le=75.0, description="Ambient temperature in °C")
    cloudCoverPct: float = Field(..., ge=0.0, le=100.0, description="Total cloud cover percentage")
    humidityPct: float = Field(..., ge=0.0, le=100.0, description="Relative humidity percentage")
    windSpeedMs: float = Field(..., ge=0.0, le=100.0, description="Wind speed at 10m in m/s")
    tiltDeg: Optional[float] = Field(default=None, ge=0.0, le=90.0, description="Array tilt in degrees")
    azimuthDeg: Optional[float] = Field(default=180.0, ge=0.0, le=360.0, description="Array azimuth in degrees")
    solarElevationDeg: Optional[float] = Field(default=None, ge=-90.0, le=90.0, description="Optional solar elevation")


class PredictRequest(BaseModel):
    instances: List[WeatherInstance] = Field(..., min_length=1, max_length=168, description="Batch of hourly instances")
    capacityKw: float = Field(..., gt=0.0, le=10000.0, description="System nameplate AC capacity in kW")


class PredictionItem(BaseModel):
    timestamp: str
    powerKw: float
    capacityFactor: float
    solarElevationDeg: float


class PredictResponse(BaseModel):
    model: Dict[str, str]
    predictions: List[PredictionItem]
    durationMs: float


class ModelInfoResponse(BaseModel):
    name: str
    version: str
    trainedAt: str
    features: List[str]
    metrics: Dict[str, Any]
    dataset: str
    hyperparameters: Optional[Dict[str, Any]] = None
    baselineComparison: Optional[Dict[str, Any]] = None


class HealthResponse(BaseModel):
    status: str
    modelLoaded: bool
    modelVersion: str
    uptimeSeconds: float
