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

## User Accounts

### Access tiers

| Role | How to create | What they can do |
|---|---|---|
| **admin** | CLI seed script (see below) | Full access — create/manage events, players, rounds |
| **user** | Self-signup at `/create-account` | Read-only access to events and summaries |
| **guest** | No account needed | Public pages only (player search, leaderboards) |

---

### Create the first admin (CLI)

Run this once after cloning the repo and starting the backend for the first time:

```powershell
cd backend
$env:PYTHONPATH="."; uv run python -m app.scripts.seed_admin
```

The script will prompt for an email and password (minimum 8 characters). The user is created with `role=admin` and is immediately able to log in.

---

### Add more admins

Run the same script again with a different email. Existing admins are **not affected** — the script is an upsert keyed on email, so every new email creates an additional admin alongside all existing ones.

```powershell
cd backend
$env:PYTHONPATH="."; uv run python -m app.scripts.seed_admin
```

Running the script with an email that **already exists** will reset that user's password — useful if an admin forgets their credentials.

---

### Normal user accounts

Users self-register through the app at:

```
http://localhost:5173/create-account
```

They enter an email and password and are automatically assigned `role=user`. No admin action required.
