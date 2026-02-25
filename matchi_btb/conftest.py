import sqlite3
import pytest
from database.schema import create_tables
from domain.models import Player
from database.repositories.match_repo import MatchRepository
from database.repositories.player_repo import PlayerRepository
from database.repositories.box_repo import BoxRepository


@pytest.fixture
def conn():
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    create_tables(conn)
    yield conn
    conn.close()


@pytest.fixture
def repos(conn):
    return {
        "players": PlayerRepository(conn),
        "matches": MatchRepository(conn),
        "boxes": BoxRepository(conn),
    }


@pytest.fixture
def players(repos):
    p1 = repos["players"].create("Alice")
    p2 = repos["players"].create("Bob")
    p3 = repos["players"].create("Charlie")
    p4 = repos["players"].create("Diana")

    return [
        repos["players"].get(p1),
        repos["players"].get(p2),
        repos["players"].get(p3),
        repos["players"].get(p4),
    ]
