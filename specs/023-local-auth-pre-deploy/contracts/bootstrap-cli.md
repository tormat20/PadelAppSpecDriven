# Contract: Bootstrap CLI Script

**Feature**: `023-local-auth-pre-deploy`  
**Interface type**: Command-line interface  
**Entry point**: `python -m app.scripts.seed_admin`  
**Created**: 2026-03-05

---

## Invocation

```bash
# From backend/ directory, with virtual environment active:
python -m app.scripts.seed_admin --email admin@example.com --password mysecretpass

# Or with interactive prompt (if --email / --password omitted):
python -m app.scripts.seed_admin
# > Email: admin@example.com
# > Password: (hidden input)
```

---

## Arguments

| Argument | Required | Description |
|---|---|---|
| `--email EMAIL` | Optional | Email for the admin account. Prompted interactively if omitted. |
| `--password PASSWORD` | Optional | Password for the admin account. Prompted securely (hidden) if omitted. |
| `--help` | — | Print usage and exit |

---

## Behaviour

1. Validate the email format (must contain `@` and a dot in domain part). Exit with error if invalid.
2. Validate the password length (must be ≥ 8 characters). Exit with error if too short.
3. Normalise email to lowercase.
4. Open a DuckDB connection using `settings.db_path` (reads from `.env` / `PADEL_DB_PATH` env var).
5. Hash the password using bcrypt.
6. Upsert the user: `INSERT INTO users ... ON CONFLICT (email) DO UPDATE SET hashed_password = EXCLUDED.hashed_password, role = 'admin'`.
7. Print a confirmation message and exit 0.

The script is **idempotent**: running it multiple times with the same email updates the password and ensures the role is `admin`. It never creates duplicates.

---

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Success — admin account created or updated |
| `1` | Validation error (invalid email or short password) |
| `1` | Database error (DB file not found, migration not run, etc.) |

---

## Stdout / stderr

```
# Success:
✓ Admin account created/updated for admin@example.com

# Validation error (stderr):
Error: Invalid email format

# Validation error (stderr):
Error: Password must be at least 8 characters

# DB error (stderr):
Error: Could not connect to database at padel.duckdb — run migrations first
```

---

## Configuration read

The script reads `settings.db_path` from `app.core.config.settings`, which in turn reads `PADEL_DB_PATH` (with prefix `PADEL_`) from the environment or a `backend/.env` file. No separate configuration is needed.

---

## Security notes

- Password is accepted via argument or secure interactive prompt (`getpass.getpass`)
- If passed via `--password` argument, it will appear in shell history — the interactive prompt is safer for production use
- The hashed password stored in the DB is a bcrypt hash; the plain-text password is not logged anywhere
