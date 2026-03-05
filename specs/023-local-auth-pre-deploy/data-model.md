# Data Model: Local Auth + Pre-Deploy Foundation

**Feature**: `023-local-auth-pre-deploy`  
**Created**: 2026-03-05  
**Spec**: [spec.md](./spec.md)

---

## Entities

### User

Represents an application account used to authenticate with the web app. A `User` is distinct from a padel `Player` — a User is an identity for access control; a Player is a participant in events. There is no required link between the two.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, auto-generated | DuckDB `UUID` type with `DEFAULT gen_random_uuid()` |
| `email` | TEXT | NOT NULL, UNIQUE | Normalised to lowercase before storage and lookup |
| `hashed_password` | TEXT | NOT NULL | One-way bcrypt hash; plain-text password never stored |
| `role` | TEXT | NOT NULL, DEFAULT `'user'`, CHECK IN (`'admin'`, `'user'`) | Two roles only; elevation to `admin` via CLI script |
| `created_at` | TIMESTAMP | DEFAULT `CURRENT_TIMESTAMP` | UTC; set once on creation, never updated |

**Validation rules** (enforced at service layer before DB write):
- `email` must match a basic format (contains `@` and a dot in the domain part)
- `email` is lowercased before any read or write
- `password` (plain-text, at point of creation/update) must be ≥ 8 characters
- `role` must be one of `'admin'` or `'user'`; defaults to `'user'` on self-registration

**DuckDB migration**: `backend/app/db/migrations/007_users.sql`

```sql
CREATE TABLE IF NOT EXISTS users (
    id              UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT      NOT NULL UNIQUE,
    hashed_password TEXT      NOT NULL,
    role            TEXT      NOT NULL DEFAULT 'user'
                              CHECK (role IN ('admin', 'user')),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

> `CREATE TABLE IF NOT EXISTS` makes the migration idempotent, consistent with the project's migration strategy.

---

### Session Token (not persisted on server)

A signed, time-limited credential issued to a User on successful authentication. The server never stores tokens — validity is determined entirely by cryptographic signature and expiry claim.

| JWT Claim | Type | Value |
|---|---|---|
| `sub` | string | User `id` (UUID as string) |
| `email` | string | User `email` (normalised) |
| `role` | string | `'admin'` or `'user'` |
| `iat` | integer | Unix timestamp — issued-at (UTC) |
| `exp` | integer | Unix timestamp — expires 8 hours after `iat` |

**Algorithm**: HS256 (HMAC-SHA256 symmetric signature)  
**Secret**: Read from `PADEL_JWT_SECRET_KEY` environment variable (no default; app fails to start without it)  
**Expiry**: Configurable via `PADEL_JWT_EXPIRE_MINUTES` (default: `480` = 8 hours)

The token is stored client-side in `localStorage` under the key `auth_token`. It is sent on every authenticated request as `Authorization: Bearer <token>`.

---

### Access Tier

Not a DB entity — a classification derived from the presence and content of a session token.

| Tier | Token Required | Role Required | Description |
|---|---|---|---|
| `public` | No | — | No `Authorization` header. Can access leaderboards, player search, player stats. |
| `user` | Yes | any | Valid token with any role. Can additionally access events list (read-only) and event summaries. |
| `admin` | Yes | `admin` | Valid token with `role = 'admin'`. Can access all write operations: create/run events, register players. |

---

## State Transitions

### User account lifecycle

```
[no account]
    │
    ├─ CLI seed_admin ──────────────────► [admin user created]
    │                                            │
    └─ POST /auth/register ─────────────► [user account created] ──► [never changes role via UI]
                                                 │
                                          (both paths)
                                                 │
                                          POST /auth/login
                                                 │
                                        [session token issued]
                                                 │
                                     ┌───────────┴───────────┐
                               token expires            POST (logout handled
                               (8 hours)                client-side only)
                                     │                        │
                               [token invalid]         [token cleared
                               → redirect /login        from localStorage]
                                                        → redirect /
```

### Authentication flow per request

```
Incoming request
      │
      ├─ No Authorization header ──────► Public route? ──Yes──► Allow
      │                                       │
      │                                       No
      │                                       │
      │                                   Return 401
      │
      └─ Authorization: Bearer <token>
              │
              ├─ Signature invalid / malformed ──► Return 401
              ├─ Token expired ─────────────────► Return 401
              │
              └─ Valid token
                      │
                      ├─ Route requires admin, role ≠ admin ──► Return 403
                      │
                      └─ Allow (return user payload to handler)
```

---

## New Backend Files

| File | Purpose |
|---|---|
| `backend/app/db/migrations/007_users.sql` | Create `users` table |
| `backend/app/domain/models.py` | Add `User` dataclass (alongside existing `Player`, `Event`, etc.) |
| `backend/app/domain/auth.py` | Pure functions: `hash_password()`, `verify_password()`, `create_token()`, `decode_token()` |
| `backend/app/repositories/users_repo.py` | `UsersRepository`: `create()`, `get_by_email()`, `get_by_id()`, `exists_any()`, `upsert_admin()` |
| `backend/app/repositories/sql/users/create.sql` | `INSERT INTO users ...` |
| `backend/app/repositories/sql/users/get_by_email.sql` | `SELECT ... WHERE email = ?` |
| `backend/app/repositories/sql/users/get_by_id.sql` | `SELECT ... WHERE id = ?` |
| `backend/app/repositories/sql/users/exists_any.sql` | `SELECT COUNT(*) FROM users` |
| `backend/app/repositories/sql/users/upsert_by_email.sql` | `INSERT ... ON CONFLICT (email) DO UPDATE SET ...` |
| `backend/app/services/auth_service.py` | `AuthService`: `register()`, `login()`, `get_me()` |
| `backend/app/api/schemas/auth.py` | `LoginRequest`, `RegisterRequest`, `TokenResponse`, `MeResponse` |
| `backend/app/api/routers/auth.py` | `POST /auth/login`, `POST /auth/register`, `GET /auth/me` |
| `backend/app/scripts/seed_admin.py` | CLI bootstrap: `python -m app.scripts.seed_admin` |

## New Frontend Files

| File | Purpose |
|---|---|
| `frontend/src/contexts/AuthContext.tsx` | `AuthProvider`, `useAuth()` hook, localStorage persistence |
| `frontend/src/components/auth/ProtectedRoute.tsx` | Redirects to `/login` if no valid token |
| `frontend/src/components/auth/RequireAdmin.tsx` | Redirects to `/` if token present but role ≠ `admin` |
| `frontend/src/pages/Login.tsx` | Login form — email + password, redirect-after-login |
| `frontend/src/pages/CreateAccount.tsx` | Self-signup form — email + password, auto-login on success |

## Modified Files

| File | Change |
|---|---|
| `backend/pyproject.toml` | Add `PyJWT>=2.9.0`, `bcrypt>=4.3.0` |
| `backend/app/core/config.py` | Add `jwt_secret_key: str`, `jwt_algorithm: str`, `jwt_expire_minutes: int`, `cors_origins: list[str]` |
| `backend/app/main.py` | CORS origins from `settings.cors_origins`; include `auth_router` |
| `backend/app/api/deps.py` | Add `UsersRepository`, `AuthService` to `services_scope()`; add `get_current_user()`, `require_admin()`, `get_optional_user()` FastAPI dependencies |
| `backend/app/api/routers/events.py` | Add `Depends(require_admin)` to write routes |
| `backend/app/api/routers/players.py` | Add `Depends(require_admin)` to `POST /players` |
| `backend/app/api/routers/rounds.py` | Add `Depends(require_admin)` to all routes |
| `frontend/src/lib/api.ts` | `API_BASE` → env var; inject `Authorization` header; handle 401 |
| `frontend/src/app/routes.tsx` | Add `/login`, `/create-account` routes; wrap admin routes in `RequireAdmin`, user routes in `ProtectedRoute` |
| `frontend/src/app/AppShell.tsx` | Auth-aware controls in `CardNav` (login link / user email + logout) |
| `frontend/src/pages/EventSlots.tsx` | Hide "Create Event" button for non-admin users |
| `backend/.env.example` | Template with all `PADEL_*` env vars |
| `frontend/.env.example` | Template with `VITE_API_BASE_URL` |

---

## Password Hashing Decision

**Chosen**: `bcrypt` (PyCA, direct — no `passlib` wrapper)

| Decision | Detail |
|---|---|
| Library | `bcrypt>=4.3.0` (PyCA, actively maintained) |
| Wrapper | None — `passlib` is unmaintained since 2020; `bcrypt` used directly |
| Rounds | 12 (default; ~300ms on modern hardware — acceptable for a login endpoint) |
| Async | Hashing runs in the synchronous handler (FastAPI `def`, not `async def`) — no threadpool needed |
| Storage | `hashed_password` stored as the full bcrypt string (`$2b$12$...`) |

`bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)).decode()` returns a string.  
`bcrypt.checkpw(plain.encode(), hashed.encode())` returns a bool.
