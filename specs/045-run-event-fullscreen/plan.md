# Implementation Plan: Run Event Fullscreen Mode

**Branch**: `045-run-event-fullscreen` | **Date**: 2026-03-31 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/045-run-event-fullscreen/spec.md`

## Summary

Add a CSS-based fullscreen toggle to the Run Event page. When activated, a fixed-position overlay covers the navigation bar and fills the viewport with the court grid and Prev/Next action buttons. All court card elements (player names, score badges, streak icons, card height) are scaled up via overlay-scoped CSS overrides to maximise readability from a distance. The toggle is a button in the court grid's round header. Escape exits fullscreen. The result entry modal continues to work on top of the overlay. No backend changes are required.

**Prerequisite**: Branch 043 (run-event-ui-polish) must be merged first. It introduces `run-grid__round-header`, the element that hosts the fullscreen toggle button.

## Technical Context

**Language/Version**: TypeScript 5.x + React 18.3  
**Primary Dependencies**: React hooks (`useState`, `useEffect`, `useRef`), plain CSS with existing design tokens  
**Storage**: N/A — fullscreen state is in-memory, resets on navigation  
**Testing**: Vitest 2 + React Testing Library (existing test suite in `frontend/tests/`)  
**Target Platform**: Desktop browser (large-screen primary use case)  
**Project Type**: Web application — frontend only, no backend changes  
**Performance Goals**: Enter/exit fullscreen in under 1 second with no layout flash  
**Constraints**: No browser Fullscreen API; no new SVG icons; no external libraries; CSS-only overlay  
**Scale/Scope**: Single page (`RunEvent.tsx`), two CSS sections, no new components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution file (`/.specify/memory/constitution.md`) contains only the template placeholder — no project-specific principles have been filled in. No constitution gates apply.

**Post-design re-check**: All changes are contained to one page file and one CSS file. No architectural patterns are introduced or violated. The overlay approach is additive (does not remove or alter existing rendering paths). Gate: PASS.

## Project Structure

### Documentation (this feature)

```text
specs/045-run-event-fullscreen/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output (UI state model)
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── ui-fullscreen.md ← Phase 1 output (UI behaviour contract)
└── tasks.md             ← Phase 2 output (/speckit.tasks — not created here)
```

### Source Code (files to modify)

```text
frontend/
├── src/
│   ├── pages/
│   │   └── RunEvent.tsx           ← add isFullscreen state, toggle button, overlay wrapper, useEffect
│   └── styles/
│       └── components.css         ← add .run-fullscreen-overlay + scoped overrides
└── tests/
    └── run-event-fullscreen.test.tsx  ← new test file
```

**Structure Decision**: Web application (frontend only). All changes are in `frontend/src/pages/RunEvent.tsx` and `frontend/src/styles/components.css`. One new test file is added to `frontend/tests/`. No backend files are touched.

## Complexity Tracking

No constitution violations. No complexity justification required.
