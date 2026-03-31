# Implementation Plan: Run Event UI Polish

**Branch**: `043-run-event-ui-polish` | **Date**: 2026-03-31 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/043-run-event-ui-polish/spec.md`

## Summary

Three targeted UI polish changes: (1) Collapse the Run Event page's redundant header panel into the court grid panel by introducing a `run-grid__round-header` wrapper div. (2) Replace the time-of-day moment label on calendar event blocks with a lifecycle status label ("Planned" / "Ongoing" / "Finished"). (3) Fix the player stats court chart to always display a Y-axis spanning courts 1–7 at a larger size.

**Prerequisite for**: Branch 045 (`run-event-fullscreen`) depends on `run-grid__round-header` being present in `RunEvent.tsx` before it can add the fullscreen toggle button.

## Technical Context

**Language/Version**: TypeScript 5.x + React 18.3  
**Primary Dependencies**: React hooks (existing, no new hooks needed), plain CSS with existing design tokens  
**Storage**: N/A — all changes are purely presentational/structural  
**Testing**: Vitest 2 + React Testing Library (existing test suite in `frontend/tests/`)  
**Target Platform**: Desktop browser (primary use case for Run Event), all screens for calendar  
**Performance Goals**: No performance impact — changes are structural/cosmetic  
**Constraints**: No new SVG icons; no external libraries; no backend changes; `formatEventMomentLabel` must remain exported  
**Scale/Scope**: Three files touched (`RunEvent.tsx`, `EventBlock.tsx`, `PlayerStats.tsx`), one CSS file (`components.css`)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution file (`/.specify/memory/constitution.md`) contains only the template placeholder — no project-specific principles have been filled in. No constitution gates apply.

**Post-design re-check**:

| Rule (from AGENTS.md) | Status | Notes |
|---|---|---|
| Use TypeScript; avoid `any` | PASS | No new `any` introduced |
| Prefer explicit domain types | PASS | `event.status` is typed `"Lobby" \| "Running" \| "Finished"` |
| Use functional components and hooks | PASS | All three changes are within existing functional components |
| Immutable updates | PASS | No state mutations; changes are rendering-only |
| CSS: reuse design tokens | PASS | New `.run-grid__round-header` uses `var(--space-2)` |
| CSS: extend existing class patterns (BEM) | PASS | `run-grid__round-header` follows BEM child convention |
| No inline styles for non-dynamic values | PASS | New wrapper uses CSS class, not inline style |
| `formatEventMomentLabel` export preserved | PASS | Function untouched; only call site reassigned to `statusLabel` |
| No destructive git commands | PASS | N/A for implementation |

**Gate: PASS**

## Project Structure

### Documentation (this feature)

```text
specs/043-run-event-ui-polish/
├── spec.md                    ← requirements spec (input)
├── research.md                ← Phase 0 output
├── plan.md                    ← this file
├── data-model.md              ← Phase 1 output (component/state/style model)
├── quickstart.md              ← Phase 1 output (implementation guide)
├── contracts/
│   └── ui-polish.md           ← Phase 1 output (rendering contracts)
├── checklists/
│   └── requirements.md        ← input checklist
└── tasks.md                   ← Phase 2 output (/speckit.tasks — not created here)
```

### Source Code (files to modify)

```text
frontend/
├── src/
│   ├── pages/
│   │   ├── RunEvent.tsx           ← Change A-1: remove header element, add run-grid__round-header wrapper
│   │   └── PlayerStats.tsx        ← Change A-3: fix COURT_W/COURT_H constants, fix maxCourtInt floor
│   ├── components/
│   │   └── calendar/
│   │       └── EventBlock.tsx     ← Change A-2: replace scheduleMoment with statusLabel
│   └── styles/
│       └── components.css         ← Change A-1: add .run-grid__round-header CSS rule
```

**No backend files are touched. No new test files are required** (changes are structural/visual; the `formatEventMomentLabel` unit tests continue to pass unchanged because the export is preserved).

**Why each file**:

- `RunEvent.tsx`: Remove `<header className="page-header panel">` (lines 351–363), add `<div className="run-grid__round-header">` inside the existing `<section className="panel run-grid">` (line 365).
- `EventBlock.tsx`: Replace `const scheduleMoment = formatEventMomentLabel(...)` with `const statusLabel = getEventStatusLabel(event.status)` and update the JSX render at line 134.
- `PlayerStats.tsx`: Change `COURT_W`/`COURT_H` constants (lines 264–265) and `maxCourtInt` assignment (line 279).
- `components.css`: Add `.run-grid__round-header` rule after the `.run-grid` block (~line 614).

## Complexity Tracking

No constitution violations. No complexity justification required.
