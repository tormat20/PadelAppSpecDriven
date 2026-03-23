import { describe, it, expect } from "vitest"
import { getDrawerTitle, isDrawerDirty, shouldConfirmDiscard } from "../src/components/calendar/EventDrawer"
import { deriveDurationMinutes } from "../src/pages/Calendar"
import type { DrawerFormValues } from "../src/components/calendar/EventDrawer"
import { normalizeDurationMinutes } from "../src/components/calendar/duration"

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
    isTeamMexicano: false,
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

describe("normalizeDurationMinutes — drawer duration constraints", () => {
  it("normalizes arbitrary values to allowed set", () => {
    expect(normalizeDurationMinutes(61)).toBe(60)
    expect(normalizeDurationMinutes(93)).toBe(90)
    expect(normalizeDurationMinutes(119)).toBe(120)
  })
})

describe("drawer modal titles", () => {
  it("returns titles by mode", () => {
    expect(getDrawerTitle("create")).toBe("New Event")
    expect(getDrawerTitle("edit")).toBe("Edit Event")
    expect(getDrawerTitle("readonly")).toBe("Event Details")
  })
})

describe("drawer close confirmation behavior", () => {
  const base: DrawerFormValues = {
    eventName: "Morning Padel",
    eventType: "Mexicano",
    eventDate: "2026-03-10",
    eventTime24h: "09:00",
    durationMinutes: 90,
    courts: [1, 2],
    isTeamMexicano: false,
  }

  it("requires discard confirmation only in edit mode when dirty", () => {
    expect(shouldConfirmDiscard("edit", base, { ...base, eventName: "Changed" })).toBe(true)
    expect(shouldConfirmDiscard("edit", base, { ...base })).toBe(false)
    expect(shouldConfirmDiscard("create", base, { ...base, eventName: "Changed" })).toBe(false)
    expect(shouldConfirmDiscard("readonly", base, { ...base, eventName: "Changed" })).toBe(false)
  })
})
