# Data Model: Calendar Scheduling (030-calendar-scheduling)

**Branch**: `030-calendar-scheduling` | **Date**: 2026-03-10

---

## Backend Changes

### 1. `EventResponse` schema — add `roundDurationMinutes`

**File**: `backend/app/api/schemas/events.py`

```python
class EventResponse(BaseModel):
    id: str
    eventName: str
    eventType: EventType
    eventDate: date
    eventTime24h: str | None
    status: EventStatus
    setupStatus: SetupStatus
    lifecycleStatus: Literal["planned", "ready", "ongoing", "finished"]
    missingRequirements: list[str]
    warnings: PlanningWarningsResponse
    version: int
    selectedCourts: list[int]
    playerIds: list[str]
    currentRoundNumber: int | None
    totalRounds: int
    roundDurationMinutes: int          # ← NEW FIELD
    isTeamMexicano: bool
```

**Change type**: Additive field only. `round_duration_minutes` is already returned by every SQL query that fetches events (both `list_all.sql` and `get_by_id.sql`). The `Event` domain model already carries `round_duration_minutes`. The `_to_event_response()` builder in `events.py` needs one additional line:

```python
# In _to_event_response():
roundDurationMinutes=event.round_duration_minutes,
```

**Backwards compatibility**: Existing API consumers that ignore unknown fields are unaffected. The field value is never null (DB column is `INTEGER NOT NULL`).

---

### 2. New SQL file — `list_by_date_range.sql`

**File**: `backend/app/repositories/sql/events/list_by_date_range.sql`

```sql
SELECT id, event_name, event_type, event_date, status,
       round_count, round_duration_minutes, current_round_number,
       event_time, setup_status, version, is_team_mexicano
FROM events
WHERE event_date BETWEEN ? AND ?
ORDER BY event_date ASC, COALESCE(event_time, '00:00') ASC, created_at ASC;
```

Column order matches `list_all.sql` exactly so the same `Event` construction code in `list_all()` applies unchanged to `list_by_date_range()`. The `ORDER BY` uses ascending date/time (most useful for calendar display, unlike `list_all` which uses descending).

---

### 3. `EventsRepository` — new method `list_by_date_range`

**File**: `backend/app/repositories/events_repo.py`

```python
def list_by_date_range(self, from_date: date, to_date: date) -> list[Event]:
    rows = self.conn.execute(
        load_sql("events/list_by_date_range.sql"),
        [from_date.isoformat(), to_date.isoformat()],
    ).fetchall()
    return [
        Event(
            id=row[0],
            event_name=row[1],
            event_type=EventType(row[2]),
            event_date=date.fromisoformat(str(row[3])),
            status=EventStatus(row[4]),
            round_count=row[5],
            round_duration_minutes=row[6],
            current_round_number=row[7],
            event_time=row[8],
            setup_status=SetupStatus(row[9]),
            version=row[10],
            is_team_mexicano=bool(row[11]),
        )
        for row in rows
    ]
```

---

### 4. `list_events` router — add `?from`/`?to` query params

**File**: `backend/app/api/routers/events.py`

```python
from datetime import date
from fastapi import Query

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
        return [
            _to_event_response(
                row["event"],
                row["player_ids"],
                row["courts"],
                row["missing_requirements"],
                row["warnings"],
                row["lifecycle_status"],
            )
            for row in events
        ]
```

The existing `list_events()` call path is preserved when no params are supplied — no regressions.

---

### 5. `EventService` — new method `list_events_by_date_range`

The event service already has a `list_events()` method. A new `list_events_by_date_range(from_date, to_date)` method is added that calls `repo.list_by_date_range()` and enriches each event the same way `list_events()` does (player IDs, courts, lifecycle status, warnings).

---

## Frontend Changes

### 6. `EventRecord` type — add `roundDurationMinutes`

**File**: `frontend/src/lib/types.ts`

```ts
export type EventRecord = {
  id: string
  eventName: string
  eventType: EventType
  eventDate: string
  eventTime24h?: string | null
  status: "Lobby" | "Running" | "Finished"
  setupStatus: SetupStatus
  lifecycleStatus?: "planned" | "ready" | "ongoing" | "finished"
  missingRequirements: string[]
  warnings: PlanningWarnings
  version: number
  selectedCourts: number[]
  playerIds: string[]
  currentRoundNumber: number | null
  totalRounds: number
  roundDurationMinutes: number      // ← NEW FIELD
  isTeamMexicano?: boolean
}
```

**Note**: `roundDurationMinutes` is intentionally non-optional. All event responses from the backend now include it. Any code that constructs `EventRecord` objects in tests may need updating.

---

### 7. New API function `listEventsByDateRange`

**File**: `frontend/src/lib/api.ts`

```ts
export async function listEventsByDateRange(
  from: string,   // YYYY-MM-DD
  to: string,     // YYYY-MM-DD
): Promise<EventRecord[]> {
  const res = await fetch(
    `${API_BASE}/events?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    { headers: authHeaders() },
  )
  if (!res.ok) throw new ApiError(res.status, await res.text())
  return res.json() as Promise<EventRecord[]>
}
```

The existing `listEvents()` function is **unchanged**.

---

## Frontend State Model — CalendarPage

### Local state

| Field | Type | Initial value | Notes |
|---|---|---|---|
| `events` | `EventRecord[]` | `[]` | Fetched on mount and on week navigation |
| `viewWeekStart` | `Date` | Monday of current week | ISO Monday (day 1) |
| `draggingEventId` | `string \| null` | `null` | ID of event being dragged; null when not dragging |
| `dragOffset` | `{ dayDelta: number; minuteDelta: number } \| null` | `null` | Computed delta from drag origin to current ghost position |
| `ghostBlock` | `GhostBlockState \| null` | `null` | Proposed position for create-drag ghost |
| `drawerState` | `DrawerState` | `{ open: false }` | Drawer open/closed + mode + prefill data |
| `isSubmitting` | `boolean` | `false` | Create/save in-flight guard |

### Type definitions (new — in `Calendar.tsx` or a dedicated `calendar/types.ts`)

```ts
export type GhostBlockState = {
  mode: "reschedule" | "create"
  dayIndex: number          // 0 = Monday … 6 = Sunday
  startMinutes: number      // minutes since 07:00, snapped to 30-min grid
  durationMinutes: number   // for reschedule: same as event; for create: grows with drag
}

export type DrawerState =
  | { open: false }
  | { open: true; mode: "edit";   event: EventRecord }
  | { open: true; mode: "create"; prefill: DrawerPrefill }
  | { open: true; mode: "readonly"; event: EventRecord }

export type DrawerPrefill = {
  date: string          // YYYY-MM-DD
  time24h: string       // HH:MM snapped
  durationMinutes: number
}
```

---

## Pure Helper Functions (exported from `Calendar.tsx`)

These are all unit-testable without DOM:

```ts
// Grid math
export function minutesSinceGridStart(time24h: string): number
export function eventTopPx(time24h: string, pxPerMinute: number): number
export function eventHeightPx(durationMinutes: number, pxPerMinute: number): number
export function snapToGrid(rawMinutes: number): number          // snap to 30-min; clamp to valid range
export function minutesToTime24h(totalMinutes: number): string
export function deriveDurationMinutes(event: EventRecord): number  // round_count × roundDurationMinutes; default 60

// Drag math
export function computeDragDayIndex(
  clientX: number,
  gridLeft: number,
  gridWidth: number,
): number  // returns 0-6

export function computeDragStartMinutes(
  clientY: number,
  gridTop: number,
  gridHeight: number,
  pxPerMinute: number,
): number  // returns snapped minutes since grid start

// Recurrence
export function getRemainingWeekdayOccurrences(originalDate: Date): Date[]
// Returns all dates strictly after originalDate, same weekday, same calendar month

// Week navigation
export function getWeekStart(date: Date): Date   // returns Monday of the week containing date
export function getWeekDates(weekStart: Date): Date[]  // returns [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
export function formatWeekLabel(weekStart: Date): string  // e.g. "10 Mar – 16 Mar 2026"
```

---

## Component Contracts (summary)

| Component | Props | Responsibility |
|---|---|---|
| `WeekGrid` | `events`, `weekStart`, `onBlockClick`, `onBlockDragStart`, `onBlockDrop`, `onCellDragStart`, `onCellDrop`, `ghostBlock` | Renders 7-column time grid + day headers + event blocks + ghost block |
| `EventBlock` | `event`, `top`, `height`, `isDragging`, `onDragStart`, `onClick` | Single positioned event; read-only lock for Running/Finished |
| `GhostBlock` | `top`, `height`, `dayIndex`, `label` | Semi-transparent preview block during drag |
| `EventDrawer` | `state: DrawerState`, `onSave`, `onDelete`, `onClose` | Slide-in drawer for edit/create/readonly; handles discard-changes prompt |
| `UnscheduledStrip` | `events`, `onBlockClick` | Horizontal strip below grid for events with no time |

---

## No Schema Migrations Required

All DB columns used by this feature (`round_duration_minutes`, `event_date`, `event_time`, `event_name`, `event_type`, `status`, `round_count`) exist in the current schema. The latest migration is `012_americano_event_type.sql`. No new migration file is needed.
