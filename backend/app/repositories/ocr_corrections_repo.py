from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import uuid4


@dataclass(slots=True)
class OcrCorrectionRecord:
    id: str
    source_type: str
    noisy_signature: str
    raw_name: str
    raw_email: str
    corrected_name: str
    corrected_email: str
    player_id: str | None
    confidence: float
    use_count: int
    last_used_at: datetime | None
    created_at: datetime
    updated_at: datetime


class OcrCorrectionsRepository:
    def __init__(self, conn):
        self.conn = conn

    @staticmethod
    def _from_row(row) -> OcrCorrectionRecord:
        return OcrCorrectionRecord(
            id=row[0],
            source_type=row[1],
            noisy_signature=row[2],
            raw_name=row[3],
            raw_email=row[4],
            corrected_name=row[5],
            corrected_email=row[6],
            player_id=row[7],
            confidence=float(row[8]),
            use_count=int(row[9]),
            last_used_at=row[10],
            created_at=row[11],
            updated_at=row[12],
        )

    def find_by_signature(
        self, source_type: str, noisy_signature: str
    ) -> list[OcrCorrectionRecord]:
        rows = self.conn.execute(
            """
            SELECT id, source_type, noisy_signature, raw_name, raw_email,
                   corrected_name, corrected_email, player_id,
                   confidence, use_count, last_used_at, created_at, updated_at
            FROM ocr_corrections
            WHERE source_type = ? AND noisy_signature = ?
            ORDER BY updated_at DESC
            """,
            [source_type, noisy_signature],
        ).fetchall()
        return [self._from_row(row) for row in rows]

    def upsert(
        self,
        source_type: str,
        noisy_signature: str,
        raw_name: str,
        raw_email: str,
        corrected_name: str,
        corrected_email: str,
        player_id: str | None,
        confidence: float,
    ) -> OcrCorrectionRecord:
        existing = self.conn.execute(
            """
            SELECT id, source_type, noisy_signature, raw_name, raw_email,
                   corrected_name, corrected_email, player_id,
                   confidence, use_count, last_used_at, created_at, updated_at
            FROM ocr_corrections
            WHERE source_type = ? AND noisy_signature = ?
              AND corrected_name = ? AND corrected_email = ?
            ORDER BY updated_at DESC
            LIMIT 1
            """,
            [source_type, noisy_signature, corrected_name, corrected_email],
        ).fetchone()

        if existing:
            record = self._from_row(existing)
            self.conn.execute(
                """
                UPDATE ocr_corrections
                SET raw_name = ?,
                    raw_email = ?,
                    player_id = ?,
                    confidence = ?,
                    use_count = use_count + 1,
                    last_used_at = current_timestamp,
                    updated_at = current_timestamp
                WHERE id = ?
                """,
                [raw_name, raw_email, player_id, confidence, record.id],
            )
            return self.get(record.id)

        correction_id = str(uuid4())
        self.conn.execute(
            """
            INSERT INTO ocr_corrections (
                id, source_type, noisy_signature, raw_name, raw_email,
                corrected_name, corrected_email, player_id, confidence
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                correction_id,
                source_type,
                noisy_signature,
                raw_name,
                raw_email,
                corrected_name,
                corrected_email,
                player_id,
                confidence,
            ],
        )
        return self.get(correction_id)

    def increment_use(self, correction_id: str) -> None:
        self.conn.execute(
            """
            UPDATE ocr_corrections
            SET use_count = use_count + 1,
                last_used_at = current_timestamp,
                updated_at = current_timestamp
            WHERE id = ?
            """,
            [correction_id],
        )

    def get(self, correction_id: str) -> OcrCorrectionRecord:
        row = self.conn.execute(
            """
            SELECT id, source_type, noisy_signature, raw_name, raw_email,
                   corrected_name, corrected_email, player_id,
                   confidence, use_count, last_used_at, created_at, updated_at
            FROM ocr_corrections
            WHERE id = ?
            """,
            [correction_id],
        ).fetchone()
        return self._from_row(row)
