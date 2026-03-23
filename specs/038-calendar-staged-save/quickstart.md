# Quickstart - Calendar reliability and staged save workflow

## Prerequisites

- Frontend and backend dependencies installed.
- Admin-capable account available.

## Run

```bash
cd backend
PYTHONPATH=. uvicorn app.main:app --reload
```

```bash
cd frontend
npm run dev
```

Open `/calendar` and `/account-settings`.

## Validation Scenarios

1. **Staged save flow**
   - Move one event, resize another, create one from template, and edit one via modal.
   - Verify Save Changes appears in header while edits are unsaved.
   - Trigger Save Changes and verify dirty state clears.

2. **Save failure behavior**
   - Simulate a save error.
   - Verify staged edits remain visible and user can retry save.

3. **Navigation guard**
   - Make unsaved edits and attempt route navigation.
   - Verify confirmation prompt appears.

4. **Legacy event normalization**
   - Verify old/pre-existing events support move/resize/edit interactions similarly to newly created events.

5. **Interaction modes**
   - Body hover/drag => move behavior.
   - Bottom 4px hover/drag => resize behavior with 60/90/120 limits.
   - Name hover/click => edit modal opens without route redirect.

6. **Preview and visual consistency**
   - Drag events with different durations; verify preview height matches footprint.
   - Verify template cards and scheduled events share consistent type colors.
   - Verify hover style is subtle edge emphasis (not heavy glow).

7. **Account event management**
   - Open Account Settings -> Event Management -> Remove all events.
   - Verify confirmation appears and deletion only executes after confirmation.

8. **Laptop layout**
   - Validate readability/usability on common laptop widths (1280-1920).

9. **Redo and day-court detail view**
   - Stage multiple edits, click Redo Changes, and verify state resets to last saved week.
   - Click a weekday header (e.g., Mon 23 Mar) and verify day-court lane view opens.
   - Verify events with no selected courts span all lanes with dotted borders.

## Validation Commands

```bash
cd frontend
npm run lint
npm test
```

```bash
cd backend
PYTHONPATH=. pytest
```

## Latest Validation Outcomes

- 2026-03-23: `cd frontend && npm run lint` passed (`tsc --noEmit`).
- 2026-03-23: `cd frontend && npm test` passed (75 files, 472 tests).
- 2026-03-23: `cd backend && PYTHONPATH=. pytest` passed (160 tests).
