from app.domain.scoring import mexicano_score


def test_mexicano_recalculation_uses_latest_valid_scores():
    first = mexicano_score(16, 8)
    corrected = mexicano_score(12, 12)

    assert first == (16, 8)
    assert corrected == (12, 12)
