# Data Model: OCR/Paste Accuracy Uplift + Learned Corrections

## Entity: ParsedParticipantRow

- **Purpose**: Represents one imported participant row after initial parser extraction and correction resolution.
- **Fields**:
  - `rawSource` (string, required) — original row text fragment
  - `sourceType` (enum: `booking_text`, `ocr_image`, required)
  - `parsedName` (string, required)
  - `parsedEmail` (string, required)
  - `noisySignature` (string, required)
  - `matchedPlayerId` (string | null)
  - `resolutionStatus` (enum: `unchanged`, `auto_corrected`, `suggested_review`, `conflict`)
  - `resolutionReason` (enum: `exact_signature`, `recent_override`, `suggested_only`, `identity_conflict`, `no_match`)
  - `confidence` (number 0.0-1.0)
- **Validation rules**:
  - `parsedEmail` must be syntactically valid email format.
  - `parsedName` must contain at least one non-whitespace token.
  - `resolutionStatus=auto_corrected` requires `confidence` above auto-apply threshold.

## Entity: OcrCorrection

- **Purpose**: Persistent user-confirmed correction memory entry used to improve future imports.
- **Fields**:
  - `id` (string/uuid, required)
  - `sourceType` (enum: `booking_text`, `ocr_image`, required)
  - `noisySignature` (string, required)
  - `correctedName` (string, required)
  - `correctedEmail` (string, required)
  - `playerId` (string | null)
  - `confidence` (number 0.0-1.0, required)
  - `useCount` (integer, required, default 0)
  - `lastUsedAt` (timestamp | null)
  - `createdAt` (timestamp, required)
  - `updatedAt` (timestamp, required)
- **Validation rules**:
  - Unique key on (`sourceType`, `noisySignature`, `correctedName`, `correctedEmail`) to prevent duplicate identical entries.
  - `updatedAt` must be refreshed on every confirmed overwrite/update.
  - `confidence` must remain within closed range [0, 1].

## Entity: CorrectionResolutionRequest

- **Purpose**: Batch request payload to resolve parsed rows against correction memory.
- **Fields**:
  - `rows` (list of `ParsedParticipantRow` input shape, required)
  - `sourceType` (enum, required)
  - `catalogSnapshot` (optional identity hints for conflict checks)
- **Validation rules**:
  - Empty `rows` list returns empty result without error.
  - All row signatures are computed deterministically from normalized raw inputs.

## Entity: CorrectionResolutionResult

- **Purpose**: Batch response carrying corrected/suggested outcomes per row.
- **Fields**:
  - `rows` (list of resolved rows)
  - `autoAppliedCount` (integer)
  - `suggestedCount` (integer)
  - `conflictCount` (integer)
- **Validation rules**:
  - Counts must equal totals derived from row statuses.
  - Each result row must include `resolutionStatus`, `resolutionReason`, and `confidence`.

## Entity: CorrectionAuditEvent

- **Purpose**: Audit record for when corrections are auto-applied or manually confirmed.
- **Fields**:
  - `eventType` (enum: `manual_confirm`, `auto_apply`, `suggestion_shown`, `conflict_blocked`)
  - `noisySignature` (string)
  - `beforeName` (string)
  - `beforeEmail` (string)
  - `afterName` (string)
  - `afterEmail` (string)
  - `confidence` (number)
  - `occurredAt` (timestamp)
- **Validation rules**:
  - Required for observability and rollback debugging.

## State Transitions

1. `parsed` -> `resolved (unchanged|auto_corrected|suggested_review|conflict)`
2. `suggested_review/conflict` -> `manual_confirm` (user edits row)
3. `manual_confirm` -> `correction_memory_upserted`
4. Next import with same/similar noisy signature -> `auto_corrected` (if safe)

## Relationship Notes

- One `OcrCorrection` can influence many future `ParsedParticipantRow` instances.
- `CorrectionResolutionResult` references zero or one winning `OcrCorrection` per row.
- `CorrectionAuditEvent` references both source row signature and applied correction outcome.
