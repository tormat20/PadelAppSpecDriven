import sqlite3

def get_connection():
    conn = sqlite3.connect("btb.db")
    conn.row_factory = sqlite3.Row  # optional but VERY nice
    conn.execute("PRAGMA foreign_keys = ON")
    return conn
