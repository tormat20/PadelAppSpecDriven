# Implementation Plan: Event Setup Label + Run Card Transparency + Inline Team Result Badges

**Branch**: `002-run-result-badges` | **Date**: 2026-02-27 | **Spec**: `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/specs/002-run-result-badges/spec.md`
**Input**: Feature specification from `/specs/002-run-result-badges/spec.md`

## Summary

Refine host-facing UX by (1) moving run-event result feedback directly into each team button with mirrored mode-aware values, (2) simplifying create-event player section labeling and list growth behavior, and (3) reducing court-card overlay heaviness while preserving tinted team-button readability and unchanged scoring/progression semantics.

Acceptance trace focus:
- Inline right-aligned team-button badges replace below-card helper text.
- Mexicano badge complements must always sum to 24.
- Setup player section uses `Players` heading with natural list expansion.

## Technical Context

**Language/Version**: TypeScript 5.x + React 18 (frontend), Python 3.12 + FastAPI (backend)  
**Primary Dependencies**: React Router, Vite, Vitest, FastAPI, DuckDB persistence layer  
**Storage**: Existing backend event/player/match persistence and frontend in-memory + local draft state  
**Testing**: Frontend `npm run lint` + `npm run test`; backend contract checks via `PYTHONPATH=. uv run pytest`  
**Target Platform**: Desktop and mobile web browsers for host workflow UI  
**Project Type**: Web application (frontend + backend monorepo)  
**Performance Goals**: Result badge update appears immediately after selection with no observable delay in normal host interaction  
**Constraints**: Preserve existing submission/progression formulas; keep route structure unchanged; UI polish must not regress accessibility/readability  
**Scale/Scope**: Create-event player panel and run-event court cards/modal result presentation; no large backend schema migration expected

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Constitution file: `/home/tor-mattsson/repos/padel-app/Padel-app-specdrive-v1/.specify/memory/constitution.md`
- Observation: document is still placeholder text and defines no enforceable principles or gates.
- Gate result before Phase 0: PASS (no explicit constraints to violate)
- Gate result after Phase 1: PASS (design remains within existing app architecture)

## Project Structure

### Documentation (this feature)

```text
specs/002-run-result-badges/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── inline-team-result-badges-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── app/
│   ├── api/
│   ├── services/
│   └── repositories/
└── tests/

frontend/
├── public/
├── src/
│   ├── app/
│   ├── components/
│   ├── features/
│   ├── pages/
│   ├── lib/
│   └── styles/
└── tests/
```

**Structure Decision**: Keep existing monorepo structure; implement feature mostly in frontend (`PlayerSelector`, `RunEvent`, `CourtGrid`, styles, tests) with backend behavior unchanged except compatibility verification.

## Complexity Tracking

No constitution violations or complexity exceptions identified.
