# Contract: Calendar — Drag to Reschedule, Click to Edit/Delete, Drag to Create, Recurring Events

**Feature**: 030-calendar-scheduling | **User Stories**: US2 (P1), US3 (P1), US4 (P2), US5 (P2)
**Files affected**:
- `frontend/src/pages/Calendar.tsx` — MODIFIED (drag handlers + recurrence helper)
- `frontend/src/components/calendar/GhostBlock.tsx` — NEW
- `frontend/src/components/calendar/EventDrawer.tsx` — NEW

---

## US2 — Drag to Reschedule

### Drag flow (native HTML5 DnD)

1. **`dragstart`** on `EventBlock` (Lobby only):
   - Store event ID and drag offset in `dataTransfer` via `setData("text/plain", eventId)`
   - Set `draggingEventId` state
   - Record `preDragSnapshot`: `{ eventId, originalDate, originalTime }`

2. **`dragover`** on the grid container:
   - Call `e.preventDefault()` to allow drop
   - Compute `ghostBlock` position from `e.clientX` / `e.clientY` relative to grid bounding rect
   - Update `ghostBlock` state → `GhostBlock` renders at the snapped position

3. **`drop`** on a day column:
   - Compute new `eventDate` (from column index) and new `eventTime24h` (from Y position, snapped to 30 min)
   - Apply optimistic update: update `events` state immediately
   - Call `updateEvent(eventId, { expectedVersion, eventDate: newDate, eventTime24h: newTime })`
   - On success: do nothing (optimistic state is already correct); clear `draggingEventId` and `ghostBlock`
   - On failure: revert `events` state to snapshot; show `useToast().error("Could not reschedule. Changes reverted.")`

4. **`dragend`** (fires on cancel / Escape / drop outside):
   - Clear `draggingEventId`, `ghostBlock`, `preDragSnapshot`
   - If `dragend` fires without a successful drop (check via a `dropSucceeded` flag), no API call is made and state is unchanged

### Locked events

```tsx
// In EventBlock:
const isLocked = event.status === "Running" || event.status === "Finished"
<div
  draggable={!isLocked}
  onDragStart={isLocked ? (e) => e.preventDefault() : props.onDragStart}
  style={{ cursor: isLocked ? "default" : "grab" }}
  ...
>
```

### Out-of-bounds clamping

- Drop below 07:00 → clamp to `snapToGrid(0)` = `"07:00"`
- Drop above 23:30 → clamp to `snapToGrid(960)` = `"23:30"` (last valid start: event at 23:30 ends at midnight)

### Exported helpers (for drag math tests)

```ts
// frontend/src/pages/Calendar.tsx

export function computeDragDayIndex(
  clientX: number,
  gridRect: { left: number; width: number },
): number  // 0 (Monday) … 6 (Sunday); clamped

export function computeDropMinutes(
  clientY: number,
  gridRect: { top: number; height: number },
  pxPerMinute: number,
): number  // raw minutes since grid start, NOT yet snapped
```

### GhostBlock component

```ts
type GhostBlockProps = {
  top: number           // px
  height: number        // px
  label: string         // e.g. "Wed 11 Mar  10:30" or "09:00 – 11:00"
  mode: "reschedule" | "create"
}
```

CSS: `position: absolute; opacity: 0.45; pointer-events: none; z-index: 10; border: 2px dashed var(--color-accent);`

---

## US3 — Click to Edit / Delete

### Edit drawer trigger

Clicking any `EventBlock` calls `handleBlockClick(event)`:
- Lobby event → opens `EventDrawer` in `mode: "edit"` with `event` pre-filled
- Running/Finished event → opens `EventDrawer` in `mode: "readonly"` with `event` pre-filled

### EventDrawer component

```ts
type EventDrawerProps = {
  state: DrawerState
  onSave: (updates: Partial<UpdateEventPayload> & { expectedVersion: number }) => Promise<void>
  onDelete: (eventId: string, version: number) => Promise<void>
  onClose: () => void
}
```

#### Edit mode fields

| Field | Input type | Notes |
|---|---|---|
| Event name | `<input type="text">` | min 3, max 120 chars |
| Event type | `<select>` | WinnersCourt / Mexicano / RankedBox / Americano |
| Date | `<input type="date">` | |
| Start time | `<input type="time">` | step="1800" (30 min) |
| Duration | `<select>` | 60 / 90 / 120 / custom (minutes); custom = `<input type="number">` |
| Courts | Multi-select or comma-separated number input | |

Duration field: displays `totalRounds × roundDurationMinutes` on load. User edits duration → this is sent as the new `round_duration_minutes` via PATCH (pending confirmation of spec — see note below).

> **Note**: The PATCH endpoint currently does not accept `round_duration_minutes` directly. The implementer must either: (a) derive the required `round_count` change from the new duration, or (b) verify whether the endpoint needs updating. For the planning phase, we record that duration editing results in a PATCH with the available fields. The task will clarify during implementation.

#### Save behaviour

1. Compare current form values to pre-fill values
2. Send only changed fields in PATCH body (plus `expectedVersion`)
3. On success: update `events` state; close drawer
4. On error: show inline error; keep drawer open

#### Delete behaviour

1. Show confirmation dialog: "Delete this event? This cannot be undone."
2. On confirm: call `deleteEvent(eventId)`; on success: remove from `events` state; close drawer
3. On cancel: dismiss dialog; keep drawer open

#### Discard changes prompt

When user clicks "Close" (× button) with unsaved form changes:
- Show a `window.confirm("Discard changes?")` or inline confirmation banner
- Confirm → close drawer without saving
- Cancel → keep drawer open

#### Read-only mode

All form fields rendered as `disabled` or plain text. No Save or Delete buttons. Only a "Close" button.

#### Animation

Drawer slides in from right using `motion` (Framer Motion):
```tsx
<motion.div
  initial={{ x: "100%" }}
  animate={{ x: 0 }}
  exit={{ x: "100%" }}
  transition={{ type: "tween", duration: 0.22 }}
  className="event-drawer"
>
```

---

## US4 — Drag to Create

### Create gesture flow (pointer events)

1. **`pointerdown`** on empty grid cell (not on an `EventBlock`):
   - Start recording: `createDragOrigin = { dayIndex, minutesFromGridStart }`
   - Set `ghostBlock = { mode: "create", dayIndex, startMinutes: snapped, durationMinutes: 60 }`

2. **`pointermove`** on grid (while pointer down):
   - Compute `durationMinutes = max(60, snapToGrid(currentMinutes - originMinutes))`
   - Update `ghostBlock.durationMinutes`

3. **`pointerup`** on grid:
   - If duration ≥ 30 min → open EventDrawer in `mode: "create"` pre-filled with:
     - `date` from `dayIndex` + `viewWeekStart`
     - `time24h` from `startMinutes` (e.g., `minutesToTime24h(startMinutes + GRID_START_HOUR*60)`)
     - `durationMinutes` from ghost block
   - Clear `ghostBlock` (ghost stays visible until drawer is opened, then disappears)

4. **Drawer "Create" button**:
   - Validate: event name required, event type required
   - Call `createEvent(payload)` for the primary event
   - If "Repeat weekly" toggle is on → call `getRemainingWeekdayOccurrences(date)` → fire N additional `createEvent` calls in parallel
   - On all resolved: add all new events to `events` state; close drawer
   - On any failure: show error toast; created events so far remain (no rollback)

5. **Drawer "Cancel"**: clear `ghostBlock`; close drawer; no API call

---

## US5 — Recurring Events

### `getRemainingWeekdayOccurrences` — exported pure function

```ts
export function getRemainingWeekdayOccurrences(originalDate: Date): Date[]
```

**Algorithm**:
1. Determine `weekday = originalDate.getDay()` (0 = Sun … 6 = Sat)
2. Determine the last day of `originalDate`'s calendar month
3. Start from `originalDate + 7 days`
4. While date ≤ last day of month AND date.getDay() === weekday: collect date, advance by 7 days
5. Return collected dates

**Edge cases**:
- `originalDate` is last occurrence of that weekday in the month → returns `[]`
- Returns only dates strictly after `originalDate`, never the original itself

**"Repeat weekly" UI** in the creation drawer:
- A checkbox/toggle labelled "Repeat weekly (rest of month)"
- When checked and dates calculated → show preview: "Will also create: Mar 17, Mar 24" (or "No more Mondays this month.")

**No more occurrences notice**:
- Use `useToast().info("No more Mondays this month — only the original event was created.")` after create completes when `getRemainingWeekdayOccurrences` returns `[]`

---

## Test contracts

### `frontend/tests/calendar-drag-reschedule.test.ts`

```ts
// computeDragDayIndex
computeDragDayIndex(clientX at col 0 centre, gridRect) → 0
computeDragDayIndex(clientX at col 6 centre, gridRect) → 6
computeDragDayIndex(clientX before col 0, gridRect) → 0  // clamp left
computeDragDayIndex(clientX after col 6, gridRect) → 6   // clamp right

// computeDropMinutes
computeDropMinutes(at grid top, gridRect, 1) → 0
computeDropMinutes(at grid bottom, gridRect, 1) → 1020

// snapToGrid + clamp
snapToGrid(975) → 960   // clamp to last slot
```

### `frontend/tests/calendar-recurrence-calc.test.ts`

```ts
getRemainingWeekdayOccurrences(new Date("2026-03-10")) → [new Date("2026-03-17"), new Date("2026-03-24")]
getRemainingWeekdayOccurrences(new Date("2026-03-24")) → []  // last Monday in March
getRemainingWeekdayOccurrences(new Date("2026-03-31")) → []  // last day of month
getRemainingWeekdayOccurrences(new Date("2026-02-24")) → []  // last Tuesday in Feb 2026
getRemainingWeekdayOccurrences(new Date("2026-02-17")) → [new Date("2026-02-24")]
```

### `frontend/tests/calendar-event-block.test.ts`

```ts
// Running/Finished event: draggable=false, drag rejected
// Lobby event: draggable=true
// isDragging=true: block rendered with opacity 0.4
```

### `frontend/tests/calendar-drawer.test.ts`

```ts
// getDrawerDirtyState(original, current) → false when nothing changed
// getDrawerDirtyState(original, changed) → true when any field changed
// Duration edit: deriveDurationMinutes with custom override
```

---

## Acceptance criteria summary

| FR | Criterion |
|---|---|
| FR-008 | Vertical drag → time update (PATCH eventTime24h) |
| FR-009 | Horizontal drag → date update (PATCH eventDate) |
| FR-010 | Ghost block visible during drag showing proposed position |
| FR-011 | Optimistic update on drop; persisted via PATCH |
| FR-012 | PATCH failure → revert + error toast |
| FR-013 | Running/Finished cannot be dragged |
| FR-014 | Out-of-bounds drop clamped to 07:00 / 23:30 |
| FR-015 | Click Lobby → drawer opens with pre-filled fields |
| FR-016 | Drawer allows updating name, date, time, duration, courts |
| FR-017 | Save → PATCH + calendar block update |
| FR-018 | Delete → confirm → DELETE + block removed |
| FR-019 | Click Running/Finished → drawer opens read-only, no save/delete |
| FR-020 | Close with unsaved changes → discard prompt |
| FR-021 | Drag on empty cell → ghost block grows |
| FR-022 | Release drag → drawer opens with date/time/duration pre-filled |
| FR-023 | Name + type required before create |
| FR-024 | Cancel create → no event, ghost cleared |
| FR-025 | "Repeat weekly" toggle in creation panel |
| FR-026 | Repeat weekly → N additional POST calls for remaining weekdays in month |
| FR-027 | No remaining occurrences → only original + info notice |
| FR-028 | Each occurrence independent — edit/delete/move one has no effect on others |
