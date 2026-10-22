# SolarSense Deployment Guide

## Overview

SolarSense is designed for zero-config multi-cloud deployment:
- **Frontend SPA:** Vercel, Netlify, or Cloudflare Pages (Static Vite build)
- **Backend API:** Render, Railway, or Fly.io (Node.js container)
- **ML Microservice:** Render or Railway (Python 3.11 Docker container)
- **Database:** MongoDB Atlas (M0 Free Tier or M10+ Production)

---

## 1. Environment Configurations

### Backend (`backend/.env`)
```ini
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/solarsense_prod?retryWrites=true&w=majority
JWT_ACCESS_SECRET=your-super-secret-random-32-byte-string
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-32-byte-string
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12
CORS_ORIGINS=https://solarsense.vercel.app
COOKIE_SECURE=true
COOKIE_SAMESITE=none
COOKIE_DOMAIN=
WEATHER_API_BASE_URL=https://api.open-meteo.com/v1/forecast
WEATHER_GEOCODING_BASE_URL=https://geocoding-api.open-meteo.com/v1/search
WEATHER_TIMEOUT_MS=8000
WEATHER_CACHE_TTL_MINUTES=60
ML_SERVICE_URL=https://solarsense-ml.onrender.com
ML_INTERNAL_KEY=your-shared-internal-secret-key-32-chars
ML_TIMEOUT_MS=10000
FORECAST_MAX_HORIZON_DAYS=7
LOG_LEVEL=info
ADMIN_SEED_NAME="System Administrator"
ADMIN_SEED_EMAIL="admin@solarsense.internal"
ADMIN_SEED_PASSWORD="ChangeMeInProd123!"
```

### Frontend (`frontend/.env`)
```ini
VITE_API_URL=https://solarsense-api.onrender.com/api
```

### ML Service (`ml/.env`)
```ini
PORT=8000
ML_INTERNAL_KEY=your-shared-internal-secret-key-32-chars
ML_MODEL_VERSION=v1.0.0
LOG_LEVEL=info
```

---

## 2. Step-by-Step Deployment

### 1. MongoDB Atlas Setup
1. Create a MongoDB Atlas cluster.
2. In **Database Access**, create a user with `readWriteAnyDatabase` privileges.
3. In **Network Access**, add the egress IP addresses of your backend deployment (or `0.0.0.0/0` with strong authentication).
4. Copy the connection string to `MONGODB_URI`.

### 2. Deploy Python ML Service
1. Deploy the `ml/` directory using the provided `Dockerfile` or Python environment.
2. Ensure `ML_INTERNAL_KEY` matches the backend configuration.
3. Verify `GET /health` returns `{"status": "ok", "modelLoaded": true}`.

### 3. Deploy Express Backend
1. Deploy the `backend/` directory.
2. Run database index creation and seed scripts:
   ```bash
   node scripts/seed-settings.js
   node scripts/seed-admin.js
   node scripts/db-indexes.js
   ```
3. Verify `GET /api/health` returns `db: "ok"` and `ml: "ok"`.

### 4. Deploy Frontend
1. Set `VITE_API_URL` to point to the backend domain.
2. Run `npm run build` to generate the production `dist/` bundle.
3. Configure SPA rewrites in `vercel.json` or `_redirects` for Netlify (`/* -> /index.html 200`).
