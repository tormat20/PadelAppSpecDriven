from fastapi import APIRouter

from app.api.deps import services_scope
from app.api.schemas.ocr import (
    OcrCorrectionResolveRequest,
    OcrCorrectionResolveResponse,
    OcrCorrectionResponse,
    OcrCorrectionUpsertRequest,
)

router = APIRouter(prefix="/ocr", tags=["ocr"])


@router.post("/corrections", response_model=OcrCorrectionResponse)
def upsert_ocr_correction(payload: OcrCorrectionUpsertRequest) -> OcrCorrectionResponse:
    with services_scope() as services:
        record = services["ocr_correction_service"].upsert_correction(
            source_type=payload.sourceType,
            noisy_signature=payload.noisySignature,
            raw_name=payload.rawName,
            raw_email=payload.rawEmail,
            corrected_name=payload.correctedName,
            corrected_email=payload.correctedEmail,
            player_id=payload.playerId,
            confidence=payload.confidence,
        )
    return OcrCorrectionResponse(
        id=record.id,
        sourceType=record.source_type,
        noisySignature=record.noisy_signature,
        correctedName=record.corrected_name,
        correctedEmail=record.corrected_email,
        playerId=record.player_id,
        confidence=record.confidence,
        useCount=record.use_count,
        updatedAt=record.updated_at.isoformat(),
    )


@router.post("/corrections/resolve", response_model=OcrCorrectionResolveResponse)
def resolve_ocr_corrections(payload: OcrCorrectionResolveRequest) -> OcrCorrectionResolveResponse:
    with services_scope() as services:
        return OcrCorrectionResolveResponse.model_validate(
            services["ocr_correction_service"].resolve_rows(
                source_type=payload.sourceType,
                rows=[row.model_dump() for row in payload.rows],
            )
        )
