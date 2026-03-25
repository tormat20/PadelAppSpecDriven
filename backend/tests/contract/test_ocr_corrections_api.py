def _upsert(
    client,
    *,
    source_type: str = "booking_text",
    signature: str = "booking_text|alice smith|alice@example.com|alice smithalice@example.com",
    raw_name: str = "Alice Smith",
    raw_email: str = "alice@example.com",
    corrected_name: str = "Alice Smith",
    corrected_email: str = "alice@example.com",
    player_id: str | None = None,
    confidence: float = 1.0,
):
    return client.post(
        "/api/v1/ocr/corrections",
        json={
            "sourceType": source_type,
            "noisySignature": signature,
            "rawName": raw_name,
            "rawEmail": raw_email,
            "correctedName": corrected_name,
            "correctedEmail": corrected_email,
            "playerId": player_id,
            "confidence": confidence,
        },
    )


def test_upsert_creates_and_is_idempotent_for_identical_payload(client):
    first = _upsert(client)
    assert first.status_code == 200
    first_body = first.json()
    assert first_body["sourceType"] == "booking_text"
    assert first_body["correctedEmail"] == "alice@example.com"
    assert first_body["useCount"] == 0

    second = _upsert(client)
    assert second.status_code == 200
    second_body = second.json()

    assert second_body["id"] == first_body["id"]
    assert second_body["correctedEmail"] == first_body["correctedEmail"]
    assert second_body["useCount"] == first_body["useCount"] + 1


def test_resolve_auto_applies_latest_high_confidence_correction(client):
    signature = "booking_text|mikael andersson|mikael.andersson@gmail.com|mikael anderssonmikael.andersson@gmail.com"
    _upsert(
        client,
        signature=signature,
        raw_name="Mikael Andersson",
        raw_email="mikael.andersson@gmail.com",
        corrected_name="Mikael Andersson",
        corrected_email="micke0522@gmail.com",
        confidence=0.95,
    )

    resolved = client.post(
        "/api/v1/ocr/corrections/resolve",
        json={
            "sourceType": "booking_text",
            "rows": [
                {
                    "rawSource": "Mikael Anderssonmikael.andersson@gmail.com",
                    "parsedName": "Mikael Andersson",
                    "parsedEmail": "mikael.andersson@gmail.com",
                    "noisySignature": signature,
                }
            ],
        },
    )
    assert resolved.status_code == 200
    row = resolved.json()["rows"][0]
    assert row["resolutionStatus"] == "auto_corrected"
    assert row["resolutionReason"] == "exact_signature"
    assert row["resolvedEmail"] == "micke0522@gmail.com"
    assert resolved.json()["autoAppliedCount"] == 1


def test_resolve_prefers_most_recent_correction_when_multiple_exist(client):
    signature = "booking_text|daniel haglund|daniel@example.com|daniel haglunddaniel@example.com"
    _upsert(
        client,
        signature=signature,
        raw_name="Daniel Haglund",
        raw_email="daniel@example.com",
        corrected_name="Daniel Haglund",
        corrected_email="first@example.com",
        confidence=0.95,
    )
    _upsert(
        client,
        signature=signature,
        raw_name="Daniel Haglund",
        raw_email="daniel@example.com",
        corrected_name="Daniel Haglund",
        corrected_email="second@example.com",
        confidence=0.95,
    )

    resolved = client.post(
        "/api/v1/ocr/corrections/resolve",
        json={
            "sourceType": "booking_text",
            "rows": [
                {
                    "rawSource": "Daniel Haglunddaniel@example.com",
                    "parsedName": "Daniel Haglund",
                    "parsedEmail": "daniel@example.com",
                    "noisySignature": signature,
                }
            ],
        },
    )
    assert resolved.status_code == 200
    row = resolved.json()["rows"][0]
    assert row["resolutionStatus"] == "auto_corrected"
    assert row["resolutionReason"] == "recent_override"
    assert row["resolvedEmail"] == "second@example.com"


def test_resolve_returns_suggested_review_when_confidence_is_low(client):
    signature = "booking_text|karin stage|karin@example.com|karin stagekarin@example.com"
    _upsert(
        client,
        signature=signature,
        raw_name="Karin Stage",
        raw_email="karin@example.com",
        corrected_name="Karin Stage",
        corrected_email="karin.stage@educ.goteborg.se",
        confidence=0.55,
    )

    resolved = client.post(
        "/api/v1/ocr/corrections/resolve",
        json={
            "sourceType": "booking_text",
            "rows": [
                {
                    "rawSource": "Karin Stagekarin@example.com",
                    "parsedName": "Karin Stage",
                    "parsedEmail": "karin@example.com",
                    "noisySignature": signature,
                }
            ],
        },
    )
    assert resolved.status_code == 200
    row = resolved.json()["rows"][0]
    assert row["resolutionStatus"] == "suggested_review"
    assert row["resolutionReason"] == "suggested_only"
    assert resolved.json()["suggestedCount"] == 1


def test_resolve_returns_conflict_when_player_identity_disagrees(client):
    signature = "booking_text|amir omrani|amir@example.com|amir omraniamir@example.com"
    _upsert(
        client,
        signature=signature,
        raw_name="Amir Omrani",
        raw_email="amir@example.com",
        corrected_name="Amir Omrani",
        corrected_email="amir@example.com",
        player_id="player-a",
        confidence=0.98,
    )

    resolved = client.post(
        "/api/v1/ocr/corrections/resolve",
        json={
            "sourceType": "booking_text",
            "rows": [
                {
                    "rawSource": "Amir Omraniamir@example.com",
                    "parsedName": "Amir Omrani",
                    "parsedEmail": "amir@example.com",
                    "noisySignature": signature,
                    "matchedPlayerId": "player-b",
                }
            ],
        },
    )
    assert resolved.status_code == 200
    row = resolved.json()["rows"][0]
    assert row["resolutionStatus"] == "conflict"
    assert row["resolutionReason"] == "identity_conflict"
    assert resolved.json()["conflictCount"] == 1
