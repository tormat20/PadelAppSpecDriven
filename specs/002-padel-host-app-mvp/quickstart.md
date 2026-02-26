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

## 2) Run backend API

```bash
cd backend
uv run fastapi dev app/main.py
```

API base URL: `http://127.0.0.1:8000/api/v1`

## 3) Backend checks

```bash
cd backend
PYTHONPATH=. uv run pytest
uv run ruff check .
```

## 4) Frontend setup

```bash
cd frontend
npm install
```

## 5) Run frontend

```bash
cd frontend
npm run dev
```

Frontend URL: `http://127.0.0.1:5173`

## 6) Manual MVP validation flow
1. Create at least 8 players.
2. Create an Americano event with 2 selected courts.
3. Start event and verify round 1 court assignments are visible.
4. Enter all court results and advance round.
5. Repeat until event is finished and verify summary standings and match history.
6. Repeat with Mexicano and verify score sum validation (`0..24`, total = 24).
7. Repeat with Beat the Box and verify global ranking updates persist into the next event.

## 7) API smoke examples

```bash
# create player
curl -X POST http://127.0.0.1:8000/api/v1/players \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Alice"}'

# create event
curl -X POST http://127.0.0.1:8000/api/v1/events \
  -H "Content-Type: application/json" \
  -d '{"eventName":"Thursday Padel","eventType":"Americano","eventDate":"2026-02-26","selectedCourts":[1,2],"playerIds":[]}'
```
