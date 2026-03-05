from uuid import uuid4

from app.core.errors import DomainError
from app.domain.enums import EventStatus, EventType, RoundStatus, SetupStatus
from app.domain.models import Event
from app.repositories.events_repo import EventsRepository
from app.repositories.matches_repo import MatchesRepository
from app.repositories.rounds_repo import RoundsRepository
from app.services.winners_court_service import WinnersCourtService
from app.services.ranked_box_service import RankedBoxService
from app.services.event_lifecycle import derive_lifecycle_status
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
        self.winners_court_service = WinnersCourtService()
        self.mexicano_service = MexicanoService()
        self.rb_service = RankedBoxService()

    @staticmethod
    def _required_player_count(courts: list[int]) -> int:
        return len(courts) * 4

    def evaluate_setup(
        self, event_type: EventType, courts: list[int], player_ids: list[str]
    ) -> list[str]:
        missing: list[str] = []
        if not courts:
            missing.append("courts_required")
            return missing

        required_count = self._required_player_count(courts)
        if len(player_ids) != required_count:
            missing.append(f"players_exact_{required_count}_required")

        return missing

    def _get_warnings(
        self,
        event: Event,
        exclude_event_id: str | None = None,
        now_date=None,
    ) -> dict[str, int | bool]:
        duplicate_count = self.events_repo.count_duplicate_slots(
            event_name=event.event_name,
            event_date=event.event_date,
            event_time=event.event_time,
            exclude_event_id=exclude_event_id,
        )

        if now_date is None:
            from datetime import datetime

            now_date = datetime.now().date()

        is_past = event.event_date < now_date
        return {
            "pastDateTime": is_past,
            "duplicateSlot": duplicate_count > 0,
            "duplicateCount": duplicate_count,
        }

    def create_event(
        self,
        event_name: str,
        event_type: EventType,
        event_date,
        event_time24h: str,
        create_action: str,
        selected_courts: list[int],
        player_ids: list[str],
    ):
        action = create_action or "auto"
        if action == "auto":
            action = "create_event" if selected_courts or player_ids else "create_event_slot"

        if action == "create_event_slot":
            selected_courts = []
            player_ids = []

        round_count = 3 if event_type == EventType.RANKED_BOX else 6
        round_duration = 30 if event_type == EventType.RANKED_BOX else 15
        missing_requirements = self.evaluate_setup(event_type, selected_courts, player_ids)

        if action == "create_event" and missing_requirements:
            joined = ", ".join(missing_requirements)
            raise ValueError(f"Event setup incomplete: {joined}")

        setup_status = SetupStatus.READY if not missing_requirements else SetupStatus.PLANNED

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
            event_time24h,
            setup_status,
            1,
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

        player_ids = self.events_repo.list_player_ids(event_id)
        courts = self.events_repo.list_courts(event_id)
        missing_requirements = self.evaluate_setup(event.event_type, courts, player_ids)
        warnings = self._get_warnings(event, exclude_event_id=event.id)

        return {
            "event": event,
            "player_ids": player_ids,
            "courts": courts,
            "missing_requirements": missing_requirements,
            "warnings": warnings,
            "lifecycle_status": derive_lifecycle_status(event),
        }

    def list_events(self) -> list[dict]:
        events = self.events_repo.list_all()
        output: list[dict] = []
        for event in events:
            player_ids = self.events_repo.list_player_ids(event.id)
            courts = self.events_repo.list_courts(event.id)
            missing_requirements = self.evaluate_setup(event.event_type, courts, player_ids)
            output.append(
                {
                    "event": event,
                    "player_ids": player_ids,
                    "courts": courts,
                    "missing_requirements": missing_requirements,
                    "warnings": self._get_warnings(event, exclude_event_id=event.id),
                    "lifecycle_status": derive_lifecycle_status(event),
                }
            )
        return output

    def update_event_setup(
        self,
        event_id: str,
        expected_version: int,
        event_name: str | None,
        event_type: EventType | None,
        event_date,
        event_time24h: str | None,
        selected_courts: list[int] | None,
        player_ids: list[str] | None,
    ) -> dict:
        current = self.events_repo.get(event_id)
        if not current:
            raise ValueError("Event not found")
        if current.version != expected_version:
            raise ValueError(f"conflict:{current.version}")

        next_name = event_name or current.event_name
        next_type = event_type or current.event_type
        next_date = event_date or current.event_date
        next_time = event_time24h if event_time24h is not None else current.event_time
        next_player_ids = (
            player_ids if player_ids is not None else self.events_repo.list_player_ids(event_id)
        )
        next_courts = (
            selected_courts
            if selected_courts is not None
            else self.events_repo.list_courts(event_id)
        )

        missing_requirements = self.evaluate_setup(next_type, next_courts, next_player_ids)
        next_setup_status = SetupStatus.READY if not missing_requirements else SetupStatus.PLANNED

        self.events_repo.update_setup(
            event_id=event_id,
            event_name=next_name,
            event_type=next_type,
            event_date=next_date,
            event_time=next_time,
            setup_status=next_setup_status,
        )

        if selected_courts is not None:
            self.events_repo.replace_courts(event_id, next_courts)
        if player_ids is not None:
            self.events_repo.replace_players(event_id, next_player_ids)

        return self.get_event_details(event_id)

    def start_event(self, event_id: str):
        event = self.events_repo.get(event_id)
        if not event:
            raise DomainError("EVENT_NOT_FOUND", "Event not found", status_code=404)

        lifecycle_status = derive_lifecycle_status(event)

        current_round = self.rounds_repo.get_current_round(event_id)
        if lifecycle_status == "ongoing":
            if not current_round:
                raise DomainError(
                    "EVENT_STATE_INVALID",
                    "Event is ongoing but no active round exists.",
                    status_code=409,
                )
            return {
                "event_id": event_id,
                "round_number": current_round.round_number,
                "matches": self.matches_repo.list_by_round(current_round.id),
            }
        if lifecycle_status == "finished":
            raise DomainError(
                "EVENT_ALREADY_FINISHED",
                "Event is finished. Open the summary or restart the event.",
                status_code=409,
            )
        if lifecycle_status == "planned":
            raise DomainError(
                "EVENT_NOT_READY",
                "Event setup is incomplete. Add courts and players before starting.",
                status_code=409,
            )
        if current_round:
            raise DomainError(
                "EVENT_ALREADY_STARTED",
                "Event already has rounds. Resume or restart instead of starting again.",
                status_code=409,
            )

        player_ids = self.events_repo.list_player_ids(event_id)
        courts = self.events_repo.list_courts(event_id)
        missing_requirements = self.evaluate_setup(event.event_type, courts, player_ids)
        if missing_requirements:
            joined = ", ".join(missing_requirements)
            raise ValueError(f"Event setup incomplete: {joined}")

        if event.event_type == EventType.WINNERS_COURT:
            plan = self.winners_court_service.generate_round_1(player_ids, courts)
        elif event.event_type == EventType.MEXICANO:
            plan = self.mexicano_service.generate_round_1(player_ids, courts)
        else:
            plan = self.rb_service.generate_round_1(player_ids, courts)

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

    def restart_event(self, event_id: str) -> dict:
        event = self.events_repo.get(event_id)
        if not event:
            raise DomainError("EVENT_NOT_FOUND", "Event not found", status_code=404)

        lifecycle_status = derive_lifecycle_status(event)
        if lifecycle_status not in {"ongoing", "finished"}:
            raise DomainError(
                "EVENT_RESTART_NOT_ALLOWED",
                "Only ongoing or finished events can be restarted.",
                status_code=409,
            )

        self.events_repo.clear_event_runtime(event_id)
        self.events_repo.set_status(event_id, EventStatus.LOBBY, None)

        details = self.get_event_details(event_id)
        return {
            "event": details["event"],
            "player_ids": details["player_ids"],
            "courts": details["courts"],
            "missing_requirements": details["missing_requirements"],
            "warnings": details["warnings"],
            "lifecycle_status": details["lifecycle_status"],
        }

    def delete_event(self, event_id: str) -> None:
        deleted = self.events_repo.delete_event(event_id)
        if not deleted:
            raise DomainError("EVENT_NOT_FOUND", "Event not found", status_code=404)
