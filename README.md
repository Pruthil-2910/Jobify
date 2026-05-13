# Jobify — AI Resume Tailoring Platform

> Paste a job link, get a resume rewritten to match. Keywords, tone, structure — all tuned for that specific role.

---

---

## Architecture

```
┌──────────────────────────────┬──────────────────────────────┐
│         FRONTEND             │           BACKEND            │
│       (frontend/)            │       (backend/)             │
│                              │                              │
│  React 18 + Vite             │  FastAPI + Uvicorn           │
│  Monochromatic Zinc UI       │  SQLite + sqlite-vec (768d)  │
│  Kinetic Text & 3D Cards     │  LangGraph + Gemini          │
│  Vite proxy → :8000          │  JWT + per-user Gemini key   │
│                              │                              │
│  npm run dev (port 5173)     │  uvicorn main:app (8000)     │
└──────────────────────────────┴──────────────────────────────┘
```

| Layer        | Directory          | Runtime          | Default port |
|--------------|--------------------|------------------|--------------|
| **Frontend** | `frontend/`        | Node 18+ / Vite  | 5173         |
| **Backend**  | `backend/`  | Python 3.11–3.14 | 8000         |

The frontend's Vite dev server proxies `/auth`, `/users`, `/jobs`, `/chat`, `/jd`, `/projects`, `/health` to the backend, so they speak the same origin and CORS is a non-issue in dev.

---

## Project Layout

```
Jobify platform/
├── frontend/
│   ├── package.json
│   ├── vite.config.js              # proxy → http://localhost:8000
│   ├── index.html                  # Vite entry
│   ├── src/
│   │   ├── main.jsx                # ReactDOM.createRoot
│   │   ├── App.jsx                 # hash router + shell + Tweaks
│   │   ├── api.js                  # Auth/Users/Jobs/Tailor/Chat/Projects/Health
│   │   ├── mock.js                 # MOCK_JOBS, DEFAULT_RESUME, timeAgo
│   │   ├── components/             # UI, Kinetic, MoncyFX, Astronaut, ProgrammerScene, TweaksPanel
│   │   ├── screens/                # 9 screens — see Routing below
│   │   └── styles/                 # tokens.css, app.css, moncy-fx.css
│   └── assets/                     # logo SVGs
│
├── backend/
│   ├── main.py                     # FastAPI factory + lifespan
│   ├── config.py                   # pydantic-settings
│   ├── requirements.txt
│   ├── install.sh                  # Ubuntu bootstrap
│   ├── .env.example
│   ├── auth/                       # JWT + bcrypt + Fernet (api-key encrypt)
│   ├── db/                         # connection.py, schema.py, crud.py
│   ├── middleware/api_key.py       # resolves Gemini key per request
│   ├── models/                     # Pydantic v2: user, job, resume
│   ├── routers/                    # auth, users, jobs, chat, jd_match, projects
│   ├── services/                   # embedding, adzuna, github
│   ├── agents/                     # LangGraph: chatbot_graph, jd_matcher_graph + nodes
│   └── tests/                      # pytest: 27 passing
│
├── README.md                       # ← you are here
```

---

## Frontend

### Tech Stack
- **React 18.3** with the `@vitejs/plugin-react` JSX transform
- **Vite 5** dev server + production bundler
- **Monochromatic Zinc Design**: A high-end, professional minimalist aesthetic using pure zinc/black/white tones.
- **Kinetic Typography**: Custom `SplitText` and `WordRotator` components for fluid, high-end motion.
- **Vanilla CSS**: Optimized design tokens and glassmorphism — no Tailwind or CSS frameworks.
- **Interactive 404 Experience**: 3D blog cards and creative ML-focused redirects for lost users.
- **Custom hash router** (`#/jobs`, `#/login`) — back/forward buttons work natively

### Routing

| Route key   | URL hash       | Screen                               | Auth |
|-------------|----------------|--------------------------------------|:---:|
| `home`      | `#/`           | Landing                              | ✗    |
| `login`     | `#/login`      | Login                                | ✗    |
| `signup`    | `#/signup`     | SignUp                               | ✗    |
| `onboarding`| `#/onboarding` | Onboarding (3-step wizard)          | ✓    |
| `jobs`      | `#/jobs`       | Jobs feed                            | ✓    |
| `jobDetail` | `#/job`        | JobDetail + AI tailoring             | ✓    |
| `builder`   | `#/builder`    | Resume builder (3 templates)         | ✓    |
| `preview`   | `#/preview`    | Preview                              | ✓    |
| `profile`   | `#/profile`    | Dashboard + history                  | ✓    |
| `chat`      | `#/chat`       | Agentic RAG chat                     | ✓    |
| `settings`  | `#/settings`   | Gemini API key + project ingest      | ✓    |

### API Client (`src/api.js`)

| Client       | Backend endpoints                                                  |
|--------------|--------------------------------------------------------------------|
| `AuthAPI`    | `register`, `login`, `setApiKey`, `validateKey`, `logout`         |
| `UsersAPI`   | `GET /users/me`, `PUT /users/resume`                              |
| `JobsAPI`    | `GET /jobs/search`, `GET /jobs/:id`, `POST /jobs/fetch`           |
| `TailorAPI`  | `POST /jd/match`, `POST /jd/tailor`, `GET /jd/history`            |
| `ChatAPI`    | `POST /chat/message`                                              |
| `ProjectsAPI`| `POST /projects/ingest`, `GET /projects`, `DELETE /projects/:id`  |
| `HealthAPI`  | `GET /health`                                                     |

JWT and `X-Gemini-API-Key` headers are auto-injected on every request.

---

## Backend

### Tech Stack
- **FastAPI** + **Uvicorn** (single worker — SQLite is single-writer)
- **SQLite** with **sqlite-vec** virtual tables (768-dim cosine search)
- **LangGraph** orchestrating two graphs: chatbot RAG and JD matcher / resume tailor
- **Google Gemini** — `gemini-2.0-flash` for LLM, `gemini-embedding-2` for embeddings
- **JWT (HS256)** auth + **bcrypt** password hashing + **Fernet** API-key encryption
- **Pydantic v2** for all I/O validation

### API Routes

| Method | Path                       | Auth | Description                                                |
|--------|----------------------------|:----:|------------------------------------------------------------|
| GET    | `/health`                  |  –   | Liveness probe                                             |
| POST   | `/auth/register`           |  –   | Create account → `{access_token, user_id}`                |
| POST   | `/auth/login`              |  –   | Authenticate → token                                       |
| POST   | `/auth/set-api-key`        |  ✓   | Store Gemini key (Fernet-encrypted)                        |
| GET    | `/auth/validate-key`       |  –   | Probe Gemini `models/list`                                 |
| GET    | `/users/me`                |  ✓   | Current user (flags only)                                  |
| GET    | `/users/resume`            |  ✓   | Get saved resume JSON (or null)                            |
| PUT    | `/users/resume`            |  ✓   | Save resume + embed into `vec_users`                       |
| GET    | `/jobs/search`             |  ✓   | Filtered search (q, location, country, category, salary…)  |
| GET    | `/jobs/match-feed`         |  ✓   | **Personalised feed** ranked by cosine similarity to resume |
| GET    | `/jobs/{id}`               |  ✓   | Job detail                                                 |
| POST   | `/jobs/fetch`              |  ✓   | Pull from Adzuna + embed into `vec_jobs`                   |
| POST   | `/jobs/seed`               |  ✓   | Bulk-pull up to N jobs (idempotent)                        |
| POST   | `/jobs/refresh-now`        |  ✓   | Trigger the daily refresh manually                         |
| GET    | `/jobs/stats/summary`      |  ✓   | Per-country totals + vector coverage                       |
| POST   | `/chat/message`            |  ✓   | Agentic RAG chat (intent-routed)                           |
| POST   | `/jd/match`                |  ✓   | Top-3 project matches + gap analysis                       |
| POST   | `/jd/tailor`               |  ✓   | Full pipeline → tailored resume saved                      |
| GET    | `/jd/history`              |  ✓   | Past tailored resumes                                      |
| POST   | `/projects/ingest`         |  ✓   | Ingest GitHub/LinkedIn URLs                                |
| POST   | `/projects/manual`         |  ✓   | Add a hand-typed project (no URL)                          |
| GET    | `/projects`                |  ✓   | List user projects                                         |
| DELETE | `/projects/{id}`           |  ✓   | Delete project                                             |

Interactive Swagger docs at `http://localhost:8000/docs` once running.

### End-to-End Flow

1. **Sign up** at `#/signup` → JWT stored in localStorage.
2. Open `#/settings` and **save your Gemini API key** (validated against
   Google's `models.list` endpoint, then Fernet-encrypted server-side).
3. Open `#/builder` — fills with whatever you saved last via
   `GET /users/resume`. Edit and click **Save** → `PUT /users/resume`
   embeds the summary + skills + experience into `vec_users` (768-dim).
4. Add evidence in `#/settings`: ingest GitHub repos / LinkedIn profiles,
   or type projects manually. Each gets embedded into `vec_projects`.
5. The job seeder runs automatically on first boot (last 60 days of
   Indian listings, default ~5K rows). Configurable via
   `JOB_SCHEDULER_*` env vars.
6. `#/jobs` calls `GET /jobs/match-feed` — if the user has a resume
   embedding, jobs are ranked by **real cosine similarity** with a
   `match_pct` 0–100. Otherwise it falls back to recency-ordered search.
7. `#/jobs/:id` triggers `POST /jd/tailor` which runs the full
   LangGraph pipeline (embed JD → vector-match user projects → LLM
   gap analysis → LLM resume rewrite → save).

---

## Quick Start

You'll need **two terminals** — one for backend, one for frontend.

### Prerequisites

- **Python 3.11, 3.12, 3.13, or 3.14** — all supported (pre-built wheels exist for all)
- **Node.js 18+** with npm
- A **Google Gemini API key** — free at <https://aistudio.google.com/apikey> (configured in the Settings screen, not in `.env`)

### Terminal 1 — Backend

```bash
cd backend

# 1. Create + activate venv
python -m venv .venv
.venv\Scripts\activate           # Windows PowerShell / cmd
# source .venv/bin/activate      # macOS / Linux

# 2. Install dependencies
python -m pip install --upgrade pip
pip install -r requirements.txt

# 3. Configure secrets (only ENCRYPTION_SECRET + JWT_SECRET are required)
copy .env.example .env           # Windows
# cp .env.example .env           # macOS / Linux
# then open .env and set:
#   ENCRYPTION_SECRET=<any 32+ char random string>
#   JWT_SECRET=<any 32+ char random string>
#   ADZUNA_APP_ID=<optional — needed for /jobs/fetch>
#   ADZUNA_APP_KEY=<optional>

# 4. Run (Activate venv first!)
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate

uvicorn main:app --workers 1 --reload --host 0.0.0.0 --port 8000
```

The backend is now at `http://localhost:8000` with Swagger at `/docs`.

### Terminal 2 — Frontend

```bash
cd frontend

# 1. Install Node modules (first time only)
npm install

# 2. Run the dev server
npm run dev
```

Open **http://localhost:5173** in your browser. Vite will hot-reload on edits and proxy API calls to the backend automatically.

### First-time setup in the UI

1. Sign up at `#/signup` — creates an account, returns a JWT.
2. Open `#/settings` and paste your **Gemini API key**. The button validates it against Google's API and stores it Fernet-encrypted on the server.
3. (Optional) Ingest GitHub repo URLs in Settings — they become evidence for JD matching.
4. Use `#/jobs/fetch` (or call `POST /jobs/fetch` from Swagger) to populate jobs from Adzuna.
5. Open any job → "Tailor my resume" runs the full LangGraph pipeline.

---

## Production Builds

```bash
# Frontend → static dist/
cd frontend && npm run build && npm run preview

# Backend (no build step — just run with multiple workers behind a reverse proxy)
cd backend && uvicorn main:app --workers 1 --host 0.0.0.0 --port 8000
```

Keep `--workers 1` for the backend: SQLite is single-writer.

---

## Tests

```bash
cd backend
.venv\Scripts\activate
pytest tests/ -v
```

Current state: **27 passed, 1 skipped** (skipped test requires a live `GEMINI_API_KEY` env var).

---

## Troubleshooting

### `pydantic-core` build fails with "linker `link.exe` not found"

You're on Python 3.14 with an older `pydantic` pin that has no 3.14 wheel, so pip tries to compile Rust from source and fails because MSVC isn't installed. Fix:

```bash
# requirements.txt now uses pydantic>=2.10 which ships 3.14 wheels.
pip install --upgrade pip
pip install -r requirements.txt
```

If you still hit it, either:
- Use Python 3.11 / 3.12 / 3.13 (all have wheels for every dep), or
- Install MSVC Build Tools → "Desktop development with C++" workload.

### `sqlite-vec` extension fails to load

`sqlite-vec` needs Python's sqlite3 to allow extension loading — true on official CPython but not on every distro build. Verify with:

```bash
python -c "import sqlite3, sqlite_vec; c = sqlite3.connect(':memory:'); c.enable_load_extension(True); c.load_extension(sqlite_vec.loadable_path()); print('OK')"
```

### Frontend says "API offline"

The status pill in the bottom-left checks `GET /health`. If it's red:
- Make sure the backend is running on port 8000
- Check `vite.config.js` proxy entries match the routes you call
- Reload the page after starting the backend (the check runs on mount)

### `passlib` / `bcrypt` errors on Python 3.14

We dropped passlib's `CryptContext` because its bcrypt backend probe is broken on bcrypt 4+ / Python 3.14. The current `auth/jwt_handler.py` calls `bcrypt` directly. If you see passlib errors, update your local copy.

---

## License

Educational / demonstration use.
