import { describe, expect, it } from "vitest"

import {
  getRecommendedEventName,
  getRequiredPlayerCount,
  getTodayDateISO,
  isPastSchedule,
  isValidEventSchedule,
  isValidEventTime24h,
  normalizeEventSchedule,
} from "../src/features/create-event/validation"

describe("CreateEvent 24-hour date-time validation", () => {
  it("accepts valid 24-hour time values", () => {
    expect(isValidEventTime24h("00:00")).toBe(true)
    expect(isValidEventTime24h("09:45")).toBe(true)
    expect(isValidEventTime24h("23:59")).toBe(true)
  })

  it("rejects invalid 24-hour time values", () => {
    expect(isValidEventTime24h("24:00")).toBe(false)
    expect(isValidEventTime24h("12:60")).toBe(false)
    expect(isValidEventTime24h("9:30")).toBe(false)
  })

  it("normalizes a valid schedule and rejects missing parts", () => {
    expect(isValidEventSchedule({ eventDate: "2026-03-10", eventTime24h: "19:30" })).toBe(true)
    expect(normalizeEventSchedule({ eventDate: "2026-03-10", eventTime24h: "19:30" })).toBe(
      "2026-03-10T19:30",
    )

    expect(isValidEventSchedule({ eventDate: "", eventTime24h: "19:30" })).toBe(false)
    expect(normalizeEventSchedule({ eventDate: "", eventTime24h: "19:30" })).toBe("")
  })

  it("returns courts x 4 as required player count", () => {
    expect(getRequiredPlayerCount([])).toBe(0)
    expect(getRequiredPlayerCount([1])).toBe(4)
    expect(getRequiredPlayerCount([1, 2, 3])).toBe(12)
  })

  it("formats today's date as local ISO date", () => {
    expect(getTodayDateISO(new Date("2026-03-10T13:00:00"))).toBe("2026-03-10")
  })

  it("detects past schedule values", () => {
    const now = new Date("2026-03-10T10:00:00")
    expect(isPastSchedule({ eventDate: "2026-03-10", eventTime24h: "09:30" }, now)).toBe(true)
    expect(isPastSchedule({ eventDate: "2026-03-10", eventTime24h: "11:00" }, now)).toBe(false)
  })

  it("builds recommended event names from weekday and mode", () => {
    expect(getRecommendedEventName({ eventDate: "2026-03-12", modeLabel: "Mexicano", eventTime24h: "19:00" })).toBe(
      "Thursday Mexicano - 19:00",
    )
    expect(getRecommendedEventName({ eventDate: "2026-03-12", modeLabel: "Winners Court", eventTime24h: "" })).toBe(
      "Thursday Winners Court",
    )
    expect(getRecommendedEventName({ eventDate: "", modeLabel: "BeatTheBox", eventTime24h: "18:00" })).toBe("")
  })
})
