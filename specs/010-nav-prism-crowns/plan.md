# Implementation Plan: Navigation Shell, Prism Background, and Final Winner Crowns

**Branch**: `010-nav-prism-crowns` | **Date**: 2026-02-27 | **Spec**: `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/specs/010-nav-prism-crowns/spec.md`
**Input**: Feature specification from `/specs/010-nav-prism-crowns/spec.md`

## Summary

Deliver an app-shell refresh that adds a full-width top navigation placeholder, converts the logo button to image-only centered branding, introduces final-summary crown winner highlighting (Mexicano ties crowned, Americano highest-court final-round winners crowned), and replaces the existing global background with the specified prism implementation while preserving reduced-motion accessibility and interaction clarity.

## Technical Context

**Language/Version**: TypeScript 5.x + React 18 (frontend), Python 3.12 (backend API response updates)  
**Primary Dependencies**: React Router, Vite, Vitest, FastAPI, Pydantic, DuckDB-backed repositories, OGL-based prism rendering dependency behavior per provided implementation  
**Storage**: Existing backend event/round/match/player persistence; no schema migration expected  
**Testing**: `npm run lint`, `npm run test`, plus backend contract/integration tests via `pytest` for summary payload behavior  
**Target Platform**: Browser-based host app (desktop + mobile), FastAPI backend on Linux development environment  
**Project Type**: Web application (frontend + backend in monorepo)  
**Performance Goals**: Maintain smooth UI interaction and readable summary rendering; background effect must not materially degrade perceived page responsiveness on typical desktop/mobile usage  
**Constraints**: Must use provided prism implementation behavior (no substitute effect), maintain reduced-motion support, keep background non-intercepting, preserve keyboard accessibility, and avoid regressions in summary flows  
**Scale/Scope**: Single-event host workflow views and final summary payload/view updates for existing event sizes in current app scope

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Constitution file `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/.specify/memory/constitution.md` contains placeholders only and no enforceable principles.
- Pre-research gate: PASS (no active constitutional constraints defined).
- Post-design gate: PASS (design remains within existing project boundaries and introduces no governance conflicts).

## Project Structure

### Documentation (this feature)

```text
specs/010-nav-prism-crowns/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── app-shell-nav-contract.md
│   ├── prism-background-contract.md
│   └── summary-crowns-contract.md
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
│   ├── app/
│   ├── components/
│   │   ├── backgrounds/
│   │   └── branding/
│   ├── pages/
│   └── styles/
└── tests/

images/
├── icons/
└── logos/
```

**Structure Decision**: Use the existing web-application split. Implement UI shell/background/branding behavior in `frontend/src/app`, `frontend/src/components/backgrounds`, `frontend/src/components/branding`, `frontend/src/styles`, and summary rendering/tests in `frontend/src/pages` and `frontend/tests`. Add crown-resolution data contract support in backend summary schema/router/service and validate via backend contract/integration tests.

## Complexity Tracking

No constitution violations or exceptions identified.
