from uuid import uuid4

from app.repositories.players_repo import PlayersRepository


class PlayerService:
    def __init__(self, players_repo: PlayersRepository):
        self.players_repo = players_repo

    def create_player(self, display_name: str):
        return self.players_repo.create(str(uuid4()), display_name)

    def search_players(self, query: str | None):
        return self.players_repo.search(query)

    def get_player(self, player_id: str):
        return self.players_repo.get(player_id)
