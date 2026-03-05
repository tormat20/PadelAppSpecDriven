# Implementation Plan: Local Auth + Pre-Deploy Foundation

**Branch**: `023-local-auth-pre-deploy` | **Date**: 2026-03-05 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/023-local-auth-pre-deploy/spec.md`

---

## Summary

Introduce three-tier JWT authentication (public / user / admin) to the existing padel app
without altering any existing public API behaviour. A new `users` table and DuckDB migration
add the identity store. A FastAPI `/auth` router handles login, self-registration, and
`/me` verification. Frontend `AuthContext` manages the token in `localStorage`, `ProtectedRoute`
and `RequireAdmin` guards enforce tiers, and a first-admin CLI script bootstraps the database.
All existing public routes (leaderboards, player search, player stats) are unaffected.

---

## Technical Context

**Language/Version**: Python 3.12 (backend), TypeScript 5.x / React 18.3 (frontend)  
**Primary Dependencies**:  
- Backend: FastAPI, DuckDB, pydantic-settings, `PyJWT>=2.9.0` (new), `bcrypt>=4.3.0` (new)  
- Frontend: React, React Router DOM 6, Vite 5, Vitest 2, `motion` (already installed)  

**Storage**: DuckDB — new `users` table via migration `007_users.sql`; no schema changes to existing tables  
**Testing**: `pytest` + `fastapi.testclient.TestClient` (backend); Vitest 2 pure-function tests (frontend)  
**Target Platform**: Local development (Linux/macOS/Windows); architecture is portable to any future host  
**Project Type**: Full-stack web service (FastAPI backend + React SPA frontend)  
**Performance Goals**: Login endpoint response ≤ 3 s (bcrypt at 12 rounds ~300 ms); all public routes unchanged  
**Constraints**: Zero new npm packages; no `passlib`; `atob()` for client-side JWT decode; localStorage only (no httpOnly cookies in this phase)  
**Scale/Scope**: Single-admin practical use case; multi-admin capability is an architectural provision only

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution (`/.specify/memory/constitution.md`) is an unfilled template — all
tokens remain as placeholders and no project-specific gates are defined. **No active gates.**
Constitution check passes by default.

---

## Project Structure

### Documentation (this feature)

```text
specs/023-local-auth-pre-deploy/
├── plan.md              ← this file
├── research.md          ← Phase 0 output (resolved 7 unknowns)
├── data-model.md        ← Phase 1 output (User entity, JWT claims, access tiers)
├── quickstart.md        ← Phase 1 output (dev setup + manual verification steps)
├── contracts/
│   ├── auth-api.md      ← REST contract: /auth endpoints, protection table
│   ├── frontend-auth.md ← AuthContext interface, ProtectedRoute, routes.tsx
│   └── bootstrap-cli.md ← CLI invocation, args, exit codes, stdout format
└── tasks.md             ← Phase 2 output (/speckit.tasks — NOT yet generated)
```

### Source Code (repository root)

```text
backend/
├── pyproject.toml                          # + PyJWT>=2.9.0, bcrypt>=4.3.0
├── .env.example                            # new — PADEL_JWT_SECRET_KEY, PADEL_CORS_ORIGINS, etc.
├── .env                                    # new — gitignored; local values
└── app/
    ├── core/
    │   └── config.py                       # + jwt_secret_key, jwt_algorithm, jwt_expire_minutes, cors_origins
    ├── db/
    │   └── migrations/
    │       └── 007_users.sql               # new — CREATE TABLE IF NOT EXISTS users (...)
    ├── domain/
    │   └── auth.py                         # new — hash_password(), verify_password(), create_token(), decode_token()
    ├── repositories/
    │   ├── users_repo.py                   # new — UsersRepository
    │   └── sql/
    │       └── users/
    │           ├── create.sql              # new
    │           ├── get_by_email.sql        # new
    │           ├── get_by_id.sql           # new
    │           ├── exists_any.sql          # new
    │           └── upsert_by_email.sql     # new
    ├── services/
    │   └── auth_service.py                 # new — AuthService: register(), login(), get_me()
    ├── api/
    │   ├── deps.py                         # + UsersRepository, AuthService in services_scope(); + get_current_user(), require_admin(), get_optional_user()
    │   ├── schemas/
    │   │   └── auth.py                     # new — LoginRequest, RegisterRequest, TokenResponse, MeResponse
    │   └── routers/
    │       ├── auth.py                     # new — POST /auth/login, POST /auth/register, GET /auth/me
    │       ├── events.py                   # + Depends(require_admin) on write routes
    │       ├── players.py                  # + Depends(require_admin) on POST /players
    │       └── rounds.py                   # + Depends(require_admin) on all routes
    ├── scripts/
    │   └── seed_admin.py                   # new — python -m app.scripts.seed_admin
    └── main.py                             # CORS from settings.cors_origins; include auth_router

frontend/
├── .env.example                            # new — VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
├── .env                                    # new — gitignored; local values
└── src/
    ├── lib/
    │   └── api.ts                          # API_BASE → env var; inject Authorization header; handle 401
    ├── contexts/
    │   └── AuthContext.tsx                 # new — AuthProvider, useAuth(), localStorage persistence
    ├── components/
    │   └── auth/
    │       ├── ProtectedRoute.tsx          # new — redirect to /login if no token
    │       └── RequireAdmin.tsx            # new — redirect to / if role ≠ admin
    ├── pages/
    │   ├── Login.tsx                       # new — login form, redirect-after-login
    │   └── CreateAccount.tsx              # new — self-signup, auto-login on success
    ├── app/
    │   ├── routes.tsx                      # + /login, /create-account; wrap routes in guards
    │   └── AppShell.tsx                    # auth-aware CardNav: login link / email + logout
    └── main.tsx                            # wrap app in <AuthProvider>

tests/
└── backend/
    ├── test_auth_register.py               # new — register happy path, duplicate email, short password
    ├── test_auth_login.py                  # new — login happy path, wrong password, unknown email
    ├── test_auth_me.py                     # new — valid token, expired token, no token
    ├── test_auth_admin_routes.py           # new — require_admin guards on events/players/rounds
    └── test_seed_admin.py                  # new — CLI bootstrap: create, idempotent update, invalid input
```

**Structure Decision**: Web application (Option 2). Backend is `backend/`, frontend is `frontend/`,
tests live alongside backend in `tests/backend/`. This mirrors the existing structure precisely.

---

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations. No entries required.
