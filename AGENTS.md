# Padel-app-specdrive-v1 Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-26

## Active Technologies
- TypeScript 5.x, React 18, Node.js 20+ tooling + React Router, Vite, Vitest (001-player-selection-favicon)
- Existing backend persistence for player catalog; draft assignment state persisted for active draft (frontend-managed persistence layer) (001-player-selection-favicon)
- TypeScript 5.x, React 18, Node.js 20+ tooling; Python backend with FastAPI + React Router, Vite, Vitest (frontend); FastAPI backend API (001-event-progress-ux)
- Existing backend player/event persistence + frontend local draft state (001-event-progress-ux)
- TypeScript 5.x + React 18 (frontend), Python 3.12 + FastAPI (backend) + React Router, Vite, Vitest, FastAPI, DuckDB persistence layer (001-event-progress-ux)
- Existing backend event/player/match persistence + frontend local draft state (001-event-progress-ux)

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
- 001-event-progress-ux: Added TypeScript 5.x + React 18 (frontend), Python 3.12 + FastAPI (backend) + React Router, Vite, Vitest, FastAPI, DuckDB persistence layer
- 001-event-progress-ux: Added TypeScript 5.x, React 18, Node.js 20+ tooling; Python backend with FastAPI + React Router, Vite, Vitest (frontend); FastAPI backend API
- 001-player-selection-favicon: Added TypeScript 5.x, React 18, Node.js 20+ tooling + React Router, Vite, Vitest


<!-- MANUAL ADDITIONS START -->
- UI interaction guidance: For event-flow interactive cards/buttons, use Magic Bento-inspired effects as default (`enableSpotlight=true`, `enableBorderGlow=true`, `clickEffect=true`, `enableTilt=false`, `enableMagnetism=false`) with subtle hover lift + border glow and clear selected states.
<!-- MANUAL ADDITIONS END -->
