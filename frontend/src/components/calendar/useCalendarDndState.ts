import { useCallback, useMemo, useState } from "react"

import type { CalendarEventViewModel, DurationOption } from "./calendarEventModel"
import { applyCalendarScheduleUpdate } from "./eventRecordMapping"
import { normalizeDurationMinutes } from "./duration"
import type { CalendarInteractionMode } from "./interactionMode"

export function useCalendarDndState(initialEvents: CalendarEventViewModel[]) {
  const [events, setEvents] = useState<CalendarEventViewModel[]>(initialEvents)
  const [interactionMode, setInteractionMode] = useState<CalendarInteractionMode>("idle")
  const [activeEventId, setActiveEventId] = useState<string | null>(null)

  const byId = useMemo(() => new Map(events.map((event) => [event.id, event])), [events])

  const replaceAll = useCallback((nextEvents: CalendarEventViewModel[]) => {
    setEvents(nextEvents)
  }, [])

  const moveEvent = useCallback((eventId: string, eventDate: string, eventTime24h: string) => {
    setEvents((current) =>
      current.map((event) =>
        event.id === eventId ? applyCalendarScheduleUpdate(event, eventDate, eventTime24h) : event,
      ),
    )
  }, [])

  const updateDuration = useCallback((eventId: string, durationMinutes: number): DurationOption => {
    const normalized = normalizeDurationMinutes(durationMinutes)
    setEvents((current) =>
      current.map((event) =>
        event.id === eventId
          ? {
              ...event,
              durationMinutes: normalized,
            }
          : event,
      ),
    )
    return normalized
  }, [])

  const updateEventFields = useCallback((eventId: string, patch: Partial<CalendarEventViewModel>) => {
    setEvents((current) => current.map((event) => (event.id === eventId ? { ...event, ...patch } : event)))
  }, [])

  const createEvent = useCallback((event: CalendarEventViewModel) => {
    setEvents((current) => [event, ...current])
  }, [])

  const removeEvent = useCallback((eventId: string) => {
    setEvents((current) => current.filter((event) => event.id !== eventId))
  }, [])

  const beginInteraction = useCallback((eventId: string, mode: CalendarInteractionMode) => {
    setActiveEventId(eventId)
    setInteractionMode(mode)
  }, [])

  const endInteraction = useCallback(() => {
    setActiveEventId(null)
    setInteractionMode("idle")
  }, [])

  return {
    events,
    byId,
    interactionMode,
    activeEventId,
    replaceAll,
    moveEvent,
    updateDuration,
    updateEventFields,
    createEvent,
    removeEvent,
    beginInteraction,
    endInteraction,
  }
}
