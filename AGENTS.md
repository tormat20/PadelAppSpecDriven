# Padel-app-specdrive-v1 Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-26

## Active Technologies
- TypeScript 5.x, React 18, Node.js 20+ tooling + React Router, Vite, Vitest (001-player-selection-favicon)
- Existing backend persistence for player catalog; draft assignment state persisted for active draft (frontend-managed persistence layer) (001-player-selection-favicon)
- TypeScript 5.x, React 18, Node.js 20+ tooling; Python backend with FastAPI + React Router, Vite, Vitest (frontend); FastAPI backend API (001-event-progress-ux)
- Existing backend player/event persistence + frontend local draft state (001-event-progress-ux)
- TypeScript 5.x + React 18 (frontend), Python 3.12 + FastAPI (backend) + React Router, Vite, Vitest, FastAPI, DuckDB persistence layer (001-event-progress-ux)
- Existing backend event/player/match persistence + frontend local draft state (001-event-progress-ux)
- Existing backend event/player/match persistence and frontend in-memory + local draft state (002-run-result-badges)
- Python 3.12 (backend), TypeScript 5.x + React 18 (frontend display updates) + FastAPI, DuckDB-backed repositories, React Router, Vite/Vitest (001-tournament-engine-summary)
- Existing backend event/round/match/player persistence; no schema migration required (001-tournament-engine-summary)
- TypeScript 5.x + React 18 (frontend), CSS modules/stylesheets in existing frontend style system + React Router, Vite, Vitest, existing in-repo MagicBento and branding components (001-branding-interaction-polish)
- N/A (visual and interaction behavior only; no persistence changes) (001-branding-interaction-polish)
- TypeScript 5.x + React 18 (frontend), Python 3.12 (backend API response updates) + React Router, Vite, Vitest, FastAPI, Pydantic, DuckDB-backed repositories, OGL-based prism rendering dependency behavior per provided implementation (010-nav-prism-crowns)
- Existing backend event/round/match/player persistence; no schema migration expected (010-nav-prism-crowns)
- TypeScript 5.x + React 18 (frontend), Python 3.12 + FastAPI (backend) + React Router, Vite, Vitest, FastAPI, Pydantic, DuckDB repositories (011-summary-rank-ordering)
- Existing DuckDB-backed event/round/match/player/ranking persistence; no schema migration planned (011-summary-rank-ordering)
- Existing player/event/match persistence; no migration required (012-event-player-logic)
- TypeScript 5.x + React 18 (frontend), Python 3.12 + FastAPI (backend) + React Router, Vite, Vitest, FastAPI, Pydantic, DuckDB-backed SQL repositories (013-planned-event-slots)
- Existing DuckDB event/player/match persistence with event schema updates for planning metadata and optimistic concurrency version (013-planned-event-slots)
- Existing DuckDB event/player/match persistence with event metadata and optimistic concurrency version fields (014-dual-event-creation)
- Existing DuckDB persistence for events/rounds/matches/results; persisted run-state and round pointer are source of truth (015-resume-ongoing-events)
- Existing DuckDB persistence for events/rounds/matches/results with setup-status and runtime status fields as event-state source-of-truth (016-event-state-restart)
- TypeScript 5.9, React 18.3 + React Router DOM 6, Vite 5, Vitest 2, `motion` (new, to be `npm install`ed) (017-create-event-stepper)
- Backend DuckDB via existing REST API (`createEvent`, `updateEvent`); `localStorage` draft for player list (017-create-event-stepper)
- TypeScript 5.x + React 18.3 + React Router DOM 6, Vite 5, Vitest 2, `motion` (already installed) (018-nav-ui-polish)
- No new persistence — player creation uses the existing `POST /api/v1/players` endpoint via `createPlayer()` in `lib/api.ts`; event-slot view state (filter, sort, mode blobs) continues to use `localStorage` under existing keys (018-nav-ui-polish)
- Python 3.12 (backend), TypeScript 5.x + React 18.3 (frontend) + FastAPI, DuckDB (backend); React Router DOM 6, Vite 5, Vitest 2 (frontend) (033-player-management-reset)
- DuckDB via existing repositories — no new tables, no migration (033-player-management-reset)
- Python 3.12 (backend), TypeScript 5.x + React 18.3 (frontend) + FastAPI, Pydantic, DuckDB repositories (backend); React Router DOM 6, Vite 5, Vitest 2 (frontend) (034-streak-summary-edit)
- DuckDB event/round/match/result persistence; existing event summary projection data (034-streak-summary-edit)
- DuckDB event/round/match/result persistence with existing run-state fields and correction audit table (035-previous-round-correction)
- TypeScript 5.x + React 18.3 + React Router DOM 6, Vite 5, existing calendar components/helpers, optional minimal extraction of Figma drag/drop interaction logic (without full generated UI kit) (036-calendar-dnd-eventrecord)
- Frontend in-memory calendar state initialized from existing event API responses (no write persistence in this phase) (036-calendar-dnd-eventrecord)
- TypeScript 5.x + React 18.3 + React Router DOM 6, Vite 5, existing in-repo calendar components/helpers, existing interactive surface styling patterns (037-calendar-interaction-polish)
- Frontend in-memory calendar state initialized from existing event data (no expanded backend persistence in this phase) (037-calendar-interaction-polish)
- TypeScript 5.x + React 18.3 (frontend), Python 3.12 (backend API response updates) + React Router, Vite, Vitest, FastAPI, Pydantic, DuckDB-backed repositories, existing interactive-surface style system (038-calendar-staged-save)
- Existing backend event/round/match/player persistence + frontend staged local calendar state before save (038-calendar-staged-save)
- Python 3.12 (backend), TypeScript 5.x + React 18.3 (frontend) + FastAPI, Pydantic, DuckDB repositories, React Router DOM 6, Vite 5, Vitest 2 (038-calendar-staged-save)
- Existing DuckDB event/round/match/player persistence + frontend staged local calendar state (038-calendar-staged-save)

- TypeScript 5.x, React 18, Node.js 20+ for tooling + React, React Router, Vite, Vitest (001-frontend-visual-redesign)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x, React 18, Node.js 20+ for tooling: Follow standard conventions

## Recent Changes
- 038-calendar-staged-save: Added Python 3.12 (backend), TypeScript 5.x + React 18.3 (frontend) + FastAPI, Pydantic, DuckDB repositories, React Router DOM 6, Vite 5, Vitest 2
- 038-calendar-staged-save: Added TypeScript 5.x + React 18.3 (frontend), Python 3.12 (backend API response updates) + React Router, Vite, Vitest, FastAPI, Pydantic, DuckDB-backed repositories, existing interactive-surface style system
- 037-calendar-interaction-polish: Added TypeScript 5.x + React 18.3 + React Router DOM 6, Vite 5, existing in-repo calendar components/helpers, existing interactive surface styling patterns


## Git Workflow

- Create a new branch when starting a new feature: `git checkout -b <feature-branch>`
- After implementation is complete and tests pass: `git add -A && git commit -m "<message>"`
- Push the branch: `git push -u origin <feature-branch>`
- **Do NOT create PRs or merge branches** — that is handled manually outside this workflow

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
