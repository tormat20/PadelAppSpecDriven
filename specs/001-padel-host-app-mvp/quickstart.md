# Quickstart - Padel Host App (MVP)

## Prerequisites
- Python 3.12+
- Node.js 20+
- `uv` installed

## 1) Backend setup

```bash
cd backend
uv venv
uv sync
```

## 2) Run backend

```bash
cd backend
uv run fastapi dev app/main.py
```

API base URL: `http://127.0.0.1:8000/api/v1`

## 3) Backend tests

```bash
cd backend
uv run pytest
uv run pytest tests/unit/test_scheduling_service.py
uv run pytest tests/integration/test_event_flow.py::test_americano_full_flow
```

## 4) Backend lint/type-check

```bash
cd backend
uv run ruff check .
uv run ruff format --check .
uv run mypy app
```

## 5) Frontend setup

```bash
cd frontend
npm install
```

## 6) Run frontend

```bash
cd frontend
npm run dev
```

Frontend URL: `http://127.0.0.1:5173`

## 7) Frontend checks

```bash
cd frontend
npm run lint
npm run test
```

## 8) Manual MVP verification flow
1. Create 8 players.
2. Create an Americano event with courts 1 and 2.
3. Add all 8 players and start event.
4. Enter results for round 1 matches.
5. Advance to round 2 and verify assignments changed.
6. Complete final round and finish event.
7. Verify summary has final standings and full match history.
8. Repeat with BeatTheBox and verify global ranking changes persist.

## 9) API smoke examples

```bash
# create player
curl -X POST http://127.0.0.1:8000/api/v1/players \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Alice"}'

# create event
curl -X POST http://127.0.0.1:8000/api/v1/events \
  -H "Content-Type: application/json" \
  -d '{"eventName":"Thursday Padel","eventType":"Americano","eventDate":"2026-02-25","selectedCourts":[1,2]}'
```
