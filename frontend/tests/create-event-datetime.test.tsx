import { describe, expect, it } from "vitest"

import {
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
})
