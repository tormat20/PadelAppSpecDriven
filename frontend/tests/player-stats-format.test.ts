import { describe, expect, it } from "vitest"

import { formatStatValue } from "../src/features/player-stats/formatStats"

describe("formatStatValue", () => {
  it("formats a positive integer as its string representation", () => {
    expect(formatStatValue(42)).toBe("42")
  })

  it("formats zero as '0'", () => {
    expect(formatStatValue(0)).toBe("0")
  })

  it("formats a large integer without decimals", () => {
    expect(formatStatValue(1234)).toBe("1234")
  })

  it("formats negative values correctly (loss/deficit scores)", () => {
    expect(formatStatValue(-15)).toBe("-15")
  })

  it("trims label string when formatting with label", () => {
    expect(formatStatValue(7, "  Wins  ")).toBe("7 Wins")
  })

  it("omits label when not provided", () => {
    expect(formatStatValue(3)).toBe("3")
  })

  it("omits label when label is empty string after trim", () => {
    expect(formatStatValue(5, "   ")).toBe("5")
  })

  it("handles label with no extra whitespace", () => {
    expect(formatStatValue(10, "Events")).toBe("10 Events")
  })
})
