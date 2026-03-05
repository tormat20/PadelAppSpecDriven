import { describe, expect, it } from "vitest"

import { buildDoughnutSegments } from "../src/features/player-stats/chartData"

describe("buildDoughnutSegments", () => {
  const cx = 50
  const cy = 50
  const r = 40
  const innerR = 24

  it("returns one segment per input segment for a normal split", () => {
    const input = [
      { label: "Wins", value: 3, color: "#0c8a8f" },
      { label: "Losses", value: 1, color: "#ef4444" },
    ]
    const result = buildDoughnutSegments(input, cx, cy, r, innerR)
    expect(result).toHaveLength(2)
  })

  it("each segment preserves label, value and color", () => {
    const input = [
      { label: "Wins", value: 6, color: "#0c8a8f" },
      { label: "Losses", value: 2, color: "#ef4444" },
    ]
    const result = buildDoughnutSegments(input, cx, cy, r, innerR)
    expect(result[0].label).toBe("Wins")
    expect(result[0].value).toBe(6)
    expect(result[0].color).toBe("#0c8a8f")
    expect(result[1].label).toBe("Losses")
    expect(result[1].value).toBe(2)
    expect(result[1].color).toBe("#ef4444")
  })

  it("every segment has a non-empty arcPath string", () => {
    const input = [
      { label: "Wins", value: 7, color: "#0c8a8f" },
      { label: "Losses", value: 3, color: "#ef4444" },
    ]
    const result = buildDoughnutSegments(input, cx, cy, r, innerR)
    for (const seg of result) {
      expect(typeof seg.arcPath).toBe("string")
      expect(seg.arcPath.length).toBeGreaterThan(0)
    }
  })

  it("100% / 0% split: returns two arcs for the full segment (two 180° arcs)", () => {
    const input = [
      { label: "Wins", value: 4, color: "#0c8a8f" },
      { label: "Losses", value: 0, color: "#ef4444" },
    ]
    const result = buildDoughnutSegments(input, cx, cy, r, innerR)
    // 100% segment is rendered as 2 arcs (special case); 0% segment is skipped
    expect(result).toHaveLength(2)
    // Both arcs should belong to the winning colour
    expect(result[0].color).toBe("#0c8a8f")
    expect(result[1].color).toBe("#0c8a8f")
  })

  it("all-zeros: returns a single grey empty ring segment", () => {
    const input = [
      { label: "Wins", value: 0, color: "#0c8a8f" },
      { label: "Losses", value: 0, color: "#ef4444" },
    ]
    const result = buildDoughnutSegments(input, cx, cy, r, innerR)
    expect(result).toHaveLength(1)
    expect(result[0].value).toBe(0)
    // Ensure it doesn't crash — arcPath must exist
    expect(typeof result[0].arcPath).toBe("string")
    expect(result[0].arcPath.length).toBeGreaterThan(0)
  })

  it("three segments sum to full circle without division-by-zero", () => {
    const input = [
      { label: "Wins", value: 5, color: "#0c8a8f" },
      { label: "Losses", value: 3, color: "#ef4444" },
      { label: "Draws", value: 2, color: "#f59e0b" },
    ]
    expect(() => buildDoughnutSegments(input, cx, cy, r, innerR)).not.toThrow()
    const result = buildDoughnutSegments(input, cx, cy, r, innerR)
    expect(result).toHaveLength(3)
  })

  it("does not throw with a single segment of nonzero value", () => {
    const input = [{ label: "Wins", value: 10, color: "#0c8a8f" }]
    expect(() => buildDoughnutSegments(input, cx, cy, r, innerR)).not.toThrow()
  })
})
