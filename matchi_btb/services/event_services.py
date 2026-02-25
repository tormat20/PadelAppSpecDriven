class EventService:
    def __init__(self, 
                event_repo, box_repo, match_repo, player_repo,
                event_service, box_service, match_service, player_service 
                ):

        self.event_repo = event_repo
        self.box_repo = box_repo
        self.match_repo = match_repo
        self.player_repo = player_repo

        self.event_service = event_service
        self.box_service = box_service
        self.match_service = match_service
        self.player_service = player_service

    def create_event(self, name: str, event_date: str) -> Event:
        event_id = self.event_repo.create(name, event_date)
        return self.event_repo.get_event(event_id)
    
    def init_game(self, name: str, event_date: str):
        event_obj = self.event_service.create_event(name, event_date)
        # event = self.create_event(name, event_date)

        event_id = event_obj["id"]

        #Get player_list
        player_list_desc = self.player_repo.list_all_by_points()
        player_list_desc_len = len(player_list_desc)

        #Get number of courts
        num_courts = player_list_desc_len // 4
        box_obj_list = [] 
        for i in num_courts:
            box_obj = self.box_service.create_box(event_id,box_number,players)




    def create_btb_matches(self, box_id, players):
        """
        players: list[Player] length = 4
        """

        rotations = [
            ((players[0], players[1]), (players[2], players[3])),
            ((players[0], players[2]), (players[1], players[3])),
            ((players[0], players[3]), (players[1], players[2])),
        ]

        match_ids = []

        for team1, team2 in rotations:
            match_id = self.match_repo.create(box_id)
            match_ids.append(match_id)

            for p in team1:
                self.match_repo.add_player(match_id, p.id, team=1)

            for p in team2:
                self.match_repo.add_player(match_id, p.id, team=2)

        return match_ids
    


