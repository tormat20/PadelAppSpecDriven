"""Bootstrap the first admin user.

Usage:
    python -m app.scripts.seed_admin

Environment variables read from ``backend/.env`` (via Settings):
    PADEL_DB_PATH           – path to the DuckDB file (default: padel.duckdb)
    PADEL_JWT_SECRET_KEY    – required JWT secret

The script prompts for the admin email and password interactively.
It uses ``upsert_admin`` so running it twice with the same email
simply resets the admin's password (safe for dev resets).
"""

import getpass
import sys

from app.core.config import settings
from app.db.connection import get_connection
from app.db.migrate import run_migrations
from app.domain.auth import hash_password
from app.repositories.users_repo import UsersRepository


def main() -> None:
    print("=== Padel App — Seed Admin ===")

    # Prompt
    email = input("Admin email: ").strip().lower()
    if not email or "@" not in email:
        print("ERROR: invalid email address.", file=sys.stderr)
        sys.exit(1)

    password = getpass.getpass("Admin password (min 8 chars): ")
    if len(password) < 8:
        print("ERROR: password must be at least 8 characters.", file=sys.stderr)
        sys.exit(1)

    password_confirm = getpass.getpass("Confirm password: ")
    if password != password_confirm:
        print("ERROR: passwords do not match.", file=sys.stderr)
        sys.exit(1)

    # Ensure migrations are applied before touching user table
    run_migrations()

    hashed = hash_password(password)

    with get_connection() as conn:
        repo = UsersRepository(conn)
        repo.upsert_admin(email, hashed)

    print(f"\nAdmin user '{email}' created/updated successfully.")
    print("You can now log in at the app with these credentials.")


if __name__ == "__main__":
    main()
