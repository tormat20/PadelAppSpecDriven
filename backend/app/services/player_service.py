from uuid import uuid4

from app.repositories.player_stats_repo import PlayerStatsRepository
from app.repositories.players_repo import PlayersRepository
from app.services.name_format import format_display_name


class PlayerService:
    def __init__(
        self,
        players_repo: PlayersRepository,
        player_stats_repo: PlayerStatsRepository | None = None,
    ):
        self.players_repo = players_repo
        self.player_stats_repo = player_stats_repo

    def create_player(self, display_name: str, email: str | None = None):
        # Email-first dedup: if an email is supplied and already in the DB,
        # return the existing player rather than creating a duplicate.
        if email:
            existing = self.players_repo.get_by_email(email)
            if existing:
                return existing
        return self.players_repo.create(str(uuid4()), format_display_name(display_name), email)

    def search_players(self, query: str | None):
        return self.players_repo.search(query)

    def get_player(self, player_id: str):
        return self.players_repo.get(player_id)

    def update_player(self, player_id: str, display_name: str, email: str | None = None):
        player = self.players_repo.get(player_id)
        if not player:
            return None

        normalized_name = format_display_name(display_name)
        existing_name = self.players_repo.get_by_display_name(normalized_name)
        if existing_name and existing_name.id != player_id:
            raise ValueError("A player with this name already exists.")

        if email:
            existing_email = self.players_repo.get_by_email(email)
            if existing_email and existing_email.id != player_id:
                raise ValueError("A player with this email already exists.")

        return self.players_repo.update(player_id, normalized_name, email)

    def delete_player(self, player_id: str) -> bool:
        """Delete a single player by ID. Returns True if found and deleted, False if not found."""
        player = self.players_repo.get(player_id)
        if not player:
            return False
        self.players_repo.delete(player_id)
        return True

    def delete_all_players(self) -> None:
        """Delete every player and all associated data."""
        self.players_repo.delete_all()

    def reset_all_player_stats(self) -> None:
        """Zero out all accumulated stats while keeping player records."""
        if self.player_stats_repo is None:
            raise RuntimeError("player_stats_repo is required for reset_all_player_stats")
        self.player_stats_repo.reset_all_stats()
