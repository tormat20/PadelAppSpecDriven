# Contract: Frontend — ConfirmDialog Component & CSS

**Feature**: 033-player-management-reset | **Priority**: P1–P4 (used by all user stories)
**Files affected**:
- `frontend/src/components/ConfirmDialog.tsx` — NEW
- `frontend/src/styles/components.css` — MODIFIED (new CSS classes)

---

## `ConfirmDialog` component

**File**: `frontend/src/components/ConfirmDialog.tsx`

### Props

```ts
type ConfirmDialogProps = {
  title: string
  message: string
  confirmLabel: string
  cancelLabel?: string          // default: "Cancel"
  variant?: "default" | "danger" // default: "default"
  isLoading?: boolean            // default: false
  onConfirm: () => void
  onCancel: () => void
}
```

### Rendered structure

```
.result-modal-backdrop          ← existing backdrop class; blocks page interaction
  .result-modal.confirm-dialog  ← existing modal panel + new confirm-dialog modifier
    h2.confirm-dialog__title    ← title prop
    p.confirm-dialog__message   ← message prop
    div.confirm-dialog__actions
      button.button-secondary   ← cancelLabel; calls onCancel()
      button.button / .button--danger  ← confirmLabel; variant controls class
```

The backdrop uses `onClick={onCancel}` so clicking outside dismisses. The inner panel uses `e.stopPropagation()` to prevent backdrop click from firing when clicking inside.

### Loading state

When `isLoading === true`:
- Confirm button gets `disabled` attribute
- Confirm button text becomes `confirmLabel + "…"` (e.g. "Yes, reset…")
- Cancel button is also disabled (prevents double-action during in-flight request)

### Full component

```tsx
import { withInteractiveSurface } from "../features/interaction/surfaceClass"

type ConfirmDialogProps = {
  title: string
  message: string
  confirmLabel: string
  cancelLabel?: string
  variant?: "default" | "danger"
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  variant = "default",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmClass = variant === "danger"
    ? withInteractiveSurface("button--danger")
    : withInteractiveSurface("button")

  return (
    <div
      className="result-modal-backdrop"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className="result-modal confirm-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="confirm-dialog__title">{title}</h2>
        <p className="confirm-dialog__message">{message}</p>
        <div className="confirm-dialog__actions">
          <button
            type="button"
            className={withInteractiveSurface("button-secondary")}
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={confirmClass}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? `${confirmLabel}…` : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## CSS additions

**File**: `frontend/src/styles/components.css`

Append to the end of the file (or near the `.button` block):

```css
/* ─── Danger button ──────────────────────────────────────────── */

.button--danger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.25;
  cursor: pointer;
  border: 1px solid var(--color-danger);
  background: var(--color-danger);
  color: #fff;
  transition: opacity 0.15s ease, transform 0.1s ease;
}

.button--danger:hover:not(:disabled) {
  opacity: 0.88;
}

.button--danger:active:not(:disabled) {
  transform: scale(0.97);
}

.button--danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ─── ConfirmDialog panel ────────────────────────────────────── */

.confirm-dialog {
  max-width: 400px;
  padding: var(--space-5);
  text-align: left;
}

.confirm-dialog__title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-ink-strong);
  margin: 0 0 var(--space-2);
}

.confirm-dialog__message {
  font-size: 0.9rem;
  color: var(--color-ink-muted);
  margin: 0 0 var(--space-4);
  line-height: 1.5;
}

.confirm-dialog__actions {
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
}
```

---

## Accessibility requirements

- Dialog panel has `role="dialog"` and `aria-modal="true"`.
- `aria-labelledby` on the backdrop points to the `<h2>` title element.
- Focus is not explicitly managed in this initial implementation (no focus trap). This is acceptable for V1 given the small team scope.
- Backdrop click calls `onCancel` to allow keyboard-only users to dismiss via Escape (the Escape key is not wired — backdrop click is the dismiss mechanism).

---

## Unit test — `ConfirmDialog`

The component renders DOM so it cannot be tested in the pure-Node Vitest setup. No unit test file is created for it. Manual testing covers the acceptance scenarios in the spec.

The `filterPlayers` helper function exported from `SearchPlayer.tsx` **can** be unit tested (pure function, no DOM):

**Test file**: `frontend/tests/player-search-filter.test.ts`

```ts
import { describe, it, expect } from "vitest"
import { filterPlayers } from "../src/pages/SearchPlayer"
import type { PlayerApiRecord } from "../src/lib/api"

const players: PlayerApiRecord[] = [
  { id: "1", displayName: "Anna Berg", email: "anna@example.com" },
  { id: "2", displayName: "Carlos Font", email: "carlos@example.com" },
  { id: "3", displayName: "Maria Soto", email: null },
]

describe("filterPlayers", () => {
  it("returns all players when query is empty", () => {
    expect(filterPlayers(players, "")).toHaveLength(3)
  })

  it("filters by displayName (case-insensitive)", () => {
    expect(filterPlayers(players, "anna")).toEqual([players[0]])
  })

  it("filters by email", () => {
    expect(filterPlayers(players, "carlos@")).toEqual([players[1]])
  })

  it("returns empty array when no match", () => {
    expect(filterPlayers(players, "zzznomatch")).toHaveLength(0)
  })

  it("handles player with null email without crashing", () => {
    expect(filterPlayers(players, "soto")).toEqual([players[2]])
  })

  it("trims whitespace from query", () => {
    expect(filterPlayers(players, "  anna  ")).toEqual([players[0]])
  })
})
```
