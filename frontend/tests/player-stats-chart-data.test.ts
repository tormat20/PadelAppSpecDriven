import { describe, expect, it } from "vitest"

import { buildDoughnutSegments, buildGroupedBars } from "../src/features/player-stats/chartData"

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

describe("buildGroupedBars", () => {
  const rounds3 = [
    { round: 1, wins: 6, draws: 1, losses: 3 },
    { round: 2, wins: 4, draws: 2, losses: 4 },
  ]
  const rounds2 = [
    { round: 1, wins: 7, draws: 0, losses: 3 },
    { round: 2, wins: 2, draws: 0, losses: 5 },
  ]

  it("returns one group per round for Ranked Box (showDraw=true)", () => {
    const result = buildGroupedBars(rounds3, true, 260, 120, 8, 8)
    expect(result).toHaveLength(2)
  })

  it("returns one group per round for Winners Court (showDraw=false)", () => {
    const result = buildGroupedBars(rounds2, false, 260, 120, 8, 8)
    expect(result).toHaveLength(2)
  })

  it("Ranked Box group has 3 bars when all outcomes are non-zero", () => {
    const result = buildGroupedBars(rounds3, true, 260, 120, 8, 8)
    expect(result[0].bars).toHaveLength(3)
  })

  it("Winners Court group has 2 bars (Win + Loss, no Draw)", () => {
    const result = buildGroupedBars(rounds2, false, 260, 120, 8, 8)
    expect(result[0].bars).toHaveLength(2)
    const labels = result[0].bars.map((b) => b.label)
    expect(labels).not.toContain("Draw")
  })

  it("omits zero-count bars from the group", () => {
    const rounds = [{ round: 1, wins: 5, draws: 0, losses: 3 }]
    const result = buildGroupedBars(rounds, true, 260, 120, 8, 8)
    // Draw is zero → should be omitted
    expect(result[0].bars).toHaveLength(2)
    const labels = result[0].bars.map((b) => b.label)
    expect(labels).not.toContain("Draw")
  })

  it("all bars share the same Y scale (heights are proportional to global max)", () => {
    // Round 1: wins=10, draws=0, losses=5; Round 2: wins=2, draws=0, losses=1
    // Global max = 10 (round1 wins)
    const rounds = [
      { round: 1, wins: 10, draws: 0, losses: 5 },
      { round: 2, wins: 2, draws: 0, losses: 1 },
    ]
    const result = buildGroupedBars(rounds, true, 260, 120, 8, 8)
    const winBar1 = result[0].bars.find((b) => b.label === "Win")!
    const winBar2 = result[1].bars.find((b) => b.label === "Win")!
    // wins in round1 is 10 (global max) → full height; round2 wins=2 → 1/5 of that height
    expect(winBar1.height).toBeGreaterThan(winBar2.height)
    // round1 win bar height should be 5x round2 win bar height
    expect(winBar1.height / winBar2.height).toBeCloseTo(5, 1)
  })

  it("single round renders without error", () => {
    const rounds = [{ round: 1, wins: 4, draws: 1, losses: 2 }]
    expect(() => buildGroupedBars(rounds, true, 260, 120, 8, 8)).not.toThrow()
    const result = buildGroupedBars(rounds, true, 260, 120, 8, 8)
    expect(result).toHaveLength(1)
    expect(result[0].bars.length).toBeGreaterThan(0)
  })

  it("returns empty array when all rounds have zero total", () => {
    const rounds = [{ round: 1, wins: 0, draws: 0, losses: 0 }]
    const result = buildGroupedBars(rounds, true, 260, 120, 8, 8)
    expect(result).toHaveLength(0)
  })

  it("each bar has a positive height for non-zero counts", () => {
    const result = buildGroupedBars(rounds3, true, 260, 120, 8, 8)
    for (const group of result) {
      for (const bar of group.bars) {
        expect(bar.height).toBeGreaterThan(0)
      }
    }
  })
})
