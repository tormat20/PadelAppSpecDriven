import { describe, expect, it } from "vitest"
import { cleanOcrName, matchNamesToCatalog, parseOcrNames } from "../src/features/ocr/ocrImport"

// ---------------------------------------------------------------------------
// cleanOcrName
// ---------------------------------------------------------------------------

describe("cleanOcrName", () => {
  it("strips a single-digit number + dot + space prefix", () => {
    expect(cleanOcrName("1. Alice")).toBe("Alice")
  })

  it("strips a double-digit number + dot + space prefix", () => {
    expect(cleanOcrName("10. Bob")).toBe("Bob")
  })

  it("strips a number prefix with no dot", () => {
    expect(cleanOcrName("3 Carlos")).toBe("Carlos")
  })

  it("strips a single-letter + dot + space prefix", () => {
    expect(cleanOcrName("D. Willma")).toBe("Willma")
  })

  it("strips a single-letter + dot + space prefix (upper and lower)", () => {
    expect(cleanOcrName("a. Maria")).toBe("Maria")
  })

  it("leaves a plain name unchanged", () => {
    expect(cleanOcrName("Alice")).toBe("Alice")
  })

  it("leaves a two-word plain name unchanged", () => {
    expect(cleanOcrName("Maria Karlsson")).toBe("Maria Karlsson")
  })

  it("does NOT strip a multi-letter abbreviation followed by dot", () => {
    // "Dr. Smith" — "Dr" is two letters, rule only fires on single-letter prefix
    expect(cleanOcrName("Dr. Smith")).toBe("Dr. Smith")
  })

  it("strips a trailing dot (e.g. '7. Julia.' → 'Julia')", () => {
    expect(cleanOcrName("7. Julia.")).toBe("Julia")
  })

  it("strips trailing dot from a plain name", () => {
    expect(cleanOcrName("Julia.")).toBe("Julia")
  })

  it("strips trailing comma", () => {
    expect(cleanOcrName("Smith,")).toBe("Smith")
  })

  it("strips multiple trailing punctuation characters", () => {
    expect(cleanOcrName("Alice...")).toBe("Alice")
  })

  it("preserves mid-name apostrophe", () => {
    expect(cleanOcrName("O'Brien")).toBe("O'Brien")
  })
})

// ---------------------------------------------------------------------------
// parseOcrNames — prefix-cleaning integration
// ---------------------------------------------------------------------------

describe("parseOcrNames (prefix cleaning)", () => {
  it("strips numbered list prefixes", () => {
    expect(parseOcrNames("1. Alice\n2. Bob\n3. Carlos")).toEqual(["Alice", "Bob", "Carlos"])
  })

  it("strips single-letter dot prefixes", () => {
    expect(parseOcrNames("D. Willma\nA. Jose")).toEqual(["Willma", "Jose"])
  })

  it("deduplicates after cleaning (same name under different prefixes)", () => {
    expect(parseOcrNames("1. Alice\n2. alice")).toEqual(["Alice"])
  })

  it("strips trailing dot and deduplicates ('7. Julia.' and 'Julia' are same)", () => {
    expect(parseOcrNames("7. Julia.\nJulia")).toEqual(["Julia"])
  })
})

// ---------------------------------------------------------------------------
// parseOcrNames
// ---------------------------------------------------------------------------

describe("parseOcrNames", () => {
  it("returns names from a clean newline-separated list", () => {
    expect(parseOcrNames("Alice\nBob\nCarlos\n")).toEqual(["Alice", "Bob", "Carlos"])
  })

  it("drops empty and whitespace-only lines", () => {
    expect(parseOcrNames("Alice\n\nBob\n  \nCarlos")).toEqual(["Alice", "Bob", "Carlos"])
  })

  it("drops purely numeric lines", () => {
    expect(parseOcrNames("1\nAlice\n23\nBob")).toEqual(["Alice", "Bob"])
  })

  it("returns an empty array for empty input", () => {
    expect(parseOcrNames("")).toEqual([])
  })

  it("deduplicates names case-insensitively, keeping the first occurrence", () => {
    expect(parseOcrNames("Alice\nalice\nALICE")).toEqual(["Alice"])
  })

  it("drops single-character lines", () => {
    expect(parseOcrNames("A\nBob")).toEqual(["Bob"])
  })

  it("trims surrounding whitespace from each name", () => {
    expect(parseOcrNames("  Alice  \n  Bob  ")).toEqual(["Alice", "Bob"])
  })

  it("handles a mix of noise, numbers, and valid names", () => {
    const raw = "1\nAlice Johnson\n\n23\nBob Smith\nCarlos\n  \nX\n42\nMaria Karlsson"
    expect(parseOcrNames(raw)).toEqual(["Alice Johnson", "Bob Smith", "Carlos", "Maria Karlsson"])
  })

  it("deduplicates names that differ only in case and spacing", () => {
    // 'bob' and 'BOB' normalise to the same key — second is dropped
    expect(parseOcrNames("bob\nBOB")).toEqual(["bob"])
  })
})

// ---------------------------------------------------------------------------
// matchNamesToCatalog
// ---------------------------------------------------------------------------

const catalog = [
  { id: "1", displayName: "Alice" },
  { id: "2", displayName: "Maria Karlsson" },
]

describe("matchNamesToCatalog", () => {
  it("returns matched player for a name that exists in catalog", () => {
    const results = matchNamesToCatalog(["Alice"], catalog)
    expect(results).toEqual([{ rawName: "Alice", matchedPlayer: { id: "1", displayName: "Alice" } }])
  })

  it("returns null matchedPlayer for a name not in catalog", () => {
    const results = matchNamesToCatalog(["Bob"], catalog)
    expect(results).toEqual([{ rawName: "Bob", matchedPlayer: null }])
  })

  it("handles a mix of matched and unmatched names", () => {
    const results = matchNamesToCatalog(["Alice", "Bob"], catalog)
    expect(results).toEqual([
      { rawName: "Alice", matchedPlayer: { id: "1", displayName: "Alice" } },
      { rawName: "Bob", matchedPlayer: null },
    ])
  })

  it("returns an empty array when names array is empty", () => {
    expect(matchNamesToCatalog([], catalog)).toEqual([])
  })

  it("returns all null matchedPlayers when catalog is empty", () => {
    const results = matchNamesToCatalog(["Alice", "Bob"], [])
    expect(results).toEqual([
      { rawName: "Alice", matchedPlayer: null },
      { rawName: "Bob", matchedPlayer: null },
    ])
  })

  it("matches names case-insensitively", () => {
    const results = matchNamesToCatalog(["alice"], catalog)
    expect(results[0].matchedPlayer).toEqual({ id: "1", displayName: "Alice" })
  })

  it("matches multi-word names", () => {
    const results = matchNamesToCatalog(["Maria Karlsson"], catalog)
    expect(results[0].matchedPlayer).toEqual({ id: "2", displayName: "Maria Karlsson" })
  })
})
