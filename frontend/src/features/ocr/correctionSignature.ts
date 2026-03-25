import { normalizePlayerName } from "../../lib/playerNames"

const MAX_SEGMENT_LENGTH = 120

function normalizeSegment(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, MAX_SEGMENT_LENGTH)
}

export function buildOcrNoisySignature(input: {
  sourceType: "booking_text" | "ocr_image"
  rawSource?: string | null
  parsedName: string
  parsedEmail: string
}): string {
  const normalizedName = normalizePlayerName(input.parsedName)
  const normalizedEmail = normalizeSegment(input.parsedEmail)
  const normalizedRaw = normalizeSegment(input.rawSource ?? "")
  return [input.sourceType, normalizedName, normalizedEmail, normalizedRaw].join("|")
}
