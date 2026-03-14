import { normalizePlayerName } from "../../lib/playerNames"
import { findDuplicateByName } from "../../features/create-event/playerSearch"

export type OcrMatchResult = {
  /** The raw name string extracted from the OCR output (trimmed, deduplicated). */
  rawName: string
  /**
   * Email address associated with this entry (from the booking-text parser).
   * Null for entries created via OCR image parsing.
   */
  email: string | null
  /**
   * The matched catalog player, or null if no case-insensitive match was found.
   */
  matchedPlayer: { id: string; displayName: string } | null
}

/**
 * Strips common OCR-list prefixes from a raw name string.
 *
 * Patterns removed (left-to-right, in order):
 * 1. Leading digits followed by an optional dot and whitespace  e.g. "10. ", "2 "
 * 2. Leading single letter followed by a dot and whitespace      e.g. "D. ", "A. "
 * 3. Remaining leading/trailing punctuation or whitespace
 *
 * Examples:
 *   "1. Alice"   → "Alice"
 *   "10. Bob"    → "Bob"
 *   "D. Willma"  → "Willma"
 *   "7. Julia."  → "Julia"
 *   "Alice"      → "Alice"
 *
 * @param raw - A single trimmed line from OCR output
 * @returns   - The cleaned name string
 */
export function cleanOcrName(raw: string): string {
  // Strip leading "N." or "N. " (one or more digits, optional dot, optional space)
  let cleaned = raw.replace(/^\d+\.?\s*/, "")
  // Strip leading "L. " (single letter followed by dot and whitespace)
  cleaned = cleaned.replace(/^[A-Za-z]\.\s+/, "")
  // Strip trailing punctuation characters left by OCR artefacts
  cleaned = cleaned.replace(/[.,;:!?]+$/, "")
  return cleaned.trim()
}

/**
 * Converts raw Tesseract OCR output into a deduplicated list of candidate
 * player name strings.
 *
 * Filtering rules (applied in order):
 * 1. Split on newlines
 * 2. Trim each line
 * 3. Drop empty / whitespace-only lines
 * 4. Drop lines with ≤ 1 character (OCR noise)
 * 5. Drop lines that are purely numeric
 * 6. Clean common list-prefix patterns via cleanOcrName()
 * 7. Drop any line that became empty or ≤ 1 char after cleaning
 * 8. Deduplicate by normalised name (case-insensitive)
 *
 * @param rawText - The raw string returned by Tesseract worker.recognize()
 * @returns       - Ordered list of unique candidate player name strings
 */
export function parseOcrNames(rawText: string): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const line of rawText.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (trimmed.length <= 1) continue
    if (/^\d+$/.test(trimmed)) continue
    const cleaned = cleanOcrName(trimmed)
    if (!cleaned || cleaned.length <= 1) continue
    const key = normalizePlayerName(cleaned)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(cleaned)
  }
  return result
}

/**
 * Maps a list of candidate name strings to OcrMatchResult objects by
 * looking each name up in the player catalog using case-insensitive matching.
 *
 * @param names   - Output of parseOcrNames()
 * @param catalog - The current player catalog loaded from the API
 * @returns       - One OcrMatchResult per input name, in the same order
 */
export function matchNamesToCatalog(
  names: string[],
  catalog: { id: string; displayName: string }[],
): OcrMatchResult[] {
  return names.map((rawName) => ({
    rawName,
    email: null,
    matchedPlayer: findDuplicateByName(catalog, rawName),
  }))
}
