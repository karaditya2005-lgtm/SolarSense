# SolarSense System Architecture

## 1. System Topology

SolarSense is composed of three decoupled runtime components and an external database:

1. **Client Tier (`frontend/`):** React 18 Single Page Application built with Vite and Tailwind CSS. Communicates exclusively with the Express backend over HTTPS.
2. **Application Tier (`backend/`):** Express 5 REST API server running on Node.js 20+. Handles authentication, user session state, database interactions, weather API proxying, and communication with the ML microservice.
3. **Inference Tier (`ml/`):** Python FastAPI microservice that loads trained scikit-learn models (Random Forest / Gradient Boosting) and executes deterministic inference against meteorological feature vectors.
4. **Data Tier (MongoDB Atlas):** Document database storing user profiles, forecast logs, cached weather snapshots (with TTL expiration), admin audit logs, contact inquiries, and benchmark solar data.

```
┌──────────────────┐               ┌──────────────────┐               ┌──────────────────┐
│   React SPA      │  HTTP/JSON    │   Express API    │   Mongoose    │  MongoDB Atlas   │
│ (Vite/Tailwind)  │ ────────────▶ │  (Node.js 20+)   │ ────────────▶ │  (Data Tier)     │
│                  │ ◀──────────── │                  │ ◀──────────── │                  │
└──────────────────┘               └──────────────────┘               └──────────────────┘
                                            │
                                            ├─ (Open-Meteo API)
                                            │   Geocoding & Hourly Solar Forecasts
                                            │
                                            ▼  HTTP/JSON (X-Internal-Key)
                                   ┌──────────────────┐
                                   │  Python FastAPI  │
                                   │  (Inference Tier)│
                                   └──────────────────┘
```

## 2. Request Lifecycle: Solar Power Forecast

When a user submits a forecast request via the UI:

1. **Client Submission:** User enters either a text query (e.g., `"Berlin, Germany"`) or coordinates (`lat`, `lon`), target date/time, and system capacity (kW).
2. **Validation:** Backend `validate` middleware verifies payload against Zod schema (`forecastValidators.createForecastSchema`).
3. **Geocoding & Resolution:** If a string query was provided, `weather.service` queries Open-Meteo Geocoding to resolve latitude, longitude, and timezone.
4. **Meteorological Snapshot:**
   - Backend checks `WeatherData` MongoDB cache using key `${lat.toFixed(2)}:${lon.toFixed(2)}:${date}`.
   - If cache miss or expired, calls Open-Meteo Hourly Forecast API to fetch GHI, DNI, DHI, temperature, cloud cover, relative humidity, wind speed, and precipitation.
   - Snapshot is saved to cache with a 60-minute TTL index.
5. **Feature Engineering:**
   - Features (solar irradiance, temperature, humidity, wind, solar elevation angle, sin/cos time encoding) are prepared according to the feature contract.
6. **ML Service Call:**
   - Backend `mlClient.service` invokes `POST /predict` on the FastAPI microservice with `X-Internal-Key` authentication header.
   - FastAPI validates instances using Pydantic, applies the trained model, enforces physical constraints (clipping within `[0, capacityKw]` and setting output to 0 at night / negative elevation), and returns predictions.
7. **Persistence & Response:**
   - Backend creates a `Forecast` record with status `completed`, input summary, weather snapshot, feature vectors, and prediction array.
   - System log event is recorded.
   - 201 Created response is returned to frontend, which renders the interactive line and bar charts.
