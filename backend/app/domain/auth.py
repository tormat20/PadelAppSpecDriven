"""Pure auth domain functions — no FastAPI, no DB, no side effects."""

from datetime import UTC, datetime, timedelta

import bcrypt
import jwt


def hash_password(plain: str) -> str:
    """Return a bcrypt hash of the plain-text password."""
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt(rounds=12)).decode()


def verify_password(plain: str, hashed: str) -> bool:
    """Return True if plain matches the bcrypt hash."""
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_token(
    sub: str,
    email: str,
    role: str,
    secret: str,
    algorithm: str,
    expire_minutes: int,
) -> str:
    """Issue a signed JWT with sub, email, role, iat, and exp claims."""
    now = datetime.now(UTC)
    payload = {
        "sub": sub,
        "email": email,
        "role": role,
        "iat": now,
        "exp": now + timedelta(minutes=expire_minutes),
    }
    return jwt.encode(payload, secret, algorithm=algorithm)


def decode_token(token: str, secret: str, algorithm: str) -> dict:
    """Decode and verify a JWT.  Raises jwt.ExpiredSignatureError or
    jwt.InvalidTokenError on failure."""
    return jwt.decode(token, secret, algorithms=[algorithm])
