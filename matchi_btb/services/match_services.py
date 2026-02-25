class MatchSerivce:
    def __init__(self, event_repo, box_repo, match_repo, player_repo):

        self.event_repo = event_repo
        self.box_repo = box_repo
        self.match_repo = match_repo
        self.player_repo = player_repo


    def create_match(self,box_id, team1_players, team2_players):
        match_id = self.match_repo.create(box_id)

        self.match_repo.add_team(match_id, team1_players, team=1)
        self.match_repo.add_team(match_id, team2_players, team=2)

        return match_id


    def set_results(self,match_id, winning_team):
        self.match_repo.set_result(match_id, winning_team)
        match = self.match_repo.get_match(match_id)

    def get_team(self, match_id, player_id):
        team = self.match_repo.get_player_team(match_id, player_id)
        return team
    
    def get_players(self, match_id, team):
        players = self.match_repo.get_team(match_id, team)
        return players
    
    def set_win(self,match_id,team):
        self.match_repo.set_result(match_id,team)

    def set_loss(self,match_id,team):
        winning_team = 2 if team == 1 else 1
        self.match_repo.set_result(match_id,winning_team)