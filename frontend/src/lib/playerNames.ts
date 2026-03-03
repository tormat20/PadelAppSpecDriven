/**
 * Normalises a player display name for case-insensitive comparison and
 * duplicate detection.
 *
 * Steps (in order):
 * 1. Trim surrounding whitespace
 * 2. Strip leading and trailing punctuation characters (handles OCR artefacts
 *    such as "Julia." matching "Julia")
 * 3. Lower-case with locale awareness
 *
 * Mid-name punctuation (apostrophes in "O'Brien", hyphens in "Anne-Marie") is
 * intentionally preserved.
 */
export function normalizePlayerName(displayName: string) {
  return displayName
    .trim()
    .replace(/^[.,;:!?]+|[.,;:!?]+$/g, "")
    .toLocaleLowerCase()
}
