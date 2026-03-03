# Research: 3-Step Create Event Stepper

**Feature**: `017-create-event-stepper`  
**Branch**: `017-create-event-stepper`  
**Date**: 2026-03-03

---

## Unknowns to Resolve

1. How does the `motion` library integrate with React 18 and Vite 5?
2. What is the exact animation pattern for step slide transitions?
3. How do we persist step state across page re-renders without a new localStorage key?
4. How does the CSS design system slot the stepper styling in?
5. What does the user-provided ReactBits Stepper component look like, and how literally must we follow it?
6. What existing tests touch `CreateEvent.tsx`, and what will break when we refactor it?

---

## 1. `motion` Library — Integration with React 18 + Vite 5

**Finding**: The `motion` package (formerly Framer Motion, rebranded to `motion` at v11+) is a
first-class React animation library. It exports a `motion` namespace with animated HTML/SVG
element factories (`motion.div`, etc.) and an `AnimatePresence` component that handles enter/exit
animations for conditionally-rendered children.

**Integration pattern** (already in the codebase's user-provided Stepper snippet):
```tsx
import { motion, AnimatePresence } from "motion/react"
```
This is the package entry-point for the React bindings. It requires:
```
npm install motion
```
No Vite plugin needed — motion ships ESM and is tree-shakable out of the box.

**`prefers-reduced-motion`**: The existing `motion.css` already disables all transitions
and animations globally when `prefers-reduced-motion: reduce` is set. The `motion` library
also respects the OS setting natively via its `useReducedMotion()` hook (optional guard).
We can rely solely on the existing CSS rule since it applies `transition-duration: 0ms` globally.

**Version to install**: `motion` latest stable (`^12.x` or whatever npm resolves — no pinning
needed since this is a new dependency).

---

## 2. Slide Transition Pattern

**Finding**: The user provided the exact ReactBits Stepper component source verbatim. The
key animation pattern is:

```tsx
// direction: 1 = forward, -1 = backward
<AnimatePresence mode="wait" custom={direction}>
  <motion.div
    key={currentStep}
    custom={direction}
    variants={{
      enter: (dir) => ({ x: dir > 0 ? 500 : -500, opacity: 0 }),
      center: { x: 0, opacity: 1 },
      exit:  (dir) => ({ x: dir > 0 ? -500 : 500, opacity: 0 }),
    }}
    initial="enter"
    animate="center"
    exit="exit"
    transition={{ duration: 0.4, ease: "easeInOut" }}
  >
    {/* step content */}
  </motion.div>
</AnimatePresence>
```

- `mode="wait"` ensures exit completes before enter begins — no layout jank.
- The `key` on the `motion.div` is the step index, which forces remount on step change.
- A `direction` piece of state (`1` or `-1`) drives whether content slides left or right.

**Constraint**: We follow this pattern exactly from the provided component. The only
change permitted is using CSS custom properties for colors instead of hardcoded hex values.

---

## 3. Step State Persistence

**Finding**: Step state does not need a new persistence mechanism.
- The server-side `lifecycleStatus` on `EventRecord` is the canonical source of truth for
  which step to open at (`planned` → Step 2, `ready` → Step 3, `null`/`undefined` → Step 1).
- Draft players already persist in `localStorage` under `create-event:active-draft:players`
  via `draftPlayers.ts` — this is unchanged and covers the Roster step.
- There is **no need** to persist which stepper step the user is on to `localStorage`. The
  step is always derived from the event's lifecycle status when resuming. If the user is mid-step
  (e.g., filling in Step 1 but hasn't pressed Next yet), navigating away loses only the unsaved
  form input — which is the same behavior as the current page.

**Decision**: No new localStorage key for step index. Step is determined by:
1. New event (no `editEventId`) → Step 1
2. Event with `lifecycleStatus === "planned"` → Step 2
3. Event with `lifecycleStatus === "ready"` → Step 3

---

## 4. CSS Design System Integration

**Finding**: All styles are plain CSS in `src/styles/`. There is no CSS modules, no
Tailwind, no scoped styling. New component CSS files follow the pattern established by
inspecting `components.css` and `motion.css`:

- Global class names, no BEM or scoping
- Design tokens via CSS custom properties (`var(--color-accent)`, `var(--space-3)`, etc.)
- Animation keyframes declared in the component's CSS file

**Plan for Stepper CSS** (`src/components/stepper/stepper.css`):
- Stepper indicator bar: `.stepper-header`, `.stepper-steps`, `.stepper-step`
- Step states: `[data-state="inactive"]`, `[data-state="active"]`, `[data-state="complete"]`
- Step circle: `.stepper-circle` — uses `var(--color-accent)` for active/complete fill
- Step label: `.stepper-label` — uses `var(--color-ink-muted)` for inactive, `var(--color-ink-strong)` for active
- Content panel wrapper: `.stepper-content` — `overflow: hidden` to clip sliding panels
- Import the CSS file in the component (`import "./stepper.css"`) — Vite handles it

**Accent color**: The design system token is `var(--color-accent)` (`#0c8a8f` teal). This
replaces any hardcoded `#5227FF` from the ReactBits reference. Active gradient: `linear-gradient(120deg, var(--color-accent), #2d5fba)` (matches `.button` gradient in `components.css`).

---

## 5. ReactBits Stepper Component — Fidelity

**Finding**: The user provided the Stepper component source verbatim and stated "Use the
ReactBits Stepper component pattern with the motion library." This means:
- The component structure (indicator bar with circles, labels, animated content panel) is
  mandated.
- The `motion` + `AnimatePresence` slide pattern is mandated.
- **Colors must use the app's design tokens**, not the ReactBits defaults.
- **Labels must be passed as props** so the component is generic.
- The component must be **extracted as standalone** (`Stepper.tsx`) — the Create Event page
  uses it but does not define it.

**What the Stepper component accepts** (designed from the spec):
```tsx
type StepperProps = {
  steps: { label: string }[]
  currentStep: number                    // 0-indexed
  onStepClick?: (index: number) => void  // only fires for completed steps
  children: React.ReactNode              // the active step content
  direction: number                      // 1 = forward, -1 = backward
}
```

The step content panels are rendered by the parent (Create Event page) and passed as
`children` — keeping the Stepper component presentation-only.

---

## 6. Existing Tests Impacting `CreateEvent.tsx`

**Finding** — tests that directly test `CreateEvent.tsx` or import from it:

| Test file | What it tests | Impact from refactor |
|-----------|---------------|----------------------|
| `create-event-page.test.tsx` | All fields + save buttons render | Buttons will change (Next vs Create Event) — test needs updating |
| `create-event-draft-persistence.test.tsx` | Draft players persist to localStorage | Roster step is Step 2 — persistence logic unchanged but test render setup may change |
| `create-event-planned-slots.test.tsx` | "Create Event Slot" button exists | Slot creation moves to Step 1 Next action — test needs updating |
| `create-event-dual-actions.test.tsx` | Two buttons (Create Event / Create Event Slot) | Dual-button layout goes away — test must be replaced with stepper flow |
| `create-event-datetime.test.tsx` | Date/time input validation | Setup step still has these inputs — should pass with minor aria/label adjustments |
| `planned-event-setup-flow.test.tsx` | Slot creation → Preview navigation | Flow now goes Step 1 Next → Step 2 (not directly to preview) — test needs updating |
| `preview-edit-event-flow.test.tsx` | Edit Event opens pre-filled form | Pre-fill still works in Step 1, but step 2/3 may need separate assertions |

**Decision**: These tests will be updated in Phase 2 (tasks) alongside the implementation.
This research documents the expected breakage so the task list is accurate.

---

## Resolved Decisions

| Question | Decision |
|----------|----------|
| Which `motion` import? | `import { motion, AnimatePresence } from "motion/react"` |
| How to drive slide direction? | A `direction` state (`1` or `-1`) toggled on Next/Previous press |
| Where does step content live? | Inline in `CreateEvent.tsx` — passed as children to `Stepper` |
| Stepper component location | `src/components/stepper/Stepper.tsx` |
| Stepper CSS location | `src/components/stepper/stepper.css` |
| Colors | `var(--color-accent)` / `var(--color-accent-strong)` / design tokens only |
| Step resume logic | Derived from `event.lifecycleStatus` — no new localStorage key |
| Existing test breakage | 6 test files need updating; documented above |
| Backend changes needed | None |
