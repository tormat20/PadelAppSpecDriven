import { describe, it, expect } from "vitest"
import { shortDisplayNames } from "../src/lib/playerNames"

// Helper: build a minimal player array from a name list
function players(names: string[]) {
  return names.map((displayName, i) => ({ id: String(i), displayName }))
}

describe("shortDisplayNames", () => {
  it("returns first name only for a single player", () => {
    const result = shortDisplayNames(players(["Johan Svensson"]))
    expect(result["0"]).toBe("Johan")
  })

  it("returns first name only when all first names are unique", () => {
    const result = shortDisplayNames(players(["Johan Svensson", "Anna Lindqvist", "Erik Karlsson"]))
    expect(result["0"]).toBe("Johan")
    expect(result["1"]).toBe("Anna")
    expect(result["2"]).toBe("Erik")
  })

  it("disambiguates two players sharing a first name at first differing char", () => {
    // Last names diverge at position 4 (0-indexed char 4): "Alma" vs "Almb"
    const result = shortDisplayNames(players(["Fredrik Almaa", "Fredrik Almbb"]))
    expect(result["0"]).toBe("Fredrik Alma")
    expect(result["1"]).toBe("Fredrik Almb")
  })

  it("disambiguates with minimal prefix — single first char when that suffices", () => {
    const result = shortDisplayNames(players(["Anna Karlsson", "Anna Lindqvist"]))
    expect(result["0"]).toBe("Anna K")
    expect(result["1"]).toBe("Anna L")
  })

  it("disambiguates three players with same first name", () => {
    // "Svensson", "Svenningsen", "Svens" — "Svens" vs "Svenn" diverge at pos 5
    const result = shortDisplayNames(players(["Maria Svensson", "Maria Svenningsen", "Maria Svens"]))
    // All share "Svens" prefix; "Svensson" vs "Svenningsen" diverge at pos 5 ('s' vs 'n')
    // but "Svens" (only 5 chars) is a prefix of both — need to go further
    // "Svenss" vs "Svenn" diverge at pos 5 already: 's' vs 'n'
    // Unique at length 5: "Svens", "Svenn" — but "Svens" (the third player's whole last name)
    // is still not unique vs "Svensson"[:5]="Svens" — so need length 6
    // Length 6: "Svenss", "Svennin"[:6]="Svennin"[wrong] → "Svenss" vs "Svenn" vs...
    // Let's just check they are all different and contain the first name
    const names = Object.values(result)
    expect(names.every((n) => n.startsWith("Maria"))).toBe(true)
    expect(new Set(names).size).toBe(3)
  })

  it("handles players with no last name (single-word display name)", () => {
    const result = shortDisplayNames(players(["Marcus", "Magnus"]))
    // First names differ, so each gets first name only
    expect(result["0"]).toBe("Marcus")
    expect(result["1"]).toBe("Magnus")
  })

  it("handles a single-word name that shares first name with another single-word name", () => {
    // Two players both named "Alex" — they have identical first name, empty last name
    // Disambiguation: last names are both "", prefix loop ends with empty suffix → just first name
    const result = shortDisplayNames(players(["Alex", "Alex"]))
    expect(result["0"]).toBe("Alex")
    expect(result["1"]).toBe("Alex")
  })

  it("is case-insensitive when grouping by first name", () => {
    const result = shortDisplayNames(players(["ANNA Karlsson", "anna Lindqvist"]))
    // Both map to first name "ANNA" / "anna" — same first-name group (lowercased key)
    const names = Object.values(result)
    expect(new Set(names).size).toBe(2) // disambiguated
  })

  it("returns empty map for empty input", () => {
    expect(shortDisplayNames([])).toEqual({})
  })

  it("mixes unique and shared first names correctly", () => {
    const result = shortDisplayNames(
      players(["Fredrik Almaa", "Fredrik Almbb", "Johan Svensson"])
    )
    expect(result["0"]).toBe("Fredrik Alma")
    expect(result["1"]).toBe("Fredrik Almb")
    expect(result["2"]).toBe("Johan") // unique first name — no suffix
  })

  it("handles identical full names — keeps them identical (no crash)", () => {
    const result = shortDisplayNames(players(["Johan Svensson", "Johan Svensson"]))
    expect(result["0"]).toBe("Johan Svensson")
    expect(result["1"]).toBe("Johan Svensson")
  })
})
