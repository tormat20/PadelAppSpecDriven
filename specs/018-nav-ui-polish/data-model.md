# Data Model: Navigation & UI Polish (018-nav-ui-polish)

**Branch**: `018-nav-ui-polish` | **Date**: 2026-03-03

This feature is entirely frontend. There are no new backend entities, no database schema changes, and no new API endpoints. The data model section describes the **frontend state shapes** and **derived values** introduced by each user story.

---

## US1 — CreateEvent: Main Menu button placement

### Change type: JSX restructure only

No new state. No new props. The Main Menu `<button>` is removed from the `<header>` and duplicated into the action row of each step panel JSX constant (`setupPanel`, `rosterPanel`, `confirmPanel`).

---

## US2 — RunEvent: Round-progress stepper

### New exported helper

```ts
// frontend/src/pages/RunEvent.tsx

/**
 * Derives the props needed to render a read-only round-progress Stepper.
 * Returns null when totalRounds is not a positive integer (stepper should not render).
 *
 * @param totalRounds  - event.totalRounds from the API (0 or positive integer)
 * @param roundNumber  - roundData.roundNumber from the API (1-indexed)
 */
export function getRoundStepperProps(
  totalRounds: number,
  roundNumber: number,
): { steps: { label: string }[]; currentStep: number } | null
```

**Validation rules:**
- If `totalRounds < 1` → return `null` (stepper not rendered)
- If `roundNumber < 1` → clamp to 1 before computing `currentStep`
- `currentStep = roundNumber - 1` (0-indexed)
- `steps` = array of `totalRounds` items, each `{ label: String(i + 1) }`

**State transitions:** None — the stepper is derived from already-loaded API data on each render. No local stepper state needed.

---

## US3 — Home page / EventSlots page split

### New page: EventSlotsPage

Lives in `frontend/src/pages/EventSlots.tsx`.

**Local state** (moved from `Home.tsx`):

| Field | Type | Initial value | Persistence |
|---|---|---|---|
| `events` | `EventRecord[]` | `[]` | fetched on mount |
| `filter` | `EventSlotFilter` | from `localStorage` key `home.eventSlots.filter`, default `"all"` | `localStorage` |
| `sortOption` | `EventSortOption` | from `localStorage` key `home.eventSlots.sort`, default `"default"` | `localStorage` |
| `modeFilters` | `EventType[]` | from `localStorage` key `home.eventSlots.modeFilters`, default all modes | `localStorage` |
| `collapsedModes` | `EventType[]` | from `localStorage` key `home.eventSlots.collapsedModes`, default `[]` | `localStorage` |

All `localStorage` keys are **unchanged** — user preferences persist seamlessly when moving to the new page.

**Exported helpers** (stay in `Home.tsx`, imported by `EventSlots.tsx`):

| Helper | Signature | Tests |
|---|---|---|
| `matchesEventFilter` | `(event, filter) => boolean` | existing |
| `applyEventSlotView` | `(events, filter, sort, modes) => EventRecord[]` | existing |
| `getEventFilterEmptyState` | `(filter) => string` | existing |
| `getEventSlotDisplay` | `(event) => string` | existing |
| `getEventSlotStatusColumnClass` | `() => string` | existing |
| `getLifecycleStatusLabel` | `(event) => string` | existing (via Home.tsx) |

**Type aliases** (stay in `Home.tsx`, re-exported by `EventSlots.tsx` if needed):
- `EventSlotFilter = "all" | "planned" | "ready" | "ongoing" | "finished"`
- `EventSortOption = "default" | "mode" | "date"`

### Home page after change

`Home.tsx` keeps all helper exports intact. Its `default export HomePage` renders only the `<MagicBentoMenu />` panel (no event-slots state, no event-slots JSX). The `listEvents()` API call and all event-slot `useState`/`useEffect` hooks are removed from `Home.tsx`.

---

## US4 — RegisterPlayer page

### New page: RegisterPlayerPage

Lives in `frontend/src/pages/RegisterPlayer.tsx`.

**Local state:**

| Field | Type | Initial value | Notes |
|---|---|---|---|
| `name` | `string` | `""` | Controlled text input |
| `catalog` | `PlayerApiRecord[]` | `[]` | Loaded on mount via `searchPlayers("")` |
| `submitError` | `string` | `""` | Inline validation or API error message |
| `successName` | `string` | `""` | Name of last successfully registered player; drives success message |
| `isSubmitting` | `boolean` | `false` | Disables submit button during in-flight API call |

### New exported helper

```ts
// frontend/src/pages/RegisterPlayer.tsx

/**
 * Returns a user-facing error string if the display name is invalid or
 * already exists in the catalog. Returns "" if the name is valid.
 *
 * @param name     - raw value from the text input (may be untrimmed)
 * @param catalog  - current player catalog from the API
 */
export function getRegisterPlayerError(
  name: string,
  catalog: { id: string; displayName: string }[],
): string
```

**Validation rules (in priority order):**
1. `name.trim() === ""` → return `"Player name cannot be empty."`
2. `findDuplicateByName(catalog, name.trim())` is not null → return `"A player named '${trimmed}' already exists."`
3. Otherwise → return `""`

### BentoCard change (MagicBentoMenu.tsx)

```ts
// Before:
{ title: "Resume Event",  to: "/events/run",    subtitle: "Enter live round results" }
{ title: "Player Setup",  to: "/events/create", subtitle: "Search or register participants" }

// After:
{ title: "View Events",      to: "/events",            subtitle: "Browse and manage all events" }
{ title: "Register Player",  to: "/players/register",  subtitle: "Add a new player to the roster" }
```

### New routes (routes.tsx)

```ts
{ path: "events",              element: <EventSlotsPage /> }
{ path: "players/register",    element: <RegisterPlayerPage /> }
```

The existing `{ path: "events/run", element: <RunEventPage /> }` route remains (it currently has no `:eventId` parameter and is a fallback; it continues to work unchanged).
