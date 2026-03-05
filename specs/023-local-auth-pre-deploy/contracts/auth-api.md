# Contract: Auth API Endpoints

**Feature**: `023-local-auth-pre-deploy`  
**Interface type**: REST HTTP API  
**Base path**: `/api/v1/auth`  
**Created**: 2026-03-05

All endpoints use `Content-Type: application/json`. Error responses follow the existing project convention:
```json
{ "detail": "<human-readable message>" }
```

---

## POST /api/v1/auth/register

Register a new user account. Accounts created this way always receive `role = "user"`. Admin accounts can only be created via the CLI bootstrap script.

### Request

```json
{
  "email": "string",       // required; normalised to lowercase; must contain @ and a domain dot
  "password": "string"     // required; minimum 8 characters
}
```

### Response — 201 Created

```json
{
  "access_token": "string",   // signed JWT, HS256
  "token_type": "bearer"
}
```

The response logs the new user in immediately. The caller stores the token and is ready to make authenticated requests.

### Error responses

| Status | `detail` | Condition |
|---|---|---|
| 400 | `"Invalid email format"` | Email does not match basic format |
| 400 | `"Password must be at least 8 characters"` | Password too short |
| 409 | `"Email already registered"` | Email already exists (case-insensitive) |
| 422 | Pydantic validation error | Missing required fields |

---

## POST /api/v1/auth/login

Authenticate an existing user and receive a session token.

### Request

```json
{
  "email": "string",     // required; normalised to lowercase before lookup
  "password": "string"   // required
}
```

### Response — 200 OK

```json
{
  "access_token": "string",   // signed JWT, HS256
  "token_type": "bearer"
}
```

### Error responses

| Status | `detail` | Condition |
|---|---|---|
| 401 | `"Invalid email or password"` | Email not found OR password incorrect (same message — no enumeration) |
| 422 | Pydantic validation error | Missing required fields |

> **Security note**: The error message is deliberately generic. The backend MUST NOT distinguish between "email not found" and "wrong password" to prevent user enumeration.

---

## GET /api/v1/auth/me

Return the identity of the currently authenticated user. Requires a valid session token.

### Request headers

```
Authorization: Bearer <token>
```

### Response — 200 OK

```json
{
  "id": "string",       // UUID as string
  "email": "string",    // normalised email
  "role": "string"      // "admin" or "user"
}
```

### Error responses

| Status | `detail` | Condition |
|---|---|---|
| 401 | `"Token has expired"` | Token `exp` claim is in the past |
| 401 | `"Invalid token"` | Malformed token or wrong signature |
| 403 | (from HTTPBearer) | No `Authorization` header present (`auto_error=True`) |

---

## Authorization dependency behaviour (affects all existing endpoints)

The following FastAPI dependencies are added to `backend/app/api/deps.py`. They affect existing routers as documented here.

### `get_current_user`

Used on: `GET /auth/me`

- Reads `Authorization: Bearer <token>` via `HTTPBearer(auto_error=True)`
- Decodes and verifies the JWT
- Returns a `TokenData` object: `{ sub: str, email: str, role: str }`
- Raises `401` on expired or invalid token

### `require_admin`

Used on: all event write routes, `POST /players`, all rounds routes

- Chains on `get_current_user`
- Returns the `TokenData` if `role == "admin"`
- Raises `403 Forbidden` if role is `"user"`
- Raises `401` if token is invalid/missing (inherited from `get_current_user`)

### `get_optional_user`

Used on: (reserved for future use — events list read routes currently require any valid login via frontend guard; no backend optional-auth needed in this phase)

- Returns `TokenData | None` — never raises for missing/invalid token
- Returns `None` if no header, expired, or invalid
- Returns `TokenData` if valid

---

## Endpoint protection table (complete — all existing + new routers)

| Method | Path | Auth required | Level |
|---|---|---|---|
| `POST` | `/auth/register` | No | public |
| `POST` | `/auth/login` | No | public |
| `GET` | `/auth/me` | Yes | any valid token |
| `GET` | `/health` | No | public |
| `GET` | `/players` | No | public |
| `POST` | `/players` | Yes | admin |
| `GET` | `/players/{id}/stats` | No | public |
| `GET` | `/leaderboards/*` | No | public |
| `GET` | `/events` | No | public (frontend restricts display; no backend guard needed) |
| `POST` | `/events` | Yes | admin |
| `GET` | `/events/{id}` | No | public |
| `PUT` | `/events/{id}` | Yes | admin |
| `PATCH` | `/events/{id}/status` | Yes | admin |
| `GET` | `/events/{id}/summary` | No | public |
| `GET` | `/events/{id}/progress` | No | public |
| `POST` | `/rounds` | Yes | admin |
| `POST` | `/rounds/{id}/scores` | Yes | admin |
| `PATCH` | `/rounds/{id}` | Yes | admin |

> **Design note**: The `/events` GET endpoints are kept public at the backend level. The frontend enforces the "requires login to view events list" rule via route guards. This keeps the API simpler and avoids needing optional-auth middleware for what is essentially a display-layer decision.
