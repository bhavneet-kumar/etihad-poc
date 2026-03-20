# Authentication (POC)

## Backend

- **POST** `/api/auth/login` — body `{ "email", "password" }` → `{ token, user: { email, role } }`
- **Claims APIs** — header `Authorization: Bearer <token>` required (except login).
- **PATCH** `/api/claims/:id/status` — **admin** only (403 for customers).

Customers see only claims whose contact email matches their login email. Admins see all claims.

## Seeded users (after `initDb`)

| Email               | Password | Role     |
|---------------------|----------|----------|
| `customer@test.com` | `123456` | customer |
| `admin@test.com`    | `123456` | admin    |

## Environment

Set `JWT_SECRET` in production (`backend/.env`). Optional: `JWT_EXPIRES` (default `1d`).

## Frontend

- Token + user stored in `localStorage`.
- Protected routes: `/`, `/claims`, `/claims/:id`, `/admin`, `/admin/:id`.
- 401 responses trigger logout and redirect to `/login`.
