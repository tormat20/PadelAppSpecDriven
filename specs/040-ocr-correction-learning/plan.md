# Implementation Plan: OCR/Paste Accuracy Uplift + Learned Corrections

**Branch**: `040-ocr-correction-learning` | **Date**: 2026-03-25 | **Spec**: `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/specs/040-ocr-correction-learning/spec.md`
**Input**: Feature specification from `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/specs/040-ocr-correction-learning/spec.md`

## Summary

Improve paste/OCR participant parsing with surgical jammed-boundary fixes for known failures, then add backend-persisted correction memory so confirmed edits auto-correct future similar rows. Keep current parser architecture and import UX intact while adding safe conflict handling and confidence-based auto-apply.

## Technical Context

**Language/Version**: Python 3.12 (backend), TypeScript 5.x + React 18.3 (frontend)  
**Primary Dependencies**: FastAPI, Pydantic, DuckDB, React, Vite, Vitest  
**Storage**: DuckDB (new persistent correction-memory table)  
**Testing**: `pytest` (backend), `vitest` + `tsc --noEmit` (frontend)  
**Target Platform**: Web application (desktop-first organizer workflow, mobile supported)
**Project Type**: Web application (`backend/` + `frontend/`)  
**Performance Goals**: No noticeable slowdown in paste/parse flow for typical 24-row imports; one-pass confirmation remains practical  
**Constraints**: Preserve current parser flow (no full rewrite), avoid regressions in existing booking fixtures, never silently overwrite stronger identity matches  
**Scale/Scope**: OCR/paste import parsing and correction resolution for organizer roster workflows

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Constitution file `.specify/memory/constitution.md` is currently a placeholder template and does not define enforceable principles.
- Gate result: **PASS** (no constitutional blockers).
- Enforced project quality gates:
  - Frontend: `npm run lint`, targeted OCR/parser tests, and full Vitest pass.
  - Backend: `pytest` coverage for new correction persistence and resolution contracts.
  - Product gate: existing parser fixture accuracy must not regress.

### Post-Design Constitution Re-check

- Phase 0/1 artifacts completed for this feature.
- No constitutional violations identified.
- Re-check result: **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/040-ocr-correction-learning/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── ocr-correction-upsert.md
│   └── ocr-correction-resolve.md
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
├── app/db/migrations/
└── tests/
    └── contract/

frontend/
├── src/
│   ├── components/ocr/
│   ├── features/ocr/
│   └── lib/
└── tests/
```

**Structure Decision**: Use the existing frontend OCR import pipeline and backend layered architecture. Add a focused parser enhancement in `frontend/src/features/ocr/bookingTextParser.ts`, integrate correction resolution in OCR import UI, and introduce backend correction-memory persistence/resolution APIs with contract tests.

## Phase 0 Output

- Research completed in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/specs/040-ocr-correction-learning/research.md`.
- Technical unknowns around heuristic tuning, confidence strategy, and correction-memory ranking/conflict behavior are resolved.

## Phase 1 Output

- Data model completed in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/specs/040-ocr-correction-learning/data-model.md`.
- Contracts completed in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/specs/040-ocr-correction-learning/contracts/`.
- Quickstart completed in `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/specs/040-ocr-correction-learning/quickstart.md`.
- Agent context refreshed via `.specify/scripts/bash/update-agent-context.sh opencode`.

## Complexity Tracking

No constitution-driven complexity exemptions are required for this feature.
