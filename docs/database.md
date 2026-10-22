# SolarSense Database Architecture

## Overview
SolarSense utilizes MongoDB Atlas with Mongoose ODM for structured, high-performance, and indexed persistence.

## Collections & Schemas

### 1. `users`
Stores user credentials, roles, profile preferences, and rotating refresh token sessions.
- `_id`: ObjectId
- `name`: String (2–80 chars, trimmed)
- `email`: String (lowercase, trimmed, unique indexed)
- `passwordHash`: String (bcrypt, select: false)
- `role`: Enum [`"user"`, `"admin"`], default `"user"`
- `status`: Enum [`"active"`, `"suspended"`], default `"active"`
- `phone`: String (optional)
- `organization`: String (optional)
- `preferences`: Object with `units`, `defaultLocation`, `defaultCapacityKw`
- `refreshTokens`: Array of `{ tokenHash, expiresAt, createdAt, userAgent, ip }` (select: false, max 5)
- `lastLoginAt`: Date
- `passwordChangedAt`: Date
- `createdAt`, `updatedAt`: Timestamps

### 2. `forecasts`
Stores every generated forecast alongside input parameters, weather snapshot, feature vectors, and prediction results.
- `_id`: ObjectId
- `userId`: ObjectId (ref: `users`, indexed)
- `location`: `{ name, latitude, longitude, timezone, country }`
- `targetDateTime`: Date (UTC)
- `mode`: Enum [`"single"`, `"day"`]
- `system`: `{ capacityKw, tiltDeg, azimuthDeg }`
- `weatherSnapshot`: `{ source, fetchedAt, hourly: [...] }`
- `features`: Exact feature vector sent to ML model
- `prediction`: `{ targetPowerKw, unit: "kW", hourly: [...], dayEnergyKwh, confidence }`
- `model`: `{ name, version, trainedAt }`
- `status`: Enum [`"pending"`, `"completed"`, `"failed"`]
- `errorCode`: String (on failure)
- `errorMessage`: String (safe user-facing error)
- `durationMs`: Number
- `createdAt`, `updatedAt`: Timestamps

### 3. `solarData`
Admin-managed ground-truth or benchmark solar radiation and power records used for evaluation, model auditing, and comparison charts.
- `_id`: ObjectId
- `location`: `{ name, latitude, longitude, timezone }`
- `timestamp`: Date (UTC)
- `ghiWm2`: Number (0–1500)
- `dniWm2`, `dhiWm2`: Number
- `temperatureC`: Number (-60–70)
- `cloudCoverPct`, `humidityPct`, `windSpeedMs`: Numbers
- `acPowerKw`: Number (measured AC power output)
- `capacityKw`: Number
- `source`: String (mandatory provenance)
- `createdBy`: ObjectId (ref: `users`)
- Indexes: Unique compound index on `{ "location.latitude": 1, "location.longitude": 1, timestamp: 1, source: 1 }`

### 4. `weatherData` (Cache)
External API response cache for Open-Meteo queries.
- `key`: String (e.g. `48.85:2.35:2026-10-22`, unique indexed)
- `latitude`, `longitude`: Number (rounded to 2 decimal places)
- `timezone`: String
- `provider`: String (`"open-meteo"`)
- `hourly`: Array of weather parameters
- `fetchedAt`: Date
- `expiresAt`: Date (**TTL Index** with `expireAfterSeconds: 0`)

### 5. `systemLogs`
Structured audit log of critical system operations (e.g., user registration, suspension, admin settings updates, forecast failures).
- `level`: Enum [`"info"`, `"warn"`, `"error"`]
- `type`: Enum [`"auth"`, `"forecast"`, `"admin"`, `"ml"`, `"weather"`, `"system"`]
- `action`: String (e.g. `"USER_SUSPENDED"`, `"FORECAST_COMPLETED"`)
- `actorId`: ObjectId (ref: `users`, optional)
- `targetType`, `targetId`: String, ObjectId
- `message`: String (safe, sanitized)
- `meta`: Mixed
- `requestId`: String
- `createdAt`: Date (indexed with TTL retention)

### 6. `contactMessages`
Inquiries submitted via the public contact form.
- `name`: String
- `email`: String
- `subject`: String
- `message`: String
- `status`: Enum [`"new"`, `"read"`, `"resolved"`]
- `userId`: ObjectId (optional)

### 7. `settings`
System-wide configuration editable by administrators.
- `key`: String (unique)
- `value`: Mixed
- `type`: Enum [`"number"`, `"boolean"`, `"string"`]
- `description`: String
- `updatedBy`: ObjectId (ref: `users`)

### 8. `modelVersions`
Registry of trained models, hyper-parameters, training dates, and evaluation scores synced from ML metadata.
- `name`, `version`: String
- `trainedAt`: Date
- `datasetDescription`: String
- `featureList`: Array of Strings
- `metrics`: `{ mae, rmse, r2, nmae }`
- `isActive`: Boolean
