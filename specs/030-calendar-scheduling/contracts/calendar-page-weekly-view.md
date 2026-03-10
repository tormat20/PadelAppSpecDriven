# Contract: Calendar Page — Weekly View

**Feature**: 030-calendar-scheduling | **User Stories**: US1 (P1)
**Files affected**:
- `frontend/src/pages/Calendar.tsx` — NEW (CalendarPage + exported helpers)
- `frontend/src/components/calendar/WeekGrid.tsx` — NEW
- `frontend/src/components/calendar/EventBlock.tsx` — NEW
- `frontend/src/components/calendar/UnscheduledStrip.tsx` — NEW
- `frontend/src/app/routes.tsx` — MODIFIED (add `/calendar` under `RequireAdmin`)
- `frontend/src/lib/api.ts` — MODIFIED (`listEventsByDateRange` added)
- `frontend/src/lib/types.ts` — MODIFIED (`roundDurationMinutes` added to `EventRecord`)

---

## Route

```
/calendar
```

Wrapped inside `RequireAdmin` in `routes.tsx`. Unauthenticated users → `/login`. Non-admin users → `/`.

```ts
// routes.tsx addition (inside the RequireAdmin children array):
{ path: "calendar", element: <CalendarPage /> }
```

Import:
```ts
import CalendarPage from "../pages/Calendar"
```

---

## `CalendarPage` — default export

### Page layout

```tsx
<section className="page-shell">
  <header className="page-header panel">
    <h1 className="page-title">Calendar</h1>
    <div className="page-header__actions">
      <button className={withInteractiveSurface("button-secondary")} onClick={() => navigate("/")}>
        Main Menu
      </button>
    </div>
  </header>

  {/* Week navigation bar */}
  <div className="calendar-nav panel">
    <button aria-label="Previous week" onClick={goToPreviousWeek}>‹</button>
    <span className="calendar-nav__label">{formatWeekLabel(viewWeekStart)}</span>
    <button aria-label="Next week" onClick={goToNextWeek}>›</button>
    <button aria-label="Go to today" onClick={goToCurrentWeek}>Today</button>
  </div>

  {/* Main grid */}
  <WeekGrid
    events={timedEvents}
    weekStart={viewWeekStart}
    ghostBlock={ghostBlock}
    onBlockClick={handleBlockClick}
    onBlockDragStart={handleBlockDragStart}
    onGridDrop={handleGridDrop}
    onGridDragOver={handleGridDragOver}
    onCellPointerDown={handleCellPointerDown}
  />

  {/* Unscheduled strip */}
  {untimedEvents.length > 0 && (
    <UnscheduledStrip events={untimedEvents} onBlockClick={handleBlockClick} />
  )}

  {/* Side drawer */}
  <EventDrawer state={drawerState} onSave={handleSave} onDelete={handleDelete} onClose={handleDrawerClose} />
</section>
```

### Data loading

On mount and on every `viewWeekStart` change:
1. Compute `from` = ISO date of `viewWeekStart` (Monday)
2. Compute `to` = ISO date of `viewWeekStart + 6 days` (Sunday)
3. Call `listEventsByDateRange(from, to)`
4. Split result into `timedEvents` (has `eventTime24h`) and `untimedEvents` (null/undefined time)

---

## `WeekGrid` component

### Props

```ts
type WeekGridProps = {
  events: EventRecord[]
  weekStart: Date
  ghostBlock: GhostBlockState | null
  onBlockClick: (event: EventRecord) => void
  onBlockDragStart: (event: EventRecord, e: React.DragEvent) => void
  onGridDrop: (e: React.DragEvent) => void
  onGridDragOver: (e: React.DragEvent) => void
  onCellPointerDown: (dayIndex: number, minutesFromGridStart: number, e: React.PointerEvent) => void
}
```

### Layout

- Outer: `position: relative` container
- Left column: time labels (07:00, 07:30, … 23:30, 00:00) — `34` labels at 30-min intervals
- 7 day columns: `position: relative`, each receives `onDrop` and `onDragOver`
- Day column headers: weekday name + date (e.g., "Mon 10 Mar"); today's column has CSS class `calendar-col--today`
- Each `EventRecord` with `eventTime24h` is rendered as `<EventBlock>` with absolute positioning
- `GhostBlock` is rendered inside the appropriate day column when `ghostBlock !== null`

### Time grid constants

```ts
export const GRID_START_HOUR = 7        // 07:00
export const GRID_END_HOUR = 24         // 00:00 next day
export const GRID_TOTAL_MINUTES = (GRID_END_HOUR - GRID_START_HOUR) * 60  // 1020
export const SNAP_MINUTES = 30
export const PX_PER_MINUTE = 1          // 1px per minute → grid height = 1020px
```

These constants are exported for use in positioning calculations.

---

## `EventBlock` component

### Props

```ts
type EventBlockProps = {
  event: EventRecord
  top: number             // px from grid top
  height: number          // px height
  isDragging: boolean     // true while this block is being dragged
  onDragStart: (e: React.DragEvent) => void
  onClick: () => void
}
```

### Behaviour

- **Lobby** events: `draggable={true}`; cursor = `grab`; full opacity when not dragging
- **Running / Finished** events: `draggable={false}`; cursor = `default`; `onDragStart` blocked with `e.preventDefault()`
- `isDragging` → opacity 0.4 (original position ghosted while block is being dragged)
- Block content: event name (truncated), event type badge, courts label ("Court 1, Court 2"), status badge for Running/Finished
- CSS class: `calendar-event-block calendar-event-block--{status.toLowerCase()} calendar-event-block--{eventType}`

### Status badge

| Status | Badge text | CSS modifier |
|---|---|---|
| Running | "Running" | `--running` |
| Finished | "Finished" | `--finished` |
| Lobby | (none) | `--lobby` |

---

## Exported pure helper functions

All exported from `frontend/src/pages/Calendar.tsx`:

```ts
export function minutesSinceGridStart(time24h: string): number
// "07:00" → 0, "07:30" → 30, "10:00" → 180, "23:30" → 990
// Clamp: values below 0 return 0; values above 1020 return 960 (last slot = 23:00)

export function eventTopPx(time24h: string, pxPerMinute: number): number
// = minutesSinceGridStart(time24h) * pxPerMinute

export function eventHeightPx(durationMinutes: number, pxPerMinute: number): number
// = durationMinutes * pxPerMinute

export function deriveDurationMinutes(event: Pick<EventRecord, "totalRounds" | "roundDurationMinutes">): number
// = event.totalRounds * event.roundDurationMinutes; fallback 60 if either is 0

export function snapToGrid(rawMinutes: number): number
// rounds to nearest multiple of 30; clamps result to [0, 960]

export function minutesToTime24h(totalMinutes: number): string
// 0 → "07:00", 30 → "07:30", 180 → "10:00", 990 → "23:30", 1020 → "00:00"

export function getWeekStart(date: Date): Date
// Returns the Monday of the week containing 'date' (ISO week: Mon = day 1)

export function getWeekDates(weekStart: Date): Date[]
// Returns [Mon, Tue, Wed, Thu, Fri, Sat, Sun] for the given week start

export function formatWeekLabel(weekStart: Date): string
// "10 Mar – 16 Mar 2026"
```

---

## `UnscheduledStrip` component

### Props

```ts
type UnscheduledStripProps = {
  events: EventRecord[]
  onBlockClick: (event: EventRecord) => void
}
```

Renders a horizontal panel labelled "Unscheduled" with event name chips. Clicking a chip opens the edit drawer for that event. Events are not draggable from the strip onto the grid in US1 (drag from strip is a stretch goal).

---

## Test contract

**New test file**: `frontend/tests/calendar-grid-positioning.test.ts`

Tests the following pure functions (no DOM, no component rendering):

| Function | Test cases |
|---|---|
| `minutesSinceGridStart` | "07:00"→0, "07:30"→30, "10:00"→180, "00:00"→1020 (midnight), invalid→0 |
| `eventHeightPx` | durationMinutes=60, pxPerMinute=1 → 60; durationMinutes=90 → 90 |
| `deriveDurationMinutes` | totalRounds=3, roundDurationMinutes=20 → 60; totalRounds=0 → 60 (default); roundDurationMinutes=0 → 60 |
| `snapToGrid` | 0→0, 15→0, 16→30, 45→30, 46→60, 975→960 (clamp) |
| `minutesToTime24h` | 0→"07:00", 30→"07:30", 180→"10:00", 990→"23:30", 1020→"00:00" |
| `getWeekStart` | March 10 (Mon) → March 10; March 11 (Tue) → March 10; March 15 (Sun) → March 10 |
| `getWeekDates` | Returns exactly 7 dates from Monday to Sunday |
| `formatWeekLabel` | "10 Mar – 16 Mar 2026" |

---

## Acceptance criteria

| FR | Criterion | Verified by |
|---|---|---|
| FR-001 | 7-column Mon–Sun grid with 07:00–00:00 time axis visible | Manual |
| FR-002 | Event block appears at correct day and time with correct height | Unit test (positioning helpers) |
| FR-003 | Duration derived as `round_count × roundDurationMinutes`; fallback 60 | Unit test (`deriveDurationMinutes`) |
| FR-004 | Previous/next week navigation and Today button work | Manual |
| FR-005 | Current day column visually highlighted | Manual |
| FR-006 | Events with null time appear in Unscheduled strip | Manual |
| FR-007 | Running/Finished blocks have status badge and distinct style | Manual |
| FR-007b | Week navigation calls `listEventsByDateRange` with correct from/to dates | Unit test (`calendar-api-integration.test.ts`) |
