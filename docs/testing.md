# SolarSense Testing Strategy & Verification Plan

## 1. Testing Philosophy
Every core workflow in SolarSense is validated through automated tests without external network dependencies:
- **Backend Tests:** Built with **Vitest + Supertest + mongodb-memory-server**. Tests execute against an isolated in-memory MongoDB engine, testing real Mongoose validation, index constraints, query logic, and cascade deletions.
- **External Mocking:** External HTTP calls (Open-Meteo and ML Service) are mocked **strictly within test suites**, never in application runtime code.
- **ML Verification:** Pytest suite testing input schemas, deterministic predictions, physical bounds (0 power at night, monotonic capacity scaling), and missing model error codes.

---

## 2. Test Suites

### Backend Integration Tests (`backend/tests/`)
1. **Authentication:**
   - Registration with password hashing, duplicate email detection (409), validation checks.
   - Login credential validation, timing-attack resistance, JWT issue, refresh token cookie generation.
   - Token refresh rotation, reuse revocation detection, logout session teardown.
2. **Access Control & RBAC:**
   - Normal user blocked from `/api/admin/*` endpoints with 403 Forbidden.
   - Demoted/suspended users immediately blocked from active sessions.
   - Last admin deletion and self-demotion guards.
3. **Forecast Generation:**
   - Valid forecast requests successfully store weather snapshots, feature vectors, and predictions.
   - Input validation fails gracefully on invalid coordinates or dates outside horizon.
   - Weather provider downtime correctly captured with 502/503 and saved as `status: failed`.
4. **Admin Management:**
   - User status toggle and role modifications.
   - Solar benchmark dataset CSV import validation report and export streaming.
   - Settings update and audit log recording.

### ML Microservice Tests (`ml/tests/`)
1. **Physical Constraints:**
   - Nighttime irradiance ($GHI = 0$ or solar elevation $\le 0$) strictly outputs $0\text{ kW}$.
   - Predictions are strictly clipped to $[0, \text{capacityKw}]$.
   - Linear capacity scaling invariance.
2. **Schema & Error Handling:**
   - Rejection of negative irradiance or temperatures out of physical bounds.
   - Model info endpoint exposes exact metrics from `metadata.json`.

---

## 3. Running Test Suites

```bash
# Run backend tests
cd backend
npm test

# Run ML tests
cd ml
pytest tests/ -v

# Run frontend build check
cd frontend
npm run build
```
