import { describe, it, expect, vi, beforeEach } from "vitest"
import * as api from "../src/lib/api"
import { getWeekStart } from "../src/pages/Calendar"

// Helper to format a Date as YYYY-MM-DD (matches what CalendarPage sends)
function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

describe("listEventsByDateRange API integration", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("listEventsByDateRange is exported from api.ts", () => {
    expect(typeof api.listEventsByDateRange).toBe("function")
  })

  it("calls the API with Monday and Sunday ISO strings for a given week", async () => {
    const mockEvents = [
      {
        id: "evt-1",
        name: "Test Event",
        eventType: "Americano",
        status: "Lobby",
        eventDate: "2026-03-11",
        eventTime24h: "10:00",
        courts: [],
        players: [],
        totalRounds: 3,
        roundDurationMinutes: 20,
        durationMinutes: 60,
        locationName: null,
        registrationDeadline: null,
        maxPlayers: null,
        minPlayers: null,
        setupStatus: "complete",
        version: 1,
      },
    ]

    const spy = vi.spyOn(api, "listEventsByDateRange").mockResolvedValue(mockEvents as never)

    // March 10, 2026 is a Tuesday; its week starts Monday March 9
    const weekStart = getWeekStart(new Date(2026, 2, 10)) // Tuesday March 10 → Monday March 9
    const from = toISODate(weekStart) // "2026-03-09"
    const sunday = new Date(weekStart)
    sunday.setDate(sunday.getDate() + 6)
    const to = toISODate(sunday) // "2026-03-15"

    await api.listEventsByDateRange(from, to)

    expect(spy).toHaveBeenCalledWith("2026-03-09", "2026-03-15")
  })

  it("getWeekStart returns Monday (March 9) for a Tuesday (March 10) input", () => {
    const tuesday = new Date(2026, 2, 10) // March 10, 2026 — actual Tuesday
    const weekStart = getWeekStart(tuesday)
    expect(toISODate(weekStart)).toBe("2026-03-09")
  })

  it("Sunday computed from weekStart+6 equals the correct ISO string", () => {
    const monday = new Date(2026, 2, 9) // March 9, 2026 — actual Monday
    const sunday = new Date(monday)
    sunday.setDate(sunday.getDate() + 6)
    expect(toISODate(sunday)).toBe("2026-03-15")
  })
})
