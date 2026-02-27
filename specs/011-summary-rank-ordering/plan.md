# Implementation Plan: Summary Rank Column and Mode-Specific Ordering Rules

**Branch**: `011-summary-rank-ordering` | **Date**: 2026-02-27 | **Spec**: `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/specs/011-summary-rank-ordering/spec.md`
**Input**: Feature specification from `/specs/011-summary-rank-ordering/spec.md`

## Summary

Add an explicit rank column and deterministic ranking/order behavior for summary tables across all modes. Mexicano final rows rank by descending total with competition tie ranking, Americano final rows rank by final-round highest-to-lowest-court winner/loser sequence with alphabetical intra-pair ordering, and BeatTheBox rows display numeric round points, total points, and court-group ordering derived from global carry-over score progression. The implementation updates backend summary contracts and frontend rendering to keep crown logic and existing event flows intact.

## Technical Context

**Language/Version**: TypeScript 5.x + React 18 (frontend), Python 3.12 + FastAPI (backend)  
**Primary Dependencies**: React Router, Vite, Vitest, FastAPI, Pydantic, DuckDB repositories  
**Storage**: Existing DuckDB-backed event/round/match/player/ranking persistence; no schema migration planned  
**Testing**: Frontend `npm run lint && npm run test`; Backend `PYTHONPATH=. uv run pytest tests/contract tests/integration`  
**Target Platform**: Browser-based host workflow (desktop/mobile) and Linux-hosted FastAPI backend  
**Project Type**: Web application monorepo (frontend + backend)  
**Performance Goals**: Summary table render remains responsive for current event sizes and deterministic ordering is stable across reloads  
**Constraints**: Preserve existing event lifecycle behavior, preserve crown rules, maintain accessibility/readability, and ensure deterministic rank/order output by mode  
**Scale/Scope**: Existing summary pages and summary API payloads for current event sizes (single-event host workflow)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Constitution file `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/.specify/memory/constitution.md` is placeholder-only and defines no enforceable principles.
- Pre-research gate: PASS (no active constitutional constraints).
- Post-design gate: PASS (design uses existing architecture and does not introduce governance conflicts).

## Project Structure

### Documentation (this feature)

```text
specs/011-summary-rank-ordering/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── summary-ranking-contract.md
│   ├── summary-table-layout-contract.md
│   └── summary-ordering-metadata-contract.md
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
│   ├── api/
│   │   ├── routers/
│   │   └── schemas/
│   └── services/
└── tests/
    ├── contract/
    └── integration/

frontend/
├── src/
│   ├── pages/
│   ├── lib/
│   └── styles/
└── tests/
```

**Structure Decision**: Keep the existing web-app split. Implement ranking and metadata generation in backend summary service/router/schema and apply rendering/order/rank logic in frontend summary page/types/api with targeted tests.

## Complexity Tracking

No constitution violations or exception handling required.
