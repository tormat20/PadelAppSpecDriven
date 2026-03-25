export type OcrCorrectionSourceType = "booking_text" | "ocr_image"

export type OcrResolutionStatus =
  | "unchanged"
  | "auto_corrected"
  | "suggested_review"
  | "conflict"

export type OcrResolutionReason =
  | "exact_signature"
  | "recent_override"
  | "suggested_only"
  | "identity_conflict"
  | "no_match"

export type OcrCorrectionUpsertRequest = {
  sourceType: OcrCorrectionSourceType
  noisySignature: string
  rawName: string
  rawEmail: string
  correctedName: string
  correctedEmail: string
  playerId?: string | null
  confidence: number
}

export type OcrCorrectionRecord = {
  id: string
  sourceType: OcrCorrectionSourceType
  noisySignature: string
  correctedName: string
  correctedEmail: string
  playerId: string | null
  confidence: number
  useCount: number
  updatedAt: string
}

export type OcrResolveRowRequest = {
  rawSource: string
  parsedName: string
  parsedEmail: string
  noisySignature: string
  matchedPlayerId?: string | null
}

export type OcrCorrectionResolveRequest = {
  sourceType: OcrCorrectionSourceType
  rows: OcrResolveRowRequest[]
}

export type OcrResolveRowResponse = {
  parsedName: string
  parsedEmail: string
  resolvedName: string
  resolvedEmail: string
  resolvedPlayerId: string | null
  resolutionStatus: OcrResolutionStatus
  resolutionReason: OcrResolutionReason
  confidence: number
}

export type OcrCorrectionResolveResponse = {
  rows: OcrResolveRowResponse[]
  autoAppliedCount: number
  suggestedCount: number
  conflictCount: number
}
