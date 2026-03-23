# Quickstart: Calendar Popup Editor with Immediate Save

## Goal

Validate centered popup event editing with immediate save and safe reconciliation with staged quick edits.

## Prerequisites

- Frontend dependencies installed.
- Backend running with test/admin access.
- Existing calendar events available for edit scenarios.

## Manual Validation Flow

1. Open weekly calendar and click event-name text in any scheduled block.
2. Verify centered popup opens above calendar with title and top-right close `X`.
3. Verify popup layout follows create-style editing language (mode/schedule/duration/name/setup).
4. Update event details including courts/players, then click Save.
5. Verify save persists immediately (refresh/list confirms updates).
6. Create staged quick edits on another event (drag/resize) without saving globally.
7. Save popup edits for one event and verify staged edits on other events remain.
8. Click Redo Changes and verify popup-persisted event is not reverted.
9. Trigger popup delete and verify event removal behavior remains correct.
10. Verify accessibility: Escape close, focus containment, and keyboard interaction.

## Automated Validation Commands

Frontend lint/type check:

```bash
cd frontend
npm run lint
```

Frontend targeted tests (example):

```bash
cd frontend
npm test -- --run tests/calendar-event-block.test.ts tests/calendar-drawer.test.ts tests/calendar-api-integration.test.ts tests/calendar-drag-reschedule.test.ts
```

Backend targeted contract tests (example):

```bash
cd backend
PYTHONPATH=. pytest tests/contract/test_events_api.py tests/contract/test_edit_event_flow_api.py
```

Full regression:

```bash
cd frontend && npm test
cd backend && PYTHONPATH=. pytest
```

## Latest Verification Results (2026-03-23)

- `cd frontend && npm run lint` -> pass
- `cd frontend && npm test -- --run tests/calendar-event-block.test.ts tests/calendar-drawer.test.ts tests/calendar-api-integration.test.ts tests/calendar-drag-reschedule.test.ts tests/calendar-grid-positioning.test.ts tests/preview-edit-event-flow.test.tsx tests/interactive-surface-pattern.test.tsx` -> 7 files passed, 120 tests passed
- `cd backend && PYTHONPATH=. pytest tests/contract/test_edit_event_flow_api.py tests/contract/test_events_api.py` -> 11 tests passed
- `cd frontend && npm test` -> 75 files passed, 476 tests passed
- `cd backend && PYTHONPATH=. pytest` -> 162 tests passed

Notes:

- Backend suite reports two existing FastAPI deprecation warnings for `@app.on_event("startup")`.
