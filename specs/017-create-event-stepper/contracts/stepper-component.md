# Contract: Stepper Component

**File**: `src/components/stepper/Stepper.tsx`  
**Feature**: `017-create-event-stepper`  
**Date**: 2026-03-03

---

## Purpose

A standalone, reusable animated stepper shell. Renders a step indicator bar
(numbered circles + labels, three visual states) and wraps step content in a
slide-animated panel. Has no knowledge of Create Event domain logic — it only
knows about steps as indices and labels.

---

## Props Interface

```ts
export type StepDefinition = {
  /** Short label displayed below/beside the step circle, e.g. "Setup" */
  label: string
}

export type StepperProps = {
  /**
   * Ordered list of step definitions. Length determines total step count.
   * Example: [{ label: "Setup" }, { label: "Roster" }, { label: "Confirm" }]
   */
  steps: StepDefinition[]

  /**
   * Zero-indexed current step. Must be in range [0, steps.length - 1].
   */
  currentStep: number

  /**
   * Slide direction for the transition animation.
   *   1 = forward (new content enters from right, old exits to left)
   *  -1 = backward (new content enters from left, old exits to right)
   */
  direction: number

  /**
   * Called when the user clicks a completed step indicator.
   * Only fires for steps with index < currentStep.
   * The parent is responsible for updating currentStep and direction.
   */
  onStepClick?: (stepIndex: number) => void

  /**
   * The content for the currently active step.
   * The parent renders the correct panel based on currentStep and passes it here.
   */
  children: React.ReactNode
}
```

---

## Visual States for Step Indicators

Each step indicator circle renders in one of three states based on the
relationship between its index (`i`) and `currentStep`:

| Condition | State label | Circle appearance | Label color | Clickable? |
|-----------|-------------|------------------|-------------|------------|
| `i < currentStep` | `"complete"` | Filled (accent gradient) with checkmark icon | Strong ink | Yes — calls `onStepClick(i)` |
| `i === currentStep` | `"active"` | Outlined with accent border + center dot | Strong ink, bold | No |
| `i > currentStep` | `"inactive"` | Muted border, shows step number | Muted ink | No |

---

## Animation Contract

The component uses `AnimatePresence` with `mode="wait"` and `motion.div`
with directional slide variants. The exact behavior:

- When `currentStep` changes, the outgoing panel slides out and the incoming
  panel slides in from the opposite direction.
- `direction > 0`: incoming panel enters from the right; outgoing exits to the left.
- `direction < 0`: incoming panel enters from the left; outgoing exits to the right.
- Duration: `0.4s`, easing: `easeInOut`.
- When `prefers-reduced-motion: reduce` is active (handled by global `motion.css`),
  all transitions are suppressed (`transition-duration: 0ms`).

---

## Accessibility Contract

- The step indicator bar has `role="list"` with each step as `role="listitem"`.
- Each step circle button has `aria-label` that includes the step number, label,
  and state: e.g. `"Step 1: Setup – complete"`, `"Step 2: Roster – active"`.
- Clickable completed step buttons are focusable `<button>` elements.
- Inactive/active steps are rendered as non-interactive `<span>` elements (not buttons).
- The animated content region has `aria-live="polite"` so screen readers announce
  step changes without being disruptive.

---

## CSS Classes (in `stepper.css`)

```
.stepper                    — root container
.stepper-header             — indicator bar row
.stepper-steps              — flex row of step items
.stepper-step               — individual step item (circle + label, stacked)
.stepper-connector          — horizontal line between steps
.stepper-circle             — the numbered/checkmark circle
.stepper-circle[data-state="inactive"]
.stepper-circle[data-state="active"]
.stepper-circle[data-state="complete"]
.stepper-label              — text label below/beside circle
.stepper-label[data-state="inactive"]
.stepper-label[data-state="active"]
.stepper-label[data-state="complete"]
.stepper-content            — clipping wrapper for animated panels
.stepper-panel              — the motion.div wrapping step content
```

---

## Example Usage (informational)

```tsx
<Stepper
  steps={[{ label: "Setup" }, { label: "Roster" }, { label: "Confirm" }]}
  currentStep={currentStep}
  direction={direction}
  onStepClick={(i) => { setDirection(-1); setCurrentStep(i) }}
>
  {currentStep === 0 && <SetupStepContent ... />}
  {currentStep === 1 && <RosterStepContent ... />}
  {currentStep === 2 && <ConfirmStepContent ... />}
</Stepper>
```

---

## What the Component Does NOT Do

- Does not maintain its own `currentStep` or `direction` state — it is fully controlled.
- Does not call any API.
- Does not render navigation buttons (Next / Previous / Start Event) — those are rendered
  by each step's content panel inside `children`.
- Does not know about event lifecycle status.
