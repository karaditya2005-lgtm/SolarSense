# ADR 001: Technology Stack and Architecture Selection

## Status
Accepted

## Context
SolarSense is a full-stack solar power forecasting platform requiring real-time weather integration, fast geographic coordinate resolution, strict multi-role authentication, high-throughput persistence, and machine-learning-based solar photovoltaic energy forecasting.

## Decision
1. **Frontend:** React 18 + Vite + Tailwind CSS + TypeScript.
   - *Rationale:* Vite provides sub-second HMR and optimized production bundles. Tailwind CSS enables custom design system tokens with high visual polish and zero runtime CSS overhead. TypeScript provides end-to-end type safety for API contracts.
2. **Backend API:** Node.js (v20+ LTS) + Express + Mongoose (MongoDB Atlas).
   - *Rationale:* Asynchronous I/O is ideal for orchestrating external APIs (Open-Meteo) and forwarding payloads to the ML service. Mongoose offers schema enforcement, indexing, and TTL support.
3. **ML Microservice:** Python 3.11+ + FastAPI + scikit-learn + uvicorn.
   - *Rationale:* Python is the industry standard for scientific computation. FastAPI provides asynchronous high-performance REST endpoints with Pydantic validation. Running ML as a decoupled microservice prevents heavy numerical operations from blocking the Node.js event loop.
4. **Authentication:** Dual-token strategy with short-lived in-memory Access JWT (15 mins) and rotating HTTP-only Secure Refresh Token cookies (7 days) with reuse detection.
5. **Weather Provider:** Open-Meteo APIs for both reverse geocoding and hourly solar radiation forecasts (Global Horizontal Irradiance, Direct Normal Irradiance, Diffuse Horizontal Irradiance). Server-side proxying ensures security and enables response caching with MongoDB TTL indexes.
6. **ML Asset Audit:** No prior legacy models existed in the active repository. A real, documented solar irradiance and generation dataset has been assembled in `ml/data/` with full provenance, enabling reproducible training benchmarks.

## Consequences
- Requires orchestrating three lightweight services (Frontend, Express Backend, FastAPI ML).
- High reliability: if the ML service is temporarily down, the backend fails gracefully with descriptive error codes rather than hanging.
- Clean separation of concerns between data persistence, weather proxying, and statistical inference.
