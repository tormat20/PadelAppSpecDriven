from uuid import uuid4

from app.core.errors import DomainError
from app.domain.enums import EventStatus, EventType, RoundStatus, SetupStatus
from app.domain.models import Event
from app.domain.scheduling import generate_americano_rounds
from app.repositories.events_repo import EventsRepository
from app.repositories.event_teams_repo import EventTeamsRepository
from app.repositories.matches_repo import MatchesRepository
from app.repositories.rounds_repo import RoundsRepository
from app.repositories.substitutions_repo import SubstitutionsRepository
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
        event_teams_repo: EventTeamsRepository | None = None,
        substitutions_repo: SubstitutionsRepository | None = None,
    ):
        self.events_repo = events_repo
        self.rounds_repo = rounds_repo
        self.matches_repo = matches_repo
        self.event_teams_repo = event_teams_repo
        self.substitutions_repo = substitutions_repo
        self.winners_court_service = WinnersCourtService()
        self.mexicano_service = MexicanoService()
        self.rb_service = RankedBoxService()

    @staticmethod
    def _required_player_count(courts: list[int]) -> int:
        return len(courts) * 4

    @staticmethod
    def _validate_event_duration_minutes(event_duration_minutes: int) -> int:
        if event_duration_minutes not in (60, 90, 120):
            raise ValueError("eventDurationMinutes must be one of: 60, 90, 120")
        return event_duration_minutes

    def evaluate_setup(
        self,
        event_type: EventType,
        courts: list[int],
        player_ids: list[str],
        is_team_mexicano: bool = False,
    ) -> list[str]:
        missing: list[str] = []
        if not courts:
            missing.append("courts_required")
            return missing

        required_count = self._required_player_count(courts)
        if len(player_ids) != required_count:
            missing.append(f"players_exact_{required_count}_required")

        if is_team_mexicano and len(player_ids) % 2 != 0:
            missing.append("team_mexicano_odd_players")

        if event_type == EventType.AMERICANO and len(player_ids) % 4 != 0:
            missing.append("americano_player_count_must_be_multiple_of_4")

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
        event_duration_minutes: int,
        create_action: str,
        selected_courts: list[int],
        player_ids: list[str],
        is_team_mexicano: bool = False,
    ):
        event_duration_minutes = self._validate_event_duration_minutes(event_duration_minutes)
        action = create_action or "auto"
        if action == "auto":
            action = "create_event" if selected_courts or player_ids else "create_event_slot"

        if action == "create_event_slot":
            selected_courts = []
            player_ids = []

        round_count = 3 if event_type == EventType.RANKED_BOX else 6
        round_duration = 30 if event_type == EventType.RANKED_BOX else 15
        missing_requirements = self.evaluate_setup(
            event_type, selected_courts, player_ids, is_team_mexicano
        )

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
            event_duration_minutes,
            None,
            event_time24h,
            setup_status,
            1,
            is_team_mexicano,
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
        missing_requirements = self.evaluate_setup(
            event.event_type, courts, player_ids, event.is_team_mexicano
        )
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
            missing_requirements = self.evaluate_setup(
                event.event_type, courts, player_ids, event.is_team_mexicano
            )
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

    def list_events_by_date_range(self, from_date, to_date) -> list[dict]:
        events = self.events_repo.list_by_date_range(from_date, to_date)
        output: list[dict] = []
        for event in events:
            player_ids = self.events_repo.list_player_ids(event.id)
            courts = self.events_repo.list_courts(event.id)
            missing_requirements = self.evaluate_setup(
                event.event_type, courts, player_ids, event.is_team_mexicano
            )
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
        event_duration_minutes: int | None,
        selected_courts: list[int] | None,
        player_ids: list[str] | None,
        is_team_mexicano: bool | None = None,
    ) -> dict:
        current = self.events_repo.get(event_id)
        if not current:
            raise ValueError("Event not found")
        if current.version != expected_version:
            raise ValueError(f"conflict:{current.version}")

        # T037: Block event_type changes on ongoing/finished events
        if event_type is not None and event_type != current.event_type:
            lifecycle = derive_lifecycle_status(current)
            if lifecycle in ("ongoing", "finished"):
                raise DomainError(
                    "EVENT_MODE_CHANGE_BLOCKED",
                    "Event mode cannot be changed after the event has started.",
                    status_code=409,
                )

        next_name = event_name or current.event_name
        next_type = event_type or current.event_type
        next_date = event_date or current.event_date
        next_time = event_time24h if event_time24h is not None else current.event_time
        next_duration_minutes = (
            self._validate_event_duration_minutes(event_duration_minutes)
            if event_duration_minutes is not None
            else current.event_duration_minutes
        )
        next_is_team_mexicano = (
            is_team_mexicano if is_team_mexicano is not None else current.is_team_mexicano
        )
        next_player_ids = (
            player_ids if player_ids is not None else self.events_repo.list_player_ids(event_id)
        )
        next_courts = (
            selected_courts
            if selected_courts is not None
            else self.events_repo.list_courts(event_id)
        )

        # T038: Clean up orphaned team assignments when mode changes away from Team Mexicano
        team_mexicano_turned_off = (
            current.is_team_mexicano is True and next_is_team_mexicano is False
        )
        event_type_changed_away_from_mexicano = (
            current.event_type == EventType.MEXICANO and next_type != EventType.MEXICANO
        )
        if (
            team_mexicano_turned_off or event_type_changed_away_from_mexicano
        ) and self.event_teams_repo:
            self.event_teams_repo.delete_by_event(event_id)

        missing_requirements = self.evaluate_setup(
            next_type, next_courts, next_player_ids, next_is_team_mexicano
        )
        next_setup_status = SetupStatus.READY if not missing_requirements else SetupStatus.PLANNED

        self.events_repo.update_setup(
            event_id=event_id,
            event_name=next_name,
            event_type=next_type,
            event_date=next_date,
            event_time=next_time,
            event_duration_minutes=next_duration_minutes,
            setup_status=next_setup_status,
            is_team_mexicano=next_is_team_mexicano,
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
        # Recovery path: event is in 'ready' state (Lobby status) but rounds already
        # exist — a corrupt state from a prior bug. Treat this as "already started":
        # update the status to Running and return the current round, same as the
        # "ongoing" branch above.
        if current_round:
            self.events_repo.set_status(event_id, EventStatus.RUNNING, current_round.round_number)
            return {
                "event_id": event_id,
                "round_number": current_round.round_number,
                "matches": self.matches_repo.list_by_round(current_round.id),
            }

        player_ids = self.events_repo.list_player_ids(event_id)
        courts = self.events_repo.list_courts(event_id)
        missing_requirements = self.evaluate_setup(event.event_type, courts, player_ids)
        if missing_requirements:
            joined = ", ".join(missing_requirements)
            raise ValueError(f"Event setup incomplete: {joined}")

        if event.event_type == EventType.WINNERS_COURT:
            plan = self.winners_court_service.generate_round_1(player_ids, courts)
        elif event.event_type == EventType.MEXICANO:
            if event.is_team_mexicano and self.event_teams_repo:
                fixed_teams_objs = self.event_teams_repo.list_by_event(event_id)
                fixed_teams = [(t.player1_id, t.player2_id) for t in fixed_teams_objs]
                plan = self.mexicano_service.generate_round_1_team_mexicano(fixed_teams, courts)
            else:
                plan = self.mexicano_service.generate_round_1(player_ids, courts)
        elif event.event_type == EventType.AMERICANO:
            all_plans = generate_americano_rounds(player_ids, courts)
            total_rounds = len(all_plans)
            # Insert all rounds and their matches at once
            for americano_plan in all_plans:
                round_id = str(uuid4())
                status = (
                    RoundStatus.RUNNING if americano_plan.round_number == 1 else RoundStatus.PENDING
                )
                self.rounds_repo.create_round(
                    round_id, event_id, americano_plan.round_number, status
                )
                americano_matches = [(str(uuid4()), m) for m in americano_plan.matches]
                self.matches_repo.create_matches_bulk(event_id, round_id, americano_matches)
            # Update event round_count to total pre-generated rounds
            self.events_repo.update_round_count(event_id, total_rounds)
            self.events_repo.set_status(event_id, EventStatus.RUNNING, 1)
            first_round = self.rounds_repo.get_current_round(event_id)
            return {
                "event_id": event_id,
                "round_number": 1,
                "matches": self.matches_repo.list_by_round(first_round.id),
            }
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

    def set_event_teams(self, event_id: str, team_pairs: list[tuple[str, str]]) -> list:
        """Replace all team assignments for a Team Mexicano event."""
        event = self.events_repo.get(event_id)
        if not event:
            raise DomainError("EVENT_NOT_FOUND", "Event not found", status_code=404)
        if not event.is_team_mexicano or event.event_type != EventType.MEXICANO:
            raise DomainError(
                "EVENT_NOT_TEAM_MEXICANO",
                "This event is not a Team Mexicano event.",
                status_code=409,
            )
        lifecycle = derive_lifecycle_status(event)
        if lifecycle in ("ongoing", "finished"):
            raise DomainError(
                "EVENT_ALREADY_STARTED",
                "Team assignments cannot be changed after the event has started.",
                status_code=409,
            )

        if self.event_teams_repo is None:
            raise RuntimeError("EventTeamsRepository not wired")

        event_player_ids = set(self.events_repo.list_player_ids(event_id))
        seen_players: set[str] = set()
        for p1, p2 in team_pairs:
            if p1 not in event_player_ids or p2 not in event_player_ids:
                raise DomainError(
                    "PLAYER_NOT_IN_EVENT",
                    "One or more players are not assigned to this event.",
                    status_code=422,
                )
            if p1 in seen_players or p2 in seen_players:
                raise DomainError(
                    "PLAYER_NOT_IN_EVENT",
                    "A player appears in more than one team pair.",
                    status_code=422,
                )
            seen_players.add(p1)
            seen_players.add(p2)

        self.event_teams_repo.delete_by_event(event_id)
        teams = []
        for p1, p2 in team_pairs:
            team = self.event_teams_repo.create(str(uuid4()), event_id, p1, p2)
            teams.append(team)
        return teams

    def get_event_teams(self, event_id: str) -> list:
        """Return the team assignments for a Team Mexicano event."""
        event = self.events_repo.get(event_id)
        if not event:
            raise DomainError("EVENT_NOT_FOUND", "Event not found", status_code=404)
        if self.event_teams_repo is None:
            raise RuntimeError("EventTeamsRepository not wired")
        return self.event_teams_repo.list_by_event(event_id)

    def substitute_player(
        self, event_id: str, departing_player_id: str, substitute_player_id: str
    ) -> dict:
        """Replace a player in an ongoing event; takes effect from the next round."""
        from app.repositories.players_repo import PlayersRepository

        event = self.events_repo.get(event_id)
        if not event:
            raise DomainError("EVENT_NOT_FOUND", "Event not found", status_code=404)

        lifecycle = derive_lifecycle_status(event)
        if lifecycle != "ongoing":
            raise DomainError(
                "EVENT_NOT_ONGOING",
                "Player substitution is only allowed while the event is running.",
                status_code=409,
            )

        event_player_ids = self.events_repo.list_player_ids(event_id)
        if departing_player_id not in event_player_ids:
            raise DomainError(
                "PLAYER_NOT_IN_EVENT",
                "The departing player is not assigned to this event.",
                status_code=404,
            )
        if substitute_player_id in event_player_ids:
            raise DomainError(
                "SUBSTITUTE_ALREADY_IN_EVENT",
                "The substitute player is already in this event.",
                status_code=409,
            )

        if self.substitutions_repo is None:
            raise RuntimeError("SubstitutionsRepository not wired")

        self.events_repo.replace_players(
            event_id,
            [
                substitute_player_id if pid == departing_player_id else pid
                for pid in event_player_ids
            ],
        )

        current_round_number = event.current_round_number or 0
        sub = self.substitutions_repo.create(
            str(uuid4()),
            event_id,
            departing_player_id,
            substitute_player_id,
            current_round_number + 1,
        )
        return {
            "substitutionId": sub.id,
            "eventId": sub.event_id,
            "departingPlayerId": sub.departing_player_id,
            "substitutePlayerId": sub.substitute_player_id,
            "effectiveFromRound": sub.effective_from_round,
        }
