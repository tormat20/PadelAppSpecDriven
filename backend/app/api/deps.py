from contextlib import contextmanager
from dataclasses import dataclass

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings
from app.db.connection import get_connection, get_read_connection
from app.domain.auth import decode_token
from app.repositories.event_teams_repo import EventTeamsRepository
from app.repositories.events_repo import EventsRepository
from app.repositories.matches_repo import MatchesRepository
from app.repositories.player_stats_repo import PlayerStatsRepository
from app.repositories.players_repo import PlayersRepository
from app.repositories.rankings_repo import RankingsRepository
from app.repositories.rounds_repo import RoundsRepository
from app.repositories.substitutions_repo import SubstitutionsRepository
from app.repositories.users_repo import UsersRepository
from app.services.auth_service import AuthService
from app.services.event_service import EventService
from app.services.player_service import PlayerService
from app.services.player_stats_service import PlayerStatsService
from app.services.round_service import RoundService
from app.services.summary_service import SummaryService


@contextmanager
def services_scope():
    with get_connection() as conn:
        players_repo = PlayersRepository(conn)
        events_repo = EventsRepository(conn)
        rounds_repo = RoundsRepository(conn)
        matches_repo = MatchesRepository(conn)
        rankings_repo = RankingsRepository(conn)
        player_stats_repo = PlayerStatsRepository(conn)
        users_repo = UsersRepository(conn)
        event_teams_repo = EventTeamsRepository(conn)
        substitutions_repo = SubstitutionsRepository(conn)

        player_service = PlayerService(players_repo)
        event_service = EventService(
            events_repo,
            rounds_repo,
            matches_repo,
            event_teams_repo=event_teams_repo,
            substitutions_repo=substitutions_repo,
        )
        round_service = RoundService(
            events_repo,
            rounds_repo,
            matches_repo,
            rankings_repo,
            event_teams_repo=event_teams_repo,
        )
        player_stats_service = PlayerStatsService(
            events_repo,
            rounds_repo,
            matches_repo,
            players_repo,
            player_stats_repo,
        )
        summary_service = SummaryService(
            events_repo,
            rounds_repo,
            matches_repo,
            players_repo,
            round_service,
            player_stats_service,
        )
        auth_service = AuthService(users_repo)

        yield {
            "player_service": player_service,
            "event_service": event_service,
            "round_service": round_service,
            "summary_service": summary_service,
            "player_stats_service": player_stats_service,
            "events_repo": events_repo,
            "players_repo": players_repo,
            "event_teams_repo": event_teams_repo,
            "substitutions_repo": substitutions_repo,
            "users_repo": users_repo,
            "auth_service": auth_service,
        }


@contextmanager
def read_services_scope():
    """Read-only variant of services_scope.

    Uses a DuckDB read-only connection so that multiple concurrent requests
    (e.g. the three leaderboard fetches that fire on Home page load) do not
    contend for the write lock.  Only use this for GET endpoints that perform
    no writes.
    """
    with get_read_connection() as conn:
        players_repo = PlayersRepository(conn)
        events_repo = EventsRepository(conn)
        rounds_repo = RoundsRepository(conn)
        matches_repo = MatchesRepository(conn)
        rankings_repo = RankingsRepository(conn)
        player_stats_repo = PlayerStatsRepository(conn)

        round_service = RoundService(events_repo, rounds_repo, matches_repo, rankings_repo)
        player_stats_service = PlayerStatsService(
            events_repo,
            rounds_repo,
            matches_repo,
            players_repo,
            player_stats_repo,
        )

        yield {
            "player_stats_service": player_stats_service,
            "round_service": round_service,
        }


# ---------------------------------------------------------------------------
# JWT FastAPI dependencies — no DB connection needed; decode the bearer token
# ---------------------------------------------------------------------------


@dataclass
class TokenData:
    sub: str
    email: str
    role: str


_bearer = HTTPBearer(auto_error=True)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> TokenData:
    """Decode the Bearer JWT.  Raises 401 on missing, expired, or malformed token."""
    token = credentials.credentials
    try:
        payload = decode_token(token, settings.jwt_secret_key, settings.jwt_algorithm)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid authentication token.")
    return TokenData(sub=payload["sub"], email=payload["email"], role=payload["role"])


def require_admin(token_data: TokenData = Depends(get_current_user)) -> TokenData:
    """Require the caller to have role=admin.  Raises 403 otherwise."""
    if token_data.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")
    return token_data


def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer(auto_error=False)),
) -> TokenData | None:
    """Return decoded token data if a valid Bearer token is present, else None."""
    if not credentials:
        return None
    try:
        payload = decode_token(
            credentials.credentials, settings.jwt_secret_key, settings.jwt_algorithm
        )
        return TokenData(sub=payload["sub"], email=payload["email"], role=payload["role"])
    except jwt.InvalidTokenError:
        return None
