# SolarSense REST API Specification

**Base URL:** `/api`
**Standard Response Envelope:**
```json
// Success
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 100, "totalPages": 5 }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [{ "field": "email", "message": "Invalid email address" }],
    "requestId": "c1f729e8-46d4"
  }
}
```

## Public & Health
- `GET /api/health` — Returns status of API server, MongoDB connection, and ML service.
- `GET /api/public/stats` — Returns aggregate platform counts (total forecasts, total users).
- `POST /api/contact` — Submits a contact inquiry to `contactMessages`.

## Authentication
- `POST /api/auth/register` — Register a new user (`name`, `email`, `password`).
- `POST /api/auth/login` — Authenticate credentials, issues short-lived access JWT and sets `refreshToken` HTTP-only cookie.
- `POST /api/auth/refresh` — Rotates refresh token and returns new access token.
- `POST /api/auth/logout` — Revokes refresh session and clears cookie.
- `GET /api/auth/me` — Returns current authenticated user profile.
- `PATCH /api/auth/change-password` — Updates password, revokes existing active sessions.

## User Self-Service
- `GET /api/users/me` — Fetch user profile and preferences.
- `PATCH /api/users/me` — Update name, phone, organization, or preferences.
- `DELETE /api/users/me` — Delete own account with password confirmation.

## Solar Forecasts
- `POST /api/forecasts` — Submit forecast parameters (location query or coords, target time, capacity).
- `GET /api/forecasts` — List own forecasts with pagination, status/location filtering, and sorting.
- `GET /api/forecasts/:id` — View full forecast details, weather snapshot, and hourly prediction curve.
- `POST /api/forecasts/:id/rerun` — Generate fresh forecast with identical parameters.
- `DELETE /api/forecasts/:id` — Delete a forecast record.
- `GET /api/forecasts/stats` — User forecast analytics and top locations.

## Dashboard
- `GET /api/dashboard/summary` — Aggregates latest forecast, recent 5 forecasts, summary stats, and weather indicators.

## Weather Proxy
- `GET /api/weather/geocode?q={query}` — Reverse geocoding via Open-Meteo.
- `GET /api/weather/current?latitude={lat}&longitude={lon}` — Current conditions.
- `GET /api/weather/forecast?latitude={lat}&longitude={lon}&date={YYYY-MM-DD}` — Hourly forecast.
- `GET /api/solar-data` — Read-only reference solar data for comparative charts.

## Admin Management (Role: `admin`)
- `GET /api/admin/stats` — Platform metrics, per-day forecast volume, ML health.
- `GET /api/admin/users` — Paginated user search and filter.
- `GET /api/admin/users/:id` — User profile details with forecast history count.
- `PATCH /api/admin/users/:id` — Update role or suspend/activate user (protected by last-admin guard).
- `DELETE /api/admin/users/:id` — Delete user with optional cascade forecast removal.
- `GET /api/admin/solar-data` — List benchmark datasets.
- `POST /api/admin/solar-data` — Add individual solar record.
- `POST /api/admin/solar-data/import` — Multipart CSV import with error report.
- `GET /api/admin/solar-data/export` — Stream filtered solar data as CSV.
- `GET /api/admin/forecasts` — Filter and view all system forecasts.
- `DELETE /api/admin/forecasts/:id` — Delete forecast record.
- `GET /api/admin/messages` — Review contact messages.
- `PATCH /api/admin/messages/:id` — Update message status (`new`, `read`, `resolved`).
- `DELETE /api/admin/messages/:id` — Delete contact message.
- `GET /api/admin/settings` — List configurable system settings.
- `PATCH /api/admin/settings/:key` — Update system setting.
- `GET /api/admin/logs` — Query structured system audit logs.
- `GET /api/admin/model` — View active model version and evaluation metrics directly from ML service.
