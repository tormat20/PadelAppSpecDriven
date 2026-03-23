import { useCallback, useEffect, useMemo, useState } from "react"

import WeekGrid from "../components/calendar/WeekGrid"
import DayCourtGrid from "../components/calendar/DayCourtGrid"
import EventDrawer from "../components/calendar/EventDrawer"
import UnscheduledStrip from "../components/calendar/UnscheduledStrip"
import EventTemplatePanel from "../components/calendar/EventTemplatePanel"
import { getDragEventId, getTemplateDropId, resolveDropTarget, setDragEventId } from "../components/calendar/calendarDnd"
import type { CalendarEventViewModel } from "../components/calendar/calendarEventModel"
import {
  createCalendarEventFromTemplate,
  generateCalendarEventName,
} from "../components/calendar/eventRecordMapping"
import { useCalendarDndState } from "../components/calendar/useCalendarDndState"
import { resolveInteractionMode } from "../components/calendar/interactionMode"
import { durationFromResizeDelta } from "../components/calendar/resizeMath"
import { templateById } from "../components/calendar/calendarTemplateTypes"
import { normalizeCalendarEvents } from "../components/calendar/normalizeCalendarEvent"
import { useStagedCalendarChanges } from "../components/calendar/useStagedCalendarChanges"
import { useUnsavedCalendarGuard } from "../components/calendar/useUnsavedCalendarGuard"
import { listEventsByDateRange, saveStagedCalendarChanges } from "../lib/api"
import type { EventRecord } from "../lib/types"
import type { SaveSessionState } from "../components/calendar/stagedChangeTypes"

// ---------------------------------------------------------------------------
// Grid constants — defined in calendarConstants.ts; re-exported here so that
// existing tests that import from Calendar.tsx continue to work, and so that
// WeekGrid.tsx can import directly without creating a circular dependency.
// ---------------------------------------------------------------------------

export {
  GRID_START_HOUR,
  GRID_END_HOUR,
  GRID_TOTAL_MINUTES,
  SNAP_MINUTES,
  PX_PER_MINUTE,
} from "../components/calendar/calendarConstants"

// Keep a local alias for use within this file
import {
  GRID_START_HOUR,
  GRID_TOTAL_MINUTES,
  SNAP_MINUTES,
  PX_PER_MINUTE,
} from "../components/calendar/calendarConstants"

// ---------------------------------------------------------------------------
// Exported pure helper functions (contract: calendar-page-weekly-view.md)
// ---------------------------------------------------------------------------

/**
 * Convert a "HH:MM" time string to minutes since the grid start (07:00).
 * "00:00" (midnight) is treated as the end-of-grid marker → 1020 min.
 * Invalid / empty strings clamp to 0.
 */
export function minutesSinceGridStart(time24h: string): number {
  if (!time24h || !time24h.includes(":")) return 0
  const [hStr, mStr] = time24h.split(":")
  const h = parseInt(hStr, 10)
  const m = parseInt(mStr, 10)
  if (isNaN(h) || isNaN(m)) return 0

  // Midnight "00:00" is the very end of the grid
  if (h === 0 && m === 0) return GRID_TOTAL_MINUTES  // 1020

  const totalMinutes = h * 60 + m
  const gridStartMinutes = GRID_START_HOUR * 60  // 420
  const offset = totalMinutes - gridStartMinutes

  if (offset < 0) return 0
  if (offset > GRID_TOTAL_MINUTES) return 960   // last valid start slot = 23:00
  return offset
}

/**
 * Returns the top-offset in pixels for an event at the given 24h time.
 */
export function eventTopPx(time24h: string, pxPerMinute: number): number {
  return minutesSinceGridStart(time24h) * pxPerMinute
}

/**
 * Returns the height in pixels for an event of the given duration.
 */
export function eventHeightPx(durationMinutes: number, pxPerMinute: number): number {
  return durationMinutes * pxPerMinute
}

/**
 * Derives the total event duration from its round structure.
 * Falls back to 60 minutes when either value is 0.
 */
export function deriveDurationMinutes(
  event: Pick<EventRecord, "totalRounds" | "roundDurationMinutes">
): number {
  if (!event.totalRounds || !event.roundDurationMinutes) return 60
  return event.totalRounds * event.roundDurationMinutes
}

/**
 * Snaps rawMinutes to the nearest SNAP_MINUTES (30) boundary.
 * Result is clamped to [0, 960] (last valid start = 23:00).
 */
export function snapToGrid(rawMinutes: number): number {
  // Round half-down: midpoint (exactly 15 mod 30) rounds down to the lower slot
  const snapped = Math.floor((rawMinutes + SNAP_MINUTES / 2 - 1) / SNAP_MINUTES) * SNAP_MINUTES
  return Math.min(Math.max(snapped, 0), 960)
}

/**
 * Converts minutes-since-grid-start back to a "HH:MM" 24h string.
 * 1020 (= GRID_TOTAL_MINUTES) maps to "00:00" (midnight).
 */
export function minutesToTime24h(totalMinutes: number): string {
  if (totalMinutes >= GRID_TOTAL_MINUTES) return "00:00"
  const absoluteMinutes = GRID_START_HOUR * 60 + totalMinutes
  const h = Math.floor(absoluteMinutes / 60) % 24
  const m = absoluteMinutes % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

/**
 * Returns the Monday of the ISO week containing `date`.
 * (ISO week: Monday = day 1, Sunday = day 7)
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  // JS getDay(): 0 = Sunday, 1 = Monday, …, 6 = Saturday
  const day = d.getDay()
  // Distance to Monday: Sunday (0) → -6, Monday (1) → 0, Tue (2) → -1, …
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

/**
 * Returns an array of 7 Date objects [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
 * for the week beginning on `weekStart`.
 */
export function getWeekDates(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })
}

/**
 * Formats a week range label like "10 Mar – 16 Mar 2026".
 */
export function formatWeekLabel(weekStart: Date): string {
  const sunday = new Date(weekStart)
  sunday.setDate(sunday.getDate() + 6)

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  const startDay = weekStart.getDate()
  const startMonth = monthNames[weekStart.getMonth()]
  const endDay = sunday.getDate()
  const endMonth = monthNames[sunday.getMonth()]
  const year = sunday.getFullYear()

  return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${year}`
}

// ---------------------------------------------------------------------------
// Phase 4 drag math helpers
// ---------------------------------------------------------------------------

/**
 * Given the cursor's clientX and the bounding rect of the 7-column grid,
 * returns the day column index (0 = Monday … 6 = Sunday), clamped to [0, 6].
 */
export function computeDragDayIndex(
  clientX: number,
  gridRect: { left: number; width: number },
): number {
  const relativeX = clientX - gridRect.left
  const colWidth = gridRect.width / 7
  return Math.min(Math.max(Math.floor(relativeX / colWidth), 0), 6)
}

/**
 * Given the cursor's clientY, the bounding rect of the grid body, and the
 * px-per-minute scale factor, returns the raw (un-snapped) minutes since
 * grid start (07:00). The caller is responsible for snapping via snapToGrid().
 */
export function computeDropMinutes(
  clientY: number,
  gridRect: { top: number; height: number },
  pxPerMinute: number,
): number {
  const relativeY = clientY - gridRect.top
  return relativeY / pxPerMinute
}

// ---------------------------------------------------------------------------
// Phase 7 helper stub
// ---------------------------------------------------------------------------

export function getRemainingWeekdayOccurrences(originalDate: Date): Date[] {
  const result: Date[] = []
  const dayOfWeek = originalDate.getDay()
  const d = new Date(originalDate)
  d.setDate(d.getDate() + 7)
  // Return up to 8 future occurrences on the same weekday
  for (let i = 0; i < 8; i++) {
    if (d.getDay() !== dayOfWeek) {
      d.setDate(d.getDate() + 1)
      continue
    }
    result.push(new Date(d))
    d.setDate(d.getDate() + 7)
  }
  return result
}

// ---------------------------------------------------------------------------
// GhostBlock state type (used by CalendarPage and WeekGrid)
// ---------------------------------------------------------------------------

export type GhostBlockState = {
  dayIndex: number
  top: number
  height: number
  label: string
  mode: "drag" | "create"
}

// ---------------------------------------------------------------------------
// DrawerState type (used by CalendarPage and EventDrawer)
// ---------------------------------------------------------------------------

export type DrawerState =
  | { open: false }
  | { open: true; mode: "edit"; event: CalendarEventViewModel }
  | { open: true; mode: "readonly"; event: CalendarEventViewModel }
  | { open: true; mode: "create"; dayIndex: number; startMinutes: number }

export function getSaveStatusLabel(
  saveSession: SaveSessionState,
  dirty: boolean,
  pendingCount: number,
): string {
  if (saveSession.status === "saving") {
    return `Saving ${pendingCount} change${pendingCount === 1 ? "" : "s"}...`
  }
  if (saveSession.status === "error") {
    return saveSession.errorMessage || "Could not save calendar changes."
  }
  if (saveSession.status === "success") {
    return `Saved at ${saveSession.lastSavedAt ?? "just now"}`
  }
  if (dirty) {
    return `${pendingCount} unsaved change${pendingCount === 1 ? "" : "s"}`
  }
  return "All changes saved"
}

// T001 note: `/calendar` route is wired in `frontend/src/app/routes.tsx`,
// and this file is the concrete page implementation target for the POC.

export default function CalendarPage() {
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()))
  const [viewMode, setViewMode] = useState<"week" | "day">("week")
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null)
  const [ghostBlock, setGhostBlock] = useState<GhostBlockState | null>(null)
  const [draggingEventId, setDraggingEventId] = useState<string | null>(null)
  const [drawerState, setDrawerState] = useState<DrawerState>({ open: false })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeResizeEventId, setActiveResizeEventId] = useState<string | null>(null)
  const [resizeStartY, setResizeStartY] = useState<number | null>(null)
  const [resizeStartDuration, setResizeStartDuration] = useState<60 | 90 | 120 | null>(null)
  const [saveSession, setSaveSession] = useState<SaveSessionState>({
    status: "idle",
    errorMessage: "",
    pendingCount: 0,
    lastSavedAt: null,
  })

  const {
    events,
    byId,
    replaceAll,
    moveEvent,
    updateDuration,
    updateEventFields,
    createEvent,
    removeEvent,
    beginInteraction,
    endInteraction,
  } = useCalendarDndState([])

  const { baseline, initialize, replaceWorking, changeSet } = useStagedCalendarChanges()

  useUnsavedCalendarGuard(changeSet.dirty)

  useEffect(() => {
    replaceWorking(events)
  }, [events, replaceWorking])

  useEffect(() => {
    setSaveSession((current) => ({
      ...current,
      pendingCount: changeSet.creates.length + changeSet.updates.length + changeSet.deletes.length,
      status: changeSet.dirty && current.status === "success" ? "idle" : current.status,
      errorMessage: changeSet.dirty ? "" : current.errorMessage,
    }))
  }, [changeSet.creates.length, changeSet.deletes.length, changeSet.dirty, changeSet.updates.length])

  const loadWeek = useCallback(async () => {
    setLoading(true)
    setError(null)
    const from = formatDateISO(weekStart)
    const toDate = new Date(weekStart)
    toDate.setDate(toDate.getDate() + 6)
    const to = formatDateISO(toDate)
    try {
      const records = await listEventsByDateRange(from, to)
      const normalized = normalizeCalendarEvents(records)
      replaceAll(normalized)
      initialize(normalized)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load calendar events.")
      replaceAll([])
      initialize([])
    } finally {
      setLoading(false)
    }
  }, [initialize, replaceAll, weekStart])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (cancelled) return
      await loadWeek()
    })()
    return () => {
      cancelled = true
    }
  }, [loadWeek])

  const scheduledEvents = useMemo(
    () => events.filter((event) => Boolean(event.eventTime24h && event.eventTime24h.length > 0)),
    [events],
  )
  const unscheduledEvents = useMemo(
    () => events.filter((event) => !event.eventTime24h || event.eventTime24h.length === 0),
    [events],
  )

  const goWeek = (offset: number) => {
    if (changeSet.dirty && !window.confirm("You have unsaved calendar changes. Discard and switch weeks?")) {
      return
    }
    setWeekStart((current) => {
      const next = new Date(current)
      next.setDate(next.getDate() + offset * 7)
      return next
    })
    setViewMode("week")
    setSelectedDayDate(null)
  }

  const onBlockDragStart = (event: CalendarEventViewModel, e: React.DragEvent) => {
    beginInteraction(event.id, "move")
    setDraggingEventId(event.id)
    setDragEventId(e, event.id)
  }

  const onBlockDragEnd = () => {
    endInteraction()
    setDraggingEventId(null)
    setGhostBlock(null)
  }

  const onGridDragOver = (dayIndex: number, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const target = resolveDropTarget(dayIndex, e.clientY, e.currentTarget.getBoundingClientRect().top)
    const draggedEventId = getDragEventId(e)
    const templateId = getTemplateDropId(e)
    const previewDurationMinutes = draggedEventId
      ? byId.get(draggedEventId)?.durationMinutes ?? 90
      : templateId
        ? 90
        : 60
    setGhostBlock({
      dayIndex: target.dayIndex,
      top: target.minutesFromGridStart,
      height: previewDurationMinutes * PX_PER_MINUTE,
      label: target.resolvedTime24h,
      mode: "drag",
    })
  }

  const onGridDrop = (dayIndex: number, e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const draggedEventId = getDragEventId(e)
    const target = resolveDropTarget(dayIndex, e.clientY, e.currentTarget.getBoundingClientRect().top)
    if (draggedEventId) {
      const dropDate = new Date(weekStart)
      dropDate.setDate(dropDate.getDate() + target.dayIndex)
      moveEvent(draggedEventId, formatDateISO(dropDate), target.resolvedTime24h)
    }

    const templateId = getTemplateDropId(e)
    if (templateId) {
      const template = templateById(templateId)
      const dropDate = new Date(weekStart)
      dropDate.setDate(dropDate.getDate() + target.dayIndex)
      createEvent(createCalendarEventFromTemplate(template, formatDateISO(dropDate), target.resolvedTime24h))
    }

    endInteraction()
    setDraggingEventId(null)
    setGhostBlock(null)
  }

  const onResizeStart = (eventId: string, e: React.PointerEvent<HTMLDivElement>) => {
    const card = byId.get(eventId)
    if (!card) return
    const target = e.currentTarget.parentElement
    if (!target) return
    const rect = target.getBoundingClientRect()
    const offsetY = e.clientY - rect.top
    if (resolveInteractionMode(rect.height, offsetY) !== "resize") return

    beginInteraction(eventId, "resize")
    setActiveResizeEventId(eventId)
    setResizeStartY(e.clientY)
    setResizeStartDuration(card.durationMinutes)
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  const onResizeMove = (eventId: string, e: React.PointerEvent<HTMLDivElement>) => {
    if (activeResizeEventId !== eventId || resizeStartY === null || resizeStartDuration === null) return
    const deltaY = e.clientY - resizeStartY
    const next = durationFromResizeDelta(resizeStartDuration, deltaY)
    updateDuration(eventId, next)
  }

  const onResizeEnd = (eventId: string, e: React.PointerEvent<HTMLDivElement>) => {
    if (activeResizeEventId !== eventId) return
    e.currentTarget.releasePointerCapture?.(e.pointerId)
    setActiveResizeEventId(null)
    setResizeStartY(null)
    setResizeStartDuration(null)
    endInteraction()
  }

  const selectedEditableEvent =
    drawerState.open && (drawerState.mode === "edit" || drawerState.mode === "readonly")
      ? drawerState.event
      : null

  const savePendingCount = saveSession.pendingCount

  const saveStatusLabel = getSaveStatusLabel(saveSession, changeSet.dirty, savePendingCount)

  const handleSaveChanges = useCallback(async () => {
    if (!changeSet.dirty || saveSession.status === "saving") return

    setSaveSession((current) => ({
      ...current,
      status: "saving",
      errorMessage: "",
    }))

    try {
      await saveStagedCalendarChanges({
        creates: changeSet.creates,
        updates: changeSet.updates,
        deletes: changeSet.deletes,
      })
      await loadWeek()
      const savedAt = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      setSaveSession((current) => ({
        ...current,
        status: "success",
        errorMessage: "",
        lastSavedAt: savedAt,
      }))
    } catch (err) {
      setSaveSession((current) => ({
        ...current,
        status: "error",
        errorMessage: err instanceof Error ? err.message : "Could not save calendar changes.",
      }))
    }
  }, [changeSet.creates, changeSet.deletes, changeSet.dirty, changeSet.updates, loadWeek, saveSession.status])

  const handleRedoChanges = useCallback(() => {
    if (!changeSet.dirty || saveSession.status === "saving") return
    replaceAll(baseline)
    replaceWorking(baseline)
    setSaveSession((current) => ({
      ...current,
      status: "idle",
      errorMessage: "",
      pendingCount: 0,
    }))
  }, [baseline, changeSet.dirty, replaceAll, replaceWorking, saveSession.status])

  return (
    <section className="page-shell calendar-page-shell" aria-label="Calendar page">
      <header className="page-header panel calendar-page-header">
        <h1 className="page-title">Calendar</h1>
        <div className="calendar-week-controls">
          <button className="button-secondary" onClick={() => goWeek(-1)} type="button">
            Previous Week
          </button>
          <span className="calendar-week-label">{formatWeekLabel(weekStart)}</span>
          <button className="button-secondary" onClick={() => goWeek(1)} type="button">
            Next Week
          </button>
        </div>
        <div className="calendar-save-row">
          <span className="muted" role="status" aria-live="polite">
            {saveStatusLabel}
          </span>
          <div className="calendar-save-row__actions">
            <button
              className="button-secondary calendar-save-row__action"
              onClick={handleRedoChanges}
              type="button"
              disabled={!changeSet.dirty || saveSession.status === "saving"}
            >
              Redo Changes
            </button>
            <button
              className="button-secondary calendar-save-row__action"
              onClick={() => {
                void handleSaveChanges()
              }}
              type="button"
              disabled={!changeSet.dirty || saveSession.status === "saving"}
            >
              {saveSession.status === "saving" ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </div>
      </header>

      {error && <p className="warning-text">{error}</p>}

      {unscheduledEvents.length > 0 && (
        <UnscheduledStrip
          events={unscheduledEvents}
          onBlockClick={(event) => setDrawerState({ open: true, mode: "edit", event })}
        />
      )}

      <div className="calendar-layout-grid">
        <EventTemplatePanel />
        <div className="panel">
          {loading ? (
            <p className="muted">Loading weekly events…</p>
          ) : viewMode === "week" ? (
            <WeekGrid
              events={scheduledEvents}
              weekStart={weekStart}
              ghostBlock={ghostBlock}
              draggingEventId={draggingEventId}
              onBlockClick={(event) => setDrawerState({ open: true, mode: "edit", event })}
              onBlockNameClick={(event) => setDrawerState({ open: true, mode: "edit", event })}
              onDayHeaderClick={(date) => {
                setSelectedDayDate(new Date(date))
                setViewMode("day")
              }}
              onBlockDragStart={onBlockDragStart}
              onBlockDragEnd={onBlockDragEnd}
              onGridDrop={onGridDrop}
              onGridDragOver={onGridDragOver}
              onResizeStart={onResizeStart}
              onResizeMove={onResizeMove}
              onResizeEnd={onResizeEnd}
              activeResizeEventId={activeResizeEventId}
              onCellPointerDown={() => undefined}
            />
          ) : (
            <DayCourtGrid
              selectedDate={selectedDayDate ?? weekStart}
              events={scheduledEvents}
              onEventClick={(event) => setDrawerState({ open: true, mode: "edit", event })}
              onBackToWeek={() => {
                setViewMode("week")
                setSelectedDayDate(null)
              }}
            />
          )}
        </div>
      </div>

      <EventDrawer
        state={drawerState}
        onSave={async (payload) => {
          if (!selectedEditableEvent) return
          const patch: Partial<CalendarEventViewModel> = {}
          if (payload.eventName !== undefined) patch.eventName = payload.eventName
          if (payload.eventType !== undefined) patch.eventType = payload.eventType
          if (payload.eventDate !== undefined) patch.eventDate = payload.eventDate
          if (payload.eventTime24h !== undefined) patch.eventTime24h = payload.eventTime24h
          if (payload.selectedCourts !== undefined) patch.selectedCourts = payload.selectedCourts

          const changedSchedulingIdentity =
            payload.eventType !== undefined || payload.eventDate !== undefined || payload.eventTime24h !== undefined

          if (changedSchedulingIdentity && payload.eventName === undefined) {
            const nextDate = payload.eventDate ?? selectedEditableEvent.eventDate
            const nextTime = payload.eventTime24h ?? selectedEditableEvent.eventTime24h ?? "07:00"
            const nextTypeLabel =
              (payload.eventType ?? selectedEditableEvent.eventType) === "Mexicano" &&
              selectedEditableEvent.isTeamMexicano
                ? "Team Mexicano"
                : payload.eventType ?? selectedEditableEvent.eventType
            patch.eventName = generateCalendarEventName(nextDate, nextTime, nextTypeLabel)
          }

          updateEventFields(selectedEditableEvent.id, patch)
          setDrawerState({ open: false })
        }}
        onDelete={async (eventId) => {
          removeEvent(eventId)
          setDrawerState({ open: false })
        }}
        onClose={() => {
          setDrawerState({ open: false })
          setGhostBlock(null)
        }}
        onDurationChange={(eventId, durationMinutes) => {
          updateDuration(eventId, durationMinutes)
        }}
      />
    </section>
  )
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}
