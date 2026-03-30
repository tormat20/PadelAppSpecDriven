# Quickstart - Calendar Drag-and-Drop POC on EventRecord

## Prerequisites

- Frontend dependencies installed.
- Existing app auth/role setup that allows access to `/calendar`.

## Run

1. Start frontend app:

```bash
cd frontend
npm run dev
```

2. Open the app and navigate to `/calendar`.

## Validate POC Behavior

1. Confirm weekly calendar view is visible (not the old placeholder message).
2. Confirm event cards show:
   - event name
   - event type label
   - time range
   - duration
3. Drag one event to another day/time slot and confirm:
   - it appears in the new slot
   - `eventDate` and `eventTime24h` mapping behavior is reflected in UI position
4. Change duration for one event and confirm:
   - duration is one of `60`, `90`, or `120`
   - card size/time range updates immediately
5. Confirm Team Mexicano labeling behavior:
   - events with Mexicano team flag render as "Team Mexicano"

## Test Commands

```bash
cd frontend
npm run lint
npm test
```

## Out of Scope Verification (must remain true)

- Drag/drop and duration edits are session-local for phase 1.
- Refreshing the page may revert edits to last loaded data.

## Validation Results (2026-03-22)

- `cd frontend && npm run lint` passed.
- `cd frontend && npm test` passed (75 files, 440 tests).
- Calendar-focused tests passed:
  - `calendar-grid-positioning.test.ts`
  - `calendar-drag-reschedule.test.ts`
  - `calendar-api-integration.test.ts`
  - `calendar-event-block.test.ts`
  - `calendar-drawer.test.ts`
