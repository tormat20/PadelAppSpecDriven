import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { withInteractiveSurface } from "../features/interaction/surfaceClass"
import { listEvents } from "../lib/api"
import { getEventModeLabel } from "../lib/eventMode"
import type { EventRecord, EventType } from "../lib/types"
import {
  applyEventSlotView,
  getEventFilterEmptyState,
  getEventSlotDisplay,
  getEventSlotStatusColumnClass,
  getLifecycleStatusLabel,
  matchesEventFilter,
  type EventSlotFilter,
  type EventSortOption,
} from "./Home"

const EVENT_SLOT_FILTER_KEY = "home.eventSlots.filter"
const EVENT_SLOT_SORT_KEY = "home.eventSlots.sort"
const EVENT_SLOT_MODE_FILTERS_KEY = "home.eventSlots.modeFilters"
const EVENT_SLOT_COLLAPSED_MODES_KEY = "home.eventSlots.collapsedModes"

const MODE_ORDER: EventType[] = ["WinnersCourt", "Mexicano", "RankedBox"]

function isEventSlotFilter(value: string | null): value is EventSlotFilter {
  return value === "all" || value === "planned" || value === "ready" || value === "ongoing" || value === "finished"
}

function isEventSortOption(value: string | null): value is EventSortOption {
  return value === "default" || value === "mode" || value === "date"
}

function isEventType(value: string): value is EventType {
  return value === "WinnersCourt" || value === "Mexicano" || value === "RankedBox"
}

function parseSavedModeFilters(value: string | null): EventType[] {
  if (!value) return [...MODE_ORDER]
  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return [...MODE_ORDER]
    const filtered = parsed.filter((entry): entry is EventType => typeof entry === "string" && isEventType(entry))
    if (filtered.length === 0) return [...MODE_ORDER]
    return MODE_ORDER.filter((mode) => filtered.includes(mode))
  } catch {
    return [...MODE_ORDER]
  }
}

function parseSavedCollapsedModes(value: string | null): EventType[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((entry): entry is EventType => typeof entry === "string" && isEventType(entry))
  } catch {
    return []
  }
}

const FILTER_LABELS: Record<EventSlotFilter, string> = {
  all: "Show all",
  planned: "Planned",
  ready: "Ready",
  ongoing: "Ongoing",
  finished: "Finished",
}

export default function EventSlotsPage() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<EventRecord[]>([])
  const [filter, setFilter] = useState<EventSlotFilter>(() => {
    if (typeof window === "undefined") return "all"
    const stored = window.localStorage.getItem(EVENT_SLOT_FILTER_KEY)
    return isEventSlotFilter(stored) ? stored : "all"
  })
  const [sortOption, setSortOption] = useState<EventSortOption>(() => {
    if (typeof window === "undefined") return "default"
    const stored = window.localStorage.getItem(EVENT_SLOT_SORT_KEY)
    return isEventSortOption(stored) ? stored : "default"
  })
  const [modeFilters, setModeFilters] = useState<EventType[]>(() => {
    if (typeof window === "undefined") return [...MODE_ORDER]
    return parseSavedModeFilters(window.localStorage.getItem(EVENT_SLOT_MODE_FILTERS_KEY))
  })
  const [collapsedModes, setCollapsedModes] = useState<EventType[]>(() => {
    if (typeof window === "undefined") return []
    return parseSavedCollapsedModes(window.localStorage.getItem(EVENT_SLOT_COLLAPSED_MODES_KEY))
  })

  useEffect(() => {
    listEvents().then(setEvents).catch(() => setEvents([]))
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(EVENT_SLOT_FILTER_KEY, filter)
  }, [filter])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(EVENT_SLOT_SORT_KEY, sortOption)
  }, [sortOption])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(EVENT_SLOT_MODE_FILTERS_KEY, JSON.stringify(modeFilters))
  }, [modeFilters])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(EVENT_SLOT_COLLAPSED_MODES_KEY, JSON.stringify(collapsedModes))
  }, [collapsedModes])

  const toggleSortOption = (option: "mode" | "date") => {
    setSortOption((current) => (current === option ? "default" : option))
  }

  const toggleModeFilter = (mode: EventType) => {
    setModeFilters((current) => {
      if (current.includes(mode)) {
        return current.filter((entry) => entry !== mode)
      }
      return MODE_ORDER.filter((entry) => current.includes(entry) || entry === mode)
    })
  }

  const toggleCollapseMode = (mode: EventType) => {
    setCollapsedModes((current) =>
      current.includes(mode) ? current.filter((m) => m !== mode) : [...current, mode],
    )
  }

  const visibleEvents = applyEventSlotView(events, filter, sortOption, modeFilters)
  const emptyState = sortOption === "mode" && modeFilters.length === 0 ? "Select at least one mode." : getEventFilterEmptyState(filter)

  return (
    <section className="page-shell">
      <header className="page-header panel">
        <h1 className="page-title">Events</h1>
        <button
          aria-label="Main menu"
          className={withInteractiveSurface("button-secondary")}
          onClick={() => navigate("/")}
        >
          Main Menu
        </button>
      </header>
      <section className="panel list-stack" aria-label="Planned and ready events">
        <div className="section-header">
          <h2 className="section-title">Event slots</h2>
          <div className="event-filter-stack">
            <div className="event-filter-control" role="tablist" aria-label="Filter events by lifecycle">
              {(Object.keys(FILTER_LABELS) as EventSlotFilter[]).map((option) => (
                <button
                  key={option}
                  className={withInteractiveSurface("event-filter-segment")}
                  type="button"
                  role="tab"
                  aria-selected={filter === option}
                  data-active={filter === option}
                  onClick={() => setFilter(option)}
                >
                  {FILTER_LABELS[option]}
                </button>
              ))}
            </div>
            <div className="event-sort-toggle-row" role="group" aria-label="Order events">
              <button
                className={withInteractiveSurface("event-sort-toggle")}
                type="button"
                aria-pressed={sortOption === "mode"}
                data-active={sortOption === "mode"}
                onClick={() => toggleSortOption("mode")}
              >
                Mode
              </button>
              <button
                className={withInteractiveSurface("event-sort-toggle")}
                type="button"
                aria-pressed={sortOption === "date"}
                data-active={sortOption === "date"}
                onClick={() => toggleSortOption("date")}
              >
                Date
              </button>
            </div>
            {sortOption === "mode" && (
              <div className="event-mode-blobs" role="group" aria-label="Filter by mode">
                {MODE_ORDER.map((mode) => {
                  const isActive = modeFilters.includes(mode)
                  const isCollapsed = collapsedModes.includes(mode)
                  return (
                    <ModeBlob
                      key={mode}
                      mode={mode}
                      isActive={isActive}
                      isCollapsed={isCollapsed}
                      onToggleFilter={() => toggleModeFilter(mode)}
                      onToggleCollapse={() => toggleCollapseMode(mode)}
                    />
                  )
                })}
              </div>
            )}
          </div>
        </div>
        {visibleEvents.length === 0 && <p className="muted">{emptyState}</p>}
        {visibleEvents.map((event) => (
          <div className="summary-row event-slot-row" key={event.id}>
            <div className="event-slot-main">
              <strong>{event.eventName}</strong>
              <p className="muted">{getEventSlotDisplay(event)}</p>
            </div>
            <div className={getEventSlotStatusColumnClass()}>
              <span className="status-chip">{getLifecycleStatusLabel(event)}</span>
              {event.warnings.duplicateSlot && <p className="warning-text">Duplicate slot</p>}
            </div>
            <Link className="button-secondary" to={`/events/${event.id}/preview`}>
              Open
            </Link>
          </div>
        ))}
      </section>
    </section>
  )
}

interface ModeBlobProps {
  mode: EventType
  isActive: boolean
  isCollapsed: boolean
  onToggleFilter: () => void
  onToggleCollapse: () => void
}

function ModeBlob({ mode, isActive, isCollapsed, onToggleFilter, onToggleCollapse }: ModeBlobProps) {
  // Track whether we're mid-animation to smoothly transition between states
  const [visuallyCollapsed, setVisuallyCollapsed] = useState(isCollapsed)
  const [animState, setAnimState] = useState<"idle" | "collapsing" | "expanding">("idle")
  const animTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // No change, skip
    if (isCollapsed === visuallyCollapsed && animState === "idle") return

    if (animTimer.current) clearTimeout(animTimer.current)

    if (isCollapsed && !visuallyCollapsed) {
      // Trigger collapse animation on the expanded blob
      setAnimState("collapsing")
      animTimer.current = setTimeout(() => {
        setVisuallyCollapsed(true)
        setAnimState("idle")
      }, 260)
    } else if (!isCollapsed && visuallyCollapsed) {
      // Switch to expanded immediately, then animate expand
      setVisuallyCollapsed(false)
      setAnimState("expanding")
      animTimer.current = setTimeout(() => {
        setAnimState("idle")
      }, 280)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCollapsed])

  // Cleanup on unmount
  useEffect(() => () => { if (animTimer.current) clearTimeout(animTimer.current) }, [])

  if (visuallyCollapsed) {
    return (
      <button
        className={withInteractiveSurface("event-mode-blob event-mode-blob--collapsed")}
        type="button"
        aria-label={`Expand ${getEventModeLabel(mode)}`}
        onClick={onToggleCollapse}
      >
        <span className="event-mode-blob-plus">+</span>
      </button>
    )
  }

  const blobClass = [
    "event-mode-blob",
    isActive ? "event-mode-blob--active" : "",
    animState === "collapsing" ? "event-mode-blob--anim-collapse" : "",
    animState === "expanding" ? "event-mode-blob--anim-expand" : "",
  ].filter(Boolean).join(" ")

  return (
    <div className={blobClass} data-active={isActive}>
      <button
        className={withInteractiveSurface("event-mode-blob-label")}
        type="button"
        aria-pressed={isActive}
        onClick={onToggleFilter}
      >
        {getEventModeLabel(mode)}
      </button>
      <button
        className={withInteractiveSurface("event-mode-blob-collapse")}
        type="button"
        aria-label={`Collapse ${getEventModeLabel(mode)}`}
        onClick={onToggleCollapse}
      >
        −
      </button>
    </div>
  )
}
