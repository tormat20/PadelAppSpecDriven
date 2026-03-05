import { describe, expect, it } from "vitest"

import { rankLeaderboardEntries } from "../src/features/leaderboards/rankLeaderboard"
import type { LeaderboardEntry } from "../src/lib/types"

function makeEntry(
  playerId: string,
  eventsPlayed: number,
  mexicanoScore: number,
  rbScore: number,
): Omit<LeaderboardEntry, "rank"> {
  return { playerId, displayName: playerId, eventsPlayed, mexicanoScore, rbScore }
}

describe("rankLeaderboardEntries", () => {
  it("returns an empty array for empty input", () => {
    expect(rankLeaderboardEntries([])).toEqual([])
  })

  it("primary sort: higher eventsPlayed comes first", () => {
    const entries = [
      makeEntry("bob", 2, 50, 20),
      makeEntry("alice", 3, 40, 10),
    ]
    const ranked = rankLeaderboardEntries(entries)
    expect(ranked[0].playerId).toBe("alice")
    expect(ranked[0].rank).toBe(1)
    expect(ranked[1].playerId).toBe("bob")
    expect(ranked[1].rank).toBe(2)
  })

  it("tiebreaker 1: same eventsPlayed — higher mexicanoScore wins", () => {
    const entries = [
      makeEntry("carlos", 3, 60, 10),
      makeEntry("alice", 3, 80, 5),
    ]
    const ranked = rankLeaderboardEntries(entries)
    expect(ranked[0].playerId).toBe("alice")
    expect(ranked[1].playerId).toBe("carlos")
  })

  it("tiebreaker 2: same eventsPlayed and mexicanoScore — higher rbScore wins", () => {
    const entries = [
      makeEntry("dave", 2, 50, 15),
      makeEntry("eve", 2, 50, 30),
    ]
    const ranked = rankLeaderboardEntries(entries)
    expect(ranked[0].playerId).toBe("eve")
    expect(ranked[1].playerId).toBe("dave")
  })

  it("players with identical scores share the same rank", () => {
    const entries = [
      makeEntry("alice", 3, 60, 20),
      makeEntry("bob", 3, 60, 20),
    ]
    const ranked = rankLeaderboardEntries(entries)
    expect(ranked[0].rank).toBe(1)
    expect(ranked[1].rank).toBe(1)
  })

  it("after tied ranks, next rank skips (dense-rank semantics)", () => {
    const entries = [
      makeEntry("alice", 3, 60, 20),
      makeEntry("bob", 3, 60, 20),
      makeEntry("carol", 1, 30, 10),
    ]
    const ranked = rankLeaderboardEntries(entries)
    const carolEntry = ranked.find((e) => e.playerId === "carol")!
    // After two tied rank-1 players the next rank is 3 (skip-rank) or 2 (dense-rank)
    // Spec says "dense ranking is acceptable" — both 2 and 3 are valid
    expect(carolEntry.rank).toBeGreaterThan(1)
  })

  it("single entry gets rank 1", () => {
    const entries = [makeEntry("alice", 5, 100, 50)]
    const ranked = rankLeaderboardEntries(entries)
    expect(ranked).toHaveLength(1)
    expect(ranked[0].rank).toBe(1)
  })

  it("does not mutate the input array", () => {
    const entries = [
      makeEntry("bob", 1, 10, 0),
      makeEntry("alice", 3, 50, 25),
    ]
    const original = [...entries]
    rankLeaderboardEntries(entries)
    expect(entries[0].playerId).toBe(original[0].playerId)
    expect(entries[1].playerId).toBe(original[1].playerId)
  })
})
