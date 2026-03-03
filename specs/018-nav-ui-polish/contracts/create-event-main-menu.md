# Contract: Create Event — Main Menu button placement

**Feature**: 018-nav-ui-polish | **User Story**: US1 (P1)
**File affected**: `frontend/src/pages/CreateEvent.tsx`

---

## Change summary

Remove the "Main Menu" `<button>` from the `<header className="page-header panel">` block.
Add a secondary "Main Menu" `<button>` to the action row of every step panel.

---

## Header — before / after

### Before (remove this button from the header)

```tsx
<header className="page-header panel">
  <h1 className="page-title">Create Event</h1>
  <button
    aria-label="Main menu"
    className={withInteractiveSurface("button-secondary")}
    onClick={() => navigate("/")}
  >
    Main Menu
  </button>
</header>
```

### After (header contains only the title)

```tsx
<header className="page-header panel">
  <h1 className="page-title">Create Event</h1>
</header>
```

---

## Action-row additions — all three steps

Each step panel already has an action row div. The "Main Menu" button is added as a **secondary** button alongside the existing primary/navigation buttons.

### Step 0 — Setup panel action row

```tsx
<div className="action-row">
  <button
    aria-label="Main menu"
    className={withInteractiveSurface("button-secondary")}
    onClick={() => navigate("/")}
  >
    Main Menu
  </button>
  <button /* existing Next button */ ... />
</div>
```

### Step 1 — Roster panel action row

```tsx
<div className="action-row">
  <button
    aria-label="Main menu"
    className={withInteractiveSurface("button-secondary")}
    onClick={() => navigate("/")}
  >
    Main Menu
  </button>
  <button /* existing Previous button */ ... />
  <button /* existing Next button */ ... />
</div>
```

### Step 2 — Confirm panel action row

```tsx
<div className="action-row">
  <button
    aria-label="Main menu"
    className={withInteractiveSurface("button-secondary")}
    onClick={() => navigate("/")}
  >
    Main Menu
  </button>
  <button /* existing Previous button */ ... />
  <button /* existing Start Event button */ ... />
</div>
```

---

## Exported pure functions (unchanged)

No new or changed exports. All existing exports from `CreateEvent.tsx` remain identical.

---

## Test contract

**New test file**: `frontend/tests/create-event-main-menu.test.tsx`

The test file must export zero DOM-rendering tests. It validates any pure-function helpers added (none currently planned for US1 — the change is purely JSX). If no pure functions are added, the test file is omitted.

> Note: The existing `create-event-stepper-step*.test.tsx` tests do not assert on the header button. They will continue to pass with zero changes.

---

## Acceptance criteria (from spec FR-001..003)

| FR | Criterion | Verified by |
|---|---|---|
| FR-001 | No "Main Menu" button in the page header | Manual inspection / snapshot |
| FR-002 | "Main Menu" button present in step action row for steps 0, 1, and 2 | Manual inspection |
| FR-003 | Clicking "Main Menu" navigates to `/` | Manual click test |
