# Research: Local Auth + Pre-Deploy Foundation

**Feature**: `023-local-auth-pre-deploy`  
**Created**: 2026-03-05  
**Phase 0 output — all unknowns resolved**

---

## Unknown 1: JWT library — PyJWT vs python-jose

**Decision**: Use `PyJWT>=2.9.0`

**Rationale**:
- PyJWT 2.x is actively maintained by the jwt.io team
- `python-jose` has had security CVEs and slower maintenance cycles
- PyJWT 2.x `jwt.encode()` returns `str` (not bytes — no `.decode()` call needed)
- `algorithms=[...]` parameter is **required** in `jwt.decode()` — prevents algorithm-confusion attacks
- Exceptions: catch `jwt.ExpiredSignatureError` before `jwt.InvalidTokenError` (specific before general)
- Token payload fields: `sub` (user id), `email`, `role`, `iat`, `exp` — all timezone-aware UTC datetimes

**Alternatives considered**:
- `python-jose[cryptography]` — more features (JWK, RS256) but heavier and less actively maintained; not needed for HS256
- `authlib` — full OAuth2/OIDC stack; excessive for simple JWT issuance

---

## Unknown 2: Password hashing — passlib vs bcrypt direct

**Decision**: Use `bcrypt>=4.3.0` (PyCA) **directly**, without passlib wrapper

**Rationale**:
- `passlib` has not had a release since October 2020 — effectively unmaintained
- `bcrypt` 4.x (rewritten in Rust by PyCA) removed `bcrypt.__about__` which passlib 1.7.4 probed for version detection → non-fatal trapped warning but cosmetically noisy
- `bcrypt` 5.0 (Sept 2025) introduces breaking changes (hard ValueError for passwords > 72 bytes); using direct bcrypt lets us control this boundary cleanly
- PyCA's `bcrypt` is actively maintained and is the actual hashing backend that passlib delegates to anyway
- API surface is minimal: `bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=12)).decode()` and `bcrypt.checkpw(plain.encode(), hashed.encode())`

**Rounds**: 12 (default; ~300ms on modern hardware — OWASP minimum is 10; 12 is the 2026 standard)

**Alternatives considered**:
- `argon2-cffi` (argon2id) — current OWASP winner for new projects; rejected because we want bcrypt compatibility with potential future export/import of hash strings, and the app's threat model doesn't require argon2's memory-hardness
- `passlib[bcrypt]` with `bcrypt<5.0` pin — rejected because passlib is unmaintained; adding a version pin creates future maintenance debt

**FastAPI sync context**: All auth routes are synchronous `def` handlers (matching the existing codebase pattern). Bcrypt's ~300ms is blocking but acceptable in a sync handler — no threadpool needed.

---

## Unknown 3: React auth state management approach

**Decision**: React Context API + localStorage, no external state library

**Rationale**:
- The project has zero existing state management dependencies (no Redux, Zustand, Jotai)
- Auth state is simple: `{ token, user, isLoading, login, logout }` — no need for a full state machine
- `AuthContext` is created fresh in `contexts/AuthContext.tsx` following the standard React pattern
- localStorage key: `"auth_token"` — readable synchronously both inside and outside React components
- JWT payload decoded client-side without a library: `atob(token.split('.')[1])` + `decodeURIComponent` for UTF-8 safety

**Token refresh**: explicitly out of scope. Single 8-hour token; no refresh endpoint.

**401 handling outside React**: The `api.ts` module runs outside the component tree. On 401:
1. `localStorage.removeItem("auth_token")`
2. `window.dispatchEvent(new Event("auth:logout"))`
3. `AuthProvider` listens for `"auth:logout"` and calls `logout()`, clearing React state
4. `ProtectedRoute` re-evaluates and redirects to `/login` via React Router — no hard page reload

**Flash prevention**: `isLoading` is `true` until the `useEffect` localStorage hydration completes. `ProtectedRoute` renders `null` (not a redirect) while `isLoading` is `true`.

**Alternatives considered**:
- Zustand — rejected; no existing dependency, adds complexity for simple auth state
- `window.location.href = '/login'` hard redirect on 401 — simpler but causes full page reload and loses React state; replaced by custom event pattern

---

## Unknown 4: DuckDB users table specifics

**Decision**: `UUID` column type for `id`, `gen_random_uuid()` default, `CURRENT_TIMESTAMP` for `created_at`

**Rationale**:
- DuckDB 1.1+ supports `UUID` as a native first-class type (efficient 128-bit internal storage)
- `gen_random_uuid()` is available as a scalar function and works as a column default
- **Gotcha**: Python `duckdb` returns `UUID` columns as `uuid.UUID` objects, not strings. Cast in SQL: `CAST(id AS TEXT)` — or consistently use `TEXT` for id to match other tables in the project
- **Resolution**: Use `TEXT` for `id` (consistent with all other tables in the project which use `TEXT PRIMARY KEY`) — pass the UUID string explicitly from Python using `str(uuid.uuid4())`
- `CURRENT_TIMESTAMP` is used project-wide (confirmed in migrations 000–006); use it here too
- `INSERT ... ON CONFLICT (email) DO UPDATE SET ... = EXCLUDED.field` — DuckDB supports this; used for the bootstrap upsert
- Migration is `007_users.sql` (next in sequence after `006_rename_beat_the_box_to_ranked_box.sql`)
- `CREATE TABLE IF NOT EXISTS` makes the migration idempotent

**Revised table DDL** (after UUID type research):

```sql
CREATE TABLE IF NOT EXISTS users (
    id              TEXT      PRIMARY KEY,
    email           TEXT      NOT NULL UNIQUE,
    hashed_password TEXT      NOT NULL,
    role            TEXT      NOT NULL DEFAULT 'user'
                              CHECK (role IN ('admin', 'user')),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Python generates the UUID: `import uuid; user_id = str(uuid.uuid4())` — passed as first `?` param.

---

## Unknown 5: Existing repository and service patterns

**Decision**: Follow existing patterns exactly — no deviations

**Confirmed patterns** (from codebase exploration):

| Pattern | Detail |
|---|---|
| Repo constructor | `def __init__(self, conn):` — untyped `conn` parameter |
| SQL parameterisation | `?` positional placeholders; params passed as a Python list |
| Row access | Integer index: `row[0]`, `row[1]` — never dict-style |
| After INSERT | Re-query with `get()` — no `RETURNING` clause |
| `load_sql()` | `from app.repositories.base import load_sql`; call as `load_sql("users/filename.sql")` |
| Service constructor | `def __init__(self, users_repo: UsersRepository):` |
| deps.py | `services_scope()` is a `@contextmanager`, not a FastAPI `Depends` — repos and services instantiated together inside `with get_connection() as conn:` |
| Router | `router = APIRouter(prefix="/auth", tags=["auth"])`; sync `def` handlers; `with services_scope() as services:` body |
| Tests | `fastapi.testclient.TestClient`; `settings.db_path` mutated to `tmp_path`; sync `def test_*` functions |

**New FastAPI dependencies**: `get_current_user`, `require_admin`, `get_optional_user` are **pure FastAPI `Depends()`-style functions** in `deps.py`, separate from `services_scope()`. They do not need a DB connection — they decode the JWT from the request header without touching the database.

---

## Unknown 6: `PADEL_JWT_SECRET_KEY` startup validation

**Decision**: Make `jwt_secret_key` a required field with no default in `pydantic-settings`

**Implementation**:
```python
class Settings(BaseSettings):
    jwt_secret_key: str                          # no default → required
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480                # 8 hours
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
```

`pydantic-settings` raises `ValidationError` on startup if `PADEL_JWT_SECRET_KEY` is missing from the environment. This is the correct behaviour — the app should not start without a secret.

---

## Unknown 7: CORS configuration

**Decision**: Move hardcoded CORS list to `settings.cors_origins`

**Current state**: `allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"]` hardcoded in `main.py`

**New state**: `allow_origins=settings.cors_origins` — list read from `PADEL_CORS_ORIGINS` env var

**`pydantic-settings` JSON parsing**: list types are parsed from a JSON string in the env var:
```
PADEL_CORS_ORIGINS=["http://localhost:5173","https://mypadelapp.com"]
```

**`allow_headers`** remains `["*"]` — `Authorization` header is already included. No change needed.

---

## Summary: Dependency additions

### Backend (`backend/pyproject.toml`)

```toml
"PyJWT>=2.9.0",
"bcrypt>=4.3.0",
```

### Frontend (`frontend/package.json`)

No new npm packages. JWT decoding is done with `atob()` (built-in browser API). No `jose`, `jwt-decode`, or any auth library needed.
