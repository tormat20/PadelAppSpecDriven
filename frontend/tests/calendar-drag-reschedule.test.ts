import { describe, it, expect } from "vitest"
import {
  computeDragDayIndex,
  computeDropMinutes,
  snapToGrid,
} from "../src/pages/Calendar"

// ---------------------------------------------------------------------------
// Helper to build a minimal DOMRect-like object
// ---------------------------------------------------------------------------

function makeRect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
    x: left,
    y: top,
    toJSON: () => ({}),
  } as DOMRect
}

// ---------------------------------------------------------------------------
// computeDragDayIndex
// ---------------------------------------------------------------------------

describe("computeDragDayIndex", () => {
  // Grid spans 700px wide, starting at x=100 → each col is 100px wide
  const gridRect = makeRect(100, 200, 700, 1020)

  it("returns 0 for clientX at centre of col 0", () => {
    // Col 0 centre = left (100) + 0.5 * colWidth (50) = 150
    expect(computeDragDayIndex(150, gridRect)).toBe(0)
  })

  it("returns 6 for clientX at centre of col 6", () => {
    // Col 6 centre = left (100) + 6 * colWidth (600) + 50 = 750
    expect(computeDragDayIndex(750, gridRect)).toBe(6)
  })

  it("clamps to 0 when clientX is before col 0 (left of grid)", () => {
    expect(computeDragDayIndex(50, gridRect)).toBe(0)
  })

  it("clamps to 6 when clientX is after col 6 (right of grid)", () => {
    expect(computeDragDayIndex(850, gridRect)).toBe(6)
  })

  it("returns 3 for clientX at centre of col 3 (Wednesday)", () => {
    // Col 3 centre = 100 + 3 * 100 + 50 = 450
    expect(computeDragDayIndex(450, gridRect)).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// computeDropMinutes
// ---------------------------------------------------------------------------

describe("computeDropMinutes", () => {
  // Grid: top=200, height=1020px, pxPerMinute=1
  const gridRect = makeRect(100, 200, 700, 1020)

  it("returns 0 when clientY is at grid top", () => {
    // clientY = 200 (top), relativeY = 0 → rawMinutes = 0
    expect(computeDropMinutes(200, gridRect, 1)).toBe(0)
  })

  it("returns 1020 when clientY is at grid bottom", () => {
    // clientY = 200 + 1020 = 1220 (bottom), relativeY = 1020 → rawMinutes = 1020
    expect(computeDropMinutes(1220, gridRect, 1)).toBe(1020)
  })

  it("returns 60 when clientY is 60px below grid top at 1px/min", () => {
    expect(computeDropMinutes(260, gridRect, 1)).toBe(60)
  })

  it("returns 30 when clientY is 60px below grid top at 2px/min", () => {
    // relativeY = 60, pxPerMinute = 2 → rawMinutes = 30
    expect(computeDropMinutes(260, gridRect, 2)).toBe(30)
  })

  it("returns raw (un-snapped) minutes — 45 not 30", () => {
    // clientY = 200 + 45 = 245, pxPerMinute = 1 → raw = 45 (not snapped to 30)
    expect(computeDropMinutes(245, gridRect, 1)).toBe(45)
  })
})

// ---------------------------------------------------------------------------
// snapToGrid clamp to last valid slot
// ---------------------------------------------------------------------------

describe("snapToGrid — clamp to last valid slot", () => {
  it("clamps 975 to 960 (last valid start slot)", () => {
    expect(snapToGrid(975)).toBe(960)
  })

  it("clamps values above 960 to 960", () => {
    expect(snapToGrid(1020)).toBe(960)
    expect(snapToGrid(9999)).toBe(960)
  })

  it("clamps negative values to 0", () => {
    expect(snapToGrid(-1)).toBe(0)
    expect(snapToGrid(-100)).toBe(0)
  })
})
