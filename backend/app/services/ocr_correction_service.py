from __future__ import annotations

from app.repositories.ocr_corrections_repo import OcrCorrectionRecord, OcrCorrectionsRepository


class OcrCorrectionService:
    def __init__(self, corrections_repo: OcrCorrectionsRepository):
        self.corrections_repo = corrections_repo

    def upsert_correction(
        self,
        *,
        source_type: str,
        noisy_signature: str,
        raw_name: str,
        raw_email: str,
        corrected_name: str,
        corrected_email: str,
        player_id: str | None,
        confidence: float,
    ) -> OcrCorrectionRecord:
        return self.corrections_repo.upsert(
            source_type=source_type,
            noisy_signature=noisy_signature,
            raw_name=raw_name,
            raw_email=raw_email,
            corrected_name=corrected_name,
            corrected_email=corrected_email,
            player_id=player_id,
            confidence=confidence,
        )

    def resolve_rows(self, *, source_type: str, rows: list[dict]) -> dict:
        resolved_rows: list[dict] = []
        auto_count = 0
        suggested_count = 0
        conflict_count = 0

        for row in rows:
            matched_player_id = row.get("matchedPlayerId")
            corrections = self.corrections_repo.find_by_signature(
                source_type=source_type,
                noisy_signature=row["noisySignature"],
            )

            if not corrections:
                resolved_rows.append(
                    {
                        "parsedName": row["parsedName"],
                        "parsedEmail": row["parsedEmail"],
                        "resolvedName": row["parsedName"],
                        "resolvedEmail": row["parsedEmail"],
                        "resolvedPlayerId": matched_player_id,
                        "resolutionStatus": "unchanged",
                        "resolutionReason": "no_match",
                        "confidence": 0.0,
                    }
                )
                continue

            winner = corrections[0]
            conflict = bool(
                matched_player_id and winner.player_id and winner.player_id != matched_player_id
            )

            if conflict:
                conflict_count += 1
                resolved_rows.append(
                    {
                        "parsedName": row["parsedName"],
                        "parsedEmail": row["parsedEmail"],
                        "resolvedName": row["parsedName"],
                        "resolvedEmail": row["parsedEmail"],
                        "resolvedPlayerId": matched_player_id,
                        "resolutionStatus": "conflict",
                        "resolutionReason": "identity_conflict",
                        "confidence": float(winner.confidence),
                    }
                )
                continue

            status = "auto_corrected" if float(winner.confidence) >= 0.9 else "suggested_review"
            reason = "recent_override" if len(corrections) > 1 else "exact_signature"

            if status == "auto_corrected":
                auto_count += 1
                self.corrections_repo.increment_use(winner.id)
            else:
                suggested_count += 1
                reason = "suggested_only"

            resolved_rows.append(
                {
                    "parsedName": row["parsedName"],
                    "parsedEmail": row["parsedEmail"],
                    "resolvedName": winner.corrected_name,
                    "resolvedEmail": winner.corrected_email,
                    "resolvedPlayerId": winner.player_id or matched_player_id,
                    "resolutionStatus": status,
                    "resolutionReason": reason,
                    "confidence": float(winner.confidence),
                }
            )

        return {
            "rows": resolved_rows,
            "autoAppliedCount": auto_count,
            "suggestedCount": suggested_count,
            "conflictCount": conflict_count,
        }
