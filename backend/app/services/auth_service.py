import jwt
from fastapi import HTTPException

from app.api.schemas.auth import MeResponse
from app.core.config import settings
from app.domain.auth import create_token, decode_token, hash_password, verify_password
from app.repositories.users_repo import UsersRepository


class AuthService:
    def __init__(self, users_repo: UsersRepository):
        self.users_repo = users_repo

    def register(self, email: str, password: str) -> str:
        """Create a new user account and return a signed JWT.

        Raises HTTPException 400 on invalid input, 409 on duplicate email.
        """
        email = email.strip().lower()
        if not email or "@" not in email or "." not in email.split("@", 1)[1]:
            raise HTTPException(status_code=400, detail="Invalid email address.")
        if len(password) < 8:
            raise HTTPException(
                status_code=400,
                detail="Password must be at least 8 characters.",
            )
        if self.users_repo.get_by_email(email):
            raise HTTPException(
                status_code=409,
                detail="An account with this email already exists.",
            )
        hashed = hash_password(password)
        user = self.users_repo.create(email, hashed, role="user")
        return create_token(
            sub=user["id"],
            email=user["email"],
            role=user["role"],
            secret=settings.jwt_secret_key,
            algorithm=settings.jwt_algorithm,
            expire_minutes=settings.jwt_expire_minutes,
        )

    def login(self, email: str, password: str) -> str:
        """Verify credentials and return a signed JWT.

        Raises HTTPException 401 on invalid credentials (generic message — does
        not reveal whether the email exists).
        """
        email = email.strip().lower()
        user = self.users_repo.get_by_email(email)
        if not user or not verify_password(password, user["hashed_password"]):
            raise HTTPException(
                status_code=401,
                detail="Invalid email or password.",
            )
        return create_token(
            sub=user["id"],
            email=user["email"],
            role=user["role"],
            secret=settings.jwt_secret_key,
            algorithm=settings.jwt_algorithm,
            expire_minutes=settings.jwt_expire_minutes,
        )

    def get_me(self, token: str) -> MeResponse:
        """Decode a token and return the user identity.

        Raises HTTPException 401 on missing, expired, or malformed token.
        """
        try:
            payload = decode_token(token, settings.jwt_secret_key, settings.jwt_algorithm)
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Session expired. Please log in again.")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid authentication token.")
        return MeResponse(
            id=payload["sub"],
            email=payload["email"],
            role=payload["role"],
        )
