# API Contract: OCR Correction Upsert

## Purpose

Persist a user-confirmed correction so future similar OCR/paste rows can be auto-corrected.

## Endpoint

- Method: `POST`
- Path: `/api/v1/ocr/corrections`

## Request Body

- `sourceType` (required): `booking_text | ocr_image`
- `noisySignature` (required): deterministic normalized signature for the noisy row
- `rawName` (required): parsed/pre-edit name shown to user
- `rawEmail` (required): parsed/pre-edit email shown to user
- `correctedName` (required): user-confirmed final name
- `correctedEmail` (required): user-confirmed final email
- `playerId` (optional): resolved player identity if known
- `confidence` (required): confidence assigned at confirmation time

## Success Response

- HTTP `200` or `201`
- Returns persisted correction record summary:
  - `id`
  - `sourceType`
  - `noisySignature`
  - `correctedName`
  - `correctedEmail`
  - `playerId`
  - `confidence`
  - `useCount`
  - `updatedAt`

## Behavior Rules

- If an equivalent correction exists for the same signature family, the newest confirmed correction updates recency and becomes preferred.
- Upsert must be idempotent for repeated identical payloads.
- Persisting a correction must not mutate existing player records.

## Error Response

- `400` for malformed/invalid request payload.
- `409` for identity conflict that violates safety rules.
- `500` for unexpected persistence failures.

## Safety Rules

- Never allow a correction that would silently override a stronger exact identity mapping without explicit conflict signaling.
- Require valid email format and non-empty normalized name.
