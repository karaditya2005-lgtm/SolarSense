# SolarSense Meteorological & Generation Dataset Documentation

## 1. Dataset Provenance & Overview

- **Dataset Name:** Solar Generation and Meteorological Benchmark Dataset (Photovoltaic Output & Solar Irradiance)
- **Source & Provenance:** Synthesized from Open-Meteo Historical Solar Archives & NREL PVWatts Benchmark physical profiles for a grid-connected commercial PV installation.
- **Reference Location:**
  - Latitude: 28.6139° N
  - Longitude: 77.2090° E
  - Elevation: 216 m above sea level
  - Timezone: Asia/Kolkata (UTC+5:30)
- **Installation Physical Specifications:**
  - Nameplate DC Capacity: 50.0 kW
  - Nominal Inverter AC Capacity: 45.0 kW
  - Fixed Array Tilt: 28.0° (optimal latitude-matched tilt)
  - Fixed Array Azimuth: 180.0° (due south)
  - Module Type: Standard Polycrystalline Silicon (Temperature coefficient: -0.41 %/°C)
- **Observation Period:** Complete annual multi-month hourly series spanning 8,760 continuous hourly intervals.
- **License:** Open Database License (ODbL) / Creative Commons Attribution 4.0 International (CC-BY 4.0).

---

## 2. Variables & Schema

| Column | Unit | Physical Range | Description |
|---|---|---|---|
| `timestamp` | ISO 8601 UTC | — | Timestamp of hourly observation |
| `latitude` | Degrees | [-90, 90] | Geodetic latitude |
| `longitude` | Degrees | [-180, 180] | Geodetic longitude |
| `ghiWm2` | W/m² | [0, 1400] | Global Horizontal Irradiance |
| `dniWm2` | W/m² | [0, 1200] | Direct Normal Irradiance |
| `dhiWm2` | W/m² | [0, 800] | Diffuse Horizontal Irradiance |
| `temperatureC` | °C | [-10, 55] | Ambient 2-meter air temperature |
| `cloudCoverPct` | % | [0, 100] | Total cloud cover percentage |
| `humidityPct` | % | [0, 100] | Relative humidity |
| `windSpeedMs` | m/s | [0, 35] | Wind speed at 10 meters |
| `solarElevationDeg` | Degrees | [-90, 90] | Solar altitude angle above horizon |
| `capacityKw` | kW | > 0 | Plant nameplate capacity (50.0 kW benchmark) |
| `acPowerKw` | kW | [0, 48.0] | Observed AC electricity fed to grid |
| `capacityFactor` | Ratio | [0.0, 1.0] | Normalized output (`acPowerKw / capacityKw`) |

---

## 3. Preprocessing & Validation

1. **Chronological Integrity:** The dataset is strictly ordered chronologically. Evaluation splits preserve sequence to prevent lookahead data leakage.
2. **Physical Bounds:** Solar elevation below 0° strictly forces irradiance to 0 and power generation to 0.0 kW.
3. **Capacity Normalization:** Training optimizes for `capacityFactor`, permitting the model to generalize across arbitrary system capacities ($0.1\text{ kW}$ to $10,000\text{ kW}$) specified by the end user during inference.
