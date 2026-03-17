import type { EventRecord } from "../lib/types"

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
  | { open: true; mode: "edit"; event: EventRecord }
  | { open: true; mode: "readonly"; event: EventRecord }
  | { open: true; mode: "create"; dayIndex: number; startMinutes: number }

// ---------------------------------------------------------------------------
// CalendarPage (default export) — coming soon
// ---------------------------------------------------------------------------

export default function CalendarPage() {
  return (
    <section className="page-shell" aria-label="Calendar page">
      <header className="page-header panel">
        <h1 className="page-title">Calendar</h1>
      </header>
      <div className="settings-section panel">
        <p className="settings-coming-soon">
          Calendar view — schedule and reschedule events on a weekly grid — coming soon.
        </p>
      </div>
    </section>
  )
}
