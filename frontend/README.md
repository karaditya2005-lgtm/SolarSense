# SolarSense — Frontend Web Application

The modern, responsive web frontend for **SolarSense**, an end-to-end solar power generation forecasting platform. Built as an MCA final-year capstone project following production-grade architectural standards.

---

## Technology Stack

- **Framework & Build:** React 18, Vite, TypeScript
- **Styling & Aesthetics:** Tailwind CSS v3 with custom dark navy palette (`#020617`, `#0f172a`), solar amber accents (`#f59e0b`, `#d97706`), Inter and Outfit typography
- **Routing:** React Router v6 with `ProtectedRoute` navigation guards and return-path retention
- **HTTP & Data Ingestion:** Axios client with Bearer authorization header injection, queueing for concurrent 401 token refresh calls, and network error normalization
- **Forms & Validation:** React Hook Form coupled with Zod schemas for client-side validation and backend field-error mapping
- **Icons & Graphics:** Lucide-react icons (no emojis), pure CSS perspective solar panel backdrop scene (`SolarPanelBackdrop`)
- **Animations:** IntersectionObserver-based `Reveal` component respecting the user's `prefers-reduced-motion` operating system preference

---

## Key Features & Architectural Highlights

1. **In-Memory Token Authentication (§16 of PRD):**
   - Access JWTs are held exclusively in memory (never written to `localStorage` or `sessionStorage` to eliminate XSS token theft).
   - Refresh tokens are delivered via `httpOnly` secure cookies set and rotated by the backend.
   - Concurrent silent refresh calls on page load (including React 18 StrictMode double-mounting) are deduplicated via in-flight Promise memoization (`activeRefreshPromise`).
   - Automated 401 interceptor queues failed requests during token rotation and transparently retries them upon receipt of a new access token.

2. **Zero Fake Data Policy:**
   - Every metric, figure, and prediction originates from genuine data sources: either the database, external weather APIs, or the machine learning microservice.
   - No mock endpoints or simulated numbers are used anywhere in the codebase.
   - Public statistics on the landing page are fetched dynamically from `GET /api/public/stats` and gracefully omitted if unavailable.

3. **Motion & Visual Design:**
   - Full-screen hero featuring a pure CSS dusk sky, sun corona, perspective photovoltaic panel array with glare reflection, with conditional fallback to `VITE_HERO_IMAGE` if specified.
   - Fixed header with transparent styling over the hero section that smoothly transitions to solid blurred glass upon scrolling.
   - Split-screen authentication layouts for Login and Register (form left, solar scene right; responsive for screens from 360px to 1920px).

---

## Page Route Map

### Public Routes
| Route | Page | Purpose |
|---|---|---|
| `/` | **Home** | Full-screen hero, fundamentals, benefits, 4-step pipeline, features grid, call to action |
| `/about` | **About** | Project background, MCA capstone objectives, architecture, data attribution |
| `/features` | **Features** | Comprehensive breakdown of modeling, ML microservice, security, and export capabilities |
| `/how-it-works` | **How It Works** | Step-by-step pipeline walkthrough: Geocoding → Weather API → Feature Vector → FastAPI ML → MongoDB Atlas → Charts |
| `/contact` | **Contact** | Inquiry form submitting directly to `POST /api/contact` with validation and error mapping |
| `/login` | **Login** | Split-screen credentials form with memory-only auth and return-to path routing |
| `/register` | **Register** | Split-screen registration (min 8 chars, letter + number), redirects to `/login` with success banner |
| `*` | **404 Not Found** | Diagnostic page with return-home navigation |

### Authenticated Routes
| Route | Page | Purpose |
|---|---|---|
| `/app/dashboard` | **Dashboard** | Displays authenticated user's name, email, role, status from API + Sign Out action |

---

## Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Base URL for the Express backend API proxy | `/api` |
| `VITE_HERO_IMAGE` | Optional image path in `public/` (e.g., `/images/solar-array.jpg`). If omitted, pure CSS scene renders. | _(empty)_ |

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation
From the `frontend/` directory:

```bash
npm install
```

### Development Server
Run Vite's development server with hot module replacement:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### Production Build
Compile TypeScript and bundle assets for production:

```bash
npm run build
```

The output bundle will be located in the `frontend/dist/` directory.

### Preview Production Build
Preview the generated production build locally:

```bash
npm run preview
```
