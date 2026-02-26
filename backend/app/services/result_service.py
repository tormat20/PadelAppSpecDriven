from app.services.round_service import RoundService


class ResultService:
    def __init__(self, round_service: RoundService):
        self.round_service = round_service

    def apply(self, match_id: str, mode: str, payload: dict) -> None:
        self.round_service.record_result(match_id, mode, payload)
