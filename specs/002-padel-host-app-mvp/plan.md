# Implementation Plan: Padel Host App (MVP)

**Branch**: `002-padel-host-app-mvp` | **Date**: 2026-02-26 | **Spec**: `specs/002-padel-host-app-mvp/spec.md`
**Input**: Feature specification from `specs/002-padel-host-app-mvp/spec.md`

## Summary

Deliver a host-first web MVP that runs complete padel events for Americano, Mexicano, and Beat the Box. Use a layered backend (FastAPI + services + repositories + raw SQL on DuckDB) and a component-driven frontend (React + TypeScript + Tailwind + shadcn/ui) with mode-specific result capture, round advancement, and persistent event history including Beat the Box global ranking updates.

## Technical Context

**Language/Version**: Python 3.12+, TypeScript 5.x  
**Primary Dependencies**: FastAPI, Pydantic v2, DuckDB, uv, pytest, React, Vite, Tailwind CSS, shadcn/ui, React Router, React Bits LightRays, React Bits MagicBento  
**Storage**: DuckDB file database (MVP), migration-ready for later Postgres swap  
**Testing**: pytest (unit + integration + API), frontend type/lint checks (TypeScript + eslint)  
**Target Platform**: Browser-based web app (desktop-first host operations, mobile-compatible shared view)  
**Project Type**: Web application (separate backend and frontend)  
**Performance Goals**: Host result entry and round transition responses complete within 3 seconds at up to 28 active players  
**Constraints**: Raw SQL only (no ORM), 7 global courts, fixed 90-minute event structure by mode, mode-specific scheduling/scoring rules, deterministic fallback for Mexicano partner constraints  
**Scale/Scope**: Single-host MVP with persistent history, architecture prepared for multi-user expansion

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase 0 Gate Check
- `.specify/memory/constitution.md` is still a placeholder template with unresolved tokens, so no enforceable project-specific principles exist.
- Temporary planning gates applied from explicit product requirements and repo guidance:
  - Preserve strict layered architecture and repository isolation for SQL.
  - Keep API contracts explicit and testable.
  - Keep event rules deterministic and persist all historical match data.
- **Result**: PASS (conditional on explicit user constraints until constitution is formalized).

### Post-Phase 1 Re-check
- Research, data model, API contract, and quickstart preserve layer boundaries and raw SQL architecture.
- Beat the Box global ranking persistence and mode-specific contracts are explicitly modeled.
- No design artifact introduces ORM coupling or conflicts with required stack.
- **Result**: PASS.

## Project Structure

### Documentation (this feature)

```text
specs/002-padel-host-app-mvp/
|- plan.md
|- research.md
|- data-model.md
|- quickstart.md
|- contracts/
|  `- api.yaml
`- tasks.md
```

### Source Code (repository root)

```text
backend/
`- app/
   |- api/
   |  |- routers/
   |  |  |- health.py
   |  |  |- players.py
   |  |  |- events.py
   |  |  |- rounds.py
   |  |  `- matches.py
   |  `- deps.py
   |- core/
   |  |- config.py
   |  `- logging.py
   |- domain/
   |  |- models.py
   |  |- enums.py
   |  |- scoring.py
   |  `- scheduling.py
   |- services/
   |  |- event_service.py
   |  |- americano_service.py
   |  |- mexicano_service.py
   |  `- beat_the_box_service.py
   |- db/
   |  |- connection.py
   |  |- migrations/
   |  `- repositories/
   |     |- players_repo.py
   |     |- events_repo.py
   |     |- rounds_repo.py
   |     |- matches_repo.py
   |     |- rankings_repo.py
   |     `- sql/
   |        |- players.sql
   |        |- events.sql
   |        |- rounds.sql
   |        |- matches.sql
   |        `- rankings.sql
   `- main.py

backend/tests/
|- unit/
`- integration/

frontend/src/
|- app/
|  |- App.tsx
|  |- router.tsx
|  `- AppShell.tsx
|- components/
|  |- branding/LogoButton.tsx
|  |- backgrounds/LightRaysBackground.tsx
|  |- bento/MagicBentoMenu.tsx
|  |- mode/ModeAccordion.tsx
|  |- courts/CourtGrid.tsx
|  `- matches/ResultEntry.tsx
|- pages/
|  |- Home.tsx
|  |- CreateEvent.tsx
|  |- PreviewEvent.tsx
|  |- RunEvent.tsx
|  `- Summary.tsx
`- lib/
   |- api.ts
   |- types.ts
   `- utils.ts
```

**Structure Decision**: Use the existing `backend/` + `frontend/` split and enforce strict backend layering so mode logic stays framework-independent and persistence can be swapped from DuckDB to Postgres later.

## Phase 0 Output (Research)

`specs/002-padel-host-app-mvp/research.md` resolves:
- stack and dependency choices
- layered architecture and repository isolation
- scheduling and scoring decisions per mode
- UI system patterns for host-first workflow
- migration and future multi-user readiness strategy

## Phase 1 Output (Design + Contracts)

- Data model: `specs/002-padel-host-app-mvp/data-model.md`
- API contract: `specs/002-padel-host-app-mvp/contracts/api.yaml`
- Developer runbook: `specs/002-padel-host-app-mvp/quickstart.md`
- Agent context update: `AGENTS.md` refreshed via update script

## Clarifications Applied Before Tasks

- No tie-break rules are implemented for any mode; ties remain ties in standings.
- Mexicano standings are cumulative within an event only (across that event's rounds), never across events.
- Event creation is valid only when `players = selected_courts * 4` for all modes.
- Beat the Box default deterministic ordering is global ranking desc, then `created_at`, then `player_id`; boxes map to selected courts in ascending order.
- Result correction default: allow edits only while event is Running and round progression is not finalized, then recompute derived totals from persisted match results.

## Complexity Tracking

No constitution violations requiring exception tracking.
