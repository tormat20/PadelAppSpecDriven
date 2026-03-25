from typing import Literal

from pydantic import BaseModel, Field


SourceType = Literal["booking_text", "ocr_image"]
ResolutionStatus = Literal["unchanged", "auto_corrected", "suggested_review", "conflict"]
ResolutionReason = Literal[
    "exact_signature",
    "recent_override",
    "suggested_only",
    "identity_conflict",
    "no_match",
]


class OcrCorrectionUpsertRequest(BaseModel):
    sourceType: SourceType
    noisySignature: str = Field(min_length=3, max_length=300)
    rawName: str = Field(min_length=1, max_length=200)
    rawEmail: str = Field(min_length=3, max_length=320)
    correctedName: str = Field(min_length=1, max_length=200)
    correctedEmail: str = Field(min_length=3, max_length=320)
    playerId: str | None = None
    confidence: float = Field(ge=0.0, le=1.0)


class OcrCorrectionResponse(BaseModel):
    id: str
    sourceType: SourceType
    noisySignature: str
    correctedName: str
    correctedEmail: str
    playerId: str | None
    confidence: float
    useCount: int
    updatedAt: str


class OcrResolveRowRequest(BaseModel):
    rawSource: str = Field(min_length=1)
    parsedName: str = Field(min_length=1)
    parsedEmail: str = Field(min_length=3)
    noisySignature: str = Field(min_length=3, max_length=300)
    matchedPlayerId: str | None = None


class OcrCorrectionResolveRequest(BaseModel):
    sourceType: SourceType
    rows: list[OcrResolveRowRequest] = Field(default_factory=list)


class OcrResolveRowResponse(BaseModel):
    parsedName: str
    parsedEmail: str
    resolvedName: str
    resolvedEmail: str
    resolvedPlayerId: str | None
    resolutionStatus: ResolutionStatus
    resolutionReason: ResolutionReason
    confidence: float


class OcrCorrectionResolveResponse(BaseModel):
    rows: list[OcrResolveRowResponse]
    autoAppliedCount: int
    suggestedCount: int
    conflictCount: int
