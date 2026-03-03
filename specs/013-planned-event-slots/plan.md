# Implementation Plan: Planned Event Slots with Deferred Setup Validation

**Branch**: `013-planned-event-slots` | **Date**: 2026-03-01 | **Spec**: `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/specs/013-planned-event-slots/spec.md`
**Input**: Feature specification from `/specs/013-planned-event-slots/spec.md`

## Summary

Enable organizers to create events as planned slots using only name, mode, date, and time, then complete courts/players later. Implement explicit setup readiness (`planned` vs `ready`) using existing mode-specific validation rules, warning-based handling for past schedule values and duplicate slots, and conflict-safe updates to prevent silent overwrite during concurrent edits.

## Technical Context

**Language/Version**: TypeScript 5.x + React 18 (frontend), Python 3.12 + FastAPI (backend)  
**Primary Dependencies**: React Router, Vite, Vitest, FastAPI, Pydantic, DuckDB-backed SQL repositories  
**Storage**: Existing DuckDB event/player/match persistence with event schema updates for planning metadata and optimistic concurrency version  
**Testing**: `npm run lint && npm run test` (frontend), `PYTHONPATH=. uv run pytest tests/contract tests/integration` (backend)  
**Target Platform**: Browser-hosted organizer UI and Linux-hosted backend API service  
**Project Type**: Web application monorepo (frontend + backend)  
**Performance Goals**: Event save/update and readiness recalculation visible to user within 1 second for normal event sizes; event list status scan remains instant at current usage scale  
**Constraints**: Preserve existing run flow behavior for fully configured events; allow duplicates with warning/disambiguation; allow past date/time with warning (no hard block); enforce conflict detection with refresh/retry  
**Scale/Scope**: Club-host workflow with low-to-moderate concurrent organizers and dozens to low hundreds of planned slots in active views

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Constitution file at `.specify/memory/constitution.md` is template-only and does not define enforceable principles or gates.
- Pre-research gate: PASS (no explicit constraints to violate).
- Post-design gate: PASS (design artifacts remain aligned with spec clarifications and repository conventions).

## Project Structure

### Documentation (this feature)

```text
specs/013-planned-event-slots/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── planned-event-readiness-contract.md
│   ├── planned-event-warning-contract.md
│   └── planned-event-concurrency-contract.md
└── tasks.md
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
backend/
├── app/
│   ├── api/routers/
│   ├── api/schemas/
│   ├── repositories/
│   ├── services/
│   └── db/migrations/
└── tests/
    ├── contract/
    └── integration/

frontend/
├── src/
│   ├── features/
│   ├── pages/
│   ├── components/
│   └── lib/
└── tests/
```

**Structure Decision**: Keep a web-app split. Add planned-slot creation and status/warning presentation in frontend create/list/detail flows, and implement readiness evaluation, conflict-aware updates, and planning metadata persistence in backend schemas/services/repositories.

## Complexity Tracking

No constitution violations identified.
