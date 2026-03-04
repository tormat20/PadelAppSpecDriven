import { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import Stepper from "../components/stepper/Stepper"
import { CourtSelector } from "../components/courts/CourtSelector"
import { ModeAccordion } from "../components/mode/ModeAccordion"
import { PlayerSelector } from "../components/players/PlayerSelector"
import { withInteractiveSurface } from "../features/interaction/surfaceClass"
import { clearDraftPlayers, loadDraftPlayers, saveDraftPlayers } from "../features/create-event/draftPlayers"
import {
  getRecommendedEventName,
  getRequiredPlayerCount,
  getTodayDateISO,
  isCreateEventDisabled,
  isPastSchedule,
  isStrictCreateEventDisabled,
} from "../features/create-event/validation"
import { getRosterHints } from "../features/create-event/rosterHints"
import { createEvent, getEvent, listEvents, searchPlayers, startEvent, updateEvent } from "../lib/api"
import { getEventModeLabel } from "../lib/eventMode"
import type { EventRecord, EventType } from "../lib/types"

// ─── Step-start helper (T009, T022) ────────────────────────────────────────
// Derives which step to open at when editing an existing event.
//   undefined / null / "planned"  → Step 0 (Setup)
//   "planned"                     → Step 1 (Roster) — slot is saved, roster not yet complete
//   "ready"                       → Step 2 (Confirm) — slot + roster are both done
// "ongoing" / "finished" are redirected before this is called.
export function getStartStep(lifecycleStatus: EventRecord["lifecycleStatus"]): 0 | 1 | 2 {
  if (lifecycleStatus === "ready") return 2
  if (lifecycleStatus === "planned") return 1
  return 0
}

const STEPPER_STEPS = [{ label: "Setup" }, { label: "Roster" }, { label: "Confirm" }]

export default function CreateEventPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const editEventId = searchParams.get("editEventId") ?? ""
  const isEditMode = editEventId.length > 0

  // ─── Stepper navigation state (T009) ──────────────────────────────────────
  const [currentStep, setCurrentStep] = useState<0 | 1 | 2>(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [savedEventId, setSavedEventId] = useState("")
  const [step1Error, setStep1Error] = useState("")
  const [step2Error, setStep2Error] = useState("")

  // ─── Form field state ──────────────────────────────────────────────────────
  const [eventName, setEventName] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [eventTime24h, setEventTime24h] = useState("")
  const [eventType, setEventType] = useState<EventType>("WinnersCourt")
  const [courts, setCourts] = useState<number[]>([])
  const [assignedPlayers, setAssignedPlayers] = useState(loadDraftPlayers)
  const [events, setEvents] = useState<EventRecord[]>([])
  const [expectedVersion, setExpectedVersion] = useState(1)

  const playerIds = useMemo(() => assignedPlayers.map((player) => player.id), [assignedPlayers])
  const requiredPlayers = getRequiredPlayerCount(courts)

  // ─── Side effects ──────────────────────────────────────────────────────────

  useEffect(() => {
    saveDraftPlayers(assignedPlayers)
  }, [assignedPlayers])

  useEffect(() => {
    listEvents().then(setEvents).catch(() => setEvents([]))
  }, [])

  // Edit mode: load event, derive start step (T022)
  // Back-navigation preserves all useState values — handlePrevious() does not
  // reset any form state, so navigating back from Roster always shows the
  // previously-entered Setup values. (T026)
  useEffect(() => {
    if (!isEditMode) return

    let mounted = true
    getEvent(editEventId)
      .then(async (event) => {
        if (!mounted) return

        // Redirect if event is already running or finished (T022)
        if (event.lifecycleStatus === "ongoing" || event.lifecycleStatus === "finished") {
          navigate(`/events/${editEventId}/preview`, { replace: true })
          return
        }

        setEventName(event.eventName)
        setEventDate(event.eventDate)
        setEventTime24h(event.eventTime24h ?? "")
        setEventType(event.eventType)
        setCourts(event.selectedCourts)
        setExpectedVersion(event.version)
        setSavedEventId(editEventId)
        setCurrentStep(getStartStep(event.lifecycleStatus))

        const catalog = await searchPlayers("")
        if (!mounted) return
        const players = event.playerIds
          .map((playerId) => catalog.find((entry) => entry.id === playerId))
          .filter((entry): entry is { id: string; displayName: string } => Boolean(entry))
        setAssignedPlayers(players)
      })
      .catch(() => undefined)

    return () => {
      mounted = false
    }
  }, [editEventId, isEditMode, navigate])

  // Auto-name for new events
  useEffect(() => {
    if (isEditMode) return
    const recommendedName = getRecommendedEventName({
      eventDate,
      modeLabel: getEventModeLabel(eventType),
      eventTime24h,
    })
    if (recommendedName) {
      setEventName(recommendedName)
    }
  }, [eventDate, eventType, eventTime24h, isEditMode])

  // ─── Derived warnings ──────────────────────────────────────────────────────

  const duplicateWarning = useMemo(() => {
    const normalizedName = eventName.trim().toLowerCase()
    if (!normalizedName || !eventDate || !eventTime24h) return false
    return events.some(
      (event) =>
        event.eventName.trim().toLowerCase() === normalizedName &&
        event.eventDate === eventDate &&
        (event.eventTime24h ?? "") === eventTime24h,
    )
  }, [eventName, eventDate, eventTime24h, events])

  const pastScheduleWarning = isPastSchedule({ eventDate, eventTime24h })

  // ─── Navigation handlers (T010, T011) ────────────────────────────────────

  const handleNext = async () => {
    if (currentStep === 0) {
      setStep1Error("")
      try {
        let event: EventRecord
        if (isEditMode || savedEventId) {
          // Update existing slot (edit mode OR already created a slot in this session)
          const idToUpdate = savedEventId || editEventId
          event = await updateEvent(idToUpdate, {
            expectedVersion,
            eventName,
            eventType,
            eventDate,
            eventTime24h,
            selectedCourts: [],
            playerIds: [],
          })
        } else {
          // Create new slot
          event = await createEvent({
            eventName,
            eventType,
            eventDate,
            eventTime24h,
            createAction: "create_event_slot",
            selectedCourts: [],
            playerIds: [],
          })
        }
        setSavedEventId(event.id)
        setExpectedVersion(event.version)
        setDirection(1)
        setCurrentStep(1)
      } catch (err) {
        setStep1Error(err instanceof Error ? err.message : "Failed to save setup. Please try again.")
      }
      return
    }

    if (currentStep === 1) {
      setStep2Error("")
      try {
        const event = await updateEvent(savedEventId, {
          expectedVersion,
          selectedCourts: courts,
          playerIds,
        })
        setExpectedVersion(event.version)
        setDirection(1)
        setCurrentStep(2)
      } catch (err) {
        setStep2Error(err instanceof Error ? err.message : "Failed to save roster. Please try again.")
      }
    }
    // Step 2 has no "Next" — it has "Start Event"
  }

  // Back-navigation (T011, T026): sets direction and decrements step.
  // No state is reset — form values remain intact for re-entry. (T026)
  const handlePrevious = () => {
    setDirection(-1)
    setCurrentStep((prev) => (prev > 0 ? ((prev - 1) as 0 | 1 | 2) : prev))
  }

  // Clicking a completed step in the indicator bar (T011)
  const handleStepClick = (index: number) => {
    setDirection(-1)
    setCurrentStep(index as 0 | 1 | 2)
  }

  // ─── Start Event (Step 2 action) ─────────────────────────────────────────

  const handleStartEvent = async () => {
    const idToStart = savedEventId || editEventId
    if (!idToStart) {
      setStep2Error("Event ID is missing. Please go back and try again.")
      return
    }
    try {
      await startEvent(idToStart)
      clearDraftPlayers()
      navigate(`/events/${idToStart}/run`)
    } catch (err) {
      // Surface as step2Error (re-used for Confirm step API errors)
      setStep2Error(err instanceof Error ? err.message : "Failed to start event. Please try again.")
    }
  }

  // ─── Disabled conditions ──────────────────────────────────────────────────

  const step0NextDisabled = isCreateEventDisabled({ eventName, eventDate, eventTime24h, courts: [], playerIds: [] })

  // Step 1 Next is always enabled — roster save is always allowed (planned or ready)
  const step1NextDisabled = false

  const step2StartDisabled = isStrictCreateEventDisabled({ eventName, eventDate, eventTime24h, courts, playerIds })

  const missingForStart = (() => {
    if (!step2StartDisabled) return ""
    if (courts.length === 0) return "Add players and courts to start event"
    const need = requiredPlayers - assignedPlayers.length
    if (need > 0) return `${need} more player${need === 1 ? "" : "s"} needed to start`
    return "Add players and courts to start event"
  })()

  // ─── Rendered step panels ─────────────────────────────────────────────────

  // Step 0 — Setup
  // Mode change on Step 0 is immediately reflected in Step 1 (Roster) because
  // getRequiredPlayerCount(courts) is derived from state on every render. (T027)
  const setupPanel = (
    <div className="panel form-grid">
      <p className="section-label">Choose mode</p>
      <ModeAccordion selected={eventType} onSelect={setEventType} />
      <p className="section-label">Choose date and time</p>
      <button
        className="today-date-link"
        type="button"
        onClick={() => setEventDate(getTodayDateISO())}
      >
        Today's date
      </button>
      <div className="event-schedule-row" aria-label="Event schedule">
        <input className="input" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
        <input
          className="input"
          type="time"
          step={60}
          value={eventTime24h}
          onChange={(e) => setEventTime24h(e.target.value)}
          aria-label="Event time"
        />
      </div>
      <input
        className="input"
        placeholder="Event name"
        value={eventName}
        onChange={(e) => setEventName(e.target.value)}
      />
      {(pastScheduleWarning || duplicateWarning) && (
        <p className="warning-text" aria-live="polite">
          {pastScheduleWarning ? "This event is scheduled in the past. You can still save it." : ""}
          {pastScheduleWarning && duplicateWarning ? " " : ""}
          {duplicateWarning ? "A similar slot already exists for the same name, date, and time." : ""}
        </p>
      )}
      <button
        className={withInteractiveSurface("button-secondary")}
        type="button"
        onClick={() => navigate("/")}
        aria-label="Main menu"
      >
        Main Menu
      </button>
      <button
        className={withInteractiveSurface("button")}
        type="button"
        onClick={handleNext}
        disabled={step0NextDisabled}
      >
        Next
      </button>
      {step1Error && (
        <p className="warning-text" aria-live="polite">
          {step1Error}
        </p>
      )}
    </div>
  )

  // Step 1 — Roster
  const rosterHints = getRosterHints(courts, assignedPlayers)
  const rosterPanel = (
    <div className="panel form-grid">
      <CourtSelector selectedCourts={courts} onChange={setCourts} />
      {rosterHints.showChooseCourts && (
        <p className="warning-text" aria-live="polite">Choose courts</p>
      )}
      <p className="muted">
        {assignedPlayers.length} / {requiredPlayers} players assigned
        {courts.length > 0 ? ` (${courts.length} court${courts.length === 1 ? "" : "s"} × 4 required)` : ""}
      </p>
      <PlayerSelector
        assignedPlayers={assignedPlayers}
        totalPlayersRequired={requiredPlayers}
        onAssignedPlayersChange={setAssignedPlayers}
      />
      {rosterHints.showAssignPlayers && (
        <p className="warning-text" aria-live="polite">Assign players</p>
      )}
      <div className="form-grid">
        <button
          className={withInteractiveSurface("button-secondary")}
          type="button"
          onClick={() => navigate("/")}
          aria-label="Main menu"
        >
          Main Menu
        </button>
        <button
          className={withInteractiveSurface("button")}
          type="button"
          onClick={handleNext}
          disabled={step1NextDisabled}
        >
          Next
        </button>
        <button
          className={withInteractiveSurface("button-secondary")}
          type="button"
          onClick={handlePrevious}
        >
          Previous
        </button>
      </div>
      {step2Error && (
        <p className="warning-text" aria-live="polite">
          {step2Error}
        </p>
      )}
    </div>
  )

  // Step 2 — Confirm
  const confirmPanel = (
    <div className="panel form-grid">
      <ul className="summary-list" aria-label="Event summary">
        <li className="summary-row">
          <span className="muted">Event</span>
          <span>{eventName || "—"}</span>
        </li>
        <li className="summary-row">
          <span className="muted">Mode</span>
          <span>{getEventModeLabel(eventType)}</span>
        </li>
        <li className="summary-row">
          <span className="muted">Date</span>
          <span>{eventDate || "—"}</span>
        </li>
        <li className="summary-row">
          <span className="muted">Time</span>
          <span>{eventTime24h || "—"}</span>
        </li>
        <li className="summary-row">
          <span className="muted">Courts</span>
          <span>{courts.length}</span>
        </li>
        <li className="summary-row">
          <span className="muted">Players</span>
          <span>{assignedPlayers.length}</span>
        </li>
      </ul>
      {step2StartDisabled && missingForStart && (
        <p className="warning-text" aria-live="polite">
          {missingForStart}
        </p>
      )}
      <div className="form-grid">
        <button
          className={withInteractiveSurface("button-secondary")}
          type="button"
          onClick={() => navigate("/")}
          aria-label="Main menu"
        >
          Main Menu
        </button>
        <button
          className={withInteractiveSurface("button")}
          type="button"
          onClick={handleStartEvent}
          disabled={step2StartDisabled}
        >
          Start Event
        </button>
        <button
          className={withInteractiveSurface("button-secondary")}
          type="button"
          onClick={handlePrevious}
        >
          Previous
        </button>
      </div>
      {step2Error && (
        <p className="warning-text" aria-live="polite">
          {step2Error}
        </p>
      )}
    </div>
  )

  // ─── Page render (T015) ───────────────────────────────────────────────────

  return (
    <section className="page-shell" aria-label="Create event page">
      <header className="page-header panel">
        <div>
          <h2 className="page-title">{isEditMode ? "Edit Event" : "Create Event"}</h2>
          <p className="page-subtitle">Pick mode, date, courts, and players before generating pairings.</p>
        </div>
      </header>

      <Stepper
        steps={STEPPER_STEPS}
        currentStep={currentStep}
        direction={direction}
        onStepClick={handleStepClick}
      >
        {currentStep === 0 && setupPanel}
        {currentStep === 1 && rosterPanel}
        {currentStep === 2 && confirmPanel}
      </Stepper>
    </section>
  )
}
