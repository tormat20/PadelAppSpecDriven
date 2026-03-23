import { useCallback, useMemo, useState } from "react"

import type { CalendarEventViewModel } from "./calendarEventModel"
import type { CalendarCreateItem, CalendarUpdateItem, StagedCalendarChangeSet } from "./stagedChangeTypes"

function toCreateItem(event: CalendarEventViewModel): CalendarCreateItem {
  return {
    eventName: event.eventName,
    eventType: event.eventType,
    eventDate: event.eventDate,
    eventTime24h: event.eventTime24h ?? "00:00",
    eventDurationMinutes: event.durationMinutes,
    selectedCourts: event.selectedCourts,
    playerIds: event.playerIds,
    isTeamMexicano: event.isTeamMexicano,
  }
}

function toUpdateItem(before: CalendarEventViewModel, after: CalendarEventViewModel): CalendarUpdateItem | null {
  const update: CalendarUpdateItem = {
    eventId: after.id,
    expectedVersion: before.version,
  }

  if (before.eventName !== after.eventName) update.eventName = after.eventName
  if (before.eventType !== after.eventType) update.eventType = after.eventType
  if (before.eventDate !== after.eventDate) update.eventDate = after.eventDate
  if ((before.eventTime24h ?? "") !== (after.eventTime24h ?? "")) update.eventTime24h = after.eventTime24h ?? "00:00"
  if (before.durationMinutes !== after.durationMinutes) update.eventDurationMinutes = after.durationMinutes
  if (JSON.stringify(before.selectedCourts) !== JSON.stringify(after.selectedCourts)) {
    update.selectedCourts = after.selectedCourts
  }
  if (JSON.stringify(before.playerIds) !== JSON.stringify(after.playerIds)) {
    update.playerIds = after.playerIds
  }
  if (before.isTeamMexicano !== after.isTeamMexicano) update.isTeamMexicano = after.isTeamMexicano

  const hasChanges = Object.keys(update).some((key) => !["eventId", "expectedVersion"].includes(key))
  return hasChanges ? update : null
}

export function useStagedCalendarChanges() {
  const [baseline, setBaseline] = useState<CalendarEventViewModel[]>([])
  const [working, setWorking] = useState<CalendarEventViewModel[]>([])

  const initialize = useCallback((events: CalendarEventViewModel[]) => {
    setBaseline(events)
    setWorking(events)
  }, [])

  const replaceWorking = useCallback((events: CalendarEventViewModel[]) => {
    setWorking(events)
  }, [])

  const markSaved = useCallback((events: CalendarEventViewModel[]) => {
    setBaseline(events)
    setWorking(events)
  }, [])

  const changeSet = useMemo<StagedCalendarChangeSet>(() => {
    return buildStagedCalendarChangeSet(baseline, working)
  }, [baseline, working])

  return {
    baseline,
    working,
    initialize,
    replaceWorking,
    markSaved,
    changeSet,
  }
}

export function buildStagedCalendarChangeSet(
  baseline: CalendarEventViewModel[],
  working: CalendarEventViewModel[],
): StagedCalendarChangeSet {
    const baselineById = new Map(baseline.map((event) => [event.id, event]))
    const workingById = new Map(working.map((event) => [event.id, event]))

    const creates = working
      .filter((event) => !baselineById.has(event.id))
      .map(toCreateItem)

    const updates = working
      .filter((event) => baselineById.has(event.id))
      .map((event) => toUpdateItem(baselineById.get(event.id)!, event))
      .filter((item): item is CalendarUpdateItem => item !== null)

    const deletes = baseline
      .filter((event) => !workingById.has(event.id))
      .map((event) => event.id)

  return {
    creates,
    updates,
    deletes,
    dirty: creates.length > 0 || updates.length > 0 || deletes.length > 0,
  }
}
