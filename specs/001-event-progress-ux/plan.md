# Implementation Plan: Event Progress UX Improvements

**Branch**: `001-event-progress-ux` | **Date**: 2026-02-26 | **Spec**: `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/specs/001-event-progress-ux/spec.md`
**Input**: Feature specification from `/specs/001-event-progress-ux/spec.md`

## Summary

Deliver a clearer host run-event UX by replacing court visuals with the new court asset, overlaying team display names per court side, introducing side-relative result modal entry (including fixed 24-option Mexicano scoring with `24 - X` complement), and preserving existing event progression/summary compatibility while extending Magic Bento-inspired interaction behavior across event-flow interactive cards/buttons.

Clarified acceptance trace:
- Team-side click is the single entry point to modal result submission.
- Mexicano modal exposes exactly 24 clickable options with complement scoring.
- Player identifiers are resolved to display names in frontend run-event mapping.

## Technical Context

**Language/Version**: TypeScript 5.x + React 18 (frontend), Python 3.12 + FastAPI (backend)  
**Primary Dependencies**: React Router, Vite, Vitest, FastAPI, DuckDB persistence layer  
**Storage**: Existing backend event/player/match persistence + frontend local draft state  
**Testing**: Frontend `npm run lint` + `npm run test`; backend contract/integration checks via `uv run pytest`  
**Target Platform**: Desktop and mobile web browsers (host-operated event control UI)
**Project Type**: Web application (frontend + backend monorepo)  
**Performance Goals**: Side-hover feedback appears immediately during interaction; result submission remains within existing match-entry cadence with no observable regression  
**Constraints**: Keep route structure and scoring/progression rules stable; preserve existing summary consumers; avoid backend contract expansion for player display names in run-event cards  
**Scale/Scope**: Create Event + Run Event + Summary flows, style system updates for event-flow interactive controls, targeted frontend/backend contract tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Constitution source: `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/.specify/memory/constitution.md`
- Finding: file remains a placeholder template with no enforceable policies.
- Gate status (pre-research): PASS.
- Gate status (post-design): PASS.

## Project Structure

### Documentation (this feature)

```text
specs/001-event-progress-ux/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── progress-summary-contract.md
│   └── run-event-result-modal-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/
│   ├── services/
│   ├── repositories/
│   └── domain/
└── tests/

frontend/
├── src/
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── lib/
│   ├── pages/
│   └── styles/
└── tests/

images/
└── courts/
```

**Structure Decision**: Retain existing monorepo. Feature work remains frontend-heavy (`RunEvent`, `CourtGrid`, modal interaction flow, styles, tests) with backend limited to already-planned summary compatibility and no new run-event naming API contract.

## Complexity Tracking

No constitution violations or exceptions require justification.
