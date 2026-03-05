# Quickstart: Local Auth + Pre-Deploy Foundation

**Feature**: `023-local-auth-pre-deploy`  
**Created**: 2026-03-05

---

## Prerequisites

- Python 3.12+ with `uv` package manager
- Node.js 20+ with `npm`
- Existing `padel.duckdb` database (or a fresh one — migrations run automatically)
- Backend and frontend already running in development

---

## 1. Install new backend dependencies

```bash
cd backend
uv add "PyJWT>=2.9.0" "bcrypt>=4.3.0"
```

Verify:
```bash
uv pip list | grep -E "PyJWT|bcrypt"
# PyJWT    2.9.x
# bcrypt   4.x.x
```

---

## 2. Create the backend `.env` file

```bash
# backend/.env  (already gitignored)
cp .env.example .env
```

Then edit `backend/.env` and fill in the required values:

```env
# Generate a secure secret:
#   python -c "import secrets; print(secrets.token_hex(32))"
PADEL_JWT_SECRET_KEY=<paste generated value here>

# Comma-separated list of allowed frontend origins (JSON array format):
PADEL_CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173"]
```

> **The app will refuse to start if `PADEL_JWT_SECRET_KEY` is missing.**

---

## 3. Create the frontend `.env` file

```bash
cd frontend
cp .env.example .env
```

`frontend/.env` content (defaults work for local dev, no changes needed):

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

---

## 4. Run backend migrations

Migrations run automatically on startup. Start the backend to apply `007_users.sql`:

```bash
cd backend
fastapi dev app/main.py
# Look for: "Applied migration: 007_users.sql"
```

---

## 5. Bootstrap the first admin account

With the backend running (or after running migrations):

```bash
cd backend
python -m app.scripts.seed_admin --email admin@yourclub.com --password yoursecretpass
# ✓ Admin account created/updated for admin@yourclub.com
```

You can run this command at any time to update the admin password.

---

## 6. Start the frontend

```bash
cd frontend
npm run dev
# http://localhost:5173
```

---

## 7. Verify the auth flow manually

### Public access (no login)

1. Open `http://localhost:5173/` — leaderboards load ✓
2. Open `http://localhost:5173/players/search` — search loads ✓
3. Open `http://localhost:5173/events` — redirected to `/login` ✓

### User self-signup

1. Open `http://localhost:5173/create-account`
2. Enter any email and a password ≥ 8 chars, submit
3. Redirected to home page — user menu shows email ✓
4. Navigate to `/events` — events list loads (read-only) ✓
5. Navigate to `/events/create` — redirected to home ✓

### Admin login

1. Open `http://localhost:5173/login`
2. Enter admin email and password from step 5
3. Redirected to home — nav shows admin email with crown indicator ✓
4. Navigate to `/events/create` — page loads ✓
5. Navigate to `/players/register` — page loads ✓

### Logout

1. Click log out in the nav
2. Redirected to home — nav shows "Log in" link ✓
3. Navigate to `/events` — redirected to `/login` ✓

---

## 8. Run tests

```bash
# Backend (from backend/)
uv run pytest

# Frontend (from frontend/)
npm test
```

All existing tests should pass. New auth tests are added in:
- `backend/tests/contract/test_auth_api.py`
- `backend/tests/unit/test_auth_domain.py`

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `ValueError: PADEL_JWT_SECRET_KEY is required` on backend start | Create `backend/.env` with `PADEL_JWT_SECRET_KEY=<generated secret>` |
| Login returns 401 even with correct credentials | Check `backend/.env` has the same `PADEL_JWT_SECRET_KEY` that was set when the account was created (the key is used to sign tokens, not to verify passwords — password issue would be from mismatched hash) |
| Frontend shows `CORS error` | Ensure `PADEL_CORS_ORIGINS` in `backend/.env` includes `http://localhost:5173` |
| `python -m app.scripts.seed_admin` fails with "table not found" | Backend has not been started yet — start it once to run migrations, then re-run the script |
| Frontend `ProtectedRoute` flashes to `/login` and back | Check `isLoading` guard in `ProtectedRoute` — should render `null` while hydrating |
