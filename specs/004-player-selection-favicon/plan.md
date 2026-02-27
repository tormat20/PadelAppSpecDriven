# Implementation Plan: Player Selection and Favicon Improvements

**Branch**: `001-player-selection-favicon` | **Date**: 2026-02-26 | **Spec**: `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/specs/001-player-selection-favicon/spec.md`
**Input**: Feature specification from `/specs/001-player-selection-favicon/spec.md`

## Summary

Improve event setup player management so hosts can add players, see immediate assignment, search by case-insensitive prefix from the first typed character, and remove assignments without deleting global player records. Persist assigned players for active drafts across refresh/return, and add browser-tab branding with Molndal logo (SVG primary plus PNG fallback). Preserve existing route architecture and event creation outcomes.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18, Node.js 20+ tooling  
**Primary Dependencies**: React Router, Vite, Vitest  
**Storage**: Existing backend persistence for player catalog; draft assignment state persisted for active draft (frontend-managed persistence layer)  
**Testing**: Vitest + existing frontend lint/type checks + manual browser favicon verification  
**Target Platform**: Modern desktop/mobile browsers (Chrome, Safari, Firefox, Edge)  
**Project Type**: Web application frontend within monorepo  
**Performance Goals**: Search suggestions update without perceptible lag during normal typing; no regressions to event setup responsiveness  
**Constraints**: Visual/UX and behavior fix scope only; preserve API contracts and event creation outcome rules; no global player deletion from assignment removal  
**Scale/Scope**: Create Event player-selection flow, assigned-list interactions, related tests, and favicon asset wiring

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Constitution source: `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/.specify/memory/constitution.md`
- Finding: Constitution file contains placeholder sections and no enforceable rules.
- Gate status before Phase 0: PASS (no active constitutional constraints detected).
- Gate status after Phase 1 design: PASS (design artifacts align with feature constraints and no constitutional violations detected).

## Project Structure

### Documentation (this feature)

```text
specs/001-player-selection-favicon/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── player-selection-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── app/
└── tests/

frontend/
├── public/
├── src/
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── lib/
│   └── pages/
└── tests/

images/
└── logos/

specs/
└── 001-player-selection-favicon/
```

**Structure Decision**: Use the existing web-app monorepo layout. Implementation changes are concentrated in `frontend/src/**`, `frontend/public/**` (favicon assets), and frontend tests.

## Complexity Tracking

No constitutional exceptions required.
