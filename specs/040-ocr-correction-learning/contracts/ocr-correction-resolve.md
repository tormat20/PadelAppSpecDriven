# API Contract: OCR Correction Resolve

## Purpose

Resolve a batch of parsed OCR/paste rows against learned correction memory and return safe auto-corrections/suggestions.

## Endpoint

- Method: `POST`
- Path: `/api/v1/ocr/corrections/resolve`

## Request Body

- `sourceType` (required): `booking_text | ocr_image`
- `rows` (required): array of parsed row inputs
  - `rawSource`
  - `parsedName`
  - `parsedEmail`
  - `noisySignature`
  - `matchedPlayerId` (optional)

## Success Response

- HTTP `200`
- `rows`: array with one resolution object per input row
  - `parsedName`
  - `parsedEmail`
  - `resolvedName`
  - `resolvedEmail`
  - `resolvedPlayerId` (optional)
  - `resolutionStatus`: `unchanged | auto_corrected | suggested_review | conflict`
  - `resolutionReason`: `exact_signature | recent_override | suggested_only | identity_conflict | no_match`
  - `confidence`: number in [0,1]
- Summary counters:
  - `autoAppliedCount`
  - `suggestedCount`
  - `conflictCount`

## Behavior Rules

- Prefer most recent confirmed correction when multiple valid corrections map to the same noisy signature family.
- Auto-apply only when confidence and safety gates pass.
- If conflict with stronger identity evidence exists, return `conflict` and do not auto-apply.
- Unresolvable rows return `unchanged` or `suggested_review` based on confidence.

## Error Response

- `400` for invalid request payload structure.
- `422` for invalid signatures/row fields that cannot be normalized.
- `500` for unexpected resolution engine failures.

## Observability Expectations

- Resolution service emits/records status counts for auto-applied, suggested, and conflict outcomes.
- Each auto-applied decision includes sufficient metadata for audit/debug traces.
