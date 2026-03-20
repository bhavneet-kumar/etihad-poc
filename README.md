# Etihad claim intake (POC)

Monorepo for a **flight disruption claim** workflow: customers submit receipts (multipart + OCR), a **rule engine** validates expenses, and **admins** review cases. The stack is **React (Vite)** + **Express (TypeScript)** + **PostgreSQL**, with **Google Gemini** for receipt OCR.

## Repository layout

| Path | Role |
|------|------|
| `frontend/` | React SPA (`npm run dev` on port **3000**) |
| `backend/` | REST API (`npm run dev` / `API_PORT` default **3001**) |
| `docker-compose.yml` | Postgres + backend + frontend containers |

## Prerequisites

- **Node.js** 18+ (backend and frontend)
- **PostgreSQL** (local install, Docker, or managed cloud DB)
- **Gemini API key** for OCR ([Google AI Studio](https://aistudio.google.com/apikey))

## Environment variables

### Backend (`backend/.env`)

Copy from `backend/.env.example` and set at least:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string (**required** for `npm run start`). See [Connection strings](#connection-strings). |
| `GEMINI_API_KEY` | Google AI key for receipt OCR |
| `GEMINI_OCR_MODEL` | Optional; default `gemini-2.0-flash` |
| `JWT_SECRET` | Long random string for signing JWTs |
| `JWT_EXPIRES` | Optional; e.g. `1d` |
| `API_PORT` | Optional; default `3001` |

Do **not** set `NODE_TLS_REJECT_UNAUTHORIZED=0` in production.

### Docker Compose (repo root `.env`)

Compose reads variables such as `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `GEMINI_API_KEY`, and `VITE_API_BASE_URL`. The backend service overrides `DATABASE_URL` to point at the **postgres** service and loads `backend/.env` for app secrets.

### Frontend (`frontend/.env`)

`VITE_API_BASE_URL` — base URL of the API (e.g. `http://localhost:3001` for local dev).

## Local development

### 1. Database

Start Postgres, then set `DATABASE_URL` in `backend/.env` to match (user, password, host, port, database).

Example if you use Compose for Postgres only:

```bash
docker compose up -d postgres
```

Use something like `postgresql://claimuser:claimpass@localhost:5432/claims_db` if your root `.env` matches the Compose defaults.

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env   # then edit DATABASE_URL, GEMINI_API_KEY, JWT_SECRET
npm run build          # compile TypeScript
npm run start          # or: npm run dev (nodemon + ts)
```

- **API** listens on `http://localhost:3001` (or `API_PORT`).
- **Swagger UI**: `http://localhost:3001/api-docs`
- **OpenAPI JSON**: `http://localhost:3001/openapi.json`

Most protected routes expect `Authorization: Bearer <token>` from `POST /api/auth/login`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs on **http://localhost:3000** (see `frontend/package.json`).

## Docker (full stack)

From the **repository root**:

1. Create a root `.env` with Postgres credentials, `GEMINI_API_KEY`, and `VITE_API_BASE_URL` (e.g. `http://localhost:3001` for browser access to the API).
2. Ensure `backend/.env` exists (JWT, Gemini, etc.). Compose injects `DATABASE_URL` for the in-cluster Postgres.

```bash
docker compose build
docker compose up -d
```

- **Postgres**: `5432`
- **API**: `3001`
- **Frontend**: `8080`

The backend image runs `npm run build`, then `npm run start` (which runs `node dist/apiServer.js`). A **healthcheck** calls `GET /api/health` so the frontend can wait on `service_healthy`.

## API overview

- **Health**: `GET /api/health`
- **Auth**: `POST /api/auth/login` — JSON `{ email, password }` → JWT
- **Claims** (JWT required): booking validation, receipt preview (multipart), submit-with-receipts, list/detail, admin status updates — see Swagger.

**Seed users** (created on first DB init when the `users` table is empty):

| Email | Password | Role |
|-------|----------|------|
| `customer@test.com` | `123456` | customer |
| `admin@test.com` | `123456` | admin |

## Connection strings

- `DATABASE_URL` must be a **single** URL. If the password contains `@`, `:`, `/`, etc., **percent-encode** those characters (e.g. `@` → `%40`).
- **Cloud databases**: if you see `ETIMEDOUT`, open **firewall / authorized networks** for your IP on port **5432**, or use your provider’s recommended tunnel (e.g. Cloud SQL Auth Proxy).

## Implementation notes

- **OCR / rules**: Receipt images are processed server-side; JSON-only claim creation is disabled in favor of multipart + OCR.
- **DB**: `initDb()` creates tables and seeds policy rules + demo users when empty.
- **Startup**: The HTTP server listens before DB migrations finish; routes that need the DB return **503** until initialization completes.
