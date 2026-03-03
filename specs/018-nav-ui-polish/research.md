# Research: Navigation & UI Polish (018-nav-ui-polish)

**Branch**: `018-nav-ui-polish` | **Date**: 2026-03-03

---

## US1 — Create Event: Main Menu button placement

### Question
Where should the "Main Menu" button live when the Create Event page uses a multi-step stepper layout?

### Findings

The existing `CreateEvent.tsx` renders a `<header className="page-header panel">` containing the page title and the Main Menu `<button>`. The three step panels (setup, roster, confirm) each render their own action row below the panel content.

- **Decision**: Remove the `<button aria-label="Main menu">` from the `<header>` entirely. Add a secondary "Main Menu" `<button className="button-secondary">` to the action row inside each of the three step panel `div`s — alongside Next/Previous/Start Event.
- **Rationale**: The user explicitly flagged this as the primary UX complaint. Grouping navigation with action controls is standard practice for multi-step forms (stepper pattern). The header remains but holds only the title and subtitle, consistent with every other page in the app (`RunEvent`, `Summary`, `PreviewEvent`).
- **Alternatives considered**: Keeping the button in the header and making it smaller/less prominent — rejected because it still breaks the visual grouping the user expects.

### Impact on existing tests

`create-event-stepper-step*.test.tsx` tests export pure functions from `CreateEvent.tsx`; none assert on the header's button presence. No test imports or asserts on the Main Menu button's current location. Only new tests need to cover the updated placement.

---

## US2 — Run Event: Round-progress stepper

### Question
How many steps does the stepper need? What are the step labels? What `currentStep` value maps to which round?

### Findings

`RunEvent.tsx` already receives `eventData.totalRounds` and `roundData.roundNumber` from the API:
- `totalRounds: number` — total rounds for this event (0 if unset)
- `roundData.roundNumber: number` — 1-indexed current round number

The existing `Stepper` component (`frontend/src/components/stepper/Stepper.tsx`) accepts:
```
steps: StepDefinition[]   // array of { label: string }
currentStep: number       // 0-indexed active step
direction: number         // 1 or -1 (for animation)
onStepClick?: (i) => void // omit for read-only
children: React.ReactNode // panel content (can be empty fragment)
```

- **Decision**: Generate `steps` as `Array.from({ length: totalRounds }, (_, i) => ({ label: String(i + 1) }))`. Map `currentStep = roundData.roundNumber - 1` (convert 1-indexed round to 0-indexed stepper position). Direction is always `1` (always advances forward). Pass no `onStepClick` (read-only). Pass an empty `<></>` as `children` (no panel content needed — the stepper is purely a progress indicator). Wrap in a conditional: only render when `totalRounds > 0` and `roundData` is loaded.
- **Rationale**: Reuses the existing `Stepper` component with zero new code in it. Labels as round numbers ("1", "2", "3"...) are the most compact option for large round counts. 0-indexing conversion is a one-liner.
- **Alternatives considered**: Creating a new `RoundProgressBar` component — rejected because `Stepper` already handles all the visual states needed and has the right accessibility markup.

### Helper function to export (for testability)
```ts
export function getRoundStepperProps(totalRounds: number, roundNumber: number): {
  steps: { label: string }[]
  currentStep: number
} | null
```
Returns `null` when `totalRounds < 1`. Otherwise returns the steps array and 0-indexed currentStep. This keeps the computation pure and unit-testable.

---

## US3 — Home page: Remove event-slots panel; new EventSlots page

### Question
Where do the event-slot helper exports go? `home-event-slots-status-layout.test.tsx` imports them from `Home.tsx` — will those tests break?

### Findings

`home-event-slots-status-layout.test.tsx` imports:
- `applyEventSlotView`
- `getEventFilterEmptyState`
- `getEventSlotDisplay`
- `getEventSlotStatusColumnClass`
- `matchesEventFilter`

All from `"../src/pages/Home"`.

Strategy options:
1. **Move helpers to a new `EventSlots.tsx` page** — existing test imports break; require import-path update.
2. **Keep helpers exported from `Home.tsx`, move only the JSX to `EventSlots.tsx`** — tests pass with zero changes.
3. **Move helpers to a dedicated `lib/eventSlots.ts`** — clean separation; tests need import-path update.

- **Decision**: Option 2 — keep all exported helper functions in `Home.tsx`, move only the JSX panel (state, effects, render) to `EventSlots.tsx`. `Home.tsx` imports nothing from `EventSlots.tsx`; `EventSlots.tsx` imports the helpers from `Home.tsx`. This way `home-event-slots-status-layout.test.tsx` requires **zero changes**.
- **Rationale**: Minimum disruption to passing tests. The helpers are pure functions with no side effects; their physical location doesn't matter for consumers.
- **Alternatives considered**: Option 3 (new lib file) — clean but requires updating the test import path, adding churn without benefit.

### Route for the new page
- **Decision**: `/events` — short, bookmarkable, matches the domain noun. `routes.tsx` adds `{ path: "events", element: <EventSlotsPage /> }`.
- **Alternatives considered**: `/events/list` (too verbose), `/view-events` (UI-label leak into URL). `/events` is already the namespace prefix for all event-specific routes.

---

## US4 — Register Player page

### Question
What API call creates a player? What duplicate detection logic exists?

### Findings

**API**: `createPlayer(displayName: string): Promise<PlayerApiRecord>` in `lib/api.ts` — `POST /api/v1/players` with `{ displayName }`. Returns `{ id, displayName }`. Throws `ApiError` on failure.

**Duplicate detection**: `createOrReusePlayer()` in `lib/api.ts` does a catalog scan for normalised name match. However, `findDuplicateByName()` in `features/create-event/playerSearch.ts` provides a pure catalog-lookup helper. The Register Player page should:
1. Load the player catalog on mount via `searchPlayers("")`.
2. Before submitting, call `findDuplicateByName(catalog, name)` — if match found, show inline error "A player named '[name]' already exists."
3. On confirmed submit, call `createPlayer(trimmedName)`.
4. On success: clear the input, show a success message "Player '[name]' registered.", offer "Register Another".
5. On API error: show the error message from the thrown `ApiError`.

**Name validation**: Empty or whitespace-only names must be rejected client-side before any API call.

- **Decision**: Implement the above flow as `RegisterPlayerPage` in `frontend/src/pages/RegisterPlayer.tsx`. Export a pure helper `getRegisterPlayerError(name, catalog)` returning a string error or `""` for no error — covers both empty-name and duplicate-name cases. This helper is unit-testable without DOM.
- **Rationale**: Consistent with the project's test pattern (export pure functions, test them independently). `findDuplicateByName` already exists and is tested; we compose on top of it.
- **Alternatives considered**: Relying solely on server-side duplicate rejection — rejected because it produces a worse UX (round-trip before feedback) and the catalog is already fetched anyway for the autocomplete pattern used elsewhere.

### Page layout
- **Decision**: `<section className="page-shell">` with `<header className="page-header panel">` (title: "Register Player", subtitle: "Add a new player to the roster"), a `<section className="panel form-grid">` with the name input, submit button, error/success messages, and a "Main Menu" secondary button. Follows the same layout used by CreateEvent and RunEvent.

---

## CSS / Design Tokens

No new design tokens required. All new UI uses:
- `.panel`, `.form-grid`, `.input`, `.button`, `.button-secondary`, `.warning-text` from `components.css`
- `.page-shell`, `.page-header`, `.page-title`, `.page-subtitle` from `layout.css`
- `withInteractiveSurface()` from `features/interaction/surfaceClass` for all interactive buttons

---

## Dependency audit

| Item | Status |
|---|---|
| `motion` (Framer Motion) | Already installed — Stepper uses it |
| `createPlayer` API function | Already in `lib/api.ts` |
| `searchPlayers` API function | Already in `lib/api.ts` |
| `findDuplicateByName` helper | Already in `features/create-event/playerSearch.ts` |
| `Stepper` component | Already in `components/stepper/Stepper.tsx` |
| `withInteractiveSurface` | Already in `features/interaction/surfaceClass` |

**No new npm packages required.**
