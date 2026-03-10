# Quickstart: Calendar Scheduling (030-calendar-scheduling)

**Branch**: `030-calendar-scheduling` | **Date**: 2026-03-10

This guide gives an implementer everything needed to start coding immediately. Read the contracts for full detail; this file is the fast-start reference.

---

## Run tests

```bash
# Backend
cd backend && PYTHONPATH=. uv run python -m pytest tests/ -q

# Frontend
cd frontend && npm test -- --run
```

All existing tests must remain green after every change.

---

## Implementation order (recommended)

Start with the backend (unblocks frontend type-checking), then build the calendar page bottom-up.

```
Step 1  Backend — expose roundDurationMinutes
Step 2  Backend — date-range filter on GET /api/v1/events
Step 3  Frontend — add roundDurationMinutes to EventRecord type
Step 4  Frontend — add listEventsByDateRange to api.ts
Step 5  Frontend — add /calendar route under RequireAdmin
Step 6  Frontend — pure helper functions in Calendar.tsx (write tests first)
Step 7  Frontend — WeekGrid + EventBlock components (static, no drag yet)
Step 8  Frontend — Drag-to-reschedule (US2)
Step 9  Frontend — EventDrawer + click-to-edit/delete (US3)
Step 10 Frontend — Drag-to-create (US4)
Step 11 Frontend — Recurring events (US5)
Step 12 Frontend — UnscheduledStrip
```

---

## Step 1 — Backend: expose `roundDurationMinutes`

**File**: `backend/app/api/schemas/events.py`

Add one line to `EventResponse`:
```python
roundDurationMinutes: int
```

**File**: `backend/app/api/routers/events.py`

In `_to_event_response()`, add:
```python
roundDurationMinutes=event.round_duration_minutes,
```

Run tests:
```bash
cd backend && PYTHONPATH=. uv run python -m pytest tests/ -q
```

Expected: all pass. The new field has a DB value on all rows so no nulls.

---

## Step 2 — Backend: date-range filter

**New file**: `backend/app/repositories/sql/events/list_by_date_range.sql`
```sql
SELECT id, event_name, event_type, event_date, status,
       round_count, round_duration_minutes, current_round_number,
       event_time, setup_status, version, is_team_mexicano
FROM events
WHERE event_date BETWEEN ? AND ?
ORDER BY event_date ASC, COALESCE(event_time, '00:00') ASC, created_at ASC;
```

**File**: `backend/app/repositories/events_repo.py`

Add method `list_by_date_range(from_date: date, to_date: date) -> list[Event]` — copy the construction logic from `list_all()` verbatim, just change the `execute()` call to use the new SQL file with `[from_date.isoformat(), to_date.isoformat()]`.

**File**: `backend/app/services/event_service.py`

Add method `list_events_by_date_range(from_date: date, to_date: date)` — mirrors `list_events()` but calls `repo.list_by_date_range(from_date, to_date)`.

**File**: `backend/app/api/routers/events.py`

Update `list_events()` signature:
```python
from fastapi import Query
from datetime import date

@router.get("", response_model=list[EventResponse])
def list_events(
    from_date: date | None = Query(default=None, alias="from"),
    to_date: date | None = Query(default=None, alias="to"),
) -> list[EventResponse]:
    with services_scope() as services:
        if from_date is not None and to_date is not None:
            events = services["event_service"].list_events_by_date_range(from_date, to_date)
        else:
            events = services["event_service"].list_events()
        ...
```

---

## Step 3 — Frontend: update `EventRecord` type

**File**: `frontend/src/lib/types.ts`

In the `EventRecord` type, add after `totalRounds`:
```ts
roundDurationMinutes: number
```

TypeScript will now flag any place that constructs an `EventRecord` without this field. Fix those (likely in test fixtures only).

---

## Step 4 — Frontend: add `listEventsByDateRange`

**File**: `frontend/src/lib/api.ts`

Add after the existing `listEvents` function:
```ts
export async function listEventsByDateRange(
  from: string,
  to: string,
): Promise<EventRecord[]> {
  const res = await fetch(
    `${API_BASE}/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    { headers: authHeaders() },
  )
  if (!res.ok) throw new ApiError(res.status, await res.text())
  return res.json() as Promise<EventRecord[]>
}
```

Do NOT modify `listEvents()`.

---

## Step 5 — Frontend: add `/calendar` route

**File**: `frontend/src/app/routes.tsx`

Add import:
```ts
import { RequireAdmin } from "../components/auth/RequireAdmin"
import CalendarPage from "../pages/Calendar"
```

Add a new `RequireAdmin` block inside the `AppShell` children, alongside the existing `ProtectedRoute` block:
```ts
{
  element: <RequireAdmin />,
  children: [
    { path: "calendar", element: <CalendarPage /> },
  ],
},
```

Create a stub `Calendar.tsx` page so the import resolves:
```tsx
// frontend/src/pages/Calendar.tsx
export default function CalendarPage() {
  return <div>Calendar coming soon</div>
}
```

Run frontend tests — all should still pass.

---

## Step 6 — Frontend: pure helper functions (TDD)

Write the test file first:

**New test file**: `frontend/tests/calendar-grid-positioning.test.ts`

```ts
import { describe, it, expect } from "vitest"
import {
  minutesSinceGridStart,
  eventHeightPx,
  deriveDurationMinutes,
  snapToGrid,
  minutesToTime24h,
  getWeekStart,
  getWeekDates,
  formatWeekLabel,
} from "../src/pages/Calendar"

// Tests per the contract (see contracts/calendar-page-weekly-view.md)
```

Then implement the helpers in `Calendar.tsx` until all tests pass.

Key implementations:
```ts
export const GRID_START_HOUR = 7
export const GRID_TOTAL_MINUTES = 1020
export const SNAP_MINUTES = 30
export const PX_PER_MINUTE = 1

export function minutesSinceGridStart(time24h: string): number {
  const [h, m] = time24h.split(":").map(Number)
  const totalMinutes = h === 0 ? 1020 : (h - GRID_START_HOUR) * 60 + m
  return Math.max(0, Math.min(1020, totalMinutes))
}

export function snapToGrid(rawMinutes: number): number {
  const snapped = Math.round(rawMinutes / SNAP_MINUTES) * SNAP_MINUTES
  return Math.max(0, Math.min(960, snapped))  // 960 = 23:00 = last valid start
}

export function minutesToTime24h(totalMinutes: number): string {
  if (totalMinutes >= 1020) return "00:00"
  const h = GRID_START_HOUR + Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export function deriveDurationMinutes(
  event: Pick<EventRecord, "totalRounds" | "roundDurationMinutes">
): number {
  const d = event.totalRounds * event.roundDurationMinutes
  return d > 0 ? d : 60
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()  // 0=Sun, 1=Mon…
  const diff = day === 0 ? -6 : 1 - day  // offset to Monday
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}
```

---

## Step 7 — WeekGrid + EventBlock (static rendering)

Create:
- `frontend/src/components/calendar/WeekGrid.tsx` — renders the 7-column grid with time labels and day headers. Use absolute positioning within each column for event blocks.
- `frontend/src/components/calendar/EventBlock.tsx` — renders a single positioned block.

Test manually: navigate to `/calendar` as admin, see the grid, see events positioned correctly.

---

## Step 8 — Drag-to-reschedule

Write test first: `frontend/tests/calendar-drag-reschedule.test.ts`

Export and test:
```ts
export function computeDragDayIndex(clientX: number, gridRect: { left: number; width: number }): number
export function computeDropMinutes(clientY: number, gridRect: { top: number; height: number }, pxPerMinute: number): number
```

Then implement drag handlers in `CalendarPage` and `WeekGrid`.

Optimistic update pattern:
```ts
const preDragSnapshot = useRef<EventRecord[] | null>(null)

function handleGridDrop(e: React.DragEvent) {
  const eventId = e.dataTransfer.getData("text/plain")
  const newDate = /* computed from drop position */
  const newTime = /* computed + snapped */

  // Optimistic update
  const prev = events
  setEvents(events.map(ev =>
    ev.id === eventId ? { ...ev, eventDate: newDate, eventTime24h: newTime } : ev
  ))

  updateEvent(eventId, { expectedVersion: event.version, eventDate: newDate, eventTime24h: newTime })
    .catch(() => {
      setEvents(prev)  // revert
      toast.error("Could not reschedule. Changes reverted.")
    })
    .finally(() => {
      setDraggingEventId(null)
      setGhostBlock(null)
    })
}
```

---

## Step 9 — EventDrawer + click-to-edit/delete

Create `frontend/src/components/calendar/EventDrawer.tsx`.

Use `motion.div` for slide-in animation (Framer Motion already installed).

Export testable helpers:
```ts
// In Calendar.tsx or EventDrawer.tsx
export function isDrawerDirty(
  original: DrawerFormValues,
  current: DrawerFormValues,
): boolean
```

Write test: `frontend/tests/calendar-drawer.test.ts`

---

## Step 10 — Drag-to-create

Use pointer events (`onPointerDown`, `onPointerMove`, `onPointerUp`) on the WeekGrid container.

Distinguish from drag-reschedule: only fire create gesture if `pointerdown` target is the grid background (not an `EventBlock`). Check: `e.target === e.currentTarget` or use a CSS data attribute.

---

## Step 11 — Recurring events

Write test first: `frontend/tests/calendar-recurrence-calc.test.ts`

Export and test:
```ts
export function getRemainingWeekdayOccurrences(originalDate: Date): Date[]
```

Then wire into the create drawer's "Repeat weekly" toggle.

---

## Step 12 — UnscheduledStrip

Create `frontend/src/components/calendar/UnscheduledStrip.tsx`.

Events with `eventTime24h == null || eventTime24h == undefined` are filtered from the main grid and passed to this strip.

---

## Files to touch

| File | Action | Step |
|---|---|---|
| `backend/app/api/schemas/events.py` | Modify | 1 |
| `backend/app/api/routers/events.py` | Modify | 1, 2 |
| `backend/app/repositories/events_repo.py` | Modify | 2 |
| `backend/app/repositories/sql/events/list_by_date_range.sql` | Create | 2 |
| `backend/app/services/event_service.py` | Modify | 2 |
| `backend/tests/test_event_response_duration.py` | Create | 1 |
| `backend/tests/test_events_date_range_filter.py` | Create | 2 |
| `frontend/src/lib/types.ts` | Modify | 3 |
| `frontend/src/lib/api.ts` | Modify | 4 |
| `frontend/src/app/routes.tsx` | Modify | 5 |
| `frontend/src/pages/Calendar.tsx` | Create | 5, 6, 8, 10, 11 |
| `frontend/src/components/calendar/WeekGrid.tsx` | Create | 7 |
| `frontend/src/components/calendar/EventBlock.tsx` | Create | 7 |
| `frontend/src/components/calendar/GhostBlock.tsx` | Create | 8 |
| `frontend/src/components/calendar/EventDrawer.tsx` | Create | 9 |
| `frontend/src/components/calendar/UnscheduledStrip.tsx` | Create | 12 |
| `frontend/tests/calendar-grid-positioning.test.ts` | Create | 6 |
| `frontend/tests/calendar-drag-reschedule.test.ts` | Create | 8 |
| `frontend/tests/calendar-drawer.test.ts` | Create | 9 |
| `frontend/tests/calendar-recurrence-calc.test.ts` | Create | 11 |
| `frontend/tests/calendar-event-block.test.ts` | Create | 7 |
| `frontend/tests/calendar-api-integration.test.ts` | Create | 4 |

---

## Key constraints (never break these)

1. **No new npm packages** — native HTML5 DnD + pointer events + existing `motion` library only.
2. **All existing tests pass** — do not modify existing test files unless a new field breaks their fixtures (add `roundDurationMinutes: 20` to any `EventRecord` fixtures that are missing it).
3. **CSS design tokens only** — no hardcoded hex values in calendar CSS; use `var(--color-*)`.
4. **TypeScript strict** — no `any` for new code.
5. **RequireAdmin gate** — `/calendar` must only render for admin users; verify with `isAdmin` from `useAuth()`.
6. **Optimistic-update revert** — drag-drop failures must silently snap back with only a toast; no half-updated state left behind.

---

## Contracts (detailed specs per story)

- [`contracts/backend-round-duration-exposure.md`](./contracts/backend-round-duration-exposure.md)
- [`contracts/backend-date-range-filter.md`](./contracts/backend-date-range-filter.md)
- [`contracts/calendar-page-weekly-view.md`](./contracts/calendar-page-weekly-view.md)
- [`contracts/calendar-drag-edit-create.md`](./contracts/calendar-drag-edit-create.md)
