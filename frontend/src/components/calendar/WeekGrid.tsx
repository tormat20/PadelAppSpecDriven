import type { EventRecord } from "../../lib/types"
import {
  getWeekDates,
  eventTopPx,
  eventHeightPx,
  deriveDurationMinutes,
  PX_PER_MINUTE,
  GRID_START_HOUR,
  GRID_TOTAL_MINUTES,
  SNAP_MINUTES,
} from "../../pages/Calendar"
import type { GhostBlockState } from "../../pages/Calendar"
import EventBlock from "./EventBlock"
import GhostBlock from "./GhostBlock"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WeekGridProps = {
  events: EventRecord[]
  weekStart: Date
  ghostBlock: GhostBlockState | null
  onBlockClick: (event: EventRecord) => void
  onBlockDragStart: (event: EventRecord, e: React.DragEvent) => void
  onGridDrop: (e: React.DragEvent) => void
  onGridDragOver: (e: React.DragEvent) => void
  onCellPointerDown: (
    dayIndex: number,
    minutesFromGridStart: number,
    e: React.PointerEvent
  ) => void
}

// ---------------------------------------------------------------------------
// Time label generation  (07:00, 07:30, … 23:30, 00:00) → 34 labels
// ---------------------------------------------------------------------------

function buildTimeLabels(): string[] {
  const labels: string[] = []
  const totalSlots = GRID_TOTAL_MINUTES / SNAP_MINUTES  // 1020 / 30 = 34
  for (let i = 0; i <= totalSlots; i++) {
    const absoluteMinutes = GRID_START_HOUR * 60 + i * SNAP_MINUTES
    if (absoluteMinutes >= 24 * 60) {
      labels.push("00:00")
      break
    }
    const h = Math.floor(absoluteMinutes / 60)
    const m = absoluteMinutes % 60
    labels.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`)
  }
  return labels
}

const TIME_LABELS = buildTimeLabels()

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

const SHORT_WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const SHORT_MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                     "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

// ---------------------------------------------------------------------------
// WeekGrid
// ---------------------------------------------------------------------------

export default function WeekGrid({
  events,
  weekStart,
  ghostBlock,
  onBlockClick,
  onBlockDragStart,
  onGridDrop,
  onGridDragOver,
  onCellPointerDown,
}: WeekGridProps) {
  const weekDates = getWeekDates(weekStart)
  const today = new Date()

  return (
    <div className="calendar-week-grid" role="grid" aria-label="Weekly calendar">
      {/* Header row */}
      <div className="calendar-week-grid__header">
        {/* Spacer for the time label column */}
        <div className="calendar-week-grid__time-spacer" aria-hidden="true" />
        {weekDates.map((date, i) => (
          <div
            key={i}
            className={[
              "calendar-week-grid__col-header",
              isSameDay(date, today) ? "calendar-col--today" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            role="columnheader"
          >
            <span className="calendar-col__weekday">{SHORT_WEEKDAY[date.getDay()]}</span>
            <span className="calendar-col__date">
              {date.getDate()} {SHORT_MONTH[date.getMonth()]}
            </span>
          </div>
        ))}
      </div>

      {/* Body: time labels + 7 day columns */}
      <div className="calendar-week-grid__body">
        {/* Time labels column */}
        <div className="calendar-week-grid__time-labels" aria-hidden="true">
          {TIME_LABELS.map((label) => (
            <div
              key={label}
              className="calendar-time-label"
              style={{ height: `${SNAP_MINUTES * PX_PER_MINUTE}px` }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {weekDates.map((date, dayIndex) => {
          const dayEvents = events.filter(
            (e) =>
              e.eventDate === formatDateISO(date) &&
              e.eventTime24h !== null &&
              e.eventTime24h !== undefined &&
              e.eventTime24h !== ""
          )

          return (
            <div
              key={dayIndex}
              className={[
                "calendar-day-col",
                isSameDay(date, today) ? "calendar-col--today" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{
                position: "relative",
                height: `${GRID_TOTAL_MINUTES * PX_PER_MINUTE}px`,
              }}
              onDrop={onGridDrop}
              onDragOver={onGridDragOver}
              onPointerDown={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const relativeY = e.clientY - rect.top
                const rawMinutes = relativeY / PX_PER_MINUTE
                onCellPointerDown(dayIndex, rawMinutes, e)
              }}
              role="gridcell"
              aria-label={`${SHORT_WEEKDAY[date.getDay()]} ${date.getDate()} ${SHORT_MONTH[date.getMonth()]}`}
            >
              {/* Hour lines */}
              {TIME_LABELS.map((label, i) => (
                <div
                  key={label}
                  className="calendar-day-col__line"
                  style={{
                    position: "absolute",
                    top: `${i * SNAP_MINUTES * PX_PER_MINUTE}px`,
                    left: 0,
                    right: 0,
                    height: "1px",
                    pointerEvents: "none",
                  }}
                  aria-hidden="true"
                />
              ))}

              {/* Event blocks */}
              {dayEvents.map((event) => {
                const top = eventTopPx(event.eventTime24h!, PX_PER_MINUTE)
                const height = eventHeightPx(
                  deriveDurationMinutes(event),
                  PX_PER_MINUTE
                )
                return (
                  <EventBlock
                    key={event.id}
                    event={event}
                    top={top}
                    height={height}
                    isDragging={false}
                    onDragStart={(e) => onBlockDragStart(event, e)}
                    onClick={() => onBlockClick(event)}
                  />
                )
              })}

              {/* Ghost block (only in the correct day column) */}
              {ghostBlock && ghostBlock.dayIndex === dayIndex && (
                <GhostBlock
                  top={ghostBlock.top}
                  height={ghostBlock.height}
                  label={ghostBlock.label}
                  mode={ghostBlock.mode}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

function formatDateISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}
