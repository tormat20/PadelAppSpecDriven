from app.domain.enums import EventType
from app.domain.scheduling import generate_next_round, generate_round_1


class AmericanoService:
    def generate_round_1(self, player_ids: list[str], courts: list[int]):
        return generate_round_1(EventType.AMERICANO, player_ids, courts)

    def generate_next_round(
        self,
        current_round: int,
        ordered_player_ids: list[str],
        courts: list[int],
        previous_matches=None,
        previous_rank_map=None,
        partner_history=None,
        event_seed: str = "",
    ):
        return generate_next_round(
            EventType.AMERICANO,
            current_round,
            ordered_player_ids,
            courts,
            previous_matches=previous_matches,
            previous_rank_map=previous_rank_map,
            partner_history=partner_history,
            event_seed=event_seed,
        )
