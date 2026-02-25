## Required SQL Structure

All query SQL must live in:

backend/app/repositories/sql/


### Example Structure
backend/app/repositories/
players_repo.py
events_repo.py
sql/
players/
get_by_id.sql
insert.sql
events/
create.sql
get_by_id.sql


Repositories must load SQL from files and execute them.

Python code may:
- Pass parameters
- Handle transactions
- Map results to domain models

Python code must **not** define SQL strings.

---

## Allowed Exceptions

SQL is allowed only in the following locations:

### 1. Schema Migrations
backend/app/db/migrations/*.sql


These files define schema creation and evolution.

---

### 2. Minimal Database Initialization

If necessary, minimal database configuration statements (e.g., DuckDB settings or pragmas) may exist in:

backend/app/db/connection.py


This must be limited strictly to database configuration — not queries.

No other exceptions are allowed.

---

# 6. Test Requirements (MVP Acceptance)

## Backend Unit Tests — Required

Each event mode must have pure domain-level unit tests.

### Americano
- Court movement logic
- Score update logic

### Mexicano
- Score validation (0–24)
- Player ranking regrouping
- Prevent same partner in consecutive rounds

### Beat the Box
- 4-player rotation scheduling
- Global ranking update logic (+25 / -15 / +5)

These tests must:
- Target domain functions only
- Avoid database dependencies
- Run deterministically

---

## Backend Integration Tests — Required

Each event mode must have one full lifecycle integration test:

1. Create event (Lobby)
2. Start event (Round 1 generated)
3. Submit match results via:

POST /matches/{matchId}/result


4. Advance rounds
5. Finish event
6. Validate summary output

Integration coverage is required for:

- Americano
- Mexicano
- Beat the Box

Tests must verify:
- Correct round transitions
- Correct scoring
- Correct persistence of matches and standings

---

## Frontend Tests

Frontend testing is optional for MVP.

Minimum requirement:
- TypeScript compiles successfully
- No runtime errors in primary flow
- Core event flow works manually (Create → Start → Run → Finish)

Backend correctness is prioritized for MVP.

---

# Enforcement

All `/speckit.implement` execution must follow this document.

Implementation must not:

- Introduce inline SQL outside allowed locations
- Mix domain logic with persistence
- Violate UUID strategy
- Replace canonical result endpoint
- Add unauthorized event statuses

If any of these violations occur, they must be corrected before proceeding to the next task.

This document overrides any ambiguous or conflicting statements in previous specs.