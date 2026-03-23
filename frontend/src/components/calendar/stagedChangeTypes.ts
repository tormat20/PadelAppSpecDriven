import type { CalendarEventViewModel } from "./calendarEventModel"

export type CalendarCreateItem = {
  eventName: string
  eventType: CalendarEventViewModel["eventType"]
  eventDate: string
  eventTime24h: string
  eventDurationMinutes: CalendarEventViewModel["durationMinutes"]
  selectedCourts: number[]
  playerIds: string[]
  isTeamMexicano: boolean
}

export type CalendarUpdateItem = {
  eventId: string
  expectedVersion: number
  eventName?: string
  eventType?: CalendarEventViewModel["eventType"]
  eventDate?: string
  eventTime24h?: string
  eventDurationMinutes?: CalendarEventViewModel["durationMinutes"]
  selectedCourts?: number[]
  playerIds?: string[]
  isTeamMexicano?: boolean
}

export type StagedCalendarChangeSet = {
  creates: CalendarCreateItem[]
  updates: CalendarUpdateItem[]
  deletes: string[]
  dirty: boolean
}

export type SaveSessionState = {
  status: "idle" | "saving" | "success" | "error"
  errorMessage: string
  pendingCount: number
  lastSavedAt: string | null
}
