# Implementation Plan: Event Player Logic and Summary Icon/Alignment Update

**Branch**: `012-event-player-logic` | **Date**: 2026-03-02 | **Spec**: `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/specs/012-event-player-logic/spec.md`
**Input**: Feature specification from `/specs/012-event-player-logic/spec.md`

## Summary

Apply event-creation UX and validation updates so required player count is exactly `courts * 4`, show assigned progress and explicit courts labeling, and provide a quick "Today's date" action while preserving manual time selection. Update summary winner icon to color variant and keep rank/name/icon alignment intentional (centered rank, left player name, right emblem) with existing crown fallback behavior.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript 5.x + React 18 (frontend), Python 3.12 + FastAPI (backend)  
**Primary Dependencies**: React Router, Vite, Vitest, FastAPI, Pydantic, DuckDB repositories  
**Storage**: Existing player/event/match persistence; no migration required  
**Testing**: `npm run lint && npm run test` (frontend), `PYTHONPATH=. uv run pytest tests/contract tests/integration` (backend)  
**Target Platform**: Browser-based host workflow UI and Linux-hosted backend APIs
**Project Type**: Web application monorepo (frontend + backend)  
**Performance Goals**: Keep event creation interactions immediate and preserve summary table readability at current event sizes  
**Constraints**: Do not regress create-event flow, summary winner behavior, or accessibility affordances; keep crown fallback marker  
**Scale/Scope**: Create-event page and summary page presentation/validation behavior for current host workflow

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Constitution file is placeholder-only with no enforceable gates.
- Pre-research gate: PASS.
- Post-design gate: PASS.

## Project Structure

### Documentation (this feature)

```text
specs/012-event-player-logic/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── create-event-capacity-contract.md
│   ├── create-event-date-shortcut-contract.md
│   └── summary-winner-icon-alignment-contract.md
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
│   └── services/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── features/
│   ├── pages/
│   └── styles/
└── tests/
```

**Structure Decision**: Implement create-event logic and counter behavior in frontend validation/page/component/style modules, keep summary icon path/alignment in frontend summary modules, and preserve backend name formatting/service compatibility introduced on this branch.

## Complexity Tracking

No constitution violations identified.
