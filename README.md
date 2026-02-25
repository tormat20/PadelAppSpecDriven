# Padel Host App (MVP)

Monorepo with backend (FastAPI + DuckDB) and frontend (React + TypeScript + Vite).

## Backend

```bash
cd backend
uv venv
uv sync
uv run fastapi dev app/main.py
```

Run tests:

```bash
cd backend
uv run pytest
```

Lint/type-check:

```bash
cd backend
uv run ruff check .
uv run ruff format --check .
uv run mypy app
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Lint/test:

```bash
cd frontend
npm run lint
npm run test
```
