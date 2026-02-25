from app.domain.enums import EventType
from app.domain.scheduling import generate_next_round, generate_round_1


class AmericanoService:
    def generate_round_1(self, player_ids: list[str], courts: list[int]):
        return generate_round_1(EventType.AMERICANO, player_ids, courts)

    def generate_next_round(
        self, current_round: int, ordered_player_ids: list[str], courts: list[int]
    ):
        return generate_next_round(EventType.AMERICANO, current_round, ordered_player_ids, courts)
