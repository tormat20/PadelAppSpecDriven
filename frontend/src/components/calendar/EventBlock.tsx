// T001 note: EventBlock owns gesture entry points for move (body drag)
// and resize (bottom 4px zone) while CalendarPage coordinates state updates.
import type { CalendarEventViewModel } from "./calendarEventModel"
import { getCalendarEventTypeLabel } from "./eventRecordMapping"
import { formatDurationLabel } from "./duration"
import { isInBottomResizeZone, RESIZE_ZONE_HEIGHT_PX } from "./interactionMode"
import { getEventTypeVisualClass } from "./eventTypeVisualMap"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EventBlockProps = {
  event: CalendarEventViewModel
  top: number       // px from grid top
  height: number    // px height
  isDragging: boolean
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
  onClick: () => void
  onNameClick?: () => void
  onResizeStart?: (eventId: string, e: React.PointerEvent<HTMLDivElement>) => void
  onResizeMove?: (eventId: string, e: React.PointerEvent<HTMLDivElement>) => void
  onResizeEnd?: (eventId: string, e: React.PointerEvent<HTMLDivElement>) => void
  isResizeActive?: boolean
}

// ---------------------------------------------------------------------------
// EventBlock
// ---------------------------------------------------------------------------

export default function EventBlock({
  event,
  top,
  height,
  isDragging,
  onDragStart,
  onDragEnd,
  onClick,
  onNameClick,
  onResizeStart,
  onResizeMove,
  onResizeEnd,
  isResizeActive = false,
}: EventBlockProps) {
  const isLobby = event.status === "Lobby"
  const isRunningOrFinished = event.status === "Running" || event.status === "Finished"

  const statusLower = event.status.toLowerCase()
  const eventTypeLower = event.eventType.toLowerCase()
  const eventTypeVisualClass = getEventTypeVisualClass(event.eventType, event.isTeamMexicano)

  const className = [
    "calendar-event-block",
    eventTypeVisualClass,
    `calendar-event-block--d${event.durationMinutes}`,
    `calendar-event-block--${statusLower}`,
    `calendar-event-block--${eventTypeLower}`,
    isDragging ? "calendar-event-block--dragging" : "",
  ]
    .filter(Boolean)
    .join(" ")

  const eventTypeLabel = getCalendarEventTypeLabel(event)
  const scheduleMoment = formatEventMomentLabel(event.eventDate, event.eventTime24h)
  const timeRangeLabel = formatEventTimeRange(event.eventTime24h, event.durationMinutes)

  const canResize = isLobby && Boolean(onResizeStart)

  return (
    <div
      className={className}
      role="button"
      tabIndex={0}
      draggable={isLobby && !isResizeActive}
      style={{
        position: "absolute",
        top: `${top}px`,
        height: `${height}px`,
        left: 0,
        right: 0,
        opacity: isDragging ? 0.4 : 1,
        cursor: isResizeActive ? "ns-resize" : isLobby ? "grab" : "default",
      }}
      onDragStart={(e) => {
        if (isRunningOrFinished) {
          e.preventDefault()
          return
        }
        onDragStart(e)
      }}
      onDragEnd={onDragEnd}
      onClick={onClick}
      onPointerMove={(e) => {
        if (!canResize || isResizeActive) return
        const rect = e.currentTarget.getBoundingClientRect()
        const offsetY = e.clientY - rect.top
        e.currentTarget.style.cursor = isInBottomResizeZone(rect.height, offsetY) ? "ns-resize" : "grab"
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick()
        }
      }}
    >
      {/* Event name */}
      <button
        type="button"
        className="calendar-event-block__name"
        draggable={false}
        onPointerDown={(e) => {
          e.stopPropagation()
        }}
        onClick={(e) => {
          e.stopPropagation()
          ;(onNameClick ?? onClick)()
        }}
      >
        {eventTypeLabel}
      </button>

      <span className="calendar-event-block__moment">{scheduleMoment}</span>
      <span className="calendar-event-block__time-range">{timeRangeLabel}</span>
      {event.durationMinutes >= 120 && <span className="calendar-event-block__duration">{formatDurationLabel(event.durationMinutes)}</span>}

      {canResize && (
        <div
          className="calendar-event-block__resize-zone"
          onPointerDown={(e) => {
            e.stopPropagation()
            onResizeStart?.(event.id, e)
          }}
          onClick={(e) => {
            e.stopPropagation()
          }}
          onPointerMove={(e) => {
            if (!isResizeActive) return
            onResizeMove?.(event.id, e)
          }}
          onPointerUp={(e) => {
            if (!isResizeActive) return
            onResizeEnd?.(event.id, e)
          }}
          onPointerCancel={(e) => {
            if (!isResizeActive) return
            onResizeEnd?.(event.id, e)
          }}
          style={{ height: `${RESIZE_ZONE_HEIGHT_PX}px` }}
          aria-hidden="true"
        />
      )}

    </div>
  )
}

export function formatEventTimeRange(eventTime24h: string | null, durationMinutes: number): string {
  if (!eventTime24h || !eventTime24h.includes(":")) return "Unscheduled"
  const [hRaw, mRaw] = eventTime24h.split(":")
  const h = Number(hRaw)
  const m = Number(mRaw)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return "Unscheduled"

  const startMinutes = h * 60 + m
  const endMinutes = startMinutes + durationMinutes
  const startHour = Math.floor(startMinutes / 60) % 24
  const startMinute = startMinutes % 60
  const endHour = Math.floor(endMinutes / 60) % 24
  const endMinute = endMinutes % 60

  const start = `${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}`
  const end = `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`
  return `${start} - ${end}`
}

export function formatEventMomentLabel(eventDate: string, eventTime24h: string | null): string {
  const parsedDate = new Date(`${eventDate}T00:00:00`)
  const weekday = Number.isNaN(parsedDate.getTime())
    ? "Event"
    : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][parsedDate.getDay()]

  if (!eventTime24h || !eventTime24h.includes(":")) {
    return `${weekday} Unscheduled`
  }

  const [hoursPart, minutesPart] = eventTime24h.split(":")
  const hours = Number(hoursPart)
  const minutes = Number(minutesPart)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return `${weekday} Unscheduled`
  }
  const startMinutes = hours * 60 + minutes

  const category =
    startMinutes >= 7 * 60 && startMinutes <= 10 * 60
      ? "Morning"
      : startMinutes >= 10 * 60 + 30 && startMinutes <= 13 * 60
        ? "Lunch"
        : startMinutes >= 13 * 60 + 30 && startMinutes <= 17 * 60
          ? "Afternoon"
          : "Evening"

  return `${weekday} ${category}`
}
