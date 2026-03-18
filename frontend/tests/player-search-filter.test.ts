import { describe, it, expect } from "vitest"
import { filterPlayers } from "../src/pages/SearchPlayer"
import type { PlayerApiRecord } from "../src/lib/api"

const players: PlayerApiRecord[] = [
  { id: "1", displayName: "Anna Berg", email: "anna@example.com" },
  { id: "2", displayName: "Carlos Font", email: "carlos@example.com" },
  { id: "3", displayName: "Maria Soto", email: null },
]

describe("filterPlayers", () => {
  it("returns all players when query is empty", () => {
    expect(filterPlayers(players, "")).toHaveLength(3)
  })

  it("filters by displayName (case-insensitive)", () => {
    expect(filterPlayers(players, "anna")).toEqual([players[0]])
  })

  it("filters by email", () => {
    expect(filterPlayers(players, "carlos@")).toEqual([players[1]])
  })

  it("returns empty array when no match", () => {
    expect(filterPlayers(players, "zzznomatch")).toHaveLength(0)
  })

  it("handles player with null email without crashing", () => {
    expect(filterPlayers(players, "soto")).toEqual([players[2]])
  })

  it("trims whitespace from query", () => {
    expect(filterPlayers(players, "  anna  ")).toEqual([players[0]])
  })
})
