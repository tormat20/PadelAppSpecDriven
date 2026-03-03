# Implementation Plan: Resumable Ongoing Events and Run-State UX

**Branch**: `015-resume-ongoing-events` | **Date**: 2026-03-01 | **Spec**: `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/specs/015-resume-ongoing-events/spec.md`
**Input**: Feature specification from `/specs/015-resume-ongoing-events/spec.md`

## Summary

Add explicit `ongoing` event run-state behavior and make in-progress events resumable from Event Slots/Preview with persisted progress restoration. Align action gating (`Start Event` vs `Resume Event`) to persisted state, surface actionable load/resume errors, and show preview schedule as combined date-time while preserving existing create/edit semantics.

## Technical Context

**Language/Version**: TypeScript 5.x + React 18 (frontend), Python 3.12 + FastAPI (backend)  
**Primary Dependencies**: React Router, Vite, Vitest, FastAPI, Pydantic, DuckDB-backed SQL repositories  
**Storage**: Existing DuckDB persistence for events/rounds/matches/results; persisted run-state and round pointer are source of truth  
**Testing**: `npm run lint && npm run test` (frontend), `PYTHONPATH=. uv run pytest tests/contract tests/integration` (backend)  
**Target Platform**: Browser-hosted organizer UI and Linux-hosted backend API service  
**Project Type**: Web application monorepo (frontend + backend)  
**Performance Goals**: Resume flow restores an ongoing event and renders actionable state within 1 second for normal club event sizes  
**Constraints**: Preserve existing create-slot/strict-create/edit-save behavior; maintain backward-compatible run/start lifecycle outcomes; no browser-only resume state reliance  
**Scale/Scope**: Dozens to low hundreds of events in list views; low-to-moderate concurrent organizers

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Constitution file at `.specify/memory/constitution.md` is placeholder-only and defines no enforceable principles.
- Pre-research gate: PASS (no enforceable constitutional constraints).
- Post-design gate: PASS (design remains consistent with clarified spec scope and repository conventions).

## Project Structure

### Documentation (this feature)

```text
specs/015-resume-ongoing-events/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── run-state-transition-contract.md
│   ├── resume-progress-contract.md
│   └── resume-error-feedback-contract.md
└── tasks.md
```

### Source Code (repository root)
```text
backend/
├── app/
│   ├── api/routers/
│   ├── api/schemas/
│   ├── repositories/
│   └── services/
└── tests/
    ├── contract/
    └── integration/

frontend/
├── src/
│   ├── app/
│   ├── pages/
│   ├── components/
│   ├── features/
│   ├── lib/
│   └── styles/
└── tests/
```

**Structure Decision**: Implement run-state transitions, resume restoration, and error contract alignment in backend service/repository/router layers; implement state-aware labels/actions and schedule/error rendering updates in frontend pages/API client/types.

## Complexity Tracking

No constitutional violations identified.
