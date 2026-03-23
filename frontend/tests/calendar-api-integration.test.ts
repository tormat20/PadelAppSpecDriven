import { describe, it, expect, vi, beforeEach } from "vitest"
import * as api from "../src/lib/api"
import { getSaveStatusLabel, getWeekStart } from "../src/pages/Calendar"
import {
  createCalendarEventFromTemplate,
  generateCalendarEventName,
  getCalendarEventTypeLabel,
  mapEventRecordToCalendarEvent,
} from "../src/components/calendar/eventRecordMapping"
import { templateById } from "../src/components/calendar/calendarTemplateTypes"
import { normalizeCalendarEvent } from "../src/components/calendar/normalizeCalendarEvent"
import { buildStagedCalendarChangeSet } from "../src/components/calendar/useStagedCalendarChanges"
import type { CalendarEventViewModel } from "../src/components/calendar/calendarEventModel"

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

  it("maps EventRecord into calendar-local model with normalized duration", () => {
    const mapped = mapEventRecordToCalendarEvent({
      id: "evt-1",
      eventName: "Team Mexicano Session",
      eventType: "Mexicano",
      eventDate: "2026-03-11",
      eventTime24h: "09:00",
      status: "Lobby",
      setupStatus: "ready",
      missingRequirements: [],
      warnings: { pastDateTime: false, duplicateSlot: false, duplicateCount: 0 },
      version: 1,
      selectedCourts: [1, 2],
      playerIds: [],
      currentRoundNumber: null,
      totalRounds: 5,
      roundDurationMinutes: 23,
      isTeamMexicano: true,
    })

    expect(mapped.eventDate).toBe("2026-03-11")
    expect(mapped.eventTime24h).toBe("09:00")
    expect(mapped.durationMinutes).toBe(120)
    expect(getCalendarEventTypeLabel(mapped)).toBe("Team Mexicano")
  })

  it("creates a template event with 90-minute defaults", () => {
    const event = createCalendarEventFromTemplate(templateById("Americano"), "2026-03-12", "11:00")
    expect(event.eventDate).toBe("2026-03-12")
    expect(event.eventTime24h).toBe("11:00")
    expect(event.durationMinutes).toBe(90)
    expect(event.eventName).toBe("Thursday Lunch Americano")
    expect(event.eventName).not.toContain("(New)")
  })

  it("maps Team Mexicano template to mexicano plus team flag", () => {
    const event = createCalendarEventFromTemplate(templateById("TeamMexicano"), "2026-03-13", "12:00")
    expect(event.eventType).toBe("Mexicano")
    expect(event.isTeamMexicano).toBe(true)
    expect(getCalendarEventTypeLabel(event)).toBe("Team Mexicano")
  })

  it("normalizes legacy events with missing duration metadata", () => {
    const mapped = normalizeCalendarEvent({
      id: "evt-legacy",
      eventName: "Legacy Slot",
      eventType: "WinnersCourt",
      eventDate: "2026-03-14",
      eventTime24h: null,
      status: "Lobby",
      setupStatus: "planned",
      missingRequirements: [],
      warnings: { pastDateTime: false, duplicateSlot: false, duplicateCount: 0 },
      version: 2,
      selectedCourts: [],
      playerIds: [],
      currentRoundNumber: null,
      totalRounds: 3,
      roundDurationMinutes: 15,
    })

    expect(mapped.eventTime24h).toBeNull()
    expect(mapped.durationMinutes).toBe(60)
    expect(mapped.isTeamMexicano).toBe(false)
  })

  it("builds a dirty staged change-set for moved events", () => {
    const baseline: CalendarEventViewModel[] = [
      {
        id: "evt-1",
        eventName: "Monday Morning Americano",
        eventType: "Americano",
        eventDate: "2026-03-09",
        eventTime24h: "09:00",
        status: "Lobby",
        setupStatus: "ready",
        missingRequirements: [],
        warnings: { pastDateTime: false, duplicateSlot: false, duplicateCount: 0 },
        version: 1,
        selectedCourts: [1],
        playerIds: [],
        currentRoundNumber: null,
        totalRounds: 3,
        roundDurationMinutes: 30,
        durationMinutes: 90,
        isTeamMexicano: false,
      },
    ]
    const working = [{ ...baseline[0], eventTime24h: "10:30" }]

    const changeSet = buildStagedCalendarChangeSet(baseline, working)

    expect(changeSet.dirty).toBe(true)
    expect(changeSet.creates).toHaveLength(0)
    expect(changeSet.deletes).toHaveLength(0)
    expect(changeSet.updates).toHaveLength(1)
    expect(changeSet.updates[0]).toMatchObject({
      eventId: "evt-1",
      expectedVersion: 1,
      eventTime24h: "10:30",
    })
  })

  it("formats save status labels for saving, error, and success", () => {
    expect(
      getSaveStatusLabel(
        { status: "saving", errorMessage: "", pendingCount: 2, lastSavedAt: null },
        true,
        2,
      ),
    ).toBe("Saving 2 changes...")

    expect(
      getSaveStatusLabel(
        { status: "error", errorMessage: "Could not save calendar changes.", pendingCount: 2, lastSavedAt: null },
        true,
        2,
      ),
    ).toBe("Could not save calendar changes.")

    expect(
      getSaveStatusLabel(
        { status: "success", errorMessage: "", pendingCount: 0, lastSavedAt: "10:45" },
        false,
        0,
      ),
    ).toBe("Saved at 10:45")
  })

  it("generates weekday + time category + type naming", () => {
    expect(generateCalendarEventName("2026-03-09", "08:00", "Mexicano")).toBe("Monday Morning Mexicano")
    expect(generateCalendarEventName("2026-03-09", "11:30", "Americano")).toBe("Monday Lunch Americano")
    expect(generateCalendarEventName("2026-03-09", "14:30", "Winners Court")).toBe("Monday Afternoon Winners Court")
    expect(generateCalendarEventName("2026-03-09", "18:00", "Ranked Box")).toBe("Monday Evening Ranked Box")
  })
})
