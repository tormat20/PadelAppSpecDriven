from app.domain.enums import EventType
from app.domain.scheduling import generate_next_round, generate_round_1


class MexicanoService:
    def generate_round_1(self, player_ids: list[str], courts: list[int]):
        return generate_round_1(EventType.MEXICANO, player_ids, courts)

    def generate_next_round(
        self, current_round: int, ordered_player_ids: list[str], courts: list[int]
    ):
        # Best-effort: use supplied ordering from scores.
        return generate_next_round(EventType.MEXICANO, current_round, ordered_player_ids, courts)
