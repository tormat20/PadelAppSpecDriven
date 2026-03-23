# Implementation Plan: Calendar Reliability, Naming, and Day-Court Workflow

**Branch**: `038-calendar-staged-save` | **Date**: 2026-03-23 | **Spec**: `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/specs/038-calendar-staged-save/spec.md`
**Input**: Feature specification from `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/specs/038-calendar-staged-save/spec.md`

## Summary

Deliver a staged-save calendar workflow where move/resize/template-create/modal-edit operations update local state immediately and only persist on explicit save. Extend the flow with stricter event-card content rules (no in-card duration dropdown), event naming format (`<Weekday> <TimeCategory> <EventTypeLabel>` with no `(New)` suffix), event-type edge hover styling (without interactive-surface glare on event cards), explicit `Redo Changes` reset to last saved state, and clickable weekday headers that open a day-court lane view with linked multi-court highlighting and dotted all-lane rendering for unspecified-court events.

## Technical Context

**Language/Version**: Python 3.12 (backend), TypeScript 5.x + React 18.3 (frontend)  
**Primary Dependencies**: FastAPI, Pydantic, DuckDB repositories, React Router DOM 6, Vite 5, Vitest 2  
**Storage**: Existing DuckDB event/round/match/player persistence + frontend staged local calendar state  
**Testing**: `pytest` (backend), `vitest` and `tsc --noEmit` (frontend)  
**Target Platform**: Web application (admin scheduling flows in browser)
**Project Type**: Web application (`backend/` + `frontend/`)  
**Performance Goals**: Calendar interactions remain immediate during edit sessions; persistence happens in explicit save transaction  
**Constraints**: All-or-nothing save semantics for staged changes, no route/menu/guard regressions, Team Mexicano semantics unchanged  
**Scale/Scope**: Admin-facing scheduling and event management workflows across weekly calendar, day-court lane view, and account settings

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Constitution file at `.specify/memory/constitution.md` is a placeholder template with no enforceable project principles.
- Gate result: **PASS** (no explicit constitutional constraints to violate).
- Operational quality gates applied from repository standards:
  - Frontend type/lint and tests must pass.
  - Backend contract tests for affected endpoints must pass.
  - No destructive workflow regressions for admin route guards or staged save behavior.

### Post-Design Constitution Re-check

- Research, data model, contracts, and quickstart are present and align with the spec scope.
- No constitutional violations introduced.
- Re-check result: **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/038-calendar-staged-save/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── account-event-management.md
│   ├── calendar-edit-modal.md
│   └── staged-calendar-save.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/
│   │   ├── routers/
│   │   └── schemas/
│   ├── repositories/
│   └── services/
└── tests/
    └── contract/

frontend/
├── src/
│   ├── components/
│   │   └── calendar/
│   ├── lib/
│   ├── pages/
│   └── styles/
└── tests/
```

**Structure Decision**: Keep the existing two-tier web app structure. Implement backend save/delete capabilities under `backend/app/{api,repositories,services}` and frontend staged-calendar behavior under `frontend/src/{components/calendar,pages,lib,styles}` with regression coverage in `frontend/tests` and backend contract coverage in `backend/tests/contract`.

## Phase 0 Output

- Research completed in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/specs/038-calendar-staged-save/research.md`.
- All prior technical unknowns resolved through decisions with rationale and alternatives.

## Phase 1 Output

- Data model completed in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/specs/038-calendar-staged-save/data-model.md`.
- Contracts completed in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/specs/038-calendar-staged-save/contracts/`.
- Quickstart completed in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/specs/038-calendar-staged-save/quickstart.md`.

## Complexity Tracking

No constitution-driven complexity exemptions required for this feature.
