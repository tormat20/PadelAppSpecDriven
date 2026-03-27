# Quickstart - Calendar interaction modes + template drag-create

## Prerequisites

- Frontend dependencies installed.
- User can access `/calendar` via existing app auth/role flow.

## Run

```bash
cd frontend
npm run dev
```

Open `/calendar`.

## Manual Validation Scenarios

1. **Move mode**
   - Hover event body and confirm move affordance.
   - Drag event to a new slot and confirm landing preview remains visible.
   - Confirm event date/time updates while duration is unchanged.

2. **Resize mode**
   - Hover bottom 4px of event and confirm vertical resize affordance.
   - Drag bottom edge and confirm duration updates in 30-minute steps.
   - Confirm resulting duration remains in 60/90/120 and visual height/time-range updates immediately.

3. **Mode conflict prevention**
   - Start gesture in resize zone and confirm move does not trigger.
   - Start gesture in body zone and confirm resize does not trigger.

4. **Template drag-create**
   - Drag each template type into valid grid slots.
   - Confirm a new event appears with duration 90 and placeholder name.
   - Confirm Team Mexicano template yields Mexicano type with team flag behavior.

5. **Interaction polish**
   - Confirm event cards show interactive glare on hover/focus.
   - Confirm no route/menu access regressions for `/calendar`.

## Validation Commands

```bash
cd frontend
npm run lint
npm test
```

## Out of Scope Guardrails

- No expanded backend persistence model changes in this phase.
- No full calendar redesign beyond listed interaction/template enhancements.

## Validation Results (2026-03-22)

- `cd frontend && npm run lint` passed.
- `cd frontend && npm test` passed (75 files, 451 tests).
- Calendar interaction regression suites passed:
  - `calendar-event-block.test.ts`
  - `calendar-drag-reschedule.test.ts`
  - `calendar-grid-positioning.test.ts`
  - `calendar-api-integration.test.ts`
  - `calendar-drawer.test.ts`
