import type { EventRecord } from "../../lib/types"
import type { CalendarEventViewModel } from "./calendarEventModel"
import { normalizeDurationMinutes } from "./duration"

export function normalizeCalendarEvent(record: EventRecord): CalendarEventViewModel {
  const duration =
    typeof record.eventDurationMinutes === "number"
      ? record.eventDurationMinutes
      : record.totalRounds * record.roundDurationMinutes

  return {
    ...record,
    eventTime24h: record.eventTime24h ?? null,
    durationMinutes: normalizeDurationMinutes(duration || 90),
    isTeamMexicano: Boolean(record.isTeamMexicano),
  }
}

export function normalizeCalendarEvents(records: EventRecord[]): CalendarEventViewModel[] {
  return records.map(normalizeCalendarEvent)
}
