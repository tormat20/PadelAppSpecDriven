import { useCallback, useEffect, useMemo, useState } from "react"
import { animate, motion, useMotionValue, useTransform } from "motion/react"

import WeekGrid from "../components/calendar/WeekGrid"
import DayCourtGrid from "../components/calendar/DayCourtGrid"
import EventDrawer from "../components/calendar/EventDrawer"
import UnscheduledStrip from "../components/calendar/UnscheduledStrip"
import EventTemplatePanel from "../components/calendar/EventTemplatePanel"
import { getDragEventId, getTemplateDropId, resolveDropTarget, setDragEventId } from "../components/calendar/calendarDnd"
import type { CalendarEventViewModel } from "../components/calendar/calendarEventModel"
import {
  generateCalendarEventName,
  getCalendarEventTypeLabel,
  mapEventRecordToCalendarEvent,
} from "../components/calendar/eventRecordMapping"
import { useCalendarDndState } from "../components/calendar/useCalendarDndState"
import { resolveInteractionMode } from "../components/calendar/interactionMode"
import { durationFromResizeDelta } from "../components/calendar/resizeMath"
import { templateById } from "../components/calendar/calendarTemplateTypes"
import { normalizeCalendarEvents } from "../components/calendar/normalizeCalendarEvent"
import {
  createEvent,
  deleteEvent,
  listEventsByDateRange,
  saveCalendarEventImmediately,
  startEvent,
  updateEvent,
} from "../lib/api"
import type { EventRecord, UpdateEventPayload } from "../lib/types"
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
  mode: "drag" | "create" | "invalid"
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

const TEMPLATE_PANEL_COLLAPSED_SIZE_PX = 72
const TEMPLATE_PANEL_EASE: [number, number, number, number] = [0.42, 0, 0.58, 1]
const TEMPLATE_PANEL_STAGE_DURATION = 0.34

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
  const [isRecurringSelectMode, setIsRecurringSelectMode] = useState(false)
  const [recurringSelectedEventIds, setRecurringSelectedEventIds] = useState<string[]>([])
  const [isRecurringSaving, setIsRecurringSaving] = useState(false)
  const [isTemplatePanelCollapsed, setIsTemplatePanelCollapsed] = useState(false)
  const [showTemplatePanelBody, setShowTemplatePanelBody] = useState(true)
  const [isTemplatePanelAnimating, setIsTemplatePanelAnimating] = useState(false)
  const [templatePanelExpandedWidth, setTemplatePanelExpandedWidth] = useState(280)
  const [templatePanelExpandedHeight, setTemplatePanelExpandedHeight] = useState(620)
  const templatePanelWidthMv = useMotionValue(280)
  const templatePanelHeightMv = useMotionValue(620)

  const {
    events,
    byId,
    replaceAll,
    moveEvent,
    updateDuration,
    updateEventFields,
    replaceEvent,
    createEvent: createLocalEvent,
    removeEvent,
    beginInteraction,
    endInteraction,
  } = useCalendarDndState([])

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load calendar events.")
      replaceAll([])
    } finally {
      setLoading(false)
    }
  }, [replaceAll, weekStart])

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
    setIsRecurringSelectMode(false)
    setRecurringSelectedEventIds([])
    setWeekStart((current) => {
      const next = new Date(current)
      next.setDate(next.getDate() + offset * 7)
      return next
    })
    setViewMode("week")
    setSelectedDayDate(null)
  }

  const [deleteDropHover, setDeleteDropHover] = useState(false)
  const [suppressBlockClick, setSuppressBlockClick] = useState(false)
  const recurringSelectedSet = useMemo(() => new Set(recurringSelectedEventIds), [recurringSelectedEventIds])
  const leftColWidthCss = useTransform(templatePanelWidthMv, (value) => `${Math.max(value, 0)}px`)

  useEffect(() => {
    if (isTemplatePanelCollapsed || isTemplatePanelAnimating) return
    templatePanelWidthMv.set(templatePanelExpandedWidth)
    templatePanelHeightMv.set(templatePanelExpandedHeight)
  }, [
    isTemplatePanelAnimating,
    isTemplatePanelCollapsed,
    templatePanelExpandedHeight,
    templatePanelExpandedWidth,
    templatePanelHeightMv,
    templatePanelWidthMv,
  ])

  const persistEventUpdate = useCallback(
    async (eventId: string, patch: Omit<UpdateEventPayload, "expectedVersion">, replacedEventId?: string) => {
      const targetId = replacedEventId ?? eventId
      const current = byId.get(targetId)
      if (!current) return

      const isLocalOnlyEvent = targetId.startsWith("template-")
      const persistedRecord = isLocalOnlyEvent
        ? await (async () => {
            const created = await createEvent({
              eventName: patch.eventName ?? current.eventName,
              eventType: patch.eventType ?? current.eventType,
              eventDate: patch.eventDate ?? current.eventDate,
              eventTime24h: patch.eventTime24h ?? current.eventTime24h ?? "00:00",
              eventDurationMinutes: patch.eventDurationMinutes ?? current.durationMinutes,
              createAction: "create_event_slot",
              selectedCourts: patch.selectedCourts ?? current.selectedCourts,
              playerIds: patch.playerIds ?? current.playerIds,
              isTeamMexicano: patch.isTeamMexicano ?? current.isTeamMexicano,
            })

            return updateEvent(created.id, {
              expectedVersion: created.version,
              ...patch,
            })
          })()
        : await updateEvent(targetId, {
            expectedVersion: current.version,
            ...patch,
          })

      const persisted = mapEventRecordToCalendarEvent(persistedRecord)
      if (isLocalOnlyEvent) {
        replaceEvent(targetId, persisted)
      } else {
        updateEventFields(persisted.id, persisted)
      }

      if (
        drawerState.open &&
        (drawerState.mode === "edit" || drawerState.mode === "readonly") &&
        drawerState.event.id === targetId
      ) {
        setDrawerState({ open: true, mode: "edit", event: persisted })
      }
    },
    [byId, drawerState, replaceEvent, updateEventFields],
  )

  const toggleRecurringSelection = useCallback((eventId: string) => {
    setRecurringSelectedEventIds((current) =>
      current.includes(eventId) ? current.filter((id) => id !== eventId) : [...current, eventId],
    )
  }, [])

  const cancelRecurringSelectMode = useCallback(() => {
    setIsRecurringSelectMode(false)
    setRecurringSelectedEventIds([])
    setIsRecurringSaving(false)
  }, [])

  const handleTemplatePanelToggle = useCallback(async () => {
    if (isTemplatePanelAnimating) return

    setIsTemplatePanelAnimating(true)

    if (!isTemplatePanelCollapsed) {
      if (isRecurringSelectMode) {
        cancelRecurringSelectMode()
      }

      setShowTemplatePanelBody(false)
      await animate(templatePanelHeightMv, TEMPLATE_PANEL_COLLAPSED_SIZE_PX, {
        duration: TEMPLATE_PANEL_STAGE_DURATION,
        ease: TEMPLATE_PANEL_EASE,
      })

      setIsTemplatePanelCollapsed(true)
      await animate(templatePanelWidthMv, TEMPLATE_PANEL_COLLAPSED_SIZE_PX, {
        duration: TEMPLATE_PANEL_STAGE_DURATION,
        ease: TEMPLATE_PANEL_EASE,
      })

      setIsTemplatePanelAnimating(false)
      return
    }

    await animate(templatePanelWidthMv, templatePanelExpandedWidth, {
      duration: TEMPLATE_PANEL_STAGE_DURATION,
      ease: TEMPLATE_PANEL_EASE,
    })
    await animate(templatePanelHeightMv, templatePanelExpandedHeight, {
      duration: TEMPLATE_PANEL_STAGE_DURATION,
      ease: TEMPLATE_PANEL_EASE,
    })

    setIsTemplatePanelCollapsed(false)
    setShowTemplatePanelBody(true)
    setIsTemplatePanelAnimating(false)
  }, [
    cancelRecurringSelectMode,
    isRecurringSelectMode,
    isTemplatePanelAnimating,
    isTemplatePanelCollapsed,
    templatePanelExpandedHeight,
    templatePanelExpandedWidth,
    templatePanelHeightMv,
    templatePanelWidthMv,
  ])

  const saveRecurringSelections = useCallback(async () => {
    if (recurringSelectedEventIds.length === 0 || isRecurringSaving) return
    setIsRecurringSaving(true)
    setError(null)

    try {
      const nextWeekStart = addDaysISO(formatDateISO(weekStart), 7)
      const nextWeekEnd = addDaysISO(formatDateISO(weekStart), 13)
      const persistedNextWeek = normalizeCalendarEvents(
        await listEventsByDateRange(nextWeekStart, nextWeekEnd),
      )
      const existingSlots = [
        ...events.filter((event) => event.eventDate >= nextWeekStart && event.eventDate <= nextWeekEnd),
        ...persistedNextWeek,
      ]

      const selected = recurringSelectedEventIds
        .map((id) => byId.get(id))
        .filter((event): event is CalendarEventViewModel => Boolean(event && event.eventTime24h))

      for (const sourceEvent of selected) {
        const nextWeekDate = addDaysISO(sourceEvent.eventDate, 7)
        const conflicts = hasEventSlotConflict(
          existingSlots,
          nextWeekDate,
          sourceEvent.eventTime24h!,
          sourceEvent.durationMinutes,
        )
        if (conflicts) {
          continue
        }

        const typeLabel = getCalendarEventTypeLabel(sourceEvent)
        const created = await createEvent({
          eventName: generateCalendarEventName(nextWeekDate, sourceEvent.eventTime24h!, typeLabel),
          eventType: sourceEvent.eventType,
          eventDate: nextWeekDate,
          eventTime24h: sourceEvent.eventTime24h!,
          eventDurationMinutes: sourceEvent.durationMinutes,
          createAction: "create_event_slot",
          selectedCourts: [],
          playerIds: [],
          isTeamMexicano: sourceEvent.isTeamMexicano,
        })

        const createdView = mapEventRecordToCalendarEvent(created)
        createLocalEvent(createdView)
        existingSlots.push(createdView)
      }

      cancelRecurringSelectMode()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save recurring selections.")
    } finally {
      setIsRecurringSaving(false)
    }
  }, [
    byId,
    cancelRecurringSelectMode,
    createLocalEvent,
    events,
    isRecurringSaving,
    recurringSelectedEventIds,
    weekStart,
  ])

  const onBlockDragStart = (event: CalendarEventViewModel, e: React.DragEvent) => {
    if (isRecurringSelectMode) {
      e.preventDefault()
      return
    }
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
    if (isRecurringSelectMode) return
    e.preventDefault()
    const target = resolveDropTarget(dayIndex, e.clientY, e.currentTarget.getBoundingClientRect().top)
    const draggedEventId = getDragEventId(e)
    const templateId = getTemplateDropId(e)
    const dropDate = new Date(weekStart)
    dropDate.setDate(dropDate.getDate() + target.dayIndex)
    const nextDate = formatDateISO(dropDate)
    const previewDurationMinutes = draggedEventId
      ? byId.get(draggedEventId)?.durationMinutes ?? 90
      : templateId
        ? 90
        : 60
    const hasConflict = hasEventSlotConflict(
      events,
      nextDate,
      target.resolvedTime24h,
      previewDurationMinutes,
      draggedEventId || undefined,
    )
    setGhostBlock({
      dayIndex: target.dayIndex,
      top: target.minutesFromGridStart,
      height: previewDurationMinutes * PX_PER_MINUTE,
      label: target.resolvedTime24h,
      mode: hasConflict ? "invalid" : "drag",
    })
  }

  const onGridDrop = (dayIndex: number, e: React.DragEvent<HTMLDivElement>) => {
    if (isRecurringSelectMode) return
    e.preventDefault()
    const draggedEventId = getDragEventId(e)
    const target = resolveDropTarget(dayIndex, e.clientY, e.currentTarget.getBoundingClientRect().top)
    const dropDate = new Date(weekStart)
    dropDate.setDate(dropDate.getDate() + target.dayIndex)
    const nextDate = formatDateISO(dropDate)

    const previewDurationMinutes = draggedEventId
      ? byId.get(draggedEventId)?.durationMinutes ?? 90
      : getTemplateDropId(e)
        ? 90
        : 60

    const hasConflict = hasEventSlotConflict(
      events,
      nextDate,
      target.resolvedTime24h,
      previewDurationMinutes,
      draggedEventId || undefined,
    )

    if (hasConflict) {
      setError("No duplicate events: this time slot is already occupied.")
      endInteraction()
      setDraggingEventId(null)
      setGhostBlock(null)
      return
    }

    if (draggedEventId) {
      moveEvent(draggedEventId, nextDate, target.resolvedTime24h)

      const movedEvent = byId.get(draggedEventId)
      if (movedEvent) {
        const eventTypeLabel = getCalendarEventTypeLabel(movedEvent)
        void persistEventUpdate(draggedEventId, {
          eventDate: nextDate,
          eventTime24h: target.resolvedTime24h,
          eventName: generateCalendarEventName(nextDate, target.resolvedTime24h, eventTypeLabel),
        }).catch((err) => {
          setError(err instanceof Error ? err.message : "Could not save calendar move.")
          void loadWeek()
        })
      }
    }

    const templateId = getTemplateDropId(e)
    if (templateId) {
      const template = templateById(templateId)
      const eventName = generateCalendarEventName(nextDate, target.resolvedTime24h, template.displayLabel)

      void createEvent({
        eventName,
        eventType: template.eventType,
        eventDate: nextDate,
        eventTime24h: target.resolvedTime24h,
        eventDurationMinutes: 90,
        createAction: "create_event_slot",
        selectedCourts: [],
        playerIds: [],
        isTeamMexicano: template.isTeamMexicano,
      })
        .then((record) => {
          createLocalEvent(mapEventRecordToCalendarEvent(record))
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Could not create calendar event.")
        })
    }

    endInteraction()
    setDraggingEventId(null)
    setGhostBlock(null)
  }

  const onResizeStart = (eventId: string, e: React.PointerEvent<HTMLDivElement>) => {
    if (isRecurringSelectMode) return
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
    setSuppressBlockClick(true)
    window.setTimeout(() => setSuppressBlockClick(false), 0)

    const resized = byId.get(eventId)
    if (resized) {
      void persistEventUpdate(eventId, {
        eventDurationMinutes: resized.durationMinutes,
      }).catch((err) => {
        setError(err instanceof Error ? err.message : "Could not save event duration.")
        void loadWeek()
      })
    }

    setActiveResizeEventId(null)
    setResizeStartY(null)
    setResizeStartDuration(null)
    endInteraction()
  }

  const selectedEditableEvent =
    drawerState.open && (drawerState.mode === "edit" || drawerState.mode === "readonly")
      ? drawerState.event
      : null

  const onDeleteDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
    const eventId = getDragEventId(e)
    if (!eventId) return
    e.preventDefault()
    setDeleteDropHover(true)
  }

  const onDeleteDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setDeleteDropHover(false)
    const eventId = getDragEventId(e)
    if (!eventId) return

    if (eventId.startsWith("template-")) {
      removeEvent(eventId)
      return
    }

    void deleteEvent(eventId)
      .then(() => {
        removeEvent(eventId)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not delete event.")
        void loadWeek()
      })
  }

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
            All calendar changes save immediately
          </span>
        </div>
      </header>

      {error && <p className="warning-text">{error}</p>}

      {unscheduledEvents.length > 0 && (
        <UnscheduledStrip
          events={unscheduledEvents}
          onBlockClick={(event) => setDrawerState({ open: true, mode: "edit", event })}
        />
      )}

      <motion.div
        className={`calendar-layout-grid${isTemplatePanelCollapsed ? " calendar-layout-grid--panel-collapsed" : ""}`}
        style={{ ["--calendar-left-col-width" as any]: leftColWidthCss }}
      >
        <EventTemplatePanel
          deleteDropHover={deleteDropHover}
          onDeleteDrop={onDeleteDrop}
          onDeleteDragOver={onDeleteDragOver}
          onDeleteDragLeave={() => setDeleteDropHover(false)}
          isCollapsed={isTemplatePanelCollapsed}
          showBody={showTemplatePanelBody}
          panelWidth={templatePanelWidthMv}
          panelHeight={templatePanelHeightMv}
          onExpandedSize={({ width, height }) => {
            if (isTemplatePanelCollapsed || isTemplatePanelAnimating) return
            setTemplatePanelExpandedWidth(width)
            setTemplatePanelExpandedHeight(height)
          }}
          onCollapseToggle={handleTemplatePanelToggle}
          isRecurringSelectMode={isRecurringSelectMode}
          recurringSelectedCount={recurringSelectedEventIds.length}
          recurringSaving={isRecurringSaving}
          onRecurringModeToggle={() => {
            setDrawerState({ open: false })
            setIsRecurringSelectMode(true)
            setRecurringSelectedEventIds([])
          }}
          onRecurringCancel={cancelRecurringSelectMode}
          onRecurringSave={() => {
            void saveRecurringSelections()
          }}
        />
        <div className="panel">
          {loading ? (
            <p className="muted">Loading weekly events…</p>
          ) : viewMode === "week" ? (
            <WeekGrid
              events={scheduledEvents}
              weekStart={weekStart}
              ghostBlock={ghostBlock}
              draggingEventId={draggingEventId}
              onBlockClick={(event) => {
                if (suppressBlockClick) return
                if (isRecurringSelectMode) {
                  toggleRecurringSelection(event.id)
                  return
                }
                setDrawerState({ open: true, mode: "edit", event })
              }}
              onBlockNameClick={(event) => {
                if (suppressBlockClick) return
                if (isRecurringSelectMode) {
                  toggleRecurringSelection(event.id)
                  return
                }
                setDrawerState({ open: true, mode: "edit", event })
              }}
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
              recurringSelectMode={isRecurringSelectMode}
              recurringSelectedEventIds={recurringSelectedSet}
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
      </motion.div>

      <EventDrawer
        state={drawerState}
        onSave={async (payload, options) => {
          if (!selectedEditableEvent) return
          const shouldClose = options?.closeOnSuccess ?? false
          const isLocalOnlyEvent = selectedEditableEvent.id.startsWith("template-")

          const persistedRecord = isLocalOnlyEvent
            ? await (async () => {
                const resolved = {
                  eventName: payload.eventName ?? selectedEditableEvent.eventName,
                  eventType: payload.eventType ?? selectedEditableEvent.eventType,
                  eventDate: payload.eventDate ?? selectedEditableEvent.eventDate,
                  eventTime24h: payload.eventTime24h ?? selectedEditableEvent.eventTime24h ?? "00:00",
                  eventDurationMinutes: payload.eventDurationMinutes ?? selectedEditableEvent.durationMinutes,
                  selectedCourts: payload.selectedCourts ?? selectedEditableEvent.selectedCourts,
                  playerIds: payload.playerIds ?? selectedEditableEvent.playerIds,
                  isTeamMexicano: payload.isTeamMexicano ?? selectedEditableEvent.isTeamMexicano,
                }

                const created = await createEvent({
                  eventName: resolved.eventName,
                  eventType: resolved.eventType,
                  eventDate: resolved.eventDate,
                  eventTime24h: resolved.eventTime24h,
                  eventDurationMinutes: resolved.eventDurationMinutes,
                  createAction: "create_event_slot",
                  selectedCourts: [],
                  playerIds: [],
                  isTeamMexicano: resolved.isTeamMexicano,
                })

                return updateEvent(created.id, {
                  expectedVersion: created.version,
                  eventName: resolved.eventName,
                  eventType: resolved.eventType,
                  eventDate: resolved.eventDate,
                  eventTime24h: resolved.eventTime24h,
                  eventDurationMinutes: resolved.eventDurationMinutes,
                  selectedCourts: resolved.selectedCourts,
                  playerIds: resolved.playerIds,
                  isTeamMexicano: resolved.isTeamMexicano,
                })
              })()
            : await saveCalendarEventImmediately(selectedEditableEvent.id, {
                ...payload,
                expectedVersion: selectedEditableEvent.version,
              })

          const persisted = mapEventRecordToCalendarEvent(persistedRecord)
          if (isLocalOnlyEvent) {
            replaceEvent(selectedEditableEvent.id, persisted)
          } else {
            updateEventFields(persisted.id, persisted)
          }

          if (shouldClose) {
            setDrawerState({ open: false })
          } else {
            setDrawerState({ open: true, mode: "edit", event: persisted })
          }

          return persisted
        }}
        onDelete={async (eventId) => {
          if (eventId.startsWith("template-")) {
            removeEvent(eventId)
            setDrawerState({ open: false })
            return
          }
          await deleteEvent(eventId)
          removeEvent(eventId)
          setDrawerState({ open: false })
        }}
        onStart={async (eventId) => {
          await startEvent(eventId)
          const win = window.open(`/events/${eventId}/run`, "_blank")
          if (win === null) {
            window.location.assign(`/events/${eventId}/run`)
          }
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

function addDaysISO(dateISO: string, days: number): string {
  const [yearRaw, monthRaw, dayRaw] = dateISO.split("-")
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  const day = Number(dayRaw)
  const parsed = new Date(year, month - 1, day)
  if (Number.isNaN(parsed.getTime())) return dateISO
  parsed.setDate(parsed.getDate() + days)
  return formatDateISO(parsed)
}

function hasEventSlotConflict(
  events: CalendarEventViewModel[],
  eventDate: string,
  eventTime24h: string,
  durationMinutes: number,
  ignoreEventId?: string,
): boolean {
  const targetStart = minutesSinceGridStart(eventTime24h)
  const targetEnd = targetStart + durationMinutes

  return events.some((event) => {
    if (event.id === ignoreEventId) return false
    if (event.eventDate !== eventDate) return false
    if (!event.eventTime24h) return false

    const existingStart = minutesSinceGridStart(event.eventTime24h)
    const existingEnd = existingStart + event.durationMinutes
    return targetStart < existingEnd && existingStart < targetEnd
  })
}
