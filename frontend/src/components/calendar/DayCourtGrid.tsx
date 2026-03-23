import { useMemo, useState } from "react"

import type { CalendarEventViewModel } from "./calendarEventModel"
import { PX_PER_MINUTE, GRID_TOTAL_MINUTES, GRID_START_HOUR, SNAP_MINUTES } from "./calendarConstants"
import { formatEventTimeRange } from "./EventBlock"
import { getCalendarEventTypeLabel } from "./eventRecordMapping"
import { getEventTypeVisualClass } from "./eventTypeVisualMap"

type DayCourtGridProps = {
  selectedDate: Date
  events: CalendarEventViewModel[]
  onEventClick: (event: CalendarEventViewModel) => void
  onBackToWeek: () => void
}

export type LaneSegment = {
  event: CalendarEventViewModel
  court: number
  top: number
  height: number
  allLanesPlanned: boolean
}

const SHORT_WEEKDAY = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const SHORT_MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function formatDateISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function minutesSinceGridStart(time24h: string): number {
  if (!time24h.includes(":")) return 0
  const [hoursPart, minutesPart] = time24h.split(":")
  const hours = Number(hoursPart)
  const minutes = Number(minutesPart)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0
  if (hours === 0 && minutes === 0) return GRID_TOTAL_MINUTES
  return Math.max(0, hours * 60 + minutes - GRID_START_HOUR * 60)
}

function buildTimeLabels(): string[] {
  const labels: string[] = []
  const totalSlots = GRID_TOTAL_MINUTES / SNAP_MINUTES
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

export function deriveCourtNumbers(events: CalendarEventViewModel[]): number[] {
  const usedCourts = new Set<number>()
  for (const event of events) {
    for (const court of event.selectedCourts) usedCourts.add(court)
  }
  const maxCourt = Math.max(8, ...Array.from(usedCourts.values(), (court) => court))
  return Array.from({ length: maxCourt }, (_, index) => index + 1)
}

export function buildDayCourtLaneSegments(
  events: CalendarEventViewModel[],
  courtNumbers: number[],
): LaneSegment[] {
  const segments: LaneSegment[] = []
  for (const event of events) {
    const start = minutesSinceGridStart(event.eventTime24h!)
    const allLanesPlanned = event.selectedCourts.length === 0
    const lanes = allLanesPlanned ? courtNumbers : event.selectedCourts
    for (const lane of lanes) {
      segments.push({
        event,
        court: lane,
        top: start * PX_PER_MINUTE,
        height: event.durationMinutes * PX_PER_MINUTE,
        allLanesPlanned,
      })
    }
  }
  return segments
}

export default function DayCourtGrid({ selectedDate, events, onEventClick, onBackToWeek }: DayCourtGridProps) {
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null)
  const selectedDateISO = formatDateISO(selectedDate)

  const dayEvents = useMemo(
    () =>
      events.filter((event) => event.eventDate === selectedDateISO && event.eventTime24h && event.eventTime24h.length > 0),
    [events, selectedDateISO],
  )

  const courtNumbers = useMemo(() => deriveCourtNumbers(dayEvents), [dayEvents])

  const laneSegments = useMemo<LaneSegment[]>(() => buildDayCourtLaneSegments(dayEvents, courtNumbers), [courtNumbers, dayEvents])

  return (
    <div
      className="calendar-day-court-grid"
      style={{ "--court-count": String(courtNumbers.length) } as Record<string, string>}
      role="grid"
      aria-label="Day court calendar"
    >
      <div className="calendar-day-court-grid__header">
        <div className="calendar-day-court-grid__time-spacer">
          <div className="calendar-day-court-grid__selected-day">
            {SHORT_WEEKDAY[selectedDate.getDay()]} {selectedDate.getDate()} {SHORT_MONTH[selectedDate.getMonth()]}
          </div>
          <button type="button" className="button-secondary" onClick={onBackToWeek}>
            Back to Week
          </button>
        </div>
        {courtNumbers.map((court) => (
          <div key={court} className="calendar-day-court-grid__col-header" role="columnheader">
            Court {court}
          </div>
        ))}
      </div>

      <div className="calendar-day-court-grid__body">
        <div className="calendar-day-court-grid__time-labels" aria-hidden="true">
          {TIME_LABELS.map((label) => (
            <div key={label} className="calendar-time-label" style={{ height: `${SNAP_MINUTES * PX_PER_MINUTE}px` }}>
              {label}
            </div>
          ))}
        </div>

        {courtNumbers.map((court) => (
          <div
            key={court}
            className="calendar-day-court-grid__lane"
            style={{ height: `${GRID_TOTAL_MINUTES * PX_PER_MINUTE}px` }}
            role="gridcell"
            aria-label={`Court ${court}`}
          >
            {TIME_LABELS.map((label, i) => (
              <div
                key={label}
                className="calendar-day-court-grid__line"
                style={{ top: `${i * SNAP_MINUTES * PX_PER_MINUTE}px` }}
                aria-hidden="true"
              />
            ))}

            {laneSegments
              .filter((segment) => segment.court === court)
              .map((segment) => {
                const { event } = segment
                const isLinkedHover = hoveredEventId === event.id
                return (
                  <div
                    key={`${event.id}-${court}`}
                    className={[
                      "calendar-day-court-event",
                      getEventTypeVisualClass(event.eventType, event.isTeamMexicano),
                      segment.allLanesPlanned ? "calendar-day-court-event--planned" : "",
                      isLinkedHover ? "calendar-day-court-event--linked-hover" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={{ top: `${segment.top}px`, height: `${segment.height}px` }}
                    role="button"
                    tabIndex={0}
                    onMouseEnter={() => setHoveredEventId(event.id)}
                    onMouseLeave={() => setHoveredEventId(null)}
                    onClick={() => onEventClick(event)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        onEventClick(event)
                      }
                    }}
                  >
                    <span className="calendar-day-court-event__name">{event.eventName}</span>
                    <span className="calendar-day-court-event__type">
                      {getCalendarEventTypeLabel({ eventType: event.eventType, isTeamMexicano: event.isTeamMexicano })}
                    </span>
                    <span className="calendar-day-court-event__time">
                      {formatEventTimeRange(event.eventTime24h, event.durationMinutes)}
                    </span>
                  </div>
                )
              })}
          </div>
        ))}
      </div>
    </div>
  )
}
