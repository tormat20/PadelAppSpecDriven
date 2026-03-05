# Tasks: Local Auth + Pre-Deploy Foundation

**Feature**: `023-local-auth-pre-deploy`  
**Input**: Design documents from `specs/023-local-auth-pre-deploy/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/auth-api.md, contracts/frontend-auth.md, contracts/bootstrap-cli.md

**Tech stack**: Python 3.12 + FastAPI + DuckDB (backend); TypeScript 5.x + React 18.3 + React Router DOM 6 + Vite 5 (frontend)  
**New packages**: `PyJWT>=2.9.0`, `bcrypt>=4.3.0` (backend only; zero new npm packages)

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US5)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add new dependencies, env config files, and the DB migration that all other work depends on.

- [ ] T001 Add `PyJWT>=2.9.0` and `bcrypt>=4.3.0` to `backend/pyproject.toml` dependencies list
- [ ] T002 [P] Create `backend/.env.example` with `PADEL_JWT_SECRET_KEY=`, `PADEL_JWT_ALGORITHM=HS256`, `PADEL_JWT_EXPIRE_MINUTES=480`, `PADEL_CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173"]`, and `PADEL_DB_PATH=` fields
- [ ] T003 [P] Create `frontend/.env.example` with `VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1`
- [ ] T004 Extend `backend/app/core/config.py` `Settings` class with `jwt_secret_key: str` (required, no default), `jwt_algorithm: str = "HS256"`, `jwt_expire_minutes: int = 480`, `cors_origins: list[str] = [...]`
- [ ] T005 Create `backend/app/db/migrations/007_users.sql` with `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, hashed_password TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin','user')), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`
- [ ] T006 Run `uv add "PyJWT>=2.9.0" "bcrypt>=4.3.0"` from `backend/` to install new packages and update lock file

**Checkpoint**: Dependencies installed, env files templated, migration SQL written, config extended — ready for all implementation phases.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core auth domain logic, persistence layer, service wiring, and CORS update that every user story depends on. Must be complete before any user story work begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T007 Create `backend/app/domain/auth.py` with pure functions: `hash_password(plain: str) -> str` (bcrypt, 12 rounds), `verify_password(plain: str, hashed: str) -> bool`, `create_token(sub: str, email: str, role: str, secret: str, algorithm: str, expire_minutes: int) -> str` (PyJWT HS256), `decode_token(token: str, secret: str, algorithm: str) -> dict` (raises `jwt.ExpiredSignatureError` / `jwt.InvalidTokenError`)
- [ ] T008 [P] Create `backend/app/repositories/sql/users/create.sql` — `INSERT INTO users (id, email, hashed_password, role) VALUES (?, ?, ?, ?)` (no RETURNING; re-query after insert)
- [ ] T009 [P] Create `backend/app/repositories/sql/users/get_by_email.sql` — `SELECT id, email, hashed_password, role, created_at FROM users WHERE email = ?`
- [ ] T010 [P] Create `backend/app/repositories/sql/users/get_by_id.sql` — `SELECT id, email, hashed_password, role, created_at FROM users WHERE id = ?`
- [ ] T011 [P] Create `backend/app/repositories/sql/users/exists_any.sql` — `SELECT COUNT(*) FROM users`
- [ ] T012 [P] Create `backend/app/repositories/sql/users/upsert_by_email.sql` — `INSERT INTO users (id, email, hashed_password, role) VALUES (?, ?, ?, 'admin') ON CONFLICT (email) DO UPDATE SET hashed_password = EXCLUDED.hashed_password, role = 'admin'`
- [ ] T013 Create `backend/app/repositories/users_repo.py` with `UsersRepository` class: `__init__(self, conn)`, `create(id, email, hashed_password, role='user') -> dict`, `get_by_email(email) -> dict | None`, `get_by_id(id) -> dict | None`, `exists_any() -> bool`, `upsert_admin(id, email, hashed_password)` — using `load_sql("users/<file>.sql")` and `?` positional params, row access by integer index (T008–T012 must exist)
- [ ] T014 Create `backend/app/api/schemas/auth.py` with Pydantic models: `LoginRequest(email: str, password: str)`, `RegisterRequest(email: str, password: str)`, `TokenResponse(access_token: str, token_type: str = "bearer")`, `MeResponse(id: str, email: str, role: str)`
- [ ] T015 Create `backend/app/services/auth_service.py` with `AuthService`: `__init__(self, users_repo: UsersRepository)`, `register(email, password) -> str` (returns token; raises 400/409), `login(email, password) -> str` (returns token; raises 401), `get_me(token) -> MeResponse` (raises 401) — uses `domain/auth.py` functions and `settings`
- [ ] T016 Add `UsersRepository` and `AuthService` to `services_scope()` in `backend/app/api/deps.py`; add `get_current_user(credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer()))` FastAPI dependency (decodes JWT, returns `TokenData`); add `require_admin(token_data = Depends(get_current_user))` (raises 403 if role ≠ admin); add `get_optional_user()` (returns `TokenData | None`, never raises)
- [ ] T017 Update `backend/app/main.py`: replace hardcoded CORS list with `allow_origins=settings.cors_origins`; add `include_router(auth_router, prefix="/api/v1")`

**Checkpoint**: Auth domain layer, persistence, service, and deps complete — user story routes and frontend can now be built.

---

## Phase 3: User Story 2 — First-Admin Bootstrap (Priority: P1)

> US2 is implemented before US1 here because the CLI script is the only way to create an admin account needed to test US1's login flow. US2 has no frontend dependency.

**Goal**: CLI script that creates or updates an admin account; idempotent; validates email format and password length.

**Independent Test**: Start with an empty `users` table. Run `python -m app.scripts.seed_admin --email admin@test.com --password correct123`. Confirm exit 0 and confirmation message. Run again with the same email and a new password — confirm exit 0. Run with `--email bad-email` — confirm exit 1. Run with `--password short` — confirm exit 1.

### Implementation for User Story 2

- [ ] T018 [US2] Create `backend/app/scripts/seed_admin.py` implementing: `argparse` with `--email` / `--password` (optional; interactive `getpass.getpass` fallback); email format validation (contains `@` and domain dot); password length validation (≥ 8 chars); normalise email to lowercase; open DuckDB connection via `settings.db_path`; call `hash_password()` from `domain/auth.py`; call `users_repo.upsert_admin()`; print `✓ Admin account created/updated for <email>` on success; print to stderr and `sys.exit(1)` on validation or DB error (T007, T012, T013 must be complete)
- [ ] T019 [US2] Verify `python -m app.scripts.seed_admin --help` prints usage and exits 0; verify no-args mode prompts interactively

**Checkpoint**: US2 fully functional — admin can be bootstrapped, password updated, errors rejected. Required before manual testing of US1.

---

## Phase 4: User Story 1 — Admin Login and Protected Access (Priority: P1)

**Goal**: `/login` page, JWT-backed session, admin route guards, nav bar auth state, protected write routes on backend.

**Independent Test**: Seed admin via CLI (US2). Visit `/login`, submit valid credentials, confirm redirect to home and nav shows admin email. Refresh — still logged in. Click log out — nav shows "Log in", `/events/create` redirects to `/login`. Submit wrong password — error shown, stay on `/login`.

### Backend — Auth router and route guards (US1)

- [ ] T020 [US1] Create `backend/app/api/routers/auth.py` with `router = APIRouter(prefix="/auth", tags=["auth"])`: `POST /login` → `AuthService.login()` → `TokenResponse` (401 on bad creds); `POST /register` → `AuthService.register()` → `TokenResponse` 201 (400/409 on invalid input); `GET /me` → `AuthService.get_me()` → `MeResponse` (requires `get_current_user`)
- [ ] T021 [US1] Add `Depends(require_admin)` to all write routes in `backend/app/api/routers/events.py` (POST, PUT, PATCH /status)
- [ ] T022 [US1] Add `Depends(require_admin)` to `POST /players` in `backend/app/api/routers/players.py`
- [ ] T023 [US1] Add `Depends(require_admin)` to all routes in `backend/app/api/routers/rounds.py`

### Frontend — Auth context and api.ts updates (US1)

- [ ] T024 [US1] Update `frontend/src/lib/api.ts`: change `API_BASE` to `import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1"`; inject `Authorization: Bearer <token>` header from `localStorage.getItem("auth_token")` in request function; on 401 response: `localStorage.removeItem("auth_token")`, `window.dispatchEvent(new Event("auth:logout"))`, throw `ApiError("Session expired...", 401)`; export `loginUser(email, password): Promise<string>` and `registerUser(email, password): Promise<string>`
- [ ] T025 [US1] Create `frontend/src/contexts/AuthContext.tsx`: `AuthUser` interface (`sub`, `email`, `role`), `AuthContextValue` interface (`token`, `user`, `isLoading`, `login`, `logout`); `AuthProvider` reads `localStorage("auth_token")` on mount, decodes JWT payload via `atob(token.split('.')[1])` + `decodeURIComponent`, sets `isLoading=false` after hydration, clears corrupt tokens silently; listens for `"auth:logout"` event; `login(token)` stores to localStorage and decodes; `logout()` removes from localStorage; export `useAuth()` hook that throws if used outside provider
- [ ] T026 [US1] Create `frontend/src/components/auth/ProtectedRoute.tsx`: renders `null` while `isLoading`, `<Navigate to="/login" state={{ from: location }} replace />` if no token, otherwise `<Outlet />`
- [ ] T027 [US1] Create `frontend/src/components/auth/RequireAdmin.tsx`: renders `null` while `isLoading`, `<Navigate to="/login" replace />` if no token, `<Navigate to="/" replace />` if role ≠ admin, otherwise `<Outlet />`
- [ ] T028 [US1] Create `frontend/src/pages/Login.tsx`: full-page layout (no AppShell); email + password fields with correct `type`/`name`/`autocomplete` attrs; "Log in" submit button with loading state; inline error display; on success call `useAuth().login(token)` + navigate to `state.from ?? "/"`; on 401 show "Invalid email or password"; on network error show "Unable to connect. Please try again."; if already authenticated redirect to `/` on mount
- [ ] T029 [US1] Update `frontend/src/app/routes.tsx`: add `/login` → `<LoginPage />` (outside AppShell, public); add `/create-account` → `<CreateAccountPage />` (outside AppShell, public — placeholder for US3); wrap events and summary routes in `<ProtectedRoute>`; wrap `events/create`, `events/:id/preview`, `events/:id/run`, `players/register` in `<RequireAdmin>`
- [ ] T030 [US1] Update `frontend/src/app/AppShell.tsx`: import `useAuth()`; when `isLoading` render nothing in nav auth area; when unauthenticated show "Log in" link to `/login`; when authenticated show user email + "Log out" button (calls `logout()` then navigates to `/`); admin users show a crown indicator alongside email
- [ ] T031 [US1] Wrap `<App />` in `<AuthProvider>` in `frontend/src/main.tsx`

**Checkpoint**: US1 fully functional — admin can log in, session persists on refresh, protected write routes are guarded, nav reflects auth state.

---

## Phase 5: User Story 4 — Public Guest Access (Priority: P1)

**Goal**: Confirm all public routes (`/`, `/players/search`, `/players/:id/stats`) work without a token and that no regressions were introduced by the auth layer.

**Independent Test**: Open app in private/incognito browser. Visit `/`, `/players/search`, `/players/:id/stats` — all load with no redirect. Visit `/events` — redirected to `/login`. Visit `/players/register` — redirected to `/login`.

### Implementation for User Story 4

- [ ] T032 [US4] Verify no `Depends(require_admin)` or `Depends(get_current_user)` was inadvertently added to `GET /players`, `GET /players/{id}/stats`, `GET /leaderboards/*`, `GET /health` in their respective routers; fix any accidental guards found
- [ ] T033 [US4] Confirm `frontend/src/app/routes.tsx` — home page `/`, `/players/search`, `/players/:id/stats` routes are NOT wrapped in `ProtectedRoute` or `RequireAdmin`; fix if incorrect
- [ ] T034 [US4] Manually run quickstart.md §7 "Public access" verification checklist against the running app: `http://localhost:5173/` loads leaderboards; `/players/search` loads; `/events` redirects to `/login`

**Checkpoint**: US4 validated — public routes are regression-free and access control boundaries are correct.

---

## Phase 6: User Story 3 — User Self-Signup and Read-Only Access (Priority: P2)

**Goal**: `/create-account` page, `POST /auth/register` endpoint wired to frontend, read-only events view for authenticated regular users, admin controls hidden from `user` role.

**Independent Test**: Visit `/create-account`, submit new email + password ≥ 8 chars, confirm auto-login and redirect to home. Navigate to `/events` — list loads without "Create Event" button. Navigate to `/events/create` — redirected to home. Try duplicate email — 409 error shown. Try short password — inline client-side error, no submit.

### Implementation for User Story 3

- [ ] T035 [US3] Create `frontend/src/pages/CreateAccount.tsx`: same full-page layout as Login; email + password fields; client-side validation (password < 8 chars shows inline error, blocks submit); on submit call `registerUser()` from `api.ts`; on success call `useAuth().login(token)` + navigate to `/`; on 409 show "An account with this email already exists"; on 400 show `detail` from response; if already authenticated redirect to `/` on mount
- [ ] T036 [US3] Wire `/create-account` route in `frontend/src/app/routes.tsx` to `<CreateAccountPage />` (replace placeholder from T029)
- [ ] T037 [US3] Update `frontend/src/pages/EventSlots.tsx` (or equivalent events list component): hide "Create Event" button/link when `useAuth().user?.role !== "admin"`; read-only view shown to `role === "user"` — no create/run controls visible

**Checkpoint**: US3 fully functional — new users can self-register, auto-login, and access events read-only; admin controls are hidden.

---

## Phase 7: User Story 5 — Session Persistence and Logout (Priority: P2)

**Goal**: localStorage-backed session survives refresh and tab close; logout clears all auth state immediately; expired token triggers silent redirect to `/login`.

**Independent Test**: Log in as any user. Close the tab and reopen. Confirm still logged in (nav shows email). Click log out. Confirm nav shows "Log in" and `/events` redirects to `/login`. Simulate an expired token by manually setting a past-expired JWT in localStorage and navigating to an authenticated route — confirm redirect to `/login`.

### Implementation for User Story 5

- [ ] T038 [US5] Verify `AuthProvider` in `frontend/src/contexts/AuthContext.tsx` correctly re-reads `localStorage("auth_token")` on every mount (i.e. after tab reopen / hard refresh) and restores `token` + decoded `user` state — `isLoading` must be `false` after hydration
- [ ] T039 [US5] Verify `logout()` in `AuthContext` calls `localStorage.removeItem("auth_token")` AND clears `token` and `user` state synchronously so UI updates immediately
- [ ] T040 [US5] Verify the `"auth:logout"` event listener in `AuthProvider` calls `logout()` when dispatched by `api.ts` on a 401 response, and that `ProtectedRoute` then redirects to `/login` without a hard page reload
- [ ] T041 [US5] Add `AuthProvider` expiry check on mount: after decoding the stored token, if `exp * 1000 < Date.now()` clear the token silently (same behaviour as a corrupt token) so the user is treated as unauthenticated from the start

**Checkpoint**: US5 fully functional — sessions survive refresh, logout is immediate, expired tokens are handled gracefully.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Wiring validation, env file hygiene, and final quickstart verification pass.

- [ ] T042 [P] Ensure `backend/.env` is listed in `backend/.gitignore` (or root `.gitignore`) — verify `.env` is gitignored and `.env.example` is tracked
- [ ] T043 [P] Ensure `frontend/.env` is listed in `frontend/.gitignore` — verify `.env` is gitignored and `.env.example` is tracked
- [ ] T044 Run full quickstart.md verification (all 4 scenarios: public access, user self-signup, admin login, logout) against the locally running app and confirm all steps pass
- [ ] T045 Run `npm test` from `frontend/` and confirm no existing Vitest tests regressed
- [ ] T046 Run `uv run pytest` from `backend/` and confirm all existing pytest tests still pass
- [ ] T047 [P] Confirm `backend/app/api/routers/auth.py` router is included in `main.py` with prefix `/api/v1` so `/api/v1/auth/login` etc. are reachable
- [ ] T048 Smoke-test the bootstrap CLI idempotency: run `python -m app.scripts.seed_admin --email admin@test.com --password correct123` twice; confirm second run updates password without error

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 (T004 needed for T015/T016; T005 for T013; T006 for T007) — **BLOCKS all user story phases**
- **Phase 3 (US2 Bootstrap)**: Depends on Phase 2 (T007, T012, T013)
- **Phase 4 (US1 Login)**: Depends on Phase 2; depends on Phase 3 completing (need a seeded admin to manually validate)
- **Phase 5 (US4 Public)**: Depends on Phase 4 being complete (route guards must be in place to verify no regressions)
- **Phase 6 (US3 Signup)**: Depends on Phase 4 (AuthContext, ProtectedRoute, api.ts must exist)
- **Phase 7 (US5 Persistence)**: Depends on Phase 4 (AuthContext must exist)
- **Phase 8 (Polish)**: Depends on all user story phases completing

### User Story Dependencies

- **US2 (Bootstrap, P1)**: Depends only on Foundational (Phase 2) — no other story dependencies
- **US1 (Admin Login, P1)**: Depends on Phase 2 and US2 (need seeded admin for manual validation)
- **US4 (Public Access, P1)**: Depends on US1 being complete (route guards must be wired first)
- **US3 (Self-Signup, P2)**: Depends on Phase 2 and US1 (AuthContext and api.ts must exist); independent of US2/US4
- **US5 (Persistence, P2)**: Depends on US1 (AuthContext must exist); can run in parallel with US3 after US1

### Parallel Opportunities Within Phases

- **Phase 1**: T002, T003 can run in parallel with each other; T001 first, then T004/T005/T006 can follow in parallel
- **Phase 2**: T008–T012 (SQL files) can all run in parallel; T007 independent of SQL files; T013 needs T008–T012; T014 independent; T015 needs T013/T014/T007; T016 needs T015; T017 needs T004
- **Phase 4 backend**: T021, T022, T023 can all run in parallel after T020 is complete (or alongside T020 since they modify different files)
- **Phase 4 frontend**: T024 (api.ts) and T025 (AuthContext) can run in parallel; T026/T027 can run in parallel after T025; T028 needs T025; T029 needs T026/T027/T028; T030 needs T025; T031 needs T025

---

## Parallel Example: Phase 2 (Foundational)

```
# Batch 1 — fully independent, run together:
T007  Create backend/app/domain/auth.py
T008  Create backend/app/repositories/sql/users/create.sql
T009  Create backend/app/repositories/sql/users/get_by_email.sql
T010  Create backend/app/repositories/sql/users/get_by_id.sql
T011  Create backend/app/repositories/sql/users/exists_any.sql
T012  Create backend/app/repositories/sql/users/upsert_by_email.sql
T014  Create backend/app/api/schemas/auth.py

# Batch 2 — after Batch 1:
T013  Create backend/app/repositories/users_repo.py  (needs T008–T012)
T015  Create backend/app/services/auth_service.py    (needs T007, T013, T014)

# Batch 3 — after Batch 2:
T016  Update backend/app/api/deps.py                 (needs T013, T015)
T017  Update backend/app/main.py                     (needs T004 from Phase 1)
```

## Parallel Example: Phase 4 (US1 Admin Login)

```
# Backend batch — run together:
T020  Create backend/app/api/routers/auth.py
T021  Add require_admin to backend/app/api/routers/events.py
T022  Add require_admin to backend/app/api/routers/players.py
T023  Add require_admin to backend/app/api/routers/rounds.py

# Frontend batch A — run together:
T024  Update frontend/src/lib/api.ts
T025  Create frontend/src/contexts/AuthContext.tsx

# Frontend batch B — after T025:
T026  Create frontend/src/components/auth/ProtectedRoute.tsx
T027  Create frontend/src/components/auth/RequireAdmin.tsx
T028  Create frontend/src/pages/Login.tsx
T030  Update frontend/src/app/AppShell.tsx
T031  Update frontend/src/main.tsx

# Frontend batch C — after T026, T027, T028:
T029  Update frontend/src/app/routes.tsx
```

---

## Implementation Strategy

### MVP Scope (P1 Stories Only: US2 + US1 + US4)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (blocks everything)
3. Complete Phase 3: US2 Bootstrap CLI
4. Complete Phase 4: US1 Admin Login
5. Complete Phase 5: US4 Public Access validation
6. **STOP and VALIDATE**: Full manual test per quickstart.md §7
7. App is usable: admin can log in, write operations are protected, public pages still work

### Full Delivery (all 5 stories)

1. MVP scope above (Phases 1–5)
2. Phase 6: US3 Self-Signup → test independently
3. Phase 7: US5 Session Persistence edge cases → test independently
4. Phase 8: Polish and regression checks

---

## Notes

- [P] tasks touch different files with no cross-dependencies — safe to run in parallel
- US2 is implemented before US1 because the CLI is needed to seed the admin account for US1 manual validation
- `ProtectedRoute` must render `null` (not redirect) while `isLoading === true` to prevent flash-to-login on refresh
- `api.ts` reads `localStorage` directly (outside React tree); `AuthProvider` listens for `"auth:logout"` custom event to sync React state on 401
- DuckDB `id` column uses `TEXT` type (not `UUID`); Python generates UUIDs with `str(uuid.uuid4())`
- bcrypt rounds = 12 (~300ms) — run in sync `def` handlers, no threadpool needed
- `PADEL_JWT_SECRET_KEY` has no default in `pydantic-settings`; app refuses to start without it
- All email normalisation (lowercase) happens at the service layer before any DB read or write
