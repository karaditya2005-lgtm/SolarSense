# SolarSense — Solar Power Forecasting Platform

[![Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20FastAPI%20%7C%20MongoDB-amber.svg)](https://github.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**SolarSense** is an enterprise-grade, end-to-end solar power forecasting platform built for homeowners, solar farm operators, energy researchers, and grid analysts. It combines real-time meteorological forecasts from the Open-Meteo API, solar geometry physics, and trained machine learning models (Random Forest / Gradient Boosting) to deliver accurate hourly and daily solar photovoltaic (PV) generation estimates.

---

## 🌟 Key Features

- **Real-Time Forecasting:** Combines live meteorological data (GHI, DNI, DHI, Temperature, Cloud Cover, Humidity, Wind Speed) with trained machine learning estimators.
- **Interactive Multi-Mode Estimation:** Supports single-hour pinpoint forecasts and full 24-hour diurnal output curves with daily energy totals (kWh).
- **Zero Mocking Governing Principle:** Every single number, chart, and metric is derived directly from live database records, real weather APIs, or trained ML inference.
- **Secure Role-Based Access Control (RBAC):** Distinct `user` and `admin` roles, secured with short-lived JWT access tokens and HTTP-only rotating refresh cookies.
- **Enterprise Admin Tooling:** Full CRUD on solar dataset benchmarks, CSV import/export with row-level validation reports, system audit logging, live model metric introspection, and user management with self-demotion guards.
- **Honest Machine Learning:** All accuracy claims, MAE, RMSE, and R² scores are derived exclusively from reproducible training benchmarks saved in `ml/models/*/metadata.json`.

---

## 🏛 Architecture Overview

```
┌─────────────────┐       HTTPS / JSON       ┌────────────────────────┐       Mongoose       ┌─────────────────────┐
│                 │ ───────────────────────▶ │                        │ ───────────────────▶ │                     │
│    React SPA    │                          │   Express API Server   │                      │    MongoDB Atlas    │
│  (Vite + TW)    │ ◀─────────────────────── │       (Node.js)        │ ◀─────────────────── │                     │
└─────────────────┘                          └────────────────────────┘                      └─────────────────────┘
                                                          │
                                         ┌────────────────┴────────────────┐
                                         │                                 │
                                         ▼ HTTPS                           ▼ REST / JSON (X-Internal-Key)
                              ┌─────────────────────┐           ┌─────────────────────┐
                              │  Open-Meteo APIs    │           │  FastAPI ML Service │
                              │ (Geocode & Weather) │           │    (Python 3.11+)   │
                              └─────────────────────┘           └─────────────────────┘
```

---

## 📁 Repository Structure

```
solarsense/
├── PRD.md                        # Master Product Requirements Document
├── README.md                     # Project documentation & quickstart
├── docs/                         # In-depth architectural & deployment guides
│   ├── architecture.md           # Full system architecture and request lifecycle
│   ├── api.md                    # Complete REST API specification
│   ├── database.md               # MongoDB schemas, relationships, and indexing
│   ├── deployment.md             # Production setup for Vercel, Render, Atlas
│   └── decisions/                # Architecture Decision Records (ADRs)
├── frontend/                     # React 18 + Vite + Tailwind CSS + TanStack Query SPA
├── backend/                      # Node.js + Express 5 + Mongoose + Zod API Server
└── ml/                           # Python 3.11+ FastAPI ML Microservice & Training Pipeline
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js:** v20.x or v22.x LTS
- **Python:** v3.11+
- **MongoDB:** MongoDB Atlas connection string (or local MongoDB)

### 1. ML Service Setup
```bash
cd ml
uv venv
# or: python -m venv .venv && source .venv/bin/activate
uv pip install -r requirements.txt
python -m src.train
uvicorn src.app:app --port 8000 --reload
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure MONGODB_URI and JWT secrets in .env
npm run seed:settings
npm run seed:admin
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.
The backend runs at `http://localhost:5000`.
The ML service runs at `http://localhost:8000`.
