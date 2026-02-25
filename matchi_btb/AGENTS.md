# AGENTS.md - Development Guide for matchi_btb

## Project Overview

This is a Padel tournament management application (BTB - Box To Box) using Python with SQLite. The project follows a layered architecture:

```
matchi_btb/
├── database/
│   ├── connection.py    # SQLite connection management
│   ├── schema.py         # Table creation/deletion
│   └── repositories/     # Data access layer
├── domain/
│   ├── models.py         # Domain entities (dataclasses)
│   ├── btb_rules.py      # Business rules
│   └── scoring.py       # Scoring logic
├── services/            # Business logic layer
├── views/               # Presentation layer
├── main.py              # Entry point
├── test.py              # Manual test functions
└── conftest.py          # Pytest fixtures
```

## Build, Lint, and Test Commands

### Running Tests

```bash
# Run all tests
pytest

# Run a specific test file
pytest test.py

# Run a single test function
pytest test.py::test_full_match_flow -v

# Run tests matching a pattern
pytest -k "match"

# Run with verbose output
pytest -v

# Run with coverage (if installed)
pytest --cov=. --cov-report=term-missing
```

### Development Commands

```bash
# Run the main application
python main.py

# Create database tables
python -c "from database.schema import create_tables; create_tables()"

# Drop all tables
python -c "from database.schema import drop_tables; drop_tables()"
```

### Linting (if configured)

```bash
# If ruff is installed
ruff check .

# If flake8 is installed
flake8 .

# If pylint is installed
pylint matchi_btb/
```

## Code Style Guidelines

### General Principles

- **Clean Code**: Write readable, maintainable code with descriptive names
- **Single Responsibility**: Each function/class should have a clear purpose
- **DRY**: Avoid duplication; extract common patterns into reusable functions

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Files | snake_case | `player_repo.py`, `match_services.py` |
| Classes | PascalCase | `PlayerRepository`, `MatchService` |
| Functions | snake_case | `create_match()`, `get_player()` |
| Variables | snake_case | `player_id`, `match_repo` |
| Constants | UPPER_SNAKE | `MAX_PLAYERS = 4` |
| Database tables | snake_case | `players`, `match_results` |

### Imports

```python
# Standard library first
from datetime import date
import sqlite3

# Third-party libraries
from faker import Faker

# Local application imports (use absolute imports)
from database.connection import get_connection
from database.repositories.player_repo import PlayerRepository
from domain.models import Player
from services.match_services import MatchService
```

- Sort imports alphabetically within each group
- Use absolute imports (not relative)
- Group: stdlib → third-party → local

### Type Hints

Always use type hints for function parameters and return values:

```python
# Good
def create_player(name: str) -> int:
    ...

def get_player(player_id: int) -> Player | None:
    ...

def list_players() -> list[Player]:
    ...

# Good - union types with |
def get_winner(match_id: int) -> int | None:
    ...
```

### Dataclasses for Models

Use Python's `dataclass` decorator for domain models:

```python
from dataclasses import dataclass
from datetime import date

@dataclass
class Player:
    id: int
    name: str
    points: int

@dataclass
class Match:
    id: int
    box_id: int
    team1: list[Player]
    team2: list[Player]
    winning_team: int | None
```

### Repository Pattern

Follow the repository pattern for data access:

```python
class PlayerRepository:
    def __init__(self, conn):
        self.conn = conn

    def create(self, name: str) -> int:
        cur = self.conn.cursor()
        cur.execute("INSERT INTO players (name) VALUES (?)", (name,))
        self.conn.commit()
        return cur.lastrowid

    def get(self, player_id: int) -> Player | None:
        cur = self.conn.cursor()
        cur.execute("SELECT id, name, points FROM players WHERE id = ?", (player_id,))
        row = cur.fetchone()
        if row is None:
            return None
        return Player(id=row["id"], name=row["name"], points=row["points"])
```

### Error Handling

- Use explicit returns for not found cases (return `None`)
- Handle database errors with try/except when needed
- Validate inputs at service layer

```python
def get(self, player_id: int) -> Player | None:
    cur = self.conn.cursor()
    cur.execute("SELECT ... WHERE id = ?", (player_id,))
    row = cur.fetchone()
    if row is None:
        return None
    return Player(...)
```

### Testing Conventions

Follow pytest conventions:

```python
import pytest
from database.connection import get_connection
from database.repositories.player_repo import PlayerRepository

@pytest.fixture
def conn():
    conn = get_connection()
    yield conn
    conn.close()

def test_create_player(conn):
    repo = PlayerRepository(conn)
    player_id = repo.create("Alice")
    assert player_id > 0
```

- Use fixtures from `conftest.py` for common setup
- Use descriptive test names: `test_<what_is_tested>`
- Use assert statements with clear failure messages when helpful

### SQL Queries

- Use parameterized queries to prevent SQL injection
- Use UPPER CASE for SQL keywords
- Enable foreign keys: `conn.execute("PRAGMA foreign_keys = ON")`

```python
cur.execute(
    "SELECT id, name, points FROM players WHERE id = ?",
    (player_id,)
)
```

### Formatting

- Maximum line length: 100 characters (soft limit: 120)
- Use 4 spaces for indentation (not tabs)
- Add blank lines between logical sections
- No trailing whitespace

### File Organization

1. Imports
2. Module-level constants (if any)
3. Classes and functions
4. Main execution block (if any)

```python
# 1. Imports
from database.connection import get_connection

# 2. Classes
class PlayerRepository:
    ...

# 3. Helper functions
def setup_test_db():
    ...

# 4. Main
if __name__ == "__main__":
    ...
```

### Database Conventions

- Use `sqlite3.Row` factory for dictionary-like row access
- Always call `conn.commit()` after modifications
- Close connections properly (use context managers or fixtures)
- Enable foreign keys: `PRAGMA foreign_keys = ON`

## Common Development Tasks

### Creating a New Repository

1. Create file in `database/repositories/`
2. Follow repository pattern with `__init__(self, conn)`
3. Add CRUD methods
4. Import in `main.py` or service files as needed

### Adding a New Domain Model

1. Add dataclass to `domain/models.py`
2. Add table to `database/schema.py`
3. Create repository in `database/repositories/`
4. Add service methods if needed

### Adding a New Service

1. Create file in `services/`
2. Inject repositories via constructor
3. Add business logic methods
4. Import and use in views/main.py

## Notes

- The project uses SQLite with a file-based database (`btb.db`)
- Tests use in-memory SQLite (`:memory:`) via fixtures
- There is a typo in the codebase: `MatchSerivce` (should be `MatchService`) - fix when editing
