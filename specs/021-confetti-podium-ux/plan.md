# Implementation Plan: Confetti Celebration, Winner Podium, and Event Creation UX Polish

**Branch**: `021-confetti-podium-ux` | **Date**: 2026-03-04 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/021-confetti-podium-ux/spec.md`

## Summary

Add a confetti burst animation on final summary entry, a winner podium (Mexicano: 1 player/slot; WinnersCourt: 2 players/slot; BeatTheBox: none), and five small Create-Event UX polish items: Setup step labels for mode and date, "Today's date" button repositioned above the date field and recoloured orange, and inline orange roster-validation hints on the Roster step.

Backend change: add `eventType` to `FinalSummaryResponse`. Frontend changes: new `confetti.ts` helper, new `podium.ts` helper, new `Podium.tsx` component, new `rosterHints.ts` helper, wiring changes in `Summary.tsx` and `CreateEvent.tsx`, CSS additions in `components.css`.

## Technical Context

**Language/Version**: TypeScript 5.x (frontend), Python 3.12 (backend)  
**Primary Dependencies**: React 18.3, React Router DOM 6, Vite 5, Vitest 2, `canvas-confetti` (to install), FastAPI, Pydantic, DuckDB  
**Storage**: DuckDB-backed repositories (backend); no schema migration required  
**Testing**: Vitest 2 (frontend unit tests in `frontend/tests/`); pytest (backend — no new backend tests needed)  
**Target Platform**: Web (desktop-first, responsive)  
**Project Type**: Web application (frontend + backend)  
**Performance Goals**: Confetti sequence completes in ~1 s with no layout shift; podium renders synchronously from pre-fetched summary data  
**Constraints**: `canvas-confetti` must be optional/progressive-enhancement (summary must render if it fails); no new colour tokens — reuse `var(--color-warning-text)`  
**Scale/Scope**: Single-page changes across ~8 files

## Constitution Check

No violations. All changes are additive, frontend-focused, and use existing patterns. The one backend change (adding a field to a Pydantic response schema) is non-breaking.

## Project Structure

### Documentation (this feature)

```text
specs/021-confetti-podium-ux/
├── plan.md              ← this file
├── research.md          ← Phase 0 codebase findings
├── data-model.md        ← entity shapes and API contract
├── quickstart.md        ← local setup notes
└── tasks.md             ← 28 implementation tasks
```

### Source Code

```text
backend/
├── app/api/schemas/summary.py      ← add eventType field to FinalSummaryResponse
└── app/api/routers/events.py       ← pass event.event_type into FinalSummaryResponse(...)

frontend/
├── src/
│   ├── lib/
│   │   ├── types.ts                ← add eventType to FinalEventSummary
│   │   └── api.ts                  ← pass eventType in normalizeFinalSummaryResponse
│   ├── features/
│   │   ├── summary/
│   │   │   ├── confetti.ts         ← NEW: scheduleConfettiBursts()
│   │   │   └── podium.ts           ← NEW: buildPodiumSlots()
│   │   └── create-event/
│   │       └── rosterHints.ts      ← NEW: getRosterHints()
│   ├── components/
│   │   └── summary/
│   │       └── Podium.tsx          ← NEW: <Podium> component
│   ├── pages/
│   │   ├── Summary.tsx             ← wire confetti useEffect + <Podium>
│   │   └── CreateEvent.tsx         ← add labels, reorder Today btn, add inline hints
│   └── styles/
│       └── components.css          ← add .podium-*, .section-label; update .today-date-link
└── tests/
    ├── summary-confetti.test.ts    ← NEW
    ├── summary-podium.test.ts      ← NEW
    └── roster-hints.test.ts        ← NEW
```

## Complexity Tracking

No constitution violations — table not required.
