# Implementation Plan: Ongoing Summary and Streak Badges

**Branch**: `034-streak-summary-edit` | **Date**: 2026-03-19 | **Spec**: `/specs/034-streak-summary-edit/spec.md`
**Input**: Feature specification from `/specs/034-streak-summary-edit/spec.md`

## Summary

Add three coordinated improvements to live event operations: (1) replace the existing recent-winner fire badge with a crown badge, (2) introduce live momentum markers for ongoing events (hot streak at 3 consecutive wins, cold streak at 3 consecutive losses, plus winner-score emphasis), and (3) replace "Go to Summary" behavior with an in-page "View Summary" expansion that preserves event context and supports result correction.

Implementation will extend existing event/summary projections and result-edit workflows instead of introducing a separate event state model.

## Technical Context

**Language/Version**: Python 3.12 (backend), TypeScript 5.x + React 18.3 (frontend)  
**Primary Dependencies**: FastAPI, Pydantic, DuckDB repositories (backend); React Router DOM 6, Vite 5, Vitest 2 (frontend)  
**Storage**: DuckDB event/round/match/result persistence; existing event summary projection data  
**Testing**: pytest (backend), Vitest (frontend), TypeScript compile check (`tsc --noEmit`)  
**Target Platform**: Web app (desktop/mobile browser) with local FastAPI backend  
**Project Type**: Web application (frontend + backend)  
**Performance Goals**: Inline summary expand/collapse and score corrections feel immediate during live hosting; summary refresh after edit within one interaction cycle  
**Constraints**: Preserve ongoing event context; do not reset/replace run state; honor existing host/admin permissions; keep score correction auditable  
**Scale/Scope**: Single-event live operation, up to full roster event sizes already supported by current app (e.g., 24 players)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution file (`.specify/memory/constitution.md`) currently contains placeholder tokens and no enforceable project-specific principles or gates.

- Gate status: **PASS (no active constitutional constraints defined)**
- Action: Continue with standard repository constraints from `AGENTS.md` and spec quality checklist.

### Post-Design Re-check

- Re-check result: **PASS**
- No constitutional violations identified because no active constitution rules are defined.

## Project Structure

### Documentation (this feature)

```text
specs/034-streak-summary-edit/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── ongoing-summary-inline-view.md
│   └── streak-and-badge-display.md
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

**Structure Decision**: Use the existing web-app split (`frontend/` + `backend/`) and extend current event result/summary pathways in place. No new top-level modules required.

## Phase 0: Research Output

Research decisions are captured in `/specs/034-streak-summary-edit/research.md`.

Resolved topics:
- Streak computation basis for ongoing events
- Winner score emphasis behavior
- Inline summary expansion behavior and state preservation
- Score correction conflict handling and audit expectations
- Badge precedence/coexistence rules

## Phase 1: Design Output

Design artifacts created:
- Data model: `/specs/034-streak-summary-edit/data-model.md`
- UI/API contracts:
  - `/specs/034-streak-summary-edit/contracts/ongoing-summary-inline-view.md`
  - `/specs/034-streak-summary-edit/contracts/streak-and-badge-display.md`
- Validation quickstart: `/specs/034-streak-summary-edit/quickstart.md`

Agent context update command executed:
- `.specify/scripts/bash/update-agent-context.sh opencode`

## Complexity Tracking

No constitution violations to justify.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
