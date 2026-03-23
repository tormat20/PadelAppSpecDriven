import type { CalendarEventViewModel } from "../../src/components/calendar/calendarEventModel"

export function makePopupEventFixture(
  overrides: Partial<CalendarEventViewModel> = {},
): CalendarEventViewModel {
  return {
    id: "evt-popup-fixture",
    eventName: "Monday Lunch Mexicano",
    eventType: "Mexicano",
    eventDate: "2026-03-23",
    eventTime24h: "12:00",
    status: "Lobby",
    setupStatus: "ready",
    missingRequirements: [],
    warnings: { pastDateTime: false, duplicateSlot: false, duplicateCount: 0 },
    version: 1,
    selectedCourts: [1, 2],
    playerIds: [],
    currentRoundNumber: null,
    totalRounds: 3,
    roundDurationMinutes: 30,
    durationMinutes: 90,
    isTeamMexicano: false,
    ...overrides,
  }
}
