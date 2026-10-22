# SolarSense — Product Requirements Document (PRD)

| | |
|---|---|
| **Project** | SolarSense — Solar Power Forecasting Platform |
| **Type** | MCA final-year project, production-style full-stack application |
| **Document status** | v1.0 — implementation-ready specification (no application code in this document) |
| **Stack** | React + Vite + Tailwind CSS · Node.js + Express + Mongoose · MongoDB Atlas · Python ML service |

> **Governing rule:** every number shown in the product must originate from a real source: the database, an external weather/solar API, or the trained ML model. No hardcoded results, fake APIs, randomly generated predictions, or buttons without behaviour in the final application.

---

## 1. Overview

SolarSense is a web application that lets users generate **solar power forecasts** for a chosen location and time, using real weather/solar-radiation data and a trained machine-learning model. Forecasts are saved per user so they can review history, compare forecasts, and see charts and statistics. Administrators manage users, solar datasets, forecast records, contact messages, and system settings, and monitor prediction activity.

**What solar forecasting is.** Solar power output depends on solar irradiance, cloud cover, temperature, time of day, and season. Forecasting estimates how much electrical power a solar installation will produce at a future time.

**Why it is useful.** Better forecasts help owners plan consumption, help operators schedule storage and backup, and help grids balance supply and demand.

**What the system does.**

1. Resolves a location to coordinates (geocoding API).
2. Fetches real forecast weather/irradiance data for the target time (weather API, called server-side only).
3. Builds a validated feature vector and sends it to a Python ML service.
4. Receives a structured prediction and stores input, weather snapshot, prediction, and model version in MongoDB Atlas.
5. Displays results with charts; makes history searchable.

### 1.1 Scope boundaries

In scope: everything in this PRD. Out of scope (see §25): real-time inverter/IoT integration, payment, multi-tenant organisations, native mobile apps.

### 1.2 Honesty requirements for ML

- Model accuracy is shown **only** from metrics actually computed during training/evaluation and stored in model metadata.
- The UI never states accuracy figures that are not in `ml/models/*/metadata.json`.
- Forecast results carry a disclaimer that predictions are estimates.

---

## 2. Goals

| ID | Goal | Measure |
|---|---|---|
| G1 | Real end-to-end forecasting | A forecast request travels React → Express → weather API → ML service → MongoDB → React with no mocked step |
| G2 | Secure multi-role platform | Users cannot reach admin APIs; passwords hashed; JWT validated on every protected route |
| G3 | Persistent history | Every forecast is stored and retrievable by its owner and by admins |
| G4 | Professional admin tooling | Admin can CRUD solar data, manage users, view/filter forecasts, view stats; all backed by real APIs |
| G5 | Honest ML | Trained from a documented dataset; metrics reproducible via a training script |
| G6 | Deployable | Frontend, backend, ML service, and Atlas deployed with env-based configuration |
| G7 | Maintainable | Layered backend, modular ML, reusable frontend components, automated tests on core flows |

**Non-goals:** competing with commercial forecasting accuracy; real-time streaming telemetry.

---

## 3. Target Users

1. **Solar owners / homeowners / small-business owners** who want an estimate of expected output.
2. **Students / researchers / analysts** exploring solar potential for locations and dates.
3. **System administrators** who maintain data quality, users, and platform health.
4. **Project evaluators** (academic) who assess architecture, correctness, and completeness.

---

## 4. User Roles

| Capability | Public (guest) | User (`user`) | Administrator (`admin`) |
|---|:-:|:-:|:-:|
| Browse public pages | Yes | Yes | Yes |
| Register / log in | Yes | — | — |
| Dashboard, forecasts, history, profile, settings (own data) | No | Yes | Yes |
| View other users' data | No | No | Yes (admin APIs only) |
| Manage users, solar data, settings, contact messages | No | No | Yes |

**Rules**

- Role is stored on the user document (`role: "user" | "admin"`) and embedded in the JWT, but **authorization re-checks the role from the database** on admin routes (so demotion/deactivation takes effect immediately).
- Public registration always creates `role: "user"`. Admin accounts are created only by a seed script (`npm run seed:admin`) or by an existing admin promoting a user.
- A deactivated user (`status: "suspended"`) cannot log in and existing tokens are rejected.
- The last remaining active admin cannot be deleted, deactivated, or demoted (guard in service layer).

---

## 5. Functional Requirements

### 5.1 Public website (FR-PUB)

| ID | Requirement |
|---|---|
| FR-PUB-1 | Pages: Home, About, Features, How It Works, Contact, Login, Register. No authentication required. |
| FR-PUB-2 | Home explains what forecasting is, why it matters, what SolarSense does, main benefits, and has a call-to-action leading to Register (guest) or Solar Forecast (logged-in). |
| FR-PUB-3 | Contact form submits to `POST /api/contact`, persists in `contactMessages`, shows success/error feedback, and is visible in the admin panel. |
| FR-PUB-4 | Public pages share a header/footer layout; header shows Login/Register or Dashboard depending on auth state. |
| FR-PUB-5 | Any statistic on public pages (e.g., "forecasts generated") must come from a public aggregate endpoint `GET /api/public/stats`, or be omitted. |

### 5.2 Authentication (FR-AUTH)

| ID | Requirement |
|---|---|
| FR-AUTH-1 | Register with name, email, password (confirmation validated client-side). Backend validates, rejects duplicate emails (409), hashes password with bcrypt, stores in Atlas. |
| FR-AUTH-2 | Login with email + password; generic error on failure ("Invalid email or password"). |
| FR-AUTH-3 | Successful login returns a short-lived access JWT and sets a refresh token cookie (see §16). |
| FR-AUTH-4 | Logout revokes the refresh token and clears the cookie. |
| FR-AUTH-5 | Silent session restore on page load via refresh endpoint. |
| FR-AUTH-6 | Protected frontend routes redirect unauthenticated users to Login with return-to path. |
| FR-AUTH-7 | Expired/invalid token → 401; frontend attempts one refresh, then logs out with a clear message. |
| FR-AUTH-8 | Change password (requires current password). Password reset by email is a stretch goal (§25). |

### 5.3 User application (FR-USER)

| ID | Requirement |
|---|---|
| FR-USER-1 | **Dashboard**: latest forecast, predicted power, recent forecasts (last 5), summary statistics (total forecasts, average predicted power, peak predicted power, most-used location), weather/solar indicators from the latest forecast snapshot, charts (see 5.4). Every value from the API. |
| FR-USER-2 | **Solar Forecast** page: form to create a forecast (see 5.4). |
| FR-USER-3 | **Forecast History**: paginated, sortable, filterable (date range, location text, status) list; delete own forecast with confirmation. |
| FR-USER-4 | **Forecast Details**: full inputs, weather snapshot, prediction, model version, status, chart, ability to "Re-run with same inputs" (creates a new forecast). |
| FR-USER-5 | **Profile**: view/edit name, optional phone/organisation, default location, default system capacity. |
| FR-USER-6 | **Account Settings**: change password, preferences (units, default location), delete own account (with password confirmation; forecasts anonymised or deleted per setting — default: deleted). |

### 5.4 Solar forecasting (FR-FC)

**Inputs (user-provided)**

| Field | Type | Rules |
|---|---|---|
| `locationQuery` | string | Free text place name, resolved via geocoding; **or** explicit `latitude`/`longitude` |
| `latitude`, `longitude` | number | −90..90, −180..180 |
| `targetDateTime` | ISO datetime | Between now−0h and now+ `FORECAST_MAX_HORIZON_DAYS` (default 7; Open-Meteo supports up to 16) at hourly resolution, evaluated in the location's timezone |
| `systemCapacityKw` | number | > 0, ≤ 10 000; default from profile |
| `tiltDeg` | number | 0..90, optional (default: ≈ latitude) |
| `azimuthDeg` | number | 0..360, optional (default: 180 = south in N-hemisphere) |
| `mode` | enum | `single` (one hour) or `day` (hourly curve for the target date). Default `day`; the "headline" prediction is for `targetDateTime`. |

**Weather/solar inputs** (auto-fetched server-side, shown read-only, never typed by the user): temperature, cloud cover, relative humidity, wind speed, shortwave radiation (GHI), direct and diffuse radiation, precipitation. *Advanced mode (optional):* the user may override fetched values; overridden values are flagged `source: "user_override"` in the stored snapshot.

**Process**

1. Validate request (Zod schemas) → 422 with field errors on failure.
2. Resolve coordinates (geocode if text) and timezone.
3. Obtain weather: check `weatherData` cache (TTL) → else call weather API → store/cached snapshot.
4. Build feature vector (feature contract in §17.4).
5. Call ML service `POST /predict`; timeout + one retry.
6. Persist forecast with `status: "completed"` (or `"failed"` with `errorCode` for diagnostics).
7. Return forecast; frontend navigates to Forecast Details.

**Result display:** predicted power (kW) and, for `day` mode, estimated energy (kWh) over the day; prediction timestamp (`createdAt`) and target timestamp; input summary; weather snapshot; hourly chart (predicted kW vs. irradiance/cloud cover); status badge; model name/version; disclaimer.

### 5.5 Weather & solar data (FR-WX)

| ID | Requirement |
|---|---|
| FR-WX-1 | Backend proxies the external weather API; the browser never calls it or sees keys. |
| FR-WX-2 | Weather snapshots are cached in `weatherData` (by rounded lat/lon + hour) with TTL index to limit API calls. |
| FR-WX-3 | Authenticated `GET /api/weather/current` and `GET /api/weather/forecast` provide data for dashboard indicators and the forecast form preview. |
| FR-WX-4 | Failures return a clear 502/503 with a user-friendly message; forecasts are not created from missing data. |

### 5.6 Admin panel (FR-ADM)

| ID | Requirement |
|---|---|
| FR-ADM-1 | **Admin Dashboard**: total users (active/suspended), total forecasts, forecasts per day (last 30 days), failed-forecast rate, ML service health, recent activity (from `systemLogs`), recent signups. |
| FR-ADM-2 | **User Management**: list with search (name/email), filter (role, status), sort, paginate; detail view (profile, forecast count, last login); change status (active/suspended); change role; delete (hard delete with cascade option) with confirmation. |
| FR-ADM-3 | **Solar Data Management**: list/search/filter (location, date range, source); create, edit, delete; CSV import (validated, with row-level error report); CSV export; this data is used for training/evaluation and charts. |
| FR-ADM-4 | **Forecast Management**: list all forecasts with filters (user, status, date range, location, model version); detail view; delete; activity chart. |
| FR-ADM-5 | **Contact Messages**: list, mark read/unread/resolved, delete. |
| FR-ADM-6 | **Settings**: editable application settings (e.g., max forecast horizon, registration enabled, default model version, weather cache TTL); persisted in `settings`; changes logged. |
| FR-ADM-7 | **System Logs**: viewer for `systemLogs` with level/type filters. |
| FR-ADM-8 | **Model Info** (read-only): active model version, training date, dataset description, stored evaluation metrics, feature list — read from the ML service/metadata. |
| FR-ADM-9 | Every admin mutation writes a `systemLogs` entry (actor, action, target). |

### 5.7 Cross-cutting (FR-X)

- All lists paginated server-side (`page`, `limit`, max 100).
- All mutations return the updated resource.
- Every destructive action requires a confirmation dialog.
- Every async view has loading, empty, error, and success states.

---

## 6. Non-functional Requirements

| Category | Requirement |
|---|---|
| Performance | API p95 < 500 ms excluding forecast creation; forecast creation p95 < 6 s (dominated by external API + ML); frontend initial JS bundle < 300 KB gzipped via route-level code splitting |
| Availability | Graceful degradation: if the ML service or weather API is down, the app remains usable and shows explicit errors |
| Security | See §23 |
| Scalability | Stateless backend and ML service (horizontal scaling possible); indexes on all query paths |
| Reliability | Timeouts (weather 8 s, ML 10 s), one retry with backoff for idempotent external calls; DB connection retry on startup |
| Usability | Responsive from 360 px to 1920 px; WCAG AA contrast; keyboard-accessible forms/dialogs; labelled inputs |
| Accessibility | Semantic HTML, `aria-*` on dialogs/tables/charts (with text alternatives or data table toggle) |
| Maintainability | Layered architecture, ESLint + Prettier, consistent naming, JSDoc on service functions, README per package |
| Observability | Structured logs (pino/winston), request IDs, `/api/health` (backend, DB, ML) |
| Browser support | Latest two versions of Chrome, Edge, Firefox, Safari |
| Data integrity | Schema validation at API (Zod) and DB (Mongoose) layers; referential checks in services |
| Privacy | Collect only necessary personal data; passwords and tokens never logged; account deletion supported |

---

## 7. Complete Page List

### 7.1 Public

| Route | Page | Purpose |
|---|---|---|
| `/` | Home | Value proposition, benefits, CTA |
| `/about` | About the Project | Problem, objectives, technology, team/guide info |
| `/features` | Features | Feature overview |
| `/how-it-works` | How It Works | Pipeline: input → weather data → ML → result |
| `/contact` | Contact | Contact form (persisted) |
| `/login` | Login | Credentials form |
| `/register` | Register | Account creation |
| `*` | Not Found | 404 with navigation |

### 7.2 User (authenticated, `/app/*`)

| Route | Page |
|---|---|
| `/app/dashboard` | Dashboard |
| `/app/forecast` | Solar Forecast (create) |
| `/app/history` | Forecast History |
| `/app/forecasts/:id` | Forecast Details |
| `/app/profile` | Profile |
| `/app/settings` | Account Settings |

### 7.3 Admin (`/admin/*`, role = admin)

| Route | Page |
|---|---|
| `/admin` | Admin Dashboard |
| `/admin/users` | User list |
| `/admin/users/:id` | User detail |
| `/admin/solar-data` | Solar data list + add/edit/import |
| `/admin/forecasts` | Forecast list |
| `/admin/forecasts/:id` | Forecast detail |
| `/admin/messages` | Contact messages |
| `/admin/settings` | Application settings |
| `/admin/logs` | System logs |
| `/admin/model` | Model information |

---

## 8. User Flow

1. **Discover:** Guest visits Home → reads About/Features/How It Works → clicks CTA.
2. **Register:** Fills form → client validation → `POST /api/auth/register` → success → redirected to Login (or auto-login) → Dashboard.
3. **Login:** `POST /api/auth/login` → access token held in memory, refresh cookie set → Dashboard loads (`GET /api/dashboard/summary`).
4. **Forecast:** Dashboard → "New Forecast" → enter location (autocomplete via `GET /api/weather/geocode`), date/time, system capacity → live weather preview → Submit → loading state ("Fetching weather → running model") → Forecast Details.
5. **Review:** History → filter/search → open details → re-run or delete.
6. **Account:** Profile/Settings → update details, change password, delete account.
7. **Logout:** `POST /api/auth/logout` → state cleared → Home.

---

## 9. Admin Flow

1. Admin logs in → redirected to `/admin`.
2. Reviews stats and recent activity.
3. **Users:** search/filter → open user → suspend/reactivate, change role, or delete (confirmation, last-admin guard).
4. **Solar data:** add record / import CSV / edit / delete; filters by location/date.
5. **Forecasts:** filter by user/status/date → open details → delete invalid records.
6. **Messages:** read → mark resolved.
7. **Settings:** update settings → logged.
8. **Model info:** verify active model version and metrics.
9. Every action is recorded in `systemLogs`.

---

## 10. System Architecture

```
┌────────────┐  HTTPS/JSON   ┌──────────────────┐   Mongoose    ┌───────────────┐
│  React SPA │ ────────────▶ │  Express API     │ ────────────▶ │ MongoDB Atlas │
│ (Vite/TW)  │ ◀──────────── │  (Node.js)       │ ◀──────────── │               │
└────────────┘               │                  │               └───────────────┘
                             │  services        │   HTTPS
                             │   ├─ weather ───────────────────▶ Open-Meteo APIs
                             │   └─ mlClient ──────────────────▶ ┌───────────────┐
                             └──────────────────┘   REST/JSON    │ Python ML     │
                                                                  │ service       │
                                                                  │ (FastAPI)     │
                                                                  └───────────────┘
```

---

## 11. Folder Structure

```
solarsense/
├── README.md
├── PRD.md
├── .gitignore
├── docker-compose.yml
├── docs/
│   ├── architecture.md
│   ├── api.md
│   ├── database.md
│   ├── deployment.md
│   ├── testing.md
│   └── decisions/
├── frontend/
├── backend/
└── ml/
```
