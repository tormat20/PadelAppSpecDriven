# AGENTS.md

Operational guide for coding agents working in `Padel-app-specdrive-v1`.

## Scope and Priority

- This file applies to the entire repository.
- If user instructions conflict with this file, follow the user.
- If deeper-directory AGENTS files are added in the future, the deeper file wins for that subtree.

## Rule Sources Checked

- Cursor rules: no `.cursor/rules/` and no `.cursorrules` found.
- Copilot rules: no `.github/copilot-instructions.md` found.
- Therefore, use the conventions documented below as the active project standards.

## Repository Layout

```text
backend/    FastAPI + DuckDB + pytest
frontend/   React + TypeScript + Vite + Vitest
specs/      Spec-driven docs (spec/plan/tasks/research/contracts)
```

Key folders:

- Backend app code: `backend/app/`
- Backend tests: `backend/tests/`
- Frontend app code: `frontend/src/`
- Frontend tests: `frontend/tests/`

## Environment and Toolchain

- Python: `>=3.12` (see `backend/pyproject.toml`)
- Node: modern Node compatible with Vite 5 / TypeScript 5
- Frontend package manager: `npm`

## Build / Lint / Test Commands

Run commands from repo root unless noted.

### Frontend

- Install deps: `cd frontend && npm install`
- Dev server: `cd frontend && npm run dev`
- Build: `cd frontend && npm run build`
- Type/lint check: `cd frontend && npm run lint`
- Run all tests: `cd frontend && npm test`

Single test file:

- `cd frontend && npm test -- --run tests/calendar-event-block.test.ts`
- `cd frontend && npm test -- --run tests/preview-edit-event-flow.test.tsx`

Single test by name pattern:

- `cd frontend && npm test -- --run tests/calendar-api-integration.test.ts -t "normalizes legacy events"`

### Backend

- Install deps (example): `cd backend && pip install -e .[dev]` (or your local venv flow)
- Dev server: `cd backend && PYTHONPATH=. uvicorn app.main:app --reload`
- Run all tests: `cd backend && PYTHONPATH=. pytest`

Single backend test file:

- `cd backend && PYTHONPATH=. pytest tests/contract/test_events_api.py`

Single backend test function:

- `cd backend && PYTHONPATH=. pytest tests/contract/test_events_api.py::test_delete_all_events_removes_all_created_events`

Filter backend tests by keyword:

- `cd backend && PYTHONPATH=. pytest -k staged_save`

## Typical Verification Sequence

For frontend-only changes:

1. `cd frontend && npm run lint`
2. `cd frontend && npm test -- --run <affected-test-files>`
3. Optional full pass: `cd frontend && npm test`

For backend-only changes:

1. `cd backend && PYTHONPATH=. pytest tests/<affected files>`
2. Optional full pass: `cd backend && PYTHONPATH=. pytest`

For cross-stack changes:

1. Frontend lint + targeted tests
2. Backend targeted contract/integration tests
3. Full frontend + backend suites before merge

## Code Style Guidelines

### TypeScript / React

- Use TypeScript everywhere; avoid `any` unless unavoidable.
- Prefer explicit domain types from `frontend/src/lib/types.ts`.
- Use functional components and hooks.
- Keep components focused; extract pure helpers for testability.
- Use named exports for helpers and types; default export for page/component roots is acceptable.
- Import order convention:
  1) external packages,
  2) internal absolute/relative modules,
  3) type-only imports where useful.
- Existing style uses double quotes and no semicolons; match file-local style.
- Prefer immutable updates (`map`, `filter`, spreads) over in-place mutation.
- Keep UI state transitions explicit and predictable (especially staged-save flows).
- Add accessibility attributes for interactive non-button elements (`role`, `tabIndex`, key handlers).

### CSS

- Reuse existing design tokens/variables (`--color-*`, `--space-*`, etc.).
- Extend current class naming patterns (BEM-like: `block__element--modifier`).
- Avoid introducing one-off inline styles unless dynamic positioning is required.
- Preserve responsive behavior; desktop/laptop refinements must not break mobile.

### Python / FastAPI

- Follow existing layered architecture:
  - router -> service -> repository
- Keep business logic in services, persistence in repositories, schema mapping in routers/schemas.
- Type annotate function signatures and return values.
- Raise `DomainError` for domain-level failures; map to `HTTPException` in routers.
- Preserve optimistic concurrency/version checks where present.
- Keep transactions explicit for batch/all-or-nothing operations.

## Naming Conventions

- Frontend components: `PascalCase.tsx`
- Frontend helpers/hooks: `camelCase.ts`, hooks prefixed with `use`
- Test files: `<feature>.test.ts` or `.test.tsx`
- Python modules/functions: `snake_case`
- Pydantic/FastAPI schema fields should remain API-compatible (existing camelCase response fields)

## Error Handling Conventions

- Frontend:
  - Surface user-friendly messages for failed API actions.
  - Do not silently swallow errors in critical flows.
  - Keep staged edits intact when save fails (retry-friendly behavior).
- Backend:
  - Convert service/repository exceptions into consistent API error payloads.
  - Use specific status codes (`400`, `404`, `409`, etc.) per current router patterns.

## Testing Expectations

- Add/adjust tests with behavior changes.
- Prefer targeted tests for new logic first, then broader regression runs.
- Keep tests deterministic and small where possible.
- For calendar features, validate both pure helper outputs and interaction contracts.

## Specs Workflow Notes

- Feature specs live under `specs/<id>-<name>/`.
- If task lists exist, keep task checkboxes in sync with real completion state.
- When behavior changes materially, update `spec.md`, `plan.md`, and `tasks.md` together.

## Practical Guardrails for Agents

- Do not revert unrelated dirty worktree changes.
- Do not use destructive git commands unless explicitly requested.
- Do not commit secrets (`.env`, credentials files).
- Keep diffs minimal and focused on requested behavior.
- Prefer fixing root causes over patching test expectations only.

## Quick Commands Reference

- Frontend lint: `cd frontend && npm run lint`
- Frontend all tests: `cd frontend && npm test`
- Frontend single file: `cd frontend && npm test -- --run tests/<file>.test.ts`
- Backend all tests: `cd backend && PYTHONPATH=. pytest`
- Backend single test: `cd backend && PYTHONPATH=. pytest tests/<file>.py::test_name`

## Active Technologies
- Python 3.12 (backend), TypeScript 5.x + React 18.3 (frontend) + FastAPI, Pydantic, DuckDB repositories, React Router DOM 6, Vite 5, Vitest 2 (039-popup-editor-save)
- Existing DuckDB event/round/match/player persistence + frontend staged local calendar change state (039-popup-editor-save)
- Python 3.12 (backend), TypeScript 5.x + React 18.3 (frontend) + FastAPI, Pydantic, DuckDB, React, Vite, Vitest (040-ocr-correction-learning)
- DuckDB (new persistent correction-memory table) (040-ocr-correction-learning)

## Recent Changes
- 039-popup-editor-save: Added Python 3.12 (backend), TypeScript 5.x + React 18.3 (frontend) + FastAPI, Pydantic, DuckDB repositories, React Router DOM 6, Vite 5, Vitest 2

## Completion Footer Policy (Required)

At the end of every assistant response, include a completion footer.

Use the footer style conditionally:

1. If the task is fully complete and no meaningful follow-up is needed:
   - `done`

2. If the task is complete but there is a clear logical next action:
   - `this is next: <short next action>`

3. If one of the structured states is materially useful, use:

   - `DONE` when fully completed (and include `WHAT'S NEXT` only if useful)
   - `PARTIAL` when partially completed (must include what remains)
   - `BLOCKED` when progress is blocked (must include blocker + required input)
   - `WHAT'S NEXT` for the immediate next step when helpful

Structured footer format:

`STATUS: DONE | PARTIAL | BLOCKED`
`WHAT'S NEXT: <single concise next step>`

Rules:
- Do not include unnecessary status labels when simple `done` or `this is next` is clearer.
- Prefer concise, one-line endings.
- Never omit completion signaling.
