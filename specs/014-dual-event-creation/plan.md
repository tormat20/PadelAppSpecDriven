# Implementation Plan: Dual Event Creation Flows and Editable Preview

**Branch**: `014-dual-event-creation` | **Date**: 2026-03-01 | **Spec**: `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/specs/014-dual-event-creation/spec.md`
**Input**: Feature specification from `/specs/014-dual-event-creation/spec.md`

## Summary

Restore strict validation for the primary `Create Event` action while adding a separate `Create Event Slot` action for planned-only creation. Support editing from Preview Event through the existing create surface in edit mode with `Save Changes`, allow partial saves that keep planned status, and keep Start Event gated by readiness. Update Event Slots list layout so the status indicator is centered in a fixed aligned column regardless of name length.

## Technical Context

**Language/Version**: TypeScript 5.x + React 18 (frontend), Python 3.12 + FastAPI (backend)  
**Primary Dependencies**: React Router, Vite, Vitest, FastAPI, Pydantic, DuckDB-backed SQL repositories  
**Storage**: Existing DuckDB event/player/match persistence with event metadata and optimistic concurrency version fields  
**Testing**: `npm run lint && npm run test` (frontend), `PYTHONPATH=. uv run pytest tests/contract tests/integration` (backend)  
**Target Platform**: Browser-hosted organizer UI and Linux-hosted backend API service  
**Project Type**: Web application monorepo (frontend + backend)  
**Performance Goals**: Event status updates and save feedback visible within 1 second for normal club usage; Event Slots list remains readable and scannable at a glance  
**Constraints**: `Create Event` strict validation must be preserved; `Create Event Slot` must remain planning-fields-only; `Edit Event` uses existing create surface in edit mode with `Save Changes` only; warnings remain non-blocking  
**Scale/Scope**: Organizer workflows with dozens to low hundreds of events in list views and low-to-moderate concurrent edits

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Constitution file at `.specify/memory/constitution.md` is template-only and does not define enforceable principles or mandatory gates.
- Pre-research gate: PASS (no enforceable constitutional constraints present).
- Post-design gate: PASS (design artifacts remain aligned with the approved feature spec and clarified behavior).

## Project Structure

### Documentation (this feature)

```text
specs/014-dual-event-creation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── dual-create-actions-contract.md
│   ├── edit-event-flow-contract.md
│   └── event-slots-status-layout-contract.md
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
│   ├── pages/
│   ├── features/
│   ├── components/
│   ├── lib/
│   └── styles/
└── tests/
```

**Structure Decision**: Keep the existing frontend/backend split. Implement dual-create and edit-mode behavior in frontend page/validation flows, and enforce readiness/save semantics in backend API schema/service/repository layers. Keep Event Slots alignment changes in frontend list/layout styling.

## Complexity Tracking

No constitutional violations identified.
