import type { EventRecord } from "../../lib/types"
import type { CalendarEventViewModel } from "./calendarEventModel"
import { normalizeDurationMinutes } from "./duration"
import type { CalendarTemplateType } from "./calendarTemplateTypes"

const WEEKDAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

function parseClockMinutes(time24h: string): number {
  if (!time24h.includes(":")) return 0
  const [hoursPart, minutesPart] = time24h.split(":")
  const hours = Number(hoursPart)
  const minutes = Number(minutesPart)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0
  return hours * 60 + minutes
}

function getTimeCategory(startMinutes: number): "Morning" | "Lunch" | "Afternoon" | "Evening" {
  if (startMinutes >= 7 * 60 && startMinutes <= 10 * 60) return "Morning"
  if (startMinutes >= 10 * 60 + 30 && startMinutes <= 13 * 60) return "Lunch"
  if (startMinutes >= 13 * 60 + 30 && startMinutes <= 17 * 60) return "Afternoon"
  return "Evening"
}

export function generateCalendarEventName(
  eventDate: string,
  eventTime24h: string,
  eventTypeLabel: string,
): string {
  const parsedDate = new Date(`${eventDate}T00:00:00`)
  const weekday = Number.isNaN(parsedDate.getTime()) ? "Event" : WEEKDAY_LABELS[parsedDate.getDay()]
  const category = getTimeCategory(parseClockMinutes(eventTime24h))
  return `${weekday} ${category} ${eventTypeLabel}`
}

function inferDurationMinutes(event: EventRecord): number {
  if (typeof event.eventDurationMinutes === "number" && event.eventDurationMinutes > 0) {
    return event.eventDurationMinutes
  }
  if (event.totalRounds > 0 && event.roundDurationMinutes > 0) {
    return event.totalRounds * event.roundDurationMinutes
  }
  return 60
}

export function getCalendarEventTypeLabel(event: Pick<CalendarEventViewModel, "eventType" | "isTeamMexicano">): string {
  if (event.eventType === "Mexicano" && event.isTeamMexicano) {
    return "Team Mexicano"
  }
  return event.eventType
}

export function mapEventRecordToCalendarEvent(event: EventRecord): CalendarEventViewModel {
  return {
    ...event,
    eventTime24h: event.eventTime24h ?? null,
    isTeamMexicano: Boolean(event.isTeamMexicano),
    durationMinutes: normalizeDurationMinutes(inferDurationMinutes(event)),
  }
}

export function mapEventRecordsToCalendarEvents(events: EventRecord[]): CalendarEventViewModel[] {
  return events.map(mapEventRecordToCalendarEvent)
}

export function applyCalendarScheduleUpdate(
  event: CalendarEventViewModel,
  eventDate: string,
  eventTime24h: string,
): CalendarEventViewModel {
  return {
    ...event,
    eventDate,
    eventTime24h,
  }
}

export function createCalendarEventFromTemplate(
  template: CalendarTemplateType,
  eventDate: string,
  eventTime24h: string,
): CalendarEventViewModel {
  const now = Date.now().toString(36)
  return {
    id: `template-${template.templateId}-${now}`,
    eventName: generateCalendarEventName(eventDate, eventTime24h, template.displayLabel),
    eventType: template.eventType,
    eventDate,
    eventTime24h,
    status: "Lobby",
    setupStatus: "planned",
    lifecycleStatus: "planned",
    missingRequirements: [],
    warnings: { pastDateTime: false, duplicateSlot: false, duplicateCount: 0 },
    version: 1,
    selectedCourts: [],
    playerIds: [],
    currentRoundNumber: null,
    totalRounds: 3,
    roundDurationMinutes: 30,
    eventDurationMinutes: 90,
    durationMinutes: normalizeDurationMinutes(90),
    isTeamMexicano: template.isTeamMexicano,
  }
}
