from domain.scoring import Points

class PlayerSerivce:
    def __init__(self, event_repo, box_repo, match_repo, player_repo):

        self.event_repo = event_repo
        self.box_repo = box_repo
        self.match_repo = match_repo
        self.player_repo = player_repo

    def set_points(self,player_id, points):
        self.player_repo.update_points(player_id,points)

    def set_win(self,player_id):
        WIN_POINTS = 15
        self.set_points(player_id, WIN_POINTS)

    def set_loss(self, player_id):
        LOSS_POINTS = -5
        self.set_points(player_id, LOSS_POINTS)