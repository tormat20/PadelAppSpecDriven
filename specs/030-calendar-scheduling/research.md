# Research: Calendar Scheduling (030-calendar-scheduling)

**Branch**: `030-calendar-scheduling` | **Date**: 2026-03-10

---

## Backend Research

### Finding 1 — `round_duration_minutes` is stored but not exposed

**Question**: Is `round_duration_minutes` available in the API response today?

**Finding**: The `events` DB table has `round_duration_minutes INTEGER NOT NULL` (confirmed in `list_all.sql` SELECT list and `EventsRepository.list_all()`). However, `EventResponse` in `backend/app/api/schemas/events.py` does **not** include this field. The router builds `EventResponse` via `_to_event_response()` which also omits it. The `Event` domain model carries the value — it is just not surfaced.

**Decision**: Add `roundDurationMinutes: int` to `EventResponse` Pydantic schema. Update `_to_event_response()` to pass `event.round_duration_minutes`. No migration required — column already exists.

**Alternatives considered**: Derive duration only on frontend using `totalRounds × fallback_minutes` — rejected because the fallback (60 min) would cause incorrect block heights whenever `round_duration_minutes` is non-zero; exposing the real value is strictly better.

---

### Finding 2 — `GET /api/v1/events` has no date-range filter

**Question**: Does the existing list endpoint support `?from`/`?to` query params?

**Finding**: `list_events()` in `events.py` takes no parameters and delegates to `event_service.list_events()` which calls `events_repo.list_all()` which executes `list_all.sql` — a plain `SELECT … FROM events ORDER BY …` with no `WHERE` clause. All events are always returned.

**Decision**:
1. Add optional `from_date: date | None = Query(default=None, alias="from")` and `to_date: date | None = Query(default=None, alias="to")` parameters to `list_events()`.
2. When both/either are provided, call a new `events_repo.list_by_date_range(from_date, to_date)` method.
3. When neither is provided, fall back to `events_repo.list_all()` (backwards compatible).
4. New SQL file `backend/app/repositories/sql/events/list_by_date_range.sql` — same SELECT as `list_all.sql` but adds `WHERE event_date BETWEEN ? AND ?` (with null-safe fallback handling).

**Alternatives considered**: Adding a WHERE clause directly to `list_all.sql` with nullable params — rejected because DuckDB's parameter binding makes null-handling awkward; cleaner to have a separate SQL file for the filtered path.

---

### Finding 3 — `PATCH /api/v1/events/{id}` supports partial updates

**Question**: Does the PATCH endpoint support sending only changed fields?

**Finding**: `UpdateEventSetupRequest` uses `field | None = None` for all fields except `expectedVersion`. The service method `update_event_setup()` checks each field for `None` before applying it. Confirmed: only non-None fields are written. The frontend can safely send only `{ expectedVersion, eventDate }` for a horizontal drag, or `{ expectedVersion, eventTime24h }` for a vertical drag.

---

### Finding 4 — `DELETE /api/v1/events/{id}` is fully implemented

**Finding**: `delete_event()` router handler exists at line 214–222 of `events.py`. It calls `event_service.delete_event()` which cascades to child tables (scores, matches, rounds, players, courts). Returns 204. No issues.

---

## Frontend Research

### Finding 5 — `RequireAdmin` exists but is not wired to any route yet

**Finding**: `frontend/src/components/auth/RequireAdmin.tsx` renders `<Outlet />` for admin users, `<Navigate to="/" />` for logged-in non-admins, and `<Navigate to="/login" />` for unauthenticated users. It uses `useAuth()` from `AuthContext`. The component is complete and ready to use — it simply has no route using it yet in `routes.tsx`. Adding `/calendar` under it follows the same pattern as `ProtectedRoute`.

---

### Finding 6 — Toast system is available

**Finding**: `frontend/src/components/toast/ToastProvider.tsx` provides `useToast()` hook with `.success(message)`, `.error(message)`, `.info(message)` methods. It is already mounted in `AppShell`. The Calendar page can call `useToast().error(…)` for drag-revert error feedback and `useToast().info(…)` for the "no more recurrences this month" notice.

---

### Finding 7 — `listEvents()` takes no parameters today

**Finding**: `frontend/src/lib/api.ts` — `listEvents()` calls `GET /api/v1/events` with no query params. A new `listEventsByDateRange(from: string, to: string): Promise<EventRecord[]>` function must be added that appends `?from=YYYY-MM-DD&to=YYYY-MM-DD` to the request.

**Decision**: Add `listEventsByDateRange` as a new exported function alongside `listEvents`. Do not modify the existing `listEvents` signature (it is used by existing pages).

---

### Finding 8 — Native HTML5 drag-and-drop is sufficient

**Question**: Is native DnD API powerful enough for a calendar grid with snapping?

**Finding**: The spec requires no new npm packages. Native `dragstart` / `dragover` / `drop` events provide:
- `dataTransfer` to carry event ID and drag offset
- `dragover` fires on every 50–100 ms interval → sufficient for ghost position updates
- `getBoundingClientRect()` on the grid container gives absolute coordinates for snap math

The ghost block position during drag is updated via `onDragOver` on the grid container, reading `event.clientY` / `event.clientX` relative to the grid's bounding rect. CSS `pointer-events: none` on the ghost block prevents it from consuming drag events.

**Alternatives considered**: Using pointer events (`pointerdown` / `pointermove` / `pointerup`) for finer control — viable and avoids some mobile DnD quirks, but adds more boilerplate. Since the spec targets desktop-primary, native DnD is the simpler choice and is what the spec explicitly permits.

---

### Finding 9 — Calendar grid math approach

**Question**: How to map event time → pixel position and height within the grid?

**Finding**: The time axis spans 07:00–24:00 = 17 hours = 1020 minutes. Each 30-minute row is `1/34` of the total grid height. Given a CSS grid height variable `--cal-grid-height` (e.g., `1020px` = 1px per minute), position and height reduce to:

```ts
// Pure helper functions (exported for tests)
export function minutesSinceGridStart(time24h: string): number
// "07:30" → 30, "10:00" → 180, "07:00" → 0

export function eventTopPx(time24h: string, pxPerMinute: number): number
// top = minutesSinceGridStart(time24h) * pxPerMinute

export function eventHeightPx(durationMinutes: number, pxPerMinute: number): number
// height = durationMinutes * pxPerMinute

export function snapToGrid(rawMinutes: number, snapIntervalMinutes: number): number
// rounds to nearest 30-min slot; clamps to [0, 1020-60] (last valid start = 23:00)

export function minutesToTime24h(totalMinutes: number): string
// 180 → "10:00", 690 → "18:30"
```

**Decision**: Use absolute positioning within each day column with `position: relative`. Each `EventBlock` is `position: absolute` with `top` and `height` derived from the functions above. This avoids CSS Grid row manipulation entirely and makes the drag math straightforward.

---

### Finding 10 — Recurrence calculation

**Question**: Given an event date (e.g., Monday March 10), what are the remaining same-weekday dates in the current calendar month?

**Finding**: Algorithm:

```ts
export function getRemainingWeekdayOccurrences(
  originalDate: Date,   // the event date (occurrence 1)
  referenceMonth: Date  // used to derive the month — same as originalDate in practice
): Date[]
// Returns dates strictly AFTER originalDate, same weekday, same calendar month
// Example: March 10 (Monday) → [March 17, March 24]
// Example: March 24 (Monday) → [] (last Monday in March)
```

This is a pure date computation — unit-testable without any API calls or DOM. The frontend calls this function after the create gesture succeeds, then fires N additional `POST /api/v1/events` calls in parallel.

---

## Dependency Audit

| Item | Status |
|---|---|
| `motion` (Framer Motion) | Already installed — used by Stepper, CreateEvent |
| `RequireAdmin` component | Already exists in `components/auth/RequireAdmin.tsx` |
| `useToast` hook | Already available in `components/toast/ToastProvider.tsx` |
| `listEvents` API function | Already in `lib/api.ts` — kept unchanged |
| `createEvent`, `updateEvent`, `deleteEvent` API functions | Already in `lib/api.ts` |
| `EventRecord`, `UpdateEventPayload`, `CreateEventPayload` types | Already in `lib/types.ts` |
| Native HTML5 DnD API | Browser built-in — no package needed |

**No new npm packages required.**

---

## Open Questions Resolved

| Question | Decision |
|---|---|
| Should the calendar nav link appear for non-admin users? | No — admin-only, no nav entry for regular users |
| What colour scheme per event type? | Use existing status/event-type colour tokens already defined in the app CSS |
| Does drag-to-create conflict with drag-to-reschedule? | No — `dragstart` only fires on an existing `EventBlock`; `pointerdown` on the grid background initiates the create gesture |
| `round_count` missing or zero — what duration to use? | Default 60 minutes (per spec FR-003) |
| Daily court view (US6, P3) — in scope for this plan? | In scope as a stretch story; implementation plan covers it but tasks may defer it to a separate PR |
