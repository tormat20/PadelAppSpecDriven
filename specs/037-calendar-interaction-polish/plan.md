# Implementation Plan: Calendar interaction modes + template drag-create

**Branch**: `037-calendar-interaction-polish` | **Date**: 2026-03-22 | **Spec**: `specs/037-calendar-interaction-polish/spec.md`
**Input**: Feature specification from `specs/037-calendar-interaction-polish/spec.md`

## Summary

Polish the `/calendar` experience by separating move and resize interaction modes on event cards, adding strict bottom-edge resizing with 30-minute granularity and 60/90/120 limits, and introducing a draggable template panel that creates new empty events in grid slots. Preserve existing route guards, EventRecord-compatible local state semantics, visible drop-preview behavior, and app-consistent interactive glare styling.

## Technical Context

**Language/Version**: TypeScript 5.x + React 18.3  
**Primary Dependencies**: React Router DOM 6, Vite 5, existing in-repo calendar components/helpers, existing interactive surface styling patterns  
**Storage**: Frontend in-memory calendar state initialized from existing event data (no expanded backend persistence in this phase)  
**Testing**: Vitest 2 frontend tests  
**Target Platform**: Web app, desktop-first interaction with existing responsive behavior  
**Project Type**: Web application (frontend-focused update)  
**Performance Goals**: Pointer interactions (move/resize/preview) should render without visible lag in typical weekly-view usage  
**Constraints**: Preserve `/calendar` access behavior; avoid full Figma UI import and global Tailwind reset; enforce resize zone and duration limits; keep non-goals out of scope  
**Scale/Scope**: Single-page calendar interaction enhancement with test updates in existing frontend suite

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Constitution file at `.specify/memory/constitution.md` is a placeholder template with no enforceable constraints.
- Gate result (pre-research): **PASS**.
- Development standards source: `AGENTS.md` + existing repo conventions.
- Gate result (post-design): **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/037-calendar-interaction-polish/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── interaction-modes.md
│   └── template-drag-create.md
└── tasks.md
```

### Source Code (repository root)

```text
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

**Structure Decision**: Implement exclusively in existing frontend calendar architecture and use Figma project as behavior reference only.

## Phase 0: Research Plan

1. Define robust mode switching between body drag and bottom-edge resize, including conflict prevention.
2. Define 4px resize-zone detection behavior and cursor affordance expectations.
3. Define template drag payload and default new-event field mapping (including Team Mexicano semantics).
4. Define interactive glare styling approach that matches current app surface behavior without introducing global style side effects.

## Phase 1: Design Outputs

1. Model interaction and template entities/flows in `data-model.md`.
2. Capture behavioral contracts for interaction modes and template create/drop in `contracts/`.
3. Define verification flow and expected outputs in `quickstart.md`.
4. Refresh agent context via `.specify/scripts/bash/update-agent-context.sh opencode`.

## Complexity Tracking

No constitutional violations requiring justification.
