import uuid

from app.repositories.base import load_sql


class UsersRepository:
    def __init__(self, conn):
        self.conn = conn

    def create(self, email: str, hashed_password: str, role: str = "user") -> dict:
        user_id = str(uuid.uuid4())
        self.conn.execute(
            load_sql("users/create.sql"),
            [user_id, email, hashed_password, role],
        )
        return self.get_by_id(user_id)

    def get_by_email(self, email: str) -> dict | None:
        row = self.conn.execute(load_sql("users/get_by_email.sql"), [email]).fetchone()
        if not row:
            return None
        return {
            "id": row[0],
            "email": row[1],
            "hashed_password": row[2],
            "role": row[3],
            "created_at": row[4],
        }

    def get_by_id(self, user_id: str) -> dict | None:
        row = self.conn.execute(load_sql("users/get_by_id.sql"), [user_id]).fetchone()
        if not row:
            return None
        return {
            "id": row[0],
            "email": row[1],
            "hashed_password": row[2],
            "role": row[3],
            "created_at": row[4],
        }

    def exists_any(self) -> bool:
        row = self.conn.execute(load_sql("users/exists_any.sql")).fetchone()
        return row[0] > 0

    def upsert_admin(self, email: str, hashed_password: str) -> None:
        user_id = str(uuid.uuid4())
        self.conn.execute(
            load_sql("users/upsert_by_email.sql"),
            [user_id, email, hashed_password],
        )
