import type { EventRecord, EventType } from "../../lib/types"

export type DurationOption = 60 | 90 | 120

export type CalendarEventViewModel = Omit<EventRecord, "eventTime24h"> & {
  eventTime24h: string | null
  durationMinutes: DurationOption
  isTeamMexicano: boolean
  eventType: EventType
}
