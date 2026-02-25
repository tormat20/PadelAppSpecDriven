class BoxSerivce:
    def __init__(self, event_repo, box_repo, match_repo, player_repo):

        self.event_repo = event_repo
        self.box_repo = box_repo
        self.match_repo = match_repo
        self.player_repo = player_repo

    def create_box(self, event_id: int, box_number: int, players: list[Player]) -> Box:
        """
        Creates a box for 4 players in an event.
        Returns a Box dataclass with players included.
        """
        # Create Box
        box_id = self.box_repo.create(event_id, box_number)

        # Add Players
        for p in players:
            self.box_repo.add_player(box_id, p.id)

        return self.box_repo.get(box_id)
