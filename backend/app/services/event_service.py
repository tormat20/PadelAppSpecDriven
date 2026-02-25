from uuid import uuid4

from app.domain.enums import EventStatus, EventType, RoundStatus
from app.repositories.events_repo import EventsRepository
from app.repositories.matches_repo import MatchesRepository
from app.repositories.rounds_repo import RoundsRepository
from app.services.americano_service import AmericanoService
from app.services.beat_the_box_service import BeatTheBoxService
from app.services.mexicano_service import MexicanoService


class EventService:
    def __init__(
        self,
        events_repo: EventsRepository,
        rounds_repo: RoundsRepository,
        matches_repo: MatchesRepository,
    ):
        self.events_repo = events_repo
        self.rounds_repo = rounds_repo
        self.matches_repo = matches_repo
        self.americano_service = AmericanoService()
        self.mexicano_service = MexicanoService()
        self.btb_service = BeatTheBoxService()

    def create_event(
        self,
        event_name: str,
        event_type: EventType,
        event_date,
        selected_courts: list[int],
        player_ids: list[str],
    ):
        if len(player_ids) < 4:
            raise ValueError("At least 4 players are required")
        if len(player_ids) % 4 != 0:
            raise ValueError("Players count must be divisible by 4")

        round_count = 3 if event_type == EventType.BEAT_THE_BOX else 6
        round_duration = 30 if event_type == EventType.BEAT_THE_BOX else 15
        event_id = str(uuid4())
        event = self.events_repo.create(
            event_id,
            event_name,
            event_type,
            event_date,
            EventStatus.LOBBY,
            round_count,
            round_duration,
            None,
        )
        for idx, player_id in enumerate(player_ids):
            self.events_repo.add_player(str(uuid4()), event_id, player_id, idx + 1)
        for court in selected_courts:
            self.events_repo.add_court(str(uuid4()), event_id, court)
        return event

    def get_event_details(self, event_id: str) -> dict:
        event = self.events_repo.get(event_id)
        if not event:
            raise ValueError("Event not found")
        return {
            "event": event,
            "player_ids": self.events_repo.list_player_ids(event_id),
            "courts": self.events_repo.list_courts(event_id),
        }

    def start_event(self, event_id: str):
        event = self.events_repo.get(event_id)
        if not event:
            raise ValueError("Event not found")

        player_ids = self.events_repo.list_player_ids(event_id)
        courts = self.events_repo.list_courts(event_id)
        if not courts:
            raise ValueError("At least one court required")

        if event.event_type == EventType.AMERICANO:
            plan = self.americano_service.generate_round_1(player_ids, courts)
        elif event.event_type == EventType.MEXICANO:
            plan = self.mexicano_service.generate_round_1(player_ids, courts)
        else:
            plan = self.btb_service.generate_round_1(player_ids, courts)

        round_id = str(uuid4())
        self.rounds_repo.create_round(round_id, event_id, plan.round_number, RoundStatus.RUNNING)

        matches = [(str(uuid4()), m) for m in plan.matches]
        self.matches_repo.create_matches_bulk(event_id, round_id, matches)
        self.events_repo.set_status(event_id, EventStatus.RUNNING, 1)

        return {
            "event_id": event_id,
            "round_number": 1,
            "matches": self.matches_repo.list_by_round(round_id),
        }
