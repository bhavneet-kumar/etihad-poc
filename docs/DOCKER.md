# Docker setup

## Quick start

From the project root:

```bash
docker compose up -d --build
```

- **Frontend:** http://localhost:8080 (static build + Node static server)
- **Backend API:** http://localhost:3001
- **PostgreSQL:** localhost:5432 (user `claimuser`, db `claims_db`)

## Environment variables

Create a **`.env` in the project root**. Docker Compose loads it automatically for `${VAR}` substitution in `docker-compose.yml`.

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | claimuser | PostgreSQL user |
| `POSTGRES_PASSWORD` | claimpass | PostgreSQL password |
| `POSTGRES_DB` | claims_db | Database name |
| `POSTGRES_PORT` | 5432 | Host port for Postgres |
| `JWT_SECRET` | (set in `.env`) | Backend JWT signing secret |
| `JWT_EXPIRES` | 1d | JWT expiry |
| `GEMINI_API_KEY` | (set in `.env`) | Google AI key for receipt OCR |
| `GEMINI_OCR_MODEL` | gemini-2.0-flash | Gemini model id for OCR |
| `VITE_API_BASE_URL` | http://localhost:3001/api | Frontend build-time API base URL |

The backend container also uses `env_file: ./backend/.env`; entries under `environment:` in `docker-compose.yml` override for the listed keys.

## Services

- **postgres:** PostgreSQL 16 Alpine; data persisted in volume `postgres_data`.
- **backend:** Node 20 Alpine; runs `node dist/apiServer.js`; waits for Postgres to be healthy.
- **frontend:** Builds Vite app with `VITE_API_BASE_URL` from root `.env`, then serves static files on port 8080.

## Build only

```bash
docker compose build
```

## Run in foreground (logs)

```bash
docker compose up --build
```

## Stop and remove

```bash
docker compose down
# Remove volume as well:
docker compose down -v
```
