from app.db.connection import get_connection
from app.db.migrate import run_migrations


def test_migrations_apply_once(tmp_path):
    from app.core.config import settings

    settings.db_path = str(tmp_path / "mig.duckdb")
    run_migrations()
    run_migrations()

    with get_connection() as conn:
        rows = conn.execute("SELECT name FROM schema_migrations ORDER BY name").fetchall()
    assert [r[0] for r in rows] == [
        "001_init.sql",
        "002_planned_event_slots.sql",
        "003_foreign_keys_cascade.sql",
        "004_rename_americano_to_winners_court.sql",
        "005_player_stats.sql",
        "006_rename_beat_the_box_to_ranked_box.sql",
        "007_users.sql",
        "008_team_mexicano.sql",
        "009_substitutions.sql",
        "010_fix_corrupt_event_status.sql",
        "011_remove_event_fk_from_event_teams_and_substitutions.sql",
        "012_americano_event_type.sql",
        "013_player_email.sql",
        "014_player_stats_wins_highscore.sql",
        "015_event_duration_minutes.sql",
        "016_match_result_corrections.sql",
        "017_ocr_corrections.sql",
        "018_players_drop_unique_display_name.sql",
        "019_americano_score_split.sql",
        "020_score_and_event_count_split.sql",
    ]
