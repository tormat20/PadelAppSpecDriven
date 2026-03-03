# Quickstart: Navigation & UI Polish (018-nav-ui-polish)

**Branch**: `018-nav-ui-polish` | **Date**: 2026-03-03

This guide gives an implementer everything needed to start coding immediately.

---

## Run tests

```bash
cd frontend && npm test
```

All 158 existing tests must remain green after each change.

---

## Files to touch

| File | Action | User Story |
|---|---|---|
| `frontend/src/pages/CreateEvent.tsx` | Modify | US1 |
| `frontend/src/pages/RunEvent.tsx` | Modify | US2 |
| `frontend/src/pages/Home.tsx` | Modify | US3 |
| `frontend/src/pages/EventSlots.tsx` | Create | US3 |
| `frontend/src/pages/RegisterPlayer.tsx` | Create | US4 |
| `frontend/src/components/bento/MagicBentoMenu.tsx` | Modify | US3 + US4 |
| `frontend/src/app/routes.tsx` | Modify | US3 + US4 |
| `frontend/tests/run-event-round-stepper.test.tsx` | Create | US2 |
| `frontend/tests/register-player-page.test.tsx` | Create | US4 |

---

## US1 — CreateEvent.tsx: move the Main Menu button

**What to change**

1. Find the `<header className="page-header panel">` block. Remove the `<button aria-label="Main menu">` from it entirely. Leave `<h1 className="page-title">Create Event</h1>` in place.
2. Scroll to each of the three step panel JSX blocks (look for `action-row` divs inside the setup, roster, and confirm panels). Add the following button **first** in each action row:
   ```tsx
   <button
     aria-label="Main menu"
     className={withInteractiveSurface("button-secondary")}
     onClick={() => navigate("/")}
   >
     Main Menu
   </button>
   ```

No new exports, no new tests needed for this story.

---

## US2 — RunEvent.tsx: add the round-progress stepper

**What to add**

1. Add the following pure exported function near the top of the file (before `export default function RunEventPage`):
   ```ts
   export function getRoundStepperProps(
     totalRounds: number,
     roundNumber: number,
   ): { steps: { label: string }[]; currentStep: number } | null {
     if (!totalRounds || totalRounds < 1) return null
     const safeRound = roundNumber < 1 ? 1 : roundNumber
     return {
       steps: Array.from({ length: totalRounds }, (_, i) => ({ label: String(i + 1) })),
       currentStep: safeRound - 1,
     }
   }
   ```

2. Inside `RunEventPage`, compute the stepper props at render time:
   ```ts
   const roundStepperProps =
     eventData && roundData
       ? getRoundStepperProps(eventData.totalRounds, roundData.roundNumber)
       : null
   ```

3. Import `Stepper` from `"../components/stepper/Stepper"` (it is already imported in `CreateEvent.tsx` — same path).

4. In the JSX, immediately after the `<h1>` heading, add:
   ```tsx
   {roundStepperProps && (
     <Stepper
       steps={roundStepperProps.steps}
       currentStep={roundStepperProps.currentStep}
       direction={1}
     >
       <></>
     </Stepper>
   )}
   ```

**New test file**: `frontend/tests/run-event-round-stepper.test.tsx` — tests `getRoundStepperProps` only.

---

## US3 — Home.tsx + EventSlots.tsx + routes + bento

### Step A — Create `frontend/src/pages/EventSlots.tsx`

- Default export: `EventSlotsPage`
- Copy all the event-slot state hooks, effects, and JSX panel from `Home.tsx` into this new file.
- Add a standard page layout with header (title "Events"), Main Menu button, and the moved event-slots panel.
- Import the helper functions from `"./Home"`:
  ```ts
  import {
    matchesEventFilter, applyEventSlotView, getEventFilterEmptyState,
    getEventSlotDisplay, getEventSlotStatusColumnClass,
    type EventSlotFilter, type EventSortOption,
  } from "./Home"
  ```

### Step B — Trim `Home.tsx`

- Remove all `useState`, `useEffect`, and JSX that relate to event slots.
- **Keep** all exported helper functions (`matchesEventFilter`, `applyEventSlotView`, `getEventFilterEmptyState`, `getEventSlotDisplay`, `getEventSlotStatusColumnClass`, `getLifecycleStatusLabel`) — these are imported by an existing test from `"../src/pages/Home"`.
- The `HomePage` default export renders only `<MagicBentoMenu />`.

### Step C — Update `MagicBentoMenu.tsx`

Change the `cards` array:
```ts
// was: { title: "Resume Event", to: "/events/run", subtitle: "Enter live round results" }
{ title: "View Events", to: "/events", subtitle: "Browse and manage all events" }

// was: { title: "Player Setup", to: "/events/create", subtitle: "Search or register participants" }
{ title: "Register Player", to: "/players/register", subtitle: "Add a new player to the roster" }
```

### Step D — Update `routes.tsx`

Add two new child routes inside the existing `AppShell` children array:
```ts
{ path: "events", element: <EventSlotsPage /> },
{ path: "players/register", element: <RegisterPlayerPage /> },
```

---

## US4 — RegisterPlayer.tsx: new page

**Create `frontend/src/pages/RegisterPlayer.tsx`**

Key imports:
```ts
import { useNavigate } from "react-router-dom"
import { withInteractiveSurface } from "../features/interaction/surfaceClass"
import { createPlayer, searchPlayers } from "../lib/api"
import { findDuplicateByName } from "../features/create-event/playerSearch"
```

Export the pure validation helper (required for tests):
```ts
export function getRegisterPlayerError(
  name: string,
  catalog: { id: string; displayName: string }[],
): string {
  if (name.trim() === "") return "Player name cannot be empty."
  if (findDuplicateByName(catalog, name.trim()) !== null)
    return `A player named '${name.trim()}' already exists.`
  return ""
}
```

Page state: `name`, `catalog`, `submitError`, `successName`, `isSubmitting`.

Load catalog on mount: `searchPlayers("").then(setCatalog)`.

**New test file**: `frontend/tests/register-player-page.test.tsx` — tests `getRegisterPlayerError` only.

---

## Key constraints (never break these)

1. **Test import paths**: `home-event-slots-status-layout.test.tsx` imports 5 helpers from `"../src/pages/Home"` — those exports must stay in `Home.tsx`.
2. **No new npm packages** — `Stepper`, `createPlayer`, `findDuplicateByName` all already exist.
3. **No hardcoded colours** — use `var(--color-*)` tokens and existing CSS classes only.
4. **All interactive buttons** use `withInteractiveSurface()`.
5. **TypeScript strict** — no `any` for new code; type everything explicitly.

---

## Contracts (detailed specs per story)

- [`contracts/create-event-main-menu.md`](./contracts/create-event-main-menu.md)
- [`contracts/run-event-round-stepper.md`](./contracts/run-event-round-stepper.md)
- [`contracts/home-view-events.md`](./contracts/home-view-events.md)
- [`contracts/register-player-page.md`](./contracts/register-player-page.md)
