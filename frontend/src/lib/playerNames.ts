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

/**
 * Builds a map of player id → short display name for a set of players in the
 * same event.
 *
 * Algorithm:
 * - Default: show first name only (e.g. "Fredrik")
 * - If two or more players share the same first name, disambiguate by appending
 *   the minimum prefix of the last name that makes all names in the group unique.
 * - Disambiguation finds the first character position where the last names
 *   diverge and shows up to and including that character.
 *
 * Examples:
 *   "Fredrik Almaa", "Fredrik Almbb"  →  "Fredrik Alma", "Fredrik Almb"
 *   "Anna Karlsson", "Anna Lindqvist" →  "Anna K",       "Anna L"
 *   "Johan Svensson" (alone)          →  "Johan"
 *
 * Players with only a single word in their displayName use that word as both
 * first and last name for grouping purposes (they will always render as just
 * that word).
 *
 * @param players - array of { id, displayName } for the players in one event
 * @returns Record mapping each player id to its short display name
 */
export function shortDisplayNames(
  players: { id: string; displayName: string }[],
): Record<string, string> {
  // Split each player into first / last parts
  const parsed = players.map(({ id, displayName }) => {
    const trimmed = displayName.trim()
    const spaceIdx = trimmed.indexOf(" ")
    const firstName = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx)
    const lastName = spaceIdx === -1 ? "" : trimmed.slice(spaceIdx + 1)
    return { id, firstName, lastName }
  })

  // Group by first name (case-insensitive)
  const groups = new Map<string, typeof parsed>()
  for (const p of parsed) {
    const key = p.firstName.toLocaleLowerCase()
    const existing = groups.get(key)
    if (existing) {
      existing.push(p)
    } else {
      groups.set(key, [p])
    }
  }

  const result: Record<string, string> = {}

  for (const group of groups.values()) {
    if (group.length === 1) {
      // Unique first name — show first name only
      result[group[0].id] = group[0].firstName
    } else {
      // Find minimum last-name prefix length that makes all entries unique
      // within this group. We compare last names case-sensitively (preserve
      // the original capitalisation in the output).
      const lastNames = group.map((p) => p.lastName)

      // Start at prefix length 1, increase until all prefixes are unique
      let prefixLen = 0
      let allUnique = false
      const maxLen = Math.max(...lastNames.map((ln) => ln.length))

      while (!allUnique && prefixLen <= maxLen) {
        prefixLen += 1
        const prefixes = lastNames.map((ln) => ln.slice(0, prefixLen).toLocaleLowerCase())
        allUnique = new Set(prefixes).size === prefixes.length
      }

      for (const p of group) {
        const suffix = p.lastName.slice(0, prefixLen)
        result[p.id] = suffix.length > 0 ? `${p.firstName} ${suffix}` : p.firstName
      }
    }
  }

  return result
}
