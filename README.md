# Padel Host App (MVP)

Monorepo with backend (FastAPI + DuckDB) and frontend (React + TypeScript + Vite).

---

## Docker — run on any machine

> **Requires:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) (free). Nothing else.

### 1. One-time setup — generate a secret key

The app needs a JWT secret to sign login tokens. Run this once and save the result in a file called `.env` in the repo root:

**macOS / Linux:**
```bash
echo "PADEL_JWT_SECRET_KEY=$(openssl rand -hex 32)" > .env
```

**Windows (PowerShell):**
```powershell
"PADEL_JWT_SECRET_KEY=$(openssl rand -hex 32)" | Out-File -Encoding utf8 .env
```

> If you don't have `openssl`, just paste any long random string (40+ characters) as the value.

### 2. Start the app

```bash
docker compose up --build
```

Open **http://localhost** in your browser. That's it.

- First build takes ~2 minutes (downloads images, installs dependencies).
- Subsequent starts are fast — layers are cached.
- Your data (players, events, results) is stored in a Docker volume and survives restarts.

### 3. Create an admin account (first run only)

```bash
docker compose exec backend python -m app.scripts.seed_admin
```

The script will prompt for an email and password.

### 4. Stop

```bash
docker compose down          # stop containers, keep data
docker compose down -v       # stop containers AND wipe the database
```

### Double-click launcher

You can also start the app by double-clicking a file — no terminal needed.
See [`launch/`](./launch/) for platform-specific launcher scripts.

---

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


```linux
cd backend
PYTHONPATH="." uv run python -m app.scripts.seed_admin
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


PADEL_JWT_SECRET_KEY=3c22ed4af48603c77404eca9628dd05c87e508c3db55a9b6550f6686ee983500
PADEL_JWT_ALGORITHM=HS256
PADEL_JWT_EXPIRE_MINUTES=480
PADEL_CORS_ORIGINS=["http://localhost:5173","http://127.0.0.1:5173"]
PADEL_DB_PATH=padel.duckdb
