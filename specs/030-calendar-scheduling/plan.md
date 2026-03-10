# Implementation Plan: Calendar Scheduling

**Branch**: `030-calendar-scheduling` | **Date**: 2026-03-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/030-calendar-scheduling/spec.md`

---

## Summary

A weekly drag-and-drop calendar view for scheduling padel events, accessible to admin users only. Organisers can see all events laid out in a Monday-to-Sunday weekly grid, drag Lobby events to reschedule them (horizontal = change day, vertical = change time), click blocks to edit or delete, drag on empty cells to create new events, and enable "Repeat weekly" to auto-fill the remaining same-weekday slots in the current month.

Two targeted backend changes are required: (1) expose `round_duration_minutes` in the `EventResponse` schema (field already stored in DB), and (2) add `?from`/`?to` date-range filter parameters to `GET /api/v1/events`. All recurrence logic is entirely frontend-computed. No new DB columns or migrations are needed.

---

## Technical Context

**Language/Version**: TypeScript 5.x + React 18.3 (frontend); Python 3.12 (backend)
**Primary Dependencies**: React Router DOM 6, Vite 5, Vitest 2, `motion` (already installed); FastAPI, Pydantic, DuckDB-backed repositories
**Storage**: Existing DuckDB event persistence; no schema migration required (all columns already exist); `localStorage` not used for new calendar state
**Testing**: Vitest 2 (frontend — pure exported helper functions); pytest (backend — unit + integration)
**Target Platform**: Web app (desktop browser primary); SPA served by Vite / static build
**Project Type**: Web application — frontend (new Calendar page + components) + backend (two small additions)
**Performance Goals**: Calendar grid renders up to 20 events per week without perceptible lag; drag interactions run at 60 fps (CSS transform, no layout reflow during drag)
**Constraints**: No new npm packages; drag-and-drop via native HTML5 drag-and-drop API or pointer events only; all existing tests must remain green; TypeScript strict compliance; CSS design tokens only
**Scale/Scope**: 1 new page (`Calendar.tsx`), 1 new route (`/calendar` under `RequireAdmin`), ~5 new calendar sub-components, 2 backend schema/query additions, ~8 new test files

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The constitution file contains only a blank template — no project-specific principles are defined. The following conventions have been inferred from the existing codebase and all previous feature plans:

| Inferred Convention | Status | Notes |
|---|---|---|
| Pure-function exports for unit-testable logic | ✅ PASS | All new calendar helper functions (grid positioning, drag math, recurrence calc) exported and tested independently |
| CSS design tokens — no hardcoded colours | ✅ PASS | All new CSS uses `var(--color-*)` tokens |
| No new npm packages | ✅ PASS | Native HTML5 DnD / pointer events; no DnD library |
| TypeScript strict compliance | ✅ PASS | All new code typed; no `any` except where existing codebase already uses it |
| Vitest unit-test pattern | ✅ PASS | New test files follow the project's pure-export + unit-test pattern |
| Existing tests must not regress | ✅ PASS | Backend: only additive changes to `EventResponse` and `list_events` query; Frontend: new route added under `RequireAdmin` — no existing route modified |
| Admin-only gate | ✅ PASS | `/calendar` route wrapped in `RequireAdmin` — consistent with all other event-management screens |

**No gate violations. Proceeding to Phase 0.**

---

## Project Structure

### Documentation (this feature)

```text
specs/030-calendar-scheduling/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   ├── backend-round-duration-exposure.md
│   ├── backend-date-range-filter.md
│   ├── calendar-page-weekly-view.md
│   └── calendar-drag-edit-create.md
└── tasks.md             ← Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/
│   │   ├── routers/events.py              ← MODIFIED: ?from/?to query params on list_events()
│   │   └── schemas/events.py              ← MODIFIED: roundDurationMinutes added to EventResponse
│   └── repositories/
│       ├── events_repo.py                 ← MODIFIED: list_by_date_range() method added
│       └── sql/events/
│           └── list_by_date_range.sql     ← NEW: parameterised date-range query
└── tests/
    ├── test_events_date_range_filter.py   ← NEW: backend unit tests for date-range filter
    └── test_event_response_duration.py   ← NEW: backend unit tests for roundDurationMinutes

frontend/
├── src/
│   ├── lib/
│   │   ├── api.ts                         ← MODIFIED: listEventsByDateRange(from, to) added
│   │   └── types.ts                       ← MODIFIED: roundDurationMinutes added to EventRecord
│   ├── app/
│   │   └── routes.tsx                     ← MODIFIED: /calendar route under RequireAdmin
│   ├── pages/
│   │   └── Calendar.tsx                   ← NEW: CalendarPage default export + helper exports
│   └── components/
│       └── calendar/
│           ├── WeekGrid.tsx               ← NEW: 7-column time grid
│           ├── EventBlock.tsx             ← NEW: positioned event block (draggable)
│           ├── GhostBlock.tsx             ← NEW: drag/create preview block
│           ├── EventDrawer.tsx            ← NEW: slide-in edit/create side drawer
│           └── UnscheduledStrip.tsx       ← NEW: strip for timeless events
└── tests/
    ├── calendar-grid-positioning.test.ts  ← NEW: pure positioning helpers
    ├── calendar-drag-reschedule.test.ts   ← NEW: drag math + optimistic revert logic
    ├── calendar-recurrence-calc.test.ts   ← NEW: remaining-weekdays-in-month logic
    ├── calendar-event-block.test.ts       ← NEW: block render + locked-event rejection
    ├── calendar-drawer.test.ts            ← NEW: drawer pre-fill + discard-changes logic
    └── calendar-api-integration.test.ts   ← NEW: listEventsByDateRange call shaping
```

**Structure Decision**: Web application — Option 2 (frontend + backend). The backend changes are minimal and additive. The frontend is a new page with its own component subtree under `components/calendar/`. The `/calendar` route is added under the existing `RequireAdmin` guard in `routes.tsx`.

---

## Complexity Tracking

No constitution violations to justify.
