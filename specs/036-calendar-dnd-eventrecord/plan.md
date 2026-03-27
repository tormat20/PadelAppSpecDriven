# Implementation Plan: Calendar Drag-and-Drop POC on EventRecord

**Branch**: `036-calendar-dnd-eventrecord` | **Date**: 2026-03-22 | **Spec**: `specs/036-calendar-dnd-eventrecord/spec.md`
**Input**: Feature specification from `specs/036-calendar-dnd-eventrecord/spec.md`

## Summary

Replace the `/calendar` placeholder with a working weekly drag-and-drop scheduler that operates on EventRecord-compatible state. The implementation will adapt only minimal interaction logic from the Figma prototype, keep updates local in memory for phase 1, constrain duration updates to 60/90/120 minutes, and preserve existing app route guards, visual identity, and interaction patterns.

## Technical Context

**Language/Version**: TypeScript 5.x + React 18.3  
**Primary Dependencies**: React Router DOM 6, Vite 5, existing calendar components/helpers, optional minimal extraction of Figma drag/drop interaction logic (without full generated UI kit)  
**Storage**: Frontend in-memory calendar state initialized from existing event API responses (no write persistence in this phase)  
**Testing**: Vitest 2 frontend tests  
**Target Platform**: Web desktop-first (existing responsive shell)  
**Project Type**: Web application (frontend + backend repo, frontend-focused change)  
**Performance Goals**: Drag/drop and duration updates reflect in UI within one interaction frame; no visible jank during normal weekly view usage  
**Constraints**: Preserve existing `/calendar` route access behavior; avoid broad global style resets; constrain duration to 60/90/120; do not expand scope to backend persistence  
**Scale/Scope**: POC-level integration on one page with existing event datasets and current calendar test surface

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Constitution file at `.specify/memory/constitution.md` is currently an unfilled template with placeholder principles and no enforceable project rules.
- Gate result (pre-research): **PASS (no active constitutional constraints to violate)**.
- Planning policy applied: follow repository standards from `AGENTS.md` (existing stack, commands, and non-destructive workflow).
- Gate result (post-design): **PASS**; generated artifacts remain within repository standards and feature scope.

## Project Structure

### Documentation (this feature)

```text
specs/036-calendar-dnd-eventrecord/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── calendar-eventrecord-mapping.md
│   └── calendar-dnd-poc-behavior.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/
└── tests/

frontend/
├── src/
│   ├── app/
│   ├── components/calendar/
│   ├── pages/
│   ├── lib/
│   └── styles/
└── tests/

figma/Calendar with Drag-and-Drop(1)/
```

**Structure Decision**: Use the existing web-application structure and implement the POC entirely in `frontend/` with selective reference/extraction from `figma/Calendar with Drag-and-Drop(1)/`.

## Phase 0: Research Plan

1. Resolve Team Mexicano representation in calendar state while staying EventRecord-compatible.
2. Resolve duration source-of-truth for POC edits without backend write persistence.
3. Compare minimal drag/drop reuse options: existing app drag model vs. extracted Figma interaction logic.
4. Confirm styling strategy that avoids Tailwind/global-reset collisions and preserves app theme.

## Phase 1: Design Outputs

1. Define calendar-local EventRecord-derived data model and validation rules in `data-model.md`.
2. Define behavioral contracts for mapping and drag/drop interactions in `contracts/`.
3. Provide a verification-oriented `quickstart.md` covering route access, drag/drop updates, and duration constraints.
4. Update agent context via `.specify/scripts/bash/update-agent-context.sh opencode`.

## Complexity Tracking

No constitutional violations requiring justification.
