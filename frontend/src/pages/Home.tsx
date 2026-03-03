import { MagicBentoMenu } from "../components/bento/MagicBentoMenu"
import type { EventRecord, EventType } from "../lib/types"

export type EventSlotFilter = "all" | "planned" | "ready" | "ongoing" | "finished"
export type EventSortOption = "default" | "mode" | "date"

const MODE_ORDER: EventType[] = ["WinnersCourt", "Mexicano", "BeatTheBox"]

const FILTER_LABELS: Record<EventSlotFilter, string> = {
  all: "Show all",
  planned: "Planned",
  ready: "Ready",
  ongoing: "Ongoing",
  finished: "Finished",
}

function deriveLifecycleStatus(event: Pick<EventRecord, "lifecycleStatus" | "status" | "setupStatus">): Exclude<EventSlotFilter, "all"> {
  if (event.lifecycleStatus) return event.lifecycleStatus
  if (event.status === "Finished") return "finished"
  if (event.status === "Running") return "ongoing"
  return event.setupStatus === "ready" ? "ready" : "planned"
}

export function matchesEventFilter(
  event: Pick<EventRecord, "lifecycleStatus" | "status" | "setupStatus">,
  filter: EventSlotFilter,
): boolean {
  if (filter === "all") return true
  return deriveLifecycleStatus(event) === filter
}

export function getEventFilterEmptyState(filter: EventSlotFilter): string {
  if (filter === "all") return "No event slots yet."
  return `No ${FILTER_LABELS[filter].toLowerCase()} events.`
}

function toScheduleTimestamp(event: Pick<EventRecord, "eventDate" | "eventTime24h">): number {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(event.eventDate)
  if (!dateMatch) return Number.MAX_SAFE_INTEGER

  const year = Number(dateMatch[1])
  const month = Number(dateMatch[2])
  const day = Number(dateMatch[3])
  const time = event.eventTime24h ?? ""
  const timeMatch = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time)
  const hours = timeMatch ? Number(timeMatch[1]) : 23
  const minutes = timeMatch ? Number(timeMatch[2]) : 59
  return new Date(year, month - 1, day, hours, minutes, 0, 0).getTime()
}

export function applyEventSlotView(
  events: EventRecord[],
  lifecycleFilter: EventSlotFilter,
  sortOption: EventSortOption,
  modeFilters: EventType[],
): EventRecord[] {
  const filtered = events.filter((event) => matchesEventFilter(event, lifecycleFilter))
  const modeFiltered = sortOption === "mode" ? filtered.filter((event) => modeFilters.includes(event.eventType)) : filtered

  if (sortOption === "default") return modeFiltered

  const sorted = [...modeFiltered].sort((left, right) => {
    if (sortOption === "date") {
      return toScheduleTimestamp(left) - toScheduleTimestamp(right)
    }

    const modeDelta = MODE_ORDER.indexOf(left.eventType) - MODE_ORDER.indexOf(right.eventType)
    if (modeDelta !== 0) return modeDelta

    const timeDelta = toScheduleTimestamp(left) - toScheduleTimestamp(right)
    if (timeDelta !== 0) return timeDelta

    return left.eventName.localeCompare(right.eventName)
  })

  return sorted
}

export function getEventSlotDisplay(event: Pick<EventRecord, "eventDate" | "eventTime24h">): string {
  return `${event.eventDate} ${event.eventTime24h ?? ""}`.trim()
}

export function getEventSlotStatusColumnClass(): string {
  return "event-slot-status-col"
}

export function getLifecycleStatusLabel(event: Pick<EventRecord, "lifecycleStatus">): string {
  if (event.lifecycleStatus === "ongoing") return "Ongoing"
  if (event.lifecycleStatus === "finished") return "Finished"
  if (event.lifecycleStatus === "ready") return "Ready"
  return "Planned"
}

export default function HomePage() {
  return (
    <section className="page-shell">
      <MagicBentoMenu />
    </section>
  )
}
