# Implementation Plan: Event State and Restart Iteration

**Branch**: `016-event-state-restart` | **Date**: 2026-03-01 | **Spec**: `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/specs/016-event-state-restart/spec.md`
**Input**: Feature specification from `/specs/016-event-state-restart/spec.md`

## Summary

Stabilize event lifecycle UX by enforcing explicit `planned`, `ready`, `ongoing`, and `finished` labels and consistent state-gated actions in Home and Preview. Fix self-duplicate warning in edit mode, make resume reliable after navigation/reload, add restart flow for ongoing events with confirmation and progress reset, display richer preview setup context, and replace generic resume/load errors with actionable guidance.

## Technical Context

**Language/Version**: TypeScript 5.x + React 18 (frontend), Python 3.12 + FastAPI (backend)  
**Primary Dependencies**: React Router, Vite, Vitest, FastAPI, Pydantic, DuckDB-backed SQL repositories  
**Storage**: Existing DuckDB persistence for events/rounds/matches/results with setup-status and runtime status fields as event-state source-of-truth  
**Testing**: `npm run lint && npm run test` (frontend), `PYTHONPATH=. uv run pytest tests/contract tests/integration` (backend)  
**Target Platform**: Browser-hosted organizer UI and Linux-hosted backend API service  
**Project Type**: Web application monorepo (frontend + backend)  
**Performance Goals**: State/action refresh and resume route hydration visible to organizer within 1 second for normal event sizes  
**Constraints**: Preserve create-slot/strict-create/edit-save semantics; restart only for ongoing events with explicit confirmation; finished events must not expose start/resume actions  
**Scale/Scope**: Dozens to low hundreds of events in list surfaces; low-to-moderate concurrent organizer sessions

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Constitution file at `.specify/memory/constitution.md` is placeholder-only and does not define enforceable gates.
- Pre-research gate: PASS (no enforceable constitutional constraints).
- Post-design gate: PASS (design artifacts align with spec clarifications and project conventions).

## Project Structure

### Documentation (this feature)

```text
specs/016-event-state-restart/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── four-state-labeling-contract.md
│   ├── restart-event-contract.md
│   └── resume-error-guidance-contract.md
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

**Structure Decision**: Implement runtime-state classification, restart reset behavior, and resume/error response semantics in backend service/repository/router layers; implement label/action rendering, preview summary rows, and error messaging in frontend page/API client/type layers.

## Complexity Tracking

No constitutional violations identified.
