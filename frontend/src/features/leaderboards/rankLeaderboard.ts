import type { LeaderboardEntry } from "../../lib/types"

/**
 * Sort and assign dense-rank positions to leaderboard entries.
 *
 * Primary key:   eventsPlayed DESC
 * Tiebreaker 1:  mexicanoScore DESC
 * Tiebreaker 2:  rbScore DESC
 *
 * Does not mutate the input array.
 * Returns a new array with `rank` fields populated.
 */
export function rankLeaderboardEntries(
  entries: Array<Omit<LeaderboardEntry, "rank">>,
): LeaderboardEntry[] {
  if (entries.length === 0) return []

  const sorted = [...entries].sort((a, b) => {
    if (b.eventsPlayed !== a.eventsPlayed) return b.eventsPlayed - a.eventsPlayed
    if (b.mexicanoScore !== a.mexicanoScore) return b.mexicanoScore - a.mexicanoScore
    return b.rbScore - a.rbScore
  })

  const ranked: LeaderboardEntry[] = []
  let currentRank = 1

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0) {
      const prev = sorted[i - 1]
      const curr = sorted[i]
      if (
        curr.eventsPlayed !== prev.eventsPlayed ||
        curr.mexicanoScore !== prev.mexicanoScore ||
        curr.rbScore !== prev.rbScore
      ) {
        // Skip-rank: next rank after ties = i + 1 (1-based)
        currentRank = i + 1
      }
      // If tied with previous, keep currentRank unchanged (same rank)
    }
    ranked.push({ ...sorted[i], rank: currentRank })
  }

  return ranked
}
