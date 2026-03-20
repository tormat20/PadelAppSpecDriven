# Implementation Plan: Previous Round Correction Flow

**Branch**: `035-previous-round-correction` | **Date**: 2026-03-20 | **Spec**: `/specs/035-previous-round-correction/spec.md`
**Input**: Feature specification from `/specs/035-previous-round-correction/spec.md`

## Summary

Introduce safe backward navigation in ongoing events so hosts can return to previous rounds, correct score mistakes, and then re-advance with regenerated assignments based on corrected outcomes. In parallel, simplify run-page UI by removing redundant recorded-score editing under inline summary and restructuring run controls into explicit back/forward top-row navigation with summary/finish actions below.

## Technical Context

**Language/Version**: Python 3.12 (backend), TypeScript 5.x + React 18.3 (frontend)  
**Primary Dependencies**: FastAPI, Pydantic, DuckDB repositories (backend); React Router DOM 6, Vite 5, Vitest 2 (frontend)  
**Storage**: DuckDB event/round/match/result persistence with existing run-state fields and correction audit table  
**Testing**: pytest (backend), Vitest (frontend), TypeScript compile check (`tsc --noEmit`)  
**Target Platform**: Web application for desktop/mobile browser with local FastAPI backend  
**Project Type**: Web application (frontend + backend)  
**Performance Goals**: Previous-round navigation and re-advance should complete within one normal interaction cycle for standard event sizes (up to 24 players)  
**Constraints**: Preserve event integrity when rebuilding downstream rounds; maintain existing permissions; show warning-style messaging when no previous round is available; no silent conflict overwrites  
**Scale/Scope**: Single ongoing event host workflow, usually one-round rollback but supports repeated rollback to Round 1 boundary

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution file (`.specify/memory/constitution.md`) currently contains placeholders and no enforceable project-specific gates.

- Gate status: **PASS (no active constitutional constraints defined)**
- Action: Follow repository constraints and feature spec/testability requirements.

### Post-Design Re-check

- Re-check result: **PASS**
- No constitution violations detected because there are no active constitutional rules.

## Project Structure

### Documentation (this feature)

```text
specs/035-previous-round-correction/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── round-back-navigation.md
│   └── run-page-action-layout.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/
│   │   ├── routers/
│   │   └── schemas/
│   ├── repositories/
│   └── services/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── features/
│   ├── lib/
│   ├── pages/
│   └── styles/
└── tests/
```

**Structure Decision**: Keep the existing frontend/backend split and extend run-event round services plus run-page components in place; no new top-level modules required.

## Phase 0: Research Output

Research captured in `/specs/035-previous-round-correction/research.md` resolves:

- Round rollback semantics and safety boundaries
- Rebuild strategy for downstream rounds after correction
- UX warning behavior at Round 1 boundary
- Action layout behavior across event modes and finish rules
- Concurrency and audit expectations for previous-round corrections

## Phase 1: Design Output

Design artifacts created:

- Data model: `/specs/035-previous-round-correction/data-model.md`
- Contracts:
  - `/specs/035-previous-round-correction/contracts/round-back-navigation.md`
  - `/specs/035-previous-round-correction/contracts/run-page-action-layout.md`
- Quickstart: `/specs/035-previous-round-correction/quickstart.md`

Agent context update command executed:

- `bash .specify/scripts/bash/update-agent-context.sh opencode`

## Complexity Tracking

No constitution violations requiring justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
