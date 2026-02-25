from database.schema import create_tables, drop_tables
from database.connection import get_connection
from database.repositories.player_repo import PlayerRepository
from database.repositories.match_repo import MatchRepository
from database.repositories.event_repo import EventRepository
from database.repositories.box_repo import BoxRepository

from services.event_services import EventService

from datetime import date

from faker import Faker


def main():

    print("running main")

    # drop_tables()
    create_tables()

    conn = get_connection()
    player_repo = PlayerRepository(conn)
    match_repo = MatchRepository(conn)
    event_repo = EventRepository(conn)

    today = date.today().isoformat()
    event_name = "Torsdags Padel"

    # Create objects in tables
    alice_id = player_repo.create("Alice")
    print("Alice ID:", alice_id)

    event = event_repo.create(event_name, today)

    players = player_repo.list_all()
    events = event_repo.list_all()

    round_number = 1
    match = match_repo.create(events[0].id,round_number)

    for player in players:
        print(player)
        print(player.name, player.points)

    for event in events:
        print(event)

def create_random_players(num_players):

    conn = get_connection()
    player_repo = PlayerRepository(conn)
    fake = Faker()
    name = fake.first_name()

    players = []

    for _ in range(num_players):
        name = fake.first_name()
        player_id = player_repo.create(name)
        players.append(player_repo.get(player_id))

    return players
        
def test():
    drop_tables()
    create_tables()
    create_random_players(5)

    conn = get_connection()
    player_repo = PlayerRepository(conn)
    match_repo = MatchRepository(conn)
    event_repo = EventRepository(conn)

    players = player_repo.list_all()
    # print("\n")
    # print(players)
    # print(len(players))
    # players = player_repo.list_all_by_points()

    for i, player in enumerate(players):
        player_repo.update_points(player.id, i)
    
    # players = player_repo.list_all()
    # print("\n")
    # print(players)
    # print(len(players))

    players = player_repo.list_all_by_points()
    print("\n")
    print(players)
    print(len(players))

    event_service = EventService(match_repo)
    match_players = players[:3]

    event_service.create_btb_matches(1,match_players)

from test import test_full_match_flow, test_match_service_setup_and_win

def full_event_test():

    drop_tables()
    create_tables()
    create_random_players(5)

    conn = get_connection()
    player_repo = PlayerRepository(conn)
    match_repo = MatchRepository(conn)
    event_repo = EventRepository(conn)

    event_service = EventService(match_repo)

    today = date.today().isoformat()
    event_name = "Torsdags Padel"

    event_id = event_service.create_event(event_name, today)



if __name__ == "__main__":

    drop_tables()
    create_tables()

    conn = get_connection()
    player_repo = PlayerRepository(conn)
    match_repo = MatchRepository(conn)
    event_repo = EventRepository(conn)
    box_repo = BoxRepository(conn)

    repos = {
        "events":event_repo,
        "boxes":box_repo,
        "matches":match_repo,
        "players":player_repo
    }
    # main()
    # test()

    players = create_random_players(4)
    test_full_match_flow(conn,repos, players )
