from app.services.round_service import RoundService


class RoundViewService:
    def __init__(self, round_service: RoundService):
        self.round_service = round_service

    def get_current_round(self, event_id: str) -> dict:
        return self.round_service.get_current_round_view(event_id)
