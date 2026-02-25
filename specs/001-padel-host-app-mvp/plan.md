# Implementation Plan: Padel Host App (MVP)

**Branch**: `001-padel-host-app-mvp` | **Date**: 2026-02-25 | **Spec**: `specs/001-padel-host-app-mvp/spec.md`
**Input**: Feature specification from `specs/001-padel-host-app-mvp/spec.md`

## Summary

Build a host-first padel event platform with FastAPI + DuckDB backend and React + TypeScript frontend.
The MVP supports full event lifecycle (Lobby -> Preview -> Running -> Summary) for Americano, Mexicano, and BeatTheBox with persistent event history and BeatTheBox global ranking updates.

## Technical Context

**Language/Version**: Python 3.12+, TypeScript 5.x  
**Primary Dependencies**: FastAPI, Pydantic v2, DuckDB, pytest, React, Vite, Tailwind CSS, shadcn/ui, React Router  
**Storage**: DuckDB (file-based local DB for MVP)  
**Testing**: pytest (backend), React Testing Library/Vitest (frontend)  
**Target Platform**: Web (desktop-first host UI; responsive support for shared screen)  
**Project Type**: Web application (backend + frontend)  
**Performance Goals**: Host actions (result entry/round advance) complete in <500ms p95 on local single-instance deployment  
**Constraints**: Raw SQL only (no ORM), 7 global courts, 90-minute event model, mode-specific scoring/scheduling rules  
**Scale/Scope**: MVP for single host session; designed for future multi-user expansion

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase 0 Gate Check
- Constitution file at `.specify/memory/constitution.md` contains placeholders only (template, no enforceable project-specific rules).
- Effective gates used for this plan:
  - Align with explicit user stack and architecture constraints.
  - Preserve layered architecture and repository pattern.
  - Keep API contracts explicit and testable.
- **Result**: PASS (no enforceable constitution violations detected).

### Post-Phase 1 Re-check
- Data model, contracts, and quickstart remain aligned with user constraints and layered architecture.
- No introduced design element conflicts with requested raw SQL or stack.
- **Result**: PASS.

## Project Structure

### Documentation (this feature)

```text
specs/001-padel-host-app-mvp/
|- plan.md
|- research.md
|- data-model.md
|- quickstart.md
|- contracts/
|  |- api.yaml
`- tasks.md (created later by /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
|- app/
|  |- api/
|  |  |- routers/
|  |  |- schemas/
|  |- domain/
|  |- services/
|  |- repositories/
|  |- db/
|  `- main.py
`- tests/
   |- unit/
   |- integration/
   `- contract/

frontend/
|- src/
|  |- app/
|  |- pages/
|  |- components/
|  |- features/
|  |- lib/
|  `- api/
`- tests/
```

**Structure Decision**: Use the web application split (`backend/` + `frontend/`) to satisfy current host-first MVP while enabling future multi-user scaling.

## Phase 0 Output (Research)

`specs/001-padel-host-app-mvp/research.md` resolves:
- framework choice and API approach
- DuckDB + repository strategy
- mode scheduling/scoring design
- testing and contract approach
- constitution placeholder handling

## Phase 1 Output (Design + Contracts)

- Data model: `specs/001-padel-host-app-mvp/data-model.md`
- API contract: `specs/001-padel-host-app-mvp/contracts/api.yaml`
- Developer runbook: `specs/001-padel-host-app-mvp/quickstart.md`

## Complexity Tracking

No constitution violations requiring exception tracking.
