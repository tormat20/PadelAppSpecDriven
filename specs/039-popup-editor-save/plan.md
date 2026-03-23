# Implementation Plan: Calendar Popup Editor with Immediate Save

**Branch**: `039-popup-editor-save` | **Date**: 2026-03-23 | **Spec**: `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/specs/039-popup-editor-save/spec.md`
**Input**: Feature specification from `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/specs/039-popup-editor-save/spec.md`

## Summary

Replace the current calendar edit drawer with a centered popup modal that reuses create-event style editing flow and persists on popup Save immediately. Keep drag/resize staged workflows where applicable, and add reconciliation so popup-persisted changes become source-of-truth and cannot be undone by Redo Changes.

## Technical Context

**Language/Version**: Python 3.12 (backend), TypeScript 5.x + React 18.3 (frontend)  
**Primary Dependencies**: FastAPI, Pydantic, DuckDB repositories, React Router DOM 6, Vite 5, Vitest 2  
**Storage**: Existing DuckDB event/round/match/player persistence + frontend staged local calendar change state  
**Testing**: `pytest` (backend), `vitest` and `tsc --noEmit` (frontend)  
**Target Platform**: Web application (desktop/laptop first, mobile supported)
**Project Type**: Web application (`backend/` + `frontend/`)  
**Performance Goals**: Popup open/close and edit interactions feel immediate; popup save reflects persisted data without disruptive reload lag  
**Constraints**: Hybrid persistence model (popup immediate save + staged quick edits), reconciliation required, no admin guard or navigation regressions  
**Scale/Scope**: Calendar event editing UX and persistence behavior in weekly/day-court scheduling contexts

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Constitution file at `.specify/memory/constitution.md` is a placeholder template and defines no enforceable principles.
- Gate result: **PASS** (no constitutional constraints currently defined).
- Quality gates enforced by project conventions:
  - Frontend: `npm run lint` and targeted/full Vitest coverage for changed flows.
  - Backend: contract tests for popup-immediate-save and reconciliation behavior.
  - Feature: no regressions to auth guards/menu routing semantics.

### Post-Design Constitution Re-check

- Research, data model, contracts, and quickstart were generated for this branch.
- No constitutional violations identified.
- Re-check result: **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/039-popup-editor-save/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── calendar-popup-editor.md
│   ├── popup-immediate-save-api.md
│   └── staged-reconciliation.md
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
│   ├── pages/
│   ├── lib/
│   └── styles/
└── tests/
```

**Structure Decision**: Keep existing backend and frontend structure. Implement popup UX and reconciliation in calendar components/pages, and extend backend event update contracts only where immediate-save payload behavior requires explicit coverage.

## Phase 0 Output

- Research completed in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/specs/039-popup-editor-save/research.md`.
- All technical unknowns were resolved with explicit decisions and alternatives.

## Phase 1 Output

- Data model completed in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/specs/039-popup-editor-save/data-model.md`.
- Contracts completed in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/specs/039-popup-editor-save/contracts/`.
- Quickstart completed in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/specs/039-popup-editor-save/quickstart.md`.

## Complexity Tracking

No constitution-driven complexity exemptions are required for this feature.
