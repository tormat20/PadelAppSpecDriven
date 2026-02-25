WIN_POINTS = 3
LOSS_POINTS = -1

class Points:
    def __init__(self):
        pass

    def calculate_points(winner, loser):
        return {
            winner: WIN_POINTS,
            loser: LOSS_POINTS
        }

# Potential weighted win / loss 