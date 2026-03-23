import { describe, it, expect } from "vitest"
import {
  computeDragDayIndex,
  minutesSinceGridStart,
  eventHeightPx,
  deriveDurationMinutes,
  snapToGrid,
  minutesToTime24h,
  getWeekStart,
  getWeekDates,
  formatWeekLabel,
} from "../src/pages/Calendar"
import { normalizeDurationMinutes } from "../src/components/calendar/duration"
import { durationFromResizeDelta } from "../src/components/calendar/resizeMath"
import { buildDayCourtLaneSegments, deriveCourtNumbers } from "../src/components/calendar/DayCourtGrid"
import type { CalendarEventViewModel } from "../src/components/calendar/calendarEventModel"

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

describe("normalizeDurationMinutes", () => {
  it("keeps valid durations", () => {
    expect(normalizeDurationMinutes(60)).toBe(60)
    expect(normalizeDurationMinutes(90)).toBe(90)
    expect(normalizeDurationMinutes(120)).toBe(120)
  })

  it("normalizes unsupported durations to nearest option", () => {
    expect(normalizeDurationMinutes(70)).toBe(60)
    expect(normalizeDurationMinutes(100)).toBe(90)
    expect(normalizeDurationMinutes(111)).toBe(120)
  })
})

describe("durationFromResizeDelta", () => {
  it("snaps positive resize deltas in 30-minute steps", () => {
    expect(durationFromResizeDelta(90, 30)).toBe(120)
  })

  it("snaps negative resize deltas and clamps", () => {
    expect(durationFromResizeDelta(90, -30)).toBe(60)
    expect(durationFromResizeDelta(60, -120)).toBe(60)
  })
})

describe("laptop-width calendar layout", () => {
  it("keeps day-column calculations stable on wider grids", () => {
    const wideGridRect = { left: 80, width: 840 }
    expect(computeDragDayIndex(80 + 60, wideGridRect)).toBe(0)
    expect(computeDragDayIndex(80 + 420, wideGridRect)).toBe(3)
    expect(computeDragDayIndex(80 + 780, wideGridRect)).toBe(6)
  })
})

describe("day-court lane helpers", () => {
  const dayEvent = (overrides: Partial<CalendarEventViewModel> = {}): CalendarEventViewModel => ({
    id: "evt-1",
    eventName: "Monday Lunch Mexicano",
    eventType: "Mexicano",
    eventDate: "2026-03-09",
    eventTime24h: "11:00",
    status: "Lobby",
    setupStatus: "planned",
    missingRequirements: [],
    warnings: { pastDateTime: false, duplicateSlot: false, duplicateCount: 0 },
    version: 1,
    selectedCourts: [4, 5],
    playerIds: [],
    currentRoundNumber: null,
    totalRounds: 3,
    roundDurationMinutes: 30,
    durationMinutes: 90,
    isTeamMexicano: false,
    ...overrides,
  })

  it("uses fallback courts 1-8 when no explicit courts are assigned", () => {
    const courts = deriveCourtNumbers([dayEvent({ selectedCourts: [] })])
    expect(courts[0]).toBe(1)
    expect(courts[7]).toBe(8)
    expect(courts).toHaveLength(8)
  })

  it("renders all-lane segments for unspecified-court events", () => {
    const events = [dayEvent({ id: "evt-plan", selectedCourts: [] })]
    const courts = deriveCourtNumbers(events)
    const segments = buildDayCourtLaneSegments(events, courts)
    expect(segments).toHaveLength(8)
    expect(segments.every((segment) => segment.allLanesPlanned)).toBe(true)
  })
})
