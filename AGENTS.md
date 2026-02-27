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
- 011-summary-rank-ordering: Added TypeScript 5.x + React 18 (frontend), Python 3.12 + FastAPI (backend) + React Router, Vite, Vitest, FastAPI, Pydantic, DuckDB repositories
- 010-nav-prism-crowns: Added TypeScript 5.x + React 18 (frontend), Python 3.12 (backend API response updates) + React Router, Vite, Vitest, FastAPI, Pydantic, DuckDB-backed repositories, OGL-based prism rendering dependency behavior per provided implementation
- 001-branding-interaction-polish: Added TypeScript 5.x + React 18 (frontend), CSS modules/stylesheets in existing frontend style system + React Router, Vite, Vitest, existing in-repo MagicBento and branding components


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
