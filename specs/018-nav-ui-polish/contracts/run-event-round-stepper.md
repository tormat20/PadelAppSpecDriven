# Contract: Run Event — Round-progress stepper

**Feature**: 018-nav-ui-polish | **User Story**: US2 (P2)
**File affected**: `frontend/src/pages/RunEvent.tsx`

---

## Change summary

1. Export a new pure helper function `getRoundStepperProps` (testable without DOM).
2. Render a read-only `<Stepper>` immediately below the page heading when `totalRounds >= 1`.

---

## New exported helper

```ts
/**
 * Derives the props needed to render a read-only round-progress Stepper.
 * Returns null when totalRounds is not a positive integer (stepper should not render).
 *
 * @param totalRounds  - event.totalRounds from the API (0 or positive integer)
 * @param roundNumber  - roundData.roundNumber from the API (1-indexed)
 */
export function getRoundStepperProps(
  totalRounds: number,
  roundNumber: number,
): { steps: { label: string }[]; currentStep: number } | null
```

### Validation rules

| Condition | Behaviour |
|---|---|
| `totalRounds < 1` | return `null` — stepper must not render |
| `roundNumber < 1` | clamp to `1` before computing `currentStep` |
| valid inputs | `currentStep = roundNumber - 1`; `steps = Array.from({ length: totalRounds }, (_, i) => ({ label: String(i + 1) }))` |

---

## JSX placement

```tsx
{/* Existing heading */}
<h1 className="page-title">Run Event — Round {roundData.roundNumber}</h1>

{/* NEW: round-progress stepper — only rendered when getRoundStepperProps returns non-null */}
{roundStepperProps && (
  <Stepper
    steps={roundStepperProps.steps}
    currentStep={roundStepperProps.currentStep}
    direction={1}
  >
    <></>
  </Stepper>
)}
```

`roundStepperProps` is derived via `getRoundStepperProps(eventData.totalRounds, roundData.roundNumber)` and should be computed at render time (not stored in state — it is purely derived from already-fetched API data).

---

## Read-only constraint

The `<Stepper>` MUST NOT receive an `onStepClick` prop. This enforces the read-only requirement (FR-006): clicking any step indicator does nothing.

---

## Render guard

The stepper block MUST be wrapped in a conditional such that it only renders when:
- `eventData` is loaded (not null/undefined)
- `roundData` is loaded (not null/undefined)
- `getRoundStepperProps(...)` returns a non-null value

---

## Existing exports (unchanged)

All existing named exports from `RunEvent.tsx` remain identical:
- `RUN_PAGE_ACTIONS` — unchanged
- `canAdvanceRound` — unchanged
- Any other existing exports — unchanged

`getRoundStepperProps` is a **new addition** only.

---

## Test contract

**New test file**: `frontend/tests/run-event-round-stepper.test.tsx`

Tests MUST cover `getRoundStepperProps` as a pure function — no DOM rendering.

```ts
// Required test cases:
getRoundStepperProps(4, 1)
  // → { steps: [{label:"1"},{label:"2"},{label:"3"},{label:"4"}], currentStep: 0 }

getRoundStepperProps(4, 3)
  // → { steps: [...4 items], currentStep: 2 }

getRoundStepperProps(1, 1)
  // → { steps: [{label:"1"}], currentStep: 0 }

getRoundStepperProps(0, 1)
  // → null

getRoundStepperProps(-1, 1)
  // → null

getRoundStepperProps(4, 0)
  // → { steps: [...4 items], currentStep: 0 }  (roundNumber clamped to 1)
```

---

## Acceptance criteria (from spec FR-004..008)

| FR | Criterion | Verified by |
|---|---|---|
| FR-004 | Stepper renders immediately below the heading when `totalRounds >= 1` | Manual / unit |
| FR-005 | Past rounds complete, current active, future inactive | Stepper component handles this via `currentStep` |
| FR-006 | No `onStepClick` prop → read-only | Code review |
| FR-007 | Stepper absent when `totalRounds = 0` | `getRoundStepperProps` unit test |
| FR-008 | Reuses existing `Stepper` component | Code review |
