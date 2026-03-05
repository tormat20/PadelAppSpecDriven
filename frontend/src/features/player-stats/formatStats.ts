/**
 * Format a numeric stat value for display.
 *
 * @param value - the numeric stat (integer, may be negative)
 * @param label - optional label to append (will be trimmed of whitespace)
 * @returns formatted string, e.g. "42" or "42 Wins"
 */
export function formatStatValue(value: number, label?: string): string {
  const trimmedLabel = label?.trim() ?? ""
  if (trimmedLabel.length > 0) {
    return `${value} ${trimmedLabel}`
  }
  return String(value)
}
