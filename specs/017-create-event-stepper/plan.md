# Implementation Plan: 3-Step Create Event Stepper

**Branch**: `017-create-event-stepper` | **Date**: 2026-03-03 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/017-create-event-stepper/spec.md`

---

## Summary

Replace the single-page Create Event layout with an animated 3-step stepper
(Setup → Roster → Confirm) that persists progress after each step via the
existing `createEvent` / `updateEvent` API calls. The stepper uses the
`motion` library for slide transitions and is extracted as a standalone
reusable component. Step entry is driven by the event's `lifecycleStatus`
field so the flow resumes at the correct step when editing an in-progress
slot.

---

## Technical Context

**Language/Version**: TypeScript 5.9, React 18.3  
**Primary Dependencies**: React Router DOM 6, Vite 5, Vitest 2, `motion` (new, to be `npm install`ed)  
**Storage**: Backend DuckDB via existing REST API (`createEvent`, `updateEvent`); `localStorage` draft for player list  
**Testing**: Vitest 2 + `@testing-library/react` (pattern established across all existing frontend tests)  
**Target Platform**: Web browser (desktop-first, responsive down to 680 px)  
**Project Type**: Web application — frontend React SPA backed by a FastAPI service  
**Performance Goals**: Step transition animation at ≥ 60 fps; no layout reflow between step panels  
**Constraints**: Respect `prefers-reduced-motion` (motion.css already disables all animations); no new backend endpoints  
**Scale/Scope**: Single page replacement — `CreateEvent.tsx` + new `Stepper` component + CSS additions  

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution file (`specs/constitution.md`) is a blank template — no
project-specific principles or gate criteria are defined. No violations to
evaluate. Gate passes by default.

---

## Project Structure

### Documentation (this feature)

```text
specs/017-create-event-stepper/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── stepper-component.md
│   ├── create-event-stepper-page.md
│   └── step-content-panels.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── components/
│   │   └── stepper/
│   │       ├── Stepper.tsx          # standalone reusable stepper shell + indicator bar
│   │       └── stepper.css          # stepper-specific styles (step indicator states)
│   ├── features/
│   │   └── create-event/
│   │       ├── draftPlayers.ts      # unchanged (localStorage draft)
│   │       ├── playerMessages.ts    # unchanged
│   │       ├── playerSearch.ts      # unchanged
│   │       └── validation.ts        # unchanged (reused by step content)
│   └── pages/
│       └── CreateEvent.tsx          # refactored: renders stepper + 3 step panels
└── tests/
    ├── create-event-stepper-step1.test.tsx   # new: Step 1 form & slot-save behaviour
    ├── create-event-stepper-step2.test.tsx   # new: Step 2 roster & ready promotion
    ├── create-event-stepper-step3.test.tsx   # new: Step 3 summary & start button state
    ├── create-event-stepper-resume.test.tsx  # new: lifecycle-status resume logic
    └── stepper-component.test.tsx            # new: generic Stepper component unit tests
    # all existing tests continue to pass unchanged
```

**Structure Decision**: Web application option (frontend-only feature). No
backend source changes. The standalone `Stepper` component lives under
`src/components/stepper/` — consistent with existing component directories
(`components/courts/`, `components/mode/`, `components/players/`). Step
panel logic stays in `pages/CreateEvent.tsx` because the step content is
tightly bound to the Create Event domain.

---

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations. This section is intentionally blank.
