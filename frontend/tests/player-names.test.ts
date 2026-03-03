import { describe, expect, it } from "vitest"
import { normalizePlayerName } from "../src/lib/playerNames"

describe("normalizePlayerName", () => {
  it("lowercases a plain name", () => {
    expect(normalizePlayerName("Alice")).toBe("alice")
  })

  it("trims surrounding whitespace", () => {
    expect(normalizePlayerName("  Bob  ")).toBe("bob")
  })

  it("strips a trailing dot", () => {
    expect(normalizePlayerName("Julia.")).toBe("julia")
  })

  it("strips multiple trailing punctuation characters", () => {
    expect(normalizePlayerName("Julia...")).toBe("julia")
  })

  it("strips a leading dot", () => {
    expect(normalizePlayerName(".Julia")).toBe("julia")
  })

  it("strips trailing comma", () => {
    expect(normalizePlayerName("Smith,")).toBe("smith")
  })

  it("treats 'Julia' and 'Julia.' as equal after normalisation", () => {
    expect(normalizePlayerName("Julia")).toBe(normalizePlayerName("Julia."))
  })

  it("preserves mid-name apostrophe (O'Brien)", () => {
    expect(normalizePlayerName("O'Brien")).toBe("o'brien")
  })

  it("preserves mid-name hyphen (Anne-Marie)", () => {
    expect(normalizePlayerName("Anne-Marie")).toBe("anne-marie")
  })

  it("handles empty string", () => {
    expect(normalizePlayerName("")).toBe("")
  })
})
