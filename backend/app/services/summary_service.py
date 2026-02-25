from app.domain.enums import EventStatus
from app.repositories.events_repo import EventsRepository
from app.services.round_service import RoundService


class SummaryService:
    def __init__(self, events_repo: EventsRepository, round_service: RoundService):
        self.events_repo = events_repo
        self.round_service = round_service

    def finish_event(self, event_id: str) -> dict:
        event = self.events_repo.get(event_id)
        if not event:
            raise ValueError("Event not found")
        if event.current_round_number is None or event.current_round_number < event.round_count:
            raise ValueError("Event can only be finished after final round")

        summary = self.round_service.summarize(event_id)
        self.events_repo.set_status(event_id, EventStatus.FINISHED, event.current_round_number)
        return summary
