import { describe, it, expect } from "vitest"
import { isDrawerDirty } from "../src/components/calendar/EventDrawer"
import { deriveDurationMinutes } from "../src/pages/Calendar"
import type { DrawerFormValues } from "../src/components/calendar/EventDrawer"

// ---------------------------------------------------------------------------
// isDrawerDirty — detects form value changes
// ---------------------------------------------------------------------------

describe("isDrawerDirty", () => {
  const base: DrawerFormValues = {
    eventName: "Morning Padel",
    eventType: "Mexicano",
    eventDate: "2026-03-10",
    eventTime24h: "09:00",
    durationMinutes: 90,
    courts: [1, 2],
  }

  it("returns false when original and current are identical", () => {
    expect(isDrawerDirty(base, { ...base })).toBe(false)
  })

  it("returns true when eventName changes", () => {
    expect(isDrawerDirty(base, { ...base, eventName: "Evening Padel" })).toBe(true)
  })

  it("returns true when eventType changes", () => {
    expect(isDrawerDirty(base, { ...base, eventType: "WinnersCourt" })).toBe(true)
  })

  it("returns true when eventDate changes", () => {
    expect(isDrawerDirty(base, { ...base, eventDate: "2026-03-11" })).toBe(true)
  })

  it("returns true when eventTime24h changes", () => {
    expect(isDrawerDirty(base, { ...base, eventTime24h: "10:00" })).toBe(true)
  })

  it("returns true when durationMinutes changes", () => {
    expect(isDrawerDirty(base, { ...base, durationMinutes: 120 })).toBe(true)
  })

  it("returns true when courts change (different length)", () => {
    expect(isDrawerDirty(base, { ...base, courts: [1] })).toBe(true)
  })

  it("returns true when courts change (different values)", () => {
    expect(isDrawerDirty(base, { ...base, courts: [1, 3] })).toBe(true)
  })

  it("returns false when courts are the same values in the same order", () => {
    expect(isDrawerDirty(base, { ...base, courts: [1, 2] })).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// deriveDurationMinutes — used in drawer to show pre-filled duration
// ---------------------------------------------------------------------------

describe("deriveDurationMinutes — drawer use cases", () => {
  it("returns 90 for totalRounds=3, roundDurationMinutes=30", () => {
    expect(deriveDurationMinutes({ totalRounds: 3, roundDurationMinutes: 30 })).toBe(90)
  })

  it("returns 60 (fallback) for totalRounds=0", () => {
    expect(deriveDurationMinutes({ totalRounds: 0, roundDurationMinutes: 30 })).toBe(60)
  })

  it("returns 60 (fallback) for roundDurationMinutes=0", () => {
    expect(deriveDurationMinutes({ totalRounds: 3, roundDurationMinutes: 0 })).toBe(60)
  })

  it("returns 120 for totalRounds=4, roundDurationMinutes=30", () => {
    expect(deriveDurationMinutes({ totalRounds: 4, roundDurationMinutes: 30 })).toBe(120)
  })
})
