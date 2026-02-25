
from database.connection import get_connection

def create_tables():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS players (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        points INTEGER DEFAULT 0
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        date TEXT NOT NULL
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS boxes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL,
        box_number INTEGER,
        FOREIGN KEY (event_id) REFERENCES events(id)
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS box_players (
        box_id INTEGER NOT NULL,
        player_id INTEGER NOT NULL,
        PRIMARY KEY (box_id, player_id),
        FOREIGN KEY (box_id) REFERENCES boxes(id),
        FOREIGN KEY (player_id) REFERENCES players(id)
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        box_id INTEGER NOT NULL,
        FOREIGN KEY (box_id) REFERENCES boxes(id)
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS match_players (
        match_id INTEGER NOT NULL,
        player_id INTEGER NOT NULL,
        team INTEGER NOT NULL,
        PRIMARY KEY (match_id, player_id),
        FOREIGN KEY (match_id) REFERENCES matches(id),
        FOREIGN KEY (player_id) REFERENCES players(id)
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS match_results (
        match_id INTEGER PRIMARY KEY,
        winning_team INTEGER NOT NULL,
        FOREIGN KEY (match_id) REFERENCES matches(id)
    )
    """)

    conn.commit()
    conn.close()

def drop_tables():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("DROP TABLE IF EXISTS match_results")
    cur.execute("DROP TABLE IF EXISTS match_players")
    cur.execute("DROP TABLE IF EXISTS matches")
    cur.execute("DROP TABLE IF EXISTS box_players")
    cur.execute("DROP TABLE IF EXISTS boxes")
    cur.execute("DROP TABLE IF EXISTS events")
    cur.execute("DROP TABLE IF EXISTS players")

    conn.commit()
    conn.close()
