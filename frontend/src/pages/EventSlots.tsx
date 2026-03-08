import { useEffect, useLayoutEffect, useRef, useState } from "react"
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

const MODE_ORDER: EventType[] = ["WinnersCourt", "Mexicano", "Americano", "RankedBox"]

// All individual event types for the filter checkboxes (includes Team Mexicano as a virtual filter)
const ALL_EVENT_TYPES: { key: EventType | "MexicanoTeam"; label: string }[] = [
  { key: "Mexicano", label: "Mexicano" },
  { key: "MexicanoTeam", label: "Mexicano (Team)" },
  { key: "Americano", label: "Americano" },
  { key: "WinnersCourt", label: "Winners Court" },
  { key: "RankedBox", label: "Ranked Box" },
]

function isEventSlotFilter(value: string | null): value is EventSlotFilter {
  return value === "all" || value === "planned" || value === "ready" || value === "ongoing" || value === "finished"
}

function isEventSortOption(value: string | null): value is EventSortOption {
  return value === "default" || value === "mode" || value === "date"
}

function isEventType(value: string): value is EventType {
  return (
    value === "WinnersCourt" ||
    value === "Mexicano" ||
    value === "Americano" ||
    value === "RankedBox"
  )
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

const FILTER_LABELS: Record<EventSlotFilter, string> = {
  all: "Show all",
  planned: "Planned",
  ready: "Ready",
  ongoing: "Ongoing",
  finished: "Finished",
}

// ── Filter chevron icon ─────────────────────────────────────────────────────────
const CHEVRON_DOWN = (
  <svg aria-hidden="true" fill="none" height="11" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" width="11">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const CHEVRON_RIGHT = (
  <svg aria-hidden="true" fill="none" height="11" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24" width="11">
    <polyline points="9 6 15 12 9 18" />
  </svg>
)

// ── Main page ──────────────────────────────────────────────────────────────────

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
  // modeFilters: which EventTypes are shown (default = all)
  // "MexicanoTeam" is a virtual filter stored separately
  const [modeFilters, setModeFilters] = useState<EventType[]>(() => {
    if (typeof window === "undefined") return [...MODE_ORDER]
    return parseSavedModeFilters(window.localStorage.getItem(EVENT_SLOT_MODE_FILTERS_KEY))
  })
  const [showTeamMexicano, setShowTeamMexicano] = useState(true)

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

  const toggleModeFilter = (mode: EventType) => {
    setModeFilters((current) => {
      if (current.includes(mode)) {
        return current.filter((entry) => entry !== mode)
      }
      return MODE_ORDER.filter((entry) => current.includes(entry) || entry === mode)
    })
  }

  // Apply mode filters: if all MODE_ORDER types are selected, no filtering.
  // Also handle Team Mexicano as a sub-filter on Mexicano events.
  const effectiveModeFilters = modeFilters.length === MODE_ORDER.length ? MODE_ORDER : modeFilters

  // When Mexicano is in the filter, decide whether to show team/non-team events
  // (for now we pass all modeFilters through — Team Mexicano is a display sub-filter
  // applied at the event level via isTeamMexicano field if available)
  const visibleEvents = applyEventSlotView(events, filter, sortOption, effectiveModeFilters).filter((event) => {
    // Sub-filter: if Mexicano is active but Team Mexicano checkbox is off, hide team events
    if (event.eventType === "Mexicano" && !showTeamMexicano) {
      if (event.isTeamMexicano) return false
    }
    return true
  })

  const emptyState =
    effectiveModeFilters.length === 0
      ? "Select at least one mode."
      : getEventFilterEmptyState(filter)

  // Active filter count badge
  const activeFilterCount = [
    filter !== "all",
    sortOption !== "default",
    modeFilters.length < MODE_ORDER.length || !showTeamMexicano,
  ].filter(Boolean).length

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
          <EventFilterDropdown
            filter={filter}
            sortOption={sortOption}
            modeFilters={modeFilters}
            showTeamMexicano={showTeamMexicano}
            activeFilterCount={activeFilterCount}
            onFilterChange={setFilter}
            onSortChange={setSortOption}
            onModeFilterToggle={toggleModeFilter}
            onTeamMexicanoChange={setShowTeamMexicano}
          />
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

// ── EventFilterDropdown ────────────────────────────────────────────────────────

interface EventFilterDropdownProps {
  filter: EventSlotFilter
  sortOption: EventSortOption
  modeFilters: EventType[]
  showTeamMexicano: boolean
  activeFilterCount: number
  onFilterChange: (f: EventSlotFilter) => void
  onSortChange: (s: EventSortOption) => void
  onModeFilterToggle: (mode: EventType) => void
  onTeamMexicanoChange: (show: boolean) => void
}

function EventFilterDropdown({
  filter,
  sortOption,
  modeFilters,
  showTeamMexicano,
  activeFilterCount,
  onFilterChange,
  onSortChange,
  onModeFilterToggle,
  onTeamMexicanoChange,
}: EventFilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const [typesExpanded, setTypesExpanded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [panelPos, setPanelPos] = useState<{ top: number; right: number } | null>(null)

  // Position the fixed panel below-right of the trigger button
  useLayoutEffect(() => {
    if (!open || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    setPanelPos({
      top: rect.bottom + 6,
      right: window.innerWidth - rect.right,
    })
  }, [open])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [open])

  const toggleSort = (option: "mode" | "date") => {
    onSortChange(sortOption === option ? "default" : option)
  }

  const pillLabel = activeFilterCount > 0 ? `Filters · ${activeFilterCount}` : "Filters"

  return (
    <div className="event-filter-pill-wrap" ref={containerRef}>
      <button
        type="button"
        className={`event-filter-pill${open ? " event-filter-pill--open" : ""}${activeFilterCount > 0 ? " event-filter-pill--active" : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{pillLabel}</span>
        <span className="event-filter-pill__chevron">{CHEVRON_DOWN}</span>
      </button>

      {open && panelPos !== null && (
        <div
          className="event-filter-panel"
          role="dialog"
          aria-label="Event filters"
          style={{ position: "fixed", top: panelPos.top, right: panelPos.right }}
        >
          {/* ── Event status ─────────────────────────────── */}
          <div className="event-filter-panel__section-label">Event status</div>
          <div role="radiogroup" aria-label="Filter events by lifecycle">
            {(Object.keys(FILTER_LABELS) as EventSlotFilter[]).map((option) => (
              <label key={option} className="event-filter-panel__item event-filter-panel__item--radio">
                <input
                  type="radio"
                  name="event-status"
                  checked={filter === option}
                  onChange={() => onFilterChange(option)}
                  className="event-filter-panel__radio"
                />
                <span>{FILTER_LABELS[option]}</span>
              </label>
            ))}
          </div>

          <div className="event-filter-panel__divider" />

          {/* ── Sort by ───────────────────────────────────── */}
          <div className="event-filter-panel__section-label">Sort by</div>
          <label className="event-filter-panel__item">
            <input
              type="checkbox"
              checked={sortOption === "date"}
              onChange={() => toggleSort("date")}
              className="event-filter-panel__checkbox"
            />
            <span>Date</span>
          </label>
          <label className="event-filter-panel__item">
            <input
              type="checkbox"
              checked={sortOption === "mode"}
              onChange={() => toggleSort("mode")}
              className="event-filter-panel__checkbox"
            />
            <span>Mode</span>
          </label>

          <div className="event-filter-panel__divider" />

          {/* ── Event types (collapsible) ─────────────────── */}
          <button
            type="button"
            className="event-filter-panel__types-header"
            aria-expanded={typesExpanded}
            onClick={() => setTypesExpanded((e) => !e)}
          >
            <span className="event-filter-panel__section-label event-filter-panel__section-label--inline">
              Event types
            </span>
            <span className="event-filter-panel__types-chevron">
              {typesExpanded ? CHEVRON_DOWN : CHEVRON_RIGHT}
            </span>
          </button>

          {typesExpanded && (
            <div className="event-filter-panel__types-body">
              {ALL_EVENT_TYPES.map(({ key, label }) => {
                if (key === "MexicanoTeam") {
                  return (
                    <label key={key} className="event-filter-panel__item event-filter-panel__item--indented">
                      <input
                        type="checkbox"
                        checked={showTeamMexicano}
                        onChange={(e) => onTeamMexicanoChange(e.target.checked)}
                        className="event-filter-panel__checkbox"
                      />
                      <span>{label}</span>
                    </label>
                  )
                }
                const mode = key as EventType
                return (
                  <label
                    key={key}
                    className={`event-filter-panel__item${mode === "Mexicano" ? "" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={modeFilters.includes(mode)}
                      onChange={() => onModeFilterToggle(mode)}
                      className="event-filter-panel__checkbox"
                    />
                    <span>{label}</span>
                  </label>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
