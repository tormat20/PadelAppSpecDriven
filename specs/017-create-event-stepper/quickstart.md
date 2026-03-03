# Quickstart: 3-Step Create Event Stepper

**Feature**: `017-create-event-stepper`  
**Branch**: `017-create-event-stepper`  
**Date**: 2026-03-03

---

## Prerequisites

- Node.js 20+
- Python 3.12+ with a virtual environment
- All existing dev dependencies installed (`npm install` in `frontend/`)
- Backend running locally (see below)

---

## 1. Install the New Dependency

The `motion` library is not yet in the project. Install it before making any
code changes:

```bash
cd frontend
npm install motion
```

Verify it appears in `frontend/package.json` under `"dependencies"`.

---

## 2. Start the Backend

The stepper calls the existing `createEvent` and `updateEvent` API endpoints.
The backend must be running for end-to-end development:

```bash
cd backend
source .venv/bin/activate   # or equivalent for your shell
uvicorn app.main:app --reload
```

Backend runs on `http://127.0.0.1:8000`. The frontend proxies nothing — the
`API_BASE` in `src/lib/api.ts` already points directly to this address.

---

## 3. Start the Frontend Dev Server

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` (default Vite port). Navigate to
**Main Menu → Create Event** to reach the stepper.

---

## 4. Developing the Stepper Component

New file to create: `frontend/src/components/stepper/Stepper.tsx`  
New CSS file: `frontend/src/components/stepper/stepper.css`

The stepper component is imported from `src/pages/CreateEvent.tsx`. To verify
the component in isolation, write a test in
`frontend/tests/stepper-component.test.tsx` and run it with:

```bash
cd frontend
npm test -- stepper-component
```

---

## 5. Refactoring `CreateEvent.tsx`

The file to refactor is `frontend/src/pages/CreateEvent.tsx`.

**Key changes**:
1. Remove the two-column grid layout.
2. Add `currentStep`, `direction`, `savedEventId`, and error state variables.
3. Replace the single form with a `<Stepper>` that renders one of three step panels.
4. On edit mount, derive `currentStep` from `getStartStep(event.lifecycleStatus)`.

Reference the data model in `data-model.md` and the contracts in `contracts/`
for exact prop shapes and state transitions.

---

## 6. Running All Frontend Tests

```bash
cd frontend
npm test
```

Expected: 103 tests pass (existing) plus new stepper tests once written.

**Known tests that will need updating** when `CreateEvent.tsx` is refactored
(see `research.md` section 6 for details):

- `create-event-page.test.tsx`
- `create-event-draft-persistence.test.tsx`
- `create-event-planned-slots.test.tsx`
- `create-event-dual-actions.test.tsx`
- `create-event-datetime.test.tsx`
- `planned-event-setup-flow.test.tsx`
- `preview-edit-event-flow.test.tsx`

Update these tests alongside the implementation to keep the test suite green
at all times.

---

## 7. TypeScript Type Check

```bash
cd frontend
npm run lint
```

This runs `tsc --noEmit`. Fix all type errors before committing.

---

## 8. Testing the Edit / Resume Flow Manually

1. Start a new event via the stepper (Step 1 only — fill Setup, press Next).
2. Navigate away to the Home page.
3. Find the new event in the list and open its Preview page.
4. Press "Edit Event" — confirm the stepper opens at **Step 2 (Roster)**.
5. Add courts and players, press Next.
6. Confirm the stepper advances to **Step 3 (Confirm)**.
7. Press "Start Event" — confirm navigation to the run-event page.

---

## 9. Verifying `prefers-reduced-motion` Behavior

In Chrome DevTools:
1. Open DevTools → Rendering tab → check "Emulate CSS media feature prefers-reduced-motion".
2. Navigate to Create Event.
3. Press Next on Step 1.
4. Verify the step transition has **no slide animation** (instant switch).

The existing `motion.css` rule handles this globally — no extra code needed.

---

## 10. Full Test Suite (both frontend and backend)

Run both suites from the repo root to confirm no regression:

```bash
# From repo root
npm test && npm run lint
```

Or individually:

```bash
# Frontend
cd frontend && npm test && npm run lint

# Backend
cd backend && source .venv/bin/activate && pytest
```
