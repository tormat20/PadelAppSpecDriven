# Contract: Frontend Auth Components and Route Guards

**Feature**: `023-local-auth-pre-deploy`  
**Interface type**: React component contracts + TypeScript interfaces  
**Created**: 2026-03-05

---

## AuthContext

Central auth state available to all components via `useAuth()`.

### TypeScript interface

```typescript
// frontend/src/contexts/AuthContext.tsx

export interface AuthUser {
  sub: string;       // user id (UUID string from JWT "sub" claim)
  email: string;     // normalised email
  role: "admin" | "user";
}

export interface AuthContextValue {
  token: string | null;       // raw JWT string, or null if unauthenticated
  user: AuthUser | null;      // decoded payload, or null if unauthenticated
  isLoading: boolean;         // true only during initial localStorage hydration
  login: (token: string) => void;     // store token + decode user
  logout: () => void;                 // clear token + user
}
```

### `useAuth()` hook

```typescript
export function useAuth(): AuthContextValue
// Throws if called outside <AuthProvider>
```

### `AuthProvider` component

```typescript
export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element
// - Reads token from localStorage key "auth_token" on mount
// - Decodes JWT payload without a library (atob + decodeURIComponent)
// - If stored token is corrupt/unparseable, clears it silently
// - Exposes login(), logout() methods
// - Wraps the entire app — placed in main.tsx around <BrowserRouter>
```

### localStorage key

```
"auth_token"
```

All reads/writes to this key go through `AuthProvider`. The API module (`api.ts`) reads this key directly (via `localStorage.getItem`) to inject `Authorization` headers, since it runs outside the React tree.

---

## ProtectedRoute

Redirects unauthenticated users to `/login`. Passes through authenticated users of any role.

### Component contract

```typescript
// frontend/src/components/auth/ProtectedRoute.tsx

// Props: none — uses React Router Outlet pattern
export function ProtectedRoute(): JSX.Element

// Behaviour:
// - isLoading === true  → renders null (prevents flash-redirect while hydrating)
// - token === null      → <Navigate to="/login" state={{ from: location }} replace />
// - token present       → <Outlet /> (renders child routes)
```

### Usage in routes.tsx

```typescript
// Wrap a group of routes that require any login:
{
  element: <ProtectedRoute />,
  children: [
    { path: "events", element: <EventSlotsPage /> },
    { path: "events/:eventId/summary", element: <SummaryPage /> },
  ]
}
```

---

## RequireAdmin

Redirects non-admin users to home. Must be nested inside (or alongside) `ProtectedRoute`.

### Component contract

```typescript
// frontend/src/components/auth/RequireAdmin.tsx

// Props: none — uses React Router Outlet pattern
export function RequireAdmin(): JSX.Element

// Behaviour:
// - isLoading === true        → renders null
// - token === null            → <Navigate to="/login" replace />
// - role !== "admin"          → <Navigate to="/" replace />
// - role === "admin"          → <Outlet />
```

### Usage in routes.tsx

```typescript
// Wrap a group of routes that require admin role:
{
  element: <RequireAdmin />,
  children: [
    { path: "events/create", element: <CreateEventPage /> },
    { path: "events/:eventId/preview", element: <PreviewEventPage /> },
    { path: "events/:eventId/run", element: <RunEventPage /> },
    { path: "players/register", element: <RegisterPlayerPage /> },
  ]
}
```

---

## Route structure (full revised routes.tsx)

```
/login                    → <LoginPage />         (public; redirects away if already logged in)
/create-account           → <CreateAccountPage />  (public; redirects away if already logged in)

/ (AppShell layout)
  index                   → <HomePage />           (public)
  players/search          → <SearchPlayerPage />   (public)
  players/:id/stats       → <PlayerStatsPage />    (public)

  [ProtectedRoute — any valid login required]
    events                → <EventSlotsPage />     (read-only UI for users)
    events/:id/summary    → <SummaryPage />

  [RequireAdmin — admin role required]
    events/create         → <CreateEventPage />
    events/:id/preview    → <PreviewEventPage />
    events/:id/run        → <RunEventPage />
    players/register      → <RegisterPlayerPage />
```

> **Note**: `/login` and `/create-account` are placed **outside** the `AppShell` layout route. They render their own full-page layouts without the top navigation bar. They are siblings of the AppShell route at the top level.

---

## Login Page (`/login`)

### Props: none

### Visual contract

- Full-page layout, no AppShell nav bar
- Matches app style: dark background (or light in light mode), glassmorphism card, existing font/colour tokens
- Card contains:
  - App logo / name heading
  - Email input (`type="email"`, `name="email"`, `autocomplete="email"`)
  - Password input (`type="password"`, `name="password"`, `autocomplete="current-password"`)
  - Submit button: "Log in"
  - Link to `/create-account`: "Don't have an account? Create one"
- Inline error message (below the form) on failed login
- Spinner or disabled button state during submission

### Behaviour

- If already authenticated on mount → redirect to `/` (or `state.from` path)
- On submit: `POST /api/v1/auth/login` with `{ email, password }`
- On success: call `login(token)` from `useAuth()`, navigate to `state.from ?? "/"`
- On error (`401`): show `"Invalid email or password"`
- On network error: show `"Unable to connect. Please try again."`

---

## Create Account Page (`/create-account`)

### Props: none

### Visual contract

- Same full-page layout as `/login`
- Card contains:
  - Heading: "Create account"
  - Email input
  - Password input (`autocomplete="new-password"`)
  - Password must be ≥ 8 characters; inline error shown if too short (client-side, before submit)
  - Submit button: "Create account"
  - Link to `/login`: "Already have an account? Log in"
- Inline error on duplicate email

### Behaviour

- If already authenticated on mount → redirect to `/`
- Client-side validation: password < 8 chars → show error, do not submit
- On submit: `POST /api/v1/auth/register` with `{ email, password }`
- On success: call `login(token)` from `useAuth()`, navigate to `/`
- On `409` error: show `"An account with this email already exists"`
- On `400` error: show the `detail` from the response

---

## AppShell nav bar auth controls

The `CardNav controls` prop is extended to include auth state awareness.

### Visual states

| Auth state | Controls shown |
|---|---|
| `isLoading` | Nothing (no flash) |
| Unauthenticated | `<ThemeToggle />` `<AnimationsToggle />` `<LoginButton />` |
| Authenticated (user) | `<ThemeToggle />` `<AnimationsToggle />` `<UserMenu email={user.email} onLogout={logout} />` |
| Authenticated (admin) | `<ThemeToggle />` `<AnimationsToggle />` `<UserMenu email={user.email} role="admin" onLogout={logout} />` |

### `LoginButton`

- Renders a small text link/button: "Log in"
- Navigates to `/login`

### `UserMenu`

- Renders the user's email (truncated if long)
- Admin users show a small visual indicator (e.g. crown icon, matching existing crown motif in the app)
- On click: shows a dropdown or inline "Log out" button
- "Log out" calls `logout()` from `useAuth()` then navigates to `/`

---

## API module (`api.ts`) auth changes

### Environment variable

```typescript
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1"
```

### Token injection

```typescript
// Added to the request() function headers spread:
const token = localStorage.getItem("auth_token")
const authHeader = token ? { Authorization: `Bearer ${token}` } : {}
```

### 401 handling

```typescript
if (response.status === 401) {
  localStorage.removeItem("auth_token")
  window.dispatchEvent(new Event("auth:logout"))
  throw new ApiError("Session expired. Please log in again.", 401)
}
```

`AuthProvider` listens for the `"auth:logout"` event and calls `logout()`, which clears in-memory state. `ProtectedRoute` then redirects to `/login` normally.

### New exported functions

```typescript
// Login — returns raw token string
export async function loginUser(email: string, password: string): Promise<string>

// Register — returns raw token string  
export async function registerUser(email: string, password: string): Promise<string>
```
