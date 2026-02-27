# Implementation Plan: Tournament Engine and Round Summary Overhaul

**Branch**: `001-tournament-engine-summary` | **Date**: 2026-02-27 | **Spec**: `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/specs/001-tournament-engine-summary/spec.md`
**Input**: Feature specification from `/specs/001-tournament-engine-summary/spec.md`

## Summary

Overhaul round progression and finished-summary behavior so tournament logic matches mode rules and host expectations: Americano court movement with bounded ladder behavior, Mexicano ranking-driven regrouping with non-repeated partners, BeatTheBox fixed in-court partner rotation, and final summary matrix by round (`R1..RN`) with numeric round values and totals.

Implementation focus:
- Replace MVP generic `generate_next_round` behavior with mode-specific scheduling.
- Preserve existing scoring formulas and submission payload contracts.
- Keep result pipeline deterministic, including seeded pseudo-random overflow handling in Americano.

## Technical Context

**Language/Version**: Python 3.12 (backend), TypeScript 5.x + React 18 (frontend display updates)  
**Primary Dependencies**: FastAPI, DuckDB-backed repositories, React Router, Vite/Vitest  
**Storage**: Existing backend event/round/match/player persistence; no schema migration required  
**Testing**: `uv run pytest` for backend unit/contract/integration tests; `npm run lint && npm run test` for frontend summary rendering coverage  
**Target Platform**: Local/dev Linux and browser-based host UI (desktop + mobile responsive views)  
**Project Type**: Web application monorepo (backend API + frontend SPA)  
**Performance Goals**: Next-round generation remains immediate in host flow (single action completion under normal event sizes)  
**Constraints**: Maintain existing result scoring formulas; top court is highest selected court number; deterministic outputs for identical input state; Americano has no draws  
**Scale/Scope**: Player counts in multiples of 4 across selected courts (up to selected-court capacity), round transitions through full event lifecycle

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Constitution file: `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/.specify/memory/constitution.md`
- Observation: constitution remains placeholder text with no enforceable principles or quantitative gates.
- Gate result before Phase 0: PASS (no explicit constitutional constraints to violate)
- Gate result after Phase 1: PASS (design stays within existing architecture and test boundaries)

## Project Structure

### Documentation (this feature)

```text
specs/001-tournament-engine-summary/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── next-round-assignment-contract.md
│   └── summary-round-matrix-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/
│   ├── domain/
│   ├── repositories/
│   └── services/
└── tests/
    ├── contract/
    ├── integration/
    └── unit/

frontend/
├── src/
│   ├── lib/
│   └── pages/
└── tests/
```

**Structure Decision**: Keep current monorepo layout and implement core logic in backend domain/services (`scheduling.py`, `round_service.py`, `summary_service.py`) with minimal frontend adjustments in summary rendering and targeted test updates.

## Complexity Tracking

No constitution violations or complexity exceptions identified.
