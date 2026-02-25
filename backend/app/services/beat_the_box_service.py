from app.domain.enums import EventType
from app.domain.scheduling import generate_next_round, generate_round_1


class BeatTheBoxService:
    def generate_round_1(self, player_ids: list[str], courts: list[int]):
        return generate_round_1(EventType.BEAT_THE_BOX, player_ids, courts)

    def generate_next_round(
        self, current_round: int, ordered_player_ids: list[str], courts: list[int]
    ):
        return generate_next_round(
            EventType.BEAT_THE_BOX, current_round, ordered_player_ids, courts
        )
