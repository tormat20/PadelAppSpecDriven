# Contract: Home page — "View Events" navigation

**Feature**: 018-nav-ui-polish | **User Story**: US3 (P3)
**Files affected**:
- `frontend/src/pages/Home.tsx` — MODIFIED (remove event-slots JSX; keep all helper exports)
- `frontend/src/pages/EventSlots.tsx` — NEW
- `frontend/src/components/bento/MagicBentoMenu.tsx` — MODIFIED (card rename)
- `frontend/src/app/routes.tsx` — MODIFIED (new `/events` route)

---

## Home.tsx — changes

### What is REMOVED from Home.tsx

- All `useState` hooks related to event slots: `events`, `filter`, `sortOption`, `modeFilters`, `collapsedModes`
- All `useEffect` hooks that call `listEvents()` and write/read from `localStorage`
- The entire event-slots JSX block (panel, filter tabs, sort controls, mode blobs, event rows)
- The `import { listEvents }` call (if it becomes unused)

### What STAYS in Home.tsx (mandatory — test constraint)

All of the following named exports MUST remain exported from `Home.tsx` **unchanged** (same name, same signature):

| Export | Reason |
|---|---|
| `matchesEventFilter` | `home-event-slots-status-layout.test.tsx` imports from `"../src/pages/Home"` |
| `applyEventSlotView` | same |
| `getEventFilterEmptyState` | same |
| `getEventSlotDisplay` | same |
| `getEventSlotStatusColumnClass` | same |
| `getLifecycleStatusLabel` | same (if currently exported) |

`EventSlotFilter` and `EventSortOption` type aliases also stay in `Home.tsx` (or re-exported from it, if moved to a shared lib in a future refactor — but NOT in this feature).

### What Home.tsx renders after the change

```tsx
export default function HomePage() {
  return (
    <section className="page-shell">
      <MagicBentoMenu />
    </section>
  );
}
```

Home.tsx does NOT import anything from `EventSlots.tsx`.

---

## EventSlots.tsx — new page

**Route**: `/events`
**Component name**: `EventSlotsPage` (default export)

### Imports from Home.tsx

```ts
import {
  matchesEventFilter,
  applyEventSlotView,
  getEventFilterEmptyState,
  getEventSlotDisplay,
  getEventSlotStatusColumnClass,
  type EventSlotFilter,
  type EventSortOption,
} from "./Home";
```

### Local state (moved from Home.tsx)

| Field | Type | localStorage key | Default |
|---|---|---|---|
| `events` | `EventRecord[]` | — (fetched on mount) | `[]` |
| `filter` | `EventSlotFilter` | `home.eventSlots.filter` | `"all"` |
| `sortOption` | `EventSortOption` | `home.eventSlots.sort` | `"default"` |
| `modeFilters` | `EventType[]` | `home.eventSlots.modeFilters` | all modes |
| `collapsedModes` | `EventType[]` | `home.eventSlots.collapsedModes` | `[]` |

All `localStorage` keys are **identical to the keys used in the old Home.tsx** — user preferences persist transparently.

### Page layout

```tsx
<section className="page-shell">
  <header className="page-header panel">
    <h1 className="page-title">Events</h1>
    <button
      aria-label="Main menu"
      className={withInteractiveSurface("button-secondary")}
      onClick={() => navigate("/")}
    >
      Main Menu
    </button>
  </header>

  {/* Filter tabs, sort controls, mode blobs, event list — identical to former Home panel */}
  <section className="panel">
    {/* ... moved JSX from Home.tsx ... */}
  </section>
</section>
```

---

## MagicBentoMenu.tsx — card change

```ts
// Before:
{ title: "Resume Event", to: "/events/run", subtitle: "Enter live round results" }

// After:
{ title: "View Events", to: "/events", subtitle: "Browse and manage all events" }
```

Only the "Resume Event" card is changed in this user story. The "Create Event" card is unchanged.

---

## routes.tsx — new route

```ts
{ path: "events", element: <EventSlotsPage /> }
```

Add alongside the existing `{ path: "events/run", element: <RunEventPage /> }` (which is unchanged).

---

## Test contract

**New test file**: `frontend/tests/home-view-events-nav.test.tsx`

No DOM rendering. Tests any pure functions added (none new — all helpers stay in `Home.tsx`).

**Existing test file**: `frontend/tests/home-event-slots-status-layout.test.tsx`
- Imports from `"../src/pages/Home"` — these imports remain valid because all helpers stay in `Home.tsx`.
- **Zero changes required** to this test file.

---

## Acceptance criteria (from spec FR-009..012)

| FR | Criterion | Verified by |
|---|---|---|
| FR-009 | Home page shows no event-slots panel | Manual inspection |
| FR-010 | Bento card reads "View Events" | Manual / bento test |
| FR-011 | `/events` page shows filter/sort/list | Manual navigation |
| FR-012 | `/events` is a stable, bookmarkable URL | routes.tsx review |
