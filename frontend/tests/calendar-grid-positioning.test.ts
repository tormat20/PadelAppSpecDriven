import { describe, it, expect } from "vitest"
import {
  minutesSinceGridStart,
  eventHeightPx,
  deriveDurationMinutes,
  snapToGrid,
  minutesToTime24h,
  getWeekStart,
  getWeekDates,
  formatWeekLabel,
} from "../src/pages/Calendar"

describe("minutesSinceGridStart", () => {
  it("returns 0 for 07:00 (grid start)", () => {
    expect(minutesSinceGridStart("07:00")).toBe(0)
  })

  it("returns 30 for 07:30", () => {
    expect(minutesSinceGridStart("07:30")).toBe(30)
  })

  it("returns 180 for 10:00", () => {
    expect(minutesSinceGridStart("10:00")).toBe(180)
  })

  it("returns 1020 for 00:00 (midnight = end of grid)", () => {
    expect(minutesSinceGridStart("00:00")).toBe(1020)
  })

  it("returns 0 for invalid/empty string", () => {
    expect(minutesSinceGridStart("")).toBe(0)
  })
})

describe("eventHeightPx", () => {
  it("returns 60 for 60 minutes at 1px/min", () => {
    expect(eventHeightPx(60, 1)).toBe(60)
  })

  it("returns 90 for 90 minutes at 1px/min", () => {
    expect(eventHeightPx(90, 1)).toBe(90)
  })

  it("scales with pxPerMinute", () => {
    expect(eventHeightPx(60, 2)).toBe(120)
  })
})

describe("deriveDurationMinutes", () => {
  it("returns totalRounds × roundDurationMinutes when both are non-zero", () => {
    expect(deriveDurationMinutes({ totalRounds: 3, roundDurationMinutes: 20 })).toBe(60)
  })

  it("returns fallback 60 when totalRounds is 0", () => {
    expect(deriveDurationMinutes({ totalRounds: 0, roundDurationMinutes: 20 })).toBe(60)
  })

  it("returns fallback 60 when roundDurationMinutes is 0", () => {
    expect(deriveDurationMinutes({ totalRounds: 3, roundDurationMinutes: 0 })).toBe(60)
  })

  it("returns fallback 60 when both are 0", () => {
    expect(deriveDurationMinutes({ totalRounds: 0, roundDurationMinutes: 0 })).toBe(60)
  })
})

describe("snapToGrid", () => {
  it("snaps 0 to 0", () => {
    expect(snapToGrid(0)).toBe(0)
  })

  it("snaps 15 to 0 (rounds down to nearest 30)", () => {
    expect(snapToGrid(15)).toBe(0)
  })

  it("snaps 16 to 30 (rounds up to nearest 30)", () => {
    expect(snapToGrid(16)).toBe(30)
  })

  it("snaps 45 to 30 (rounds down)", () => {
    expect(snapToGrid(45)).toBe(30)
  })

  it("snaps 46 to 60 (rounds up)", () => {
    expect(snapToGrid(46)).toBe(60)
  })

  it("clamps 975 to 960 (max slot = 23:00)", () => {
    expect(snapToGrid(975)).toBe(960)
  })
})

describe("minutesToTime24h", () => {
  it("converts 0 minutes to 07:00 (grid start)", () => {
    expect(minutesToTime24h(0)).toBe("07:00")
  })

  it("converts 30 minutes to 07:30", () => {
    expect(minutesToTime24h(30)).toBe("07:30")
  })

  it("converts 180 minutes to 10:00", () => {
    expect(minutesToTime24h(180)).toBe("10:00")
  })

  it("converts 990 minutes to 23:30", () => {
    expect(minutesToTime24h(990)).toBe("23:30")
  })

  it("converts 1020 minutes to 00:00 (midnight)", () => {
    expect(minutesToTime24h(1020)).toBe("00:00")
  })
})

describe("getWeekStart", () => {
  // In 2026: Monday = March 9, Tuesday = March 10, Sunday = March 15
  it("returns Monday when given a Monday (March 9)", () => {
    const monday = new Date(2026, 2, 9) // March 9, 2026 — actual Monday
    const result = getWeekStart(monday)
    expect(result.getFullYear()).toBe(2026)
    expect(result.getMonth()).toBe(2)
    expect(result.getDate()).toBe(9)
  })

  it("returns Monday when given a Tuesday (March 10)", () => {
    const tuesday = new Date(2026, 2, 10) // March 10, 2026 — actual Tuesday
    const result = getWeekStart(tuesday)
    expect(result.getFullYear()).toBe(2026)
    expect(result.getMonth()).toBe(2)
    expect(result.getDate()).toBe(9)
  })

  it("returns Monday when given a Sunday (March 15)", () => {
    const sunday = new Date(2026, 2, 15) // March 15, 2026 — actual Sunday
    const result = getWeekStart(sunday)
    expect(result.getFullYear()).toBe(2026)
    expect(result.getMonth()).toBe(2)
    expect(result.getDate()).toBe(9)
  })
})

describe("getWeekDates", () => {
  it("returns exactly 7 dates", () => {
    const monday = new Date(2026, 2, 9) // March 9, 2026 — actual Monday
    expect(getWeekDates(monday)).toHaveLength(7)
  })

  it("starts with Monday and ends with Sunday", () => {
    const monday = new Date(2026, 2, 9) // March 9, 2026 — actual Monday
    const dates = getWeekDates(monday)
    // Monday = 1 (JS getDay), Sunday = 0
    expect(dates[0].getDay()).toBe(1) // Monday
    expect(dates[6].getDay()).toBe(0) // Sunday
  })

  it("spans consecutive days", () => {
    const monday = new Date(2026, 2, 9) // March 9, 2026 — actual Monday
    const dates = getWeekDates(monday)
    for (let i = 1; i < 7; i++) {
      const diffMs = dates[i].getTime() - dates[i - 1].getTime()
      expect(diffMs).toBe(24 * 60 * 60 * 1000) // exactly one day apart
    }
  })
})

describe("formatWeekLabel", () => {
  it("formats the week of March 9 as '9 Mar – 15 Mar 2026'", () => {
    const monday = new Date(2026, 2, 9) // March 9, 2026 — actual Monday
    expect(formatWeekLabel(monday)).toBe("9 Mar – 15 Mar 2026")
  })
})
