from contextlib import contextmanager

from app.db.connection import get_connection
from app.repositories.events_repo import EventsRepository
from app.repositories.matches_repo import MatchesRepository
from app.repositories.players_repo import PlayersRepository
from app.repositories.rankings_repo import RankingsRepository
from app.repositories.rounds_repo import RoundsRepository
from app.services.event_service import EventService
from app.services.player_service import PlayerService
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

        player_service = PlayerService(players_repo)
        event_service = EventService(events_repo, rounds_repo, matches_repo)
        round_service = RoundService(events_repo, rounds_repo, matches_repo, rankings_repo)
        summary_service = SummaryService(events_repo, round_service)

        yield {
            "player_service": player_service,
            "event_service": event_service,
            "round_service": round_service,
            "summary_service": summary_service,
            "events_repo": events_repo,
            "players_repo": players_repo,
        }
