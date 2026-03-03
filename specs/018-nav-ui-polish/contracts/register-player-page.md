# Contract: Register Player page

**Feature**: 018-nav-ui-polish | **User Story**: US4 (P4)
**Files affected**:
- `frontend/src/pages/RegisterPlayer.tsx` — NEW
- `frontend/src/components/bento/MagicBentoMenu.tsx` — MODIFIED (card rename)
- `frontend/src/app/routes.tsx` — MODIFIED (new `/players/register` route)

---

## RegisterPlayer.tsx — new page

**Route**: `/players/register`
**Component name**: `RegisterPlayerPage` (default export)

---

## New exported helper

```ts
import { findDuplicateByName } from "../features/create-event/playerSearch";

/**
 * Returns a user-facing error string if the display name is invalid or
 * already exists in the catalog. Returns "" if the name is valid and unique.
 *
 * @param name    - raw value from the text input (may be untrimmed)
 * @param catalog - current player catalog from the API
 */
export function getRegisterPlayerError(
  name: string,
  catalog: { id: string; displayName: string }[],
): string
```

### Validation rules (in priority order)

| Priority | Condition | Return value |
|---|---|---|
| 1 | `name.trim() === ""` | `"Player name cannot be empty."` |
| 2 | `findDuplicateByName(catalog, name.trim()) !== null` | `"A player named '${name.trim()}' already exists."` |
| 3 | Otherwise | `""` (no error) |

---

## Local state

| Field | Type | Initial value | Notes |
|---|---|---|---|
| `name` | `string` | `""` | Controlled text input value |
| `catalog` | `{ id: string; displayName: string }[]` | `[]` | Loaded on mount via `searchPlayers("")` |
| `submitError` | `string` | `""` | Inline validation or API error |
| `successName` | `string` | `""` | Name of last successfully registered player |
| `isSubmitting` | `boolean` | `false` | Disables submit button during API call |

---

## Submit flow

```
User clicks "Register Player"
  → getRegisterPlayerError(name, catalog)
    → if error: set submitError, return early (no API call)
  → set isSubmitting = true, clear submitError, clear successName
  → await createPlayer(name.trim())
    → on success:
        append new player to catalog state
        set successName = name.trim()
        clear name input
        set isSubmitting = false
    → on ApiError:
        set submitError = error.message (or fallback)
        set isSubmitting = false
```

---

## Page layout

```tsx
<section className="page-shell">
  <header className="page-header panel">
    <h1 className="page-title">Register Player</h1>
    <p className="page-subtitle">Add a new player to the roster</p>
  </header>

  <section className="panel form-grid">
    <label htmlFor="player-name">Display name</label>
    <input
      id="player-name"
      className="input"
      type="text"
      value={name}
      onChange={(e) => setName(e.target.value)}
      disabled={isSubmitting}
      placeholder="Enter player name"
    />

    {submitError && (
      <p className="warning-text" role="alert">{submitError}</p>
    )}

    {successName && (
      <p role="status">
        Player '{successName}' registered.{" "}
        <button className={withInteractiveSurface("button-secondary")} onClick={() => setSuccessName("")}>
          Register Another
        </button>
      </p>
    )}

    <div className="action-row">
      <button
        aria-label="Main menu"
        className={withInteractiveSurface("button-secondary")}
        onClick={() => navigate("/")}
      >
        Main Menu
      </button>
      <button
        className={withInteractiveSurface("button")}
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Saving…" : "Register Player"}
      </button>
    </div>
  </section>
</section>
```

---

## MagicBentoMenu.tsx — card change

```ts
// Before:
{ title: "Player Setup", to: "/events/create", subtitle: "Search or register participants" }

// After:
{ title: "Register Player", to: "/players/register", subtitle: "Add a new player to the roster" }
```

Only the "Player Setup" card is changed in this user story. The "Create Event" card is unchanged.

---

## routes.tsx — new route

```ts
{ path: "players/register", element: <RegisterPlayerPage /> }
```

---

## Test contract

**New test file**: `frontend/tests/register-player-page.test.tsx`

Tests MUST cover `getRegisterPlayerError` as a pure function — no DOM rendering.

```ts
// Required test cases:
getRegisterPlayerError("", [])
  // → "Player name cannot be empty."

getRegisterPlayerError("   ", [])
  // → "Player name cannot be empty."

getRegisterPlayerError("Alice", [{ id: "1", displayName: "Alice" }])
  // → "A player named 'Alice' already exists."

getRegisterPlayerError("alice", [{ id: "1", displayName: "Alice" }])
  // → "A player named 'alice' already exists."  (case-insensitive via findDuplicateByName)

getRegisterPlayerError("Bob", [{ id: "1", displayName: "Alice" }])
  // → ""

getRegisterPlayerError("Bob", [])
  // → ""
```

---

## Acceptance criteria (from spec FR-013..018)

| FR | Criterion | Verified by |
|---|---|---|
| FR-013 | Bento card reads "Register Player" | Manual / bento test |
| FR-014 | Card subtitle communicates adding a player | Manual inspection |
| FR-015 | Card navigates to `/players/register` | Manual / routes review |
| FR-016 | Page allows entering a name and saving | Manual form flow |
| FR-017 | Success and error feedback shown | Manual + `getRegisterPlayerError` unit test |
| FR-018 | "Main Menu" button navigates to `/` | Manual click test |
