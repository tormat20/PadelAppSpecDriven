import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import Stepper from "../components/stepper/Stepper"
import { CourtSelector } from "../components/courts/CourtSelector"
import { ModeAccordion } from "../components/mode/ModeAccordion"
import { PlayerSelector } from "../components/players/PlayerSelector"
import { useToast } from "../components/toast/ToastProvider"
import { withInteractiveSurface } from "../features/interaction/surfaceClass"
import { clearDraftPlayers, loadDraftPlayers, saveDraftPlayers } from "../features/create-event/draftPlayers"
import {
  buildEventName,
  getRequiredPlayerCount,
  getTodayDateISO,
  isCreateEventDisabled,
  isPastSchedule,
  isStrictCreateEventDisabled,
} from "../features/create-event/validation"
import { getRosterHints } from "../features/create-event/rosterHints"
import { createEvent, getEvent, listEvents, searchPlayers, setEventTeams, startEvent, updateEvent } from "../lib/api"
import { getEventModeLabel } from "../lib/eventMode"
import type { EventRecord, EventType } from "../lib/types"

// ─── Step-start helper (T009, T022) ────────────────────────────────────────
// Derives which step to open at when editing an existing event.
//   undefined / null / "planned"  → Step 0 (Setup)
//   "planned"                     → Step 1 (Roster) — slot is saved, roster not yet complete
//   "ready"                       → Step 2 (Confirm) for normal, Step 3 (Confirm) for Team Mexicano
// "ongoing" / "finished" are redirected before this is called.
export function getStartStep(lifecycleStatus: EventRecord["lifecycleStatus"]): 0 | 1 | 2 {
  if (lifecycleStatus === "ready") return 2
  if (lifecycleStatus === "planned") return 1
  return 0
}

const STEPPER_STEPS_BASE = [{ label: "Setup" }, { label: "Roster" }, { label: "Confirm" }]
const STEPPER_STEPS_TEAM_MEX = [{ label: "Setup" }, { label: "Roster" }, { label: "Teams" }, { label: "Confirm" }]

export default function CreateEventPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const editEventId = searchParams.get("editEventId") ?? ""
  const isEditMode = editEventId.length > 0

  // ─── Stepper navigation state (T009) ──────────────────────────────────────
  const [currentStep, setCurrentStep] = useState<0 | 1 | 2 | 3>(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [savedEventId, setSavedEventId] = useState("")
  const [step1Error, setStep1Error] = useState("")
  const [step2Error, setStep2Error] = useState("")
  const [step3Error, setStep3Error] = useState("")

  // ─── Form field state ──────────────────────────────────────────────────────
  const [eventName, setEventName] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [eventTime24h, setEventTime24h] = useState("")
  const [eventDurationMinutes, setEventDurationMinutes] = useState<60 | 90 | 120>(90)
  const [eventType, setEventType] = useState<EventType>("WinnersCourt")
  const [isTeamMexicano, setIsTeamMexicano] = useState(false)
  const [courts, setCourts] = useState<number[]>([])
  const [assignedPlayers, setAssignedPlayers] = useState(loadDraftPlayers)
  const [events, setEvents] = useState<EventRecord[]>([])
  const [expectedVersion, setExpectedVersion] = useState(1)

  // ─── Lifecycle status (needed for edit-mode auto-name guard T013 and T018) ─
  const [lifecycleStatus, setLifecycleStatus] = useState<EventRecord["lifecycleStatus"] | null>(null)

  // ─── T010: manuallyEditedName ref ─────────────────────────────────────────
  // Tracks whether the user has manually edited the event name in this session.
  // MUST be useRef, NOT useState, to avoid triggering re-renders.
  const manuallyEditedName = useRef<boolean>(false)

  // ─── T014: slot-saving state ──────────────────────────────────────────────
  const [slotSaving, setSlotSaving] = useState(false)
  const [slotError, setSlotError] = useState("")
  const [step1Saving, setStep1Saving] = useState(false)

  // ─── Team assignment state (Assign Teams step) ────────────────────────────
  // teamPairs: array of [player1Id, player2Id] pairs
  const [teamPairs, setTeamPairs] = useState<[string, string][]>([])
  const [teamsError, setTeamsError] = useState("")
  const [pendingPick, setPendingPick] = useState<string | null>(null)

  const playerIds = useMemo(() => assignedPlayers.map((player) => player.id), [assignedPlayers])
  const requiredPlayers = getRequiredPlayerCount(courts)

  // Whether Team Mexicano is effectively active (only relevant for Mexicano mode)
  const teamMexicanoActive = eventType === "Mexicano" && isTeamMexicano

  // Stepper steps depend on whether Team Mexicano is active
  const stepperSteps = teamMexicanoActive ? STEPPER_STEPS_TEAM_MEX : STEPPER_STEPS_BASE

  // ─── Side effects ──────────────────────────────────────────────────────────

  useEffect(() => {
    saveDraftPlayers(assignedPlayers)
  }, [assignedPlayers])

  useEffect(() => {
    listEvents().then(setEvents).catch(() => setEvents([]))
  }, [])

  // T008: Strip stale draft entries (no displayName) on mount.
  // Runs once after the initial loadDraftPlayers() seeds assignedPlayers.
  useEffect(() => {
    const filtered = assignedPlayers.filter(
      (p) => p.displayName && p.displayName.trim().length > 0,
    )
    if (filtered.length !== assignedPlayers.length) {
      saveDraftPlayers(filtered)
      setAssignedPlayers(filtered)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally empty deps — run once on mount only

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

        setLifecycleStatus(event.lifecycleStatus)
        setEventName(event.eventName)
        setEventDate(event.eventDate)
        setEventTime24h(event.eventTime24h ?? "")
        setEventDurationMinutes((event.eventDurationMinutes as 60 | 90 | 120 | undefined) ?? 90)
        setEventType(event.eventType)
        setIsTeamMexicano(event.isTeamMexicano ?? false)
        setCourts(event.selectedCourts)
        setExpectedVersion(event.version)
        setSavedEventId(editEventId)
        setCurrentStep(getStartStep(event.lifecycleStatus))

        const catalog = await searchPlayers("")
        if (!mounted) return
        // T009: displayName always comes from catalog; skip any player not found.
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

  // T013 / T012: Single merged auto-name effect.
  // Rebuilds the event name from all 4 slots whenever any relevant input changes.
  // Guards: manual edit, or ongoing/finished event (do not overwrite persisted name).
  // Always sets a non-empty name (even just "Mexicano") — no empty-string guard.
  useEffect(() => {
    if (manuallyEditedName.current === true) return
    if (lifecycleStatus === "ongoing" || lifecycleStatus === "finished") return
    const name = buildEventName({ eventDate, eventType, isTeamMexicano, eventTime24h })
    setEventName(name)
  }, [eventDate, eventType, isTeamMexicano, eventTime24h, lifecycleStatus])

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
      setStep1Saving(true)
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
            eventDurationMinutes,
            selectedCourts: [],
            playerIds: [],
            isTeamMexicano: teamMexicanoActive,
          })
        } else {
          // Create new slot
          event = await createEvent({
            eventName,
            eventType,
            eventDate,
            eventTime24h,
            eventDurationMinutes,
            createAction: "create_event_slot",
            selectedCourts: [],
            playerIds: [],
            isTeamMexicano: teamMexicanoActive,
          })
        }
        setSavedEventId(event.id)
        setExpectedVersion(event.version)
        toast.success("Event slot created")
        setDirection(1)
        setCurrentStep(1)
      } catch (err) {
        setStep1Error(err instanceof Error ? err.message : "Failed to save setup. Please try again.")
      } finally {
        setStep1Saving(false)
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
          isTeamMexicano: teamMexicanoActive,
        })
        setExpectedVersion(event.version)
        // T021: toast when roster save results in a ready event
        if (event.lifecycleStatus === "ready" || event.setupStatus === "ready") {
          toast.success("Event is ready to start")
        }
        setDirection(1)
        // When Team Mexicano is active, go to Assign Teams step (2); otherwise go to Confirm (2)
        setCurrentStep(teamMexicanoActive ? 2 : 2)
      } catch (err) {
        setStep2Error(err instanceof Error ? err.message : "Failed to save roster. Please try again.")
      }
      return
    }

    if (currentStep === 2 && teamMexicanoActive) {
      // Assign Teams step — save team pairs
      setTeamsError("")
      if (teamPairs.length === 0 && assignedPlayers.length > 0) {
        setTeamsError("Assign all players into teams before continuing.")
        return
      }
      try {
        await setEventTeams(
          savedEventId,
          teamPairs.map(([player1Id, player2Id]) => ({ player1Id, player2Id })),
        )
        setDirection(1)
        setCurrentStep(3)
      } catch (err) {
        setTeamsError(err instanceof Error ? err.message : "Failed to save teams. Please try again.")
      }
    }
    // Step 2 (non-Team Mexicano) and Step 3 have no "Next" — they have "Start Event"
  }

  // Back-navigation (T011, T026): sets direction and decrements step.
  // No state is reset — form values remain intact for re-entry. (T026)
  const handlePrevious = () => {
    setDirection(-1)
    setCurrentStep((prev) => (prev > 0 ? ((prev - 1) as 0 | 1 | 2 | 3) : prev))
  }

  // Clicking a completed step in the indicator bar (T011)
  const handleStepClick = (index: number) => {
    setDirection(-1)
    setCurrentStep(index as 0 | 1 | 2 | 3)
  }

  // ─── T015: Create Event Slot (save Setup and navigate home) ──────────────
  const handleCreateEventSlot = async () => {
    setSlotError("")
    setSlotSaving(true)
    try {
      let event: EventRecord
      if (isEditMode || savedEventId) {
        const idToUpdate = savedEventId || editEventId
        event = await updateEvent(idToUpdate, {
          expectedVersion,
          eventName,
          eventType,
          eventDate,
          eventTime24h,
          eventDurationMinutes,
          selectedCourts: [],
          playerIds: [],
          isTeamMexicano: teamMexicanoActive,
        })
      } else {
        event = await createEvent({
          eventName,
          eventType,
          eventDate,
          eventTime24h,
          eventDurationMinutes,
          createAction: "create_event_slot",
          selectedCourts: [],
          playerIds: [],
          isTeamMexicano: teamMexicanoActive,
        })
      }
      // Update local state so it is consistent if the user somehow stays
      setSavedEventId(event.id)
      setExpectedVersion(event.version)
      toast.success("Event slot created")
      navigate("/")
    } catch (err) {
      setSlotError(err instanceof Error ? err.message : "Failed to create event slot. Please try again.")
      setSlotSaving(false)
    }
  }

  // ─── Start Event (Confirm step action) ──────────────────────────────────
  // Opens the run page in a new window (same as PreviewEvent).
  // Falls back to same-tab navigation if the popup is blocked.
  // T007: If the event is already ongoing (corrupt-state), skip startEvent() call.

  const handleStartEvent = async () => {
    const idToStart = savedEventId || editEventId
    if (!idToStart) {
      setStep2Error("Event ID is missing. Please go back and try again.")
      return
    }
    try {
      // T007: Pre-check — if event is already ongoing, just open the run page.
      const currentEvent = await getEvent(idToStart)
      if (currentEvent.lifecycleStatus !== "ongoing") {
        await startEvent(idToStart)
      }
      clearDraftPlayers()
      // T020: toast on event started
      toast.success("Event started")
      const win = window.open(`/events/${idToStart}/run`, "_blank")
      if (win === null) {
        // Popup blocked — fall back to same-tab navigation
        navigate(`/events/${idToStart}/run`)
      } else {
        // New tab opened — return the current tab to home
        navigate("/")
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start event. Please try again."
      // Surface on the correct error slot: step3Error for Team Mexicano, step2Error otherwise
      if (teamMexicanoActive) {
        setStep3Error(msg)
      } else {
        setStep2Error(msg)
      }
    }
  }

  // ─── Disabled conditions ──────────────────────────────────────────────────

  const step0NextDisabled = isCreateEventDisabled({ eventName, eventDate, eventTime24h, courts: [], playerIds: [] })

  // Step 1 Next is always enabled — roster save is always allowed (planned or ready)
  const step1NextDisabled = false

  // Step 2 (Assign Teams) Next: disabled until all players are paired (even count required)
  const step2NextDisabled = teamMexicanoActive && (assignedPlayers.length === 0 || teamPairs.length * 2 !== assignedPlayers.length)

  const step2StartDisabled = isStrictCreateEventDisabled({ eventName, eventDate, eventTime24h, courts, playerIds, eventType })

  const missingForStart = (() => {
    if (!step2StartDisabled) return ""
    if (eventType === "Americano" && courts.length < 2) return "Americano requires 2 or more courts"
    if (courts.length === 0) return "Add players and courts to start event"
    const need = requiredPlayers - assignedPlayers.length
    if (need > 0) return `${need} more player${need === 1 ? "" : "s"} needed to start`
    return "Add players and courts to start event"
  })()

  // ─── T018: Read-only summary for ongoing/finished ─────────────────────────
  // The edit-mode useEffect already redirects ongoing/finished to /preview, but
  // during the async fetch there can be a brief render window. We guard here too.
  if (
    isEditMode &&
    (lifecycleStatus === "ongoing" || lifecycleStatus === "finished")
  ) {
    return (
      <section className="page-shell" aria-label="Event summary (read-only)">
        <header className="page-header panel">
          <div>
            <h2 className="page-title">{eventName || "Event"}</h2>
            <p className="page-subtitle">
              {lifecycleStatus === "ongoing" ? "This event is currently running." : "This event has finished."}
            </p>
          </div>
        </header>
        <div className="panel form-grid event-readonly-summary">
          <ul className="summary-list">
            <li className="summary-row"><span className="muted">Mode</span><span>{getEventModeLabel(eventType)}</span></li>
            <li className="summary-row"><span className="muted">Date</span><span>{eventDate || "—"}</span></li>
            <li className="summary-row"><span className="muted">Time</span><span>{eventTime24h || "—"}</span></li>
            <li className="summary-row"><span className="muted">Duration</span><span>{eventDurationMinutes} min</span></li>
            <li className="summary-row"><span className="muted">Players</span><span>{assignedPlayers.length}</span></li>
          </ul>
          {lifecycleStatus === "ongoing" ? (
            <button
              className={withInteractiveSurface("button")}
              type="button"
              onClick={() => {
                const win = window.open(`/events/${savedEventId || editEventId}/run`, "_blank")
                if (win === null) navigate(`/events/${savedEventId || editEventId}/run`)
              }}
            >
              Open Running Event
            </button>
          ) : (
            <button
              className={withInteractiveSurface("button")}
              type="button"
              onClick={() => navigate(`/events/${savedEventId || editEventId}/summary`)}
            >
              View Summary
            </button>
          )}
        </div>
      </section>
    )
  }

  // ─── Rendered step panels ─────────────────────────────────────────────────

  // Step 0 — Setup
  // Mode change on Step 0 is immediately reflected in Step 1 (Roster) because
  // getRequiredPlayerCount(courts) is derived from state on every render. (T027)
  const setupPanel = (
    <div className="panel form-grid">
      <p className="section-label">Choose mode</p>
      <ModeAccordion
        selected={eventType}
        isTeamMexicano={isTeamMexicano}
        onTeamMexicanoChange={setIsTeamMexicano}
        onSelect={(type) => {
          setEventType(type)
          // Clear Team Mexicano when switching away from Mexicano
          if (type !== "Mexicano") setIsTeamMexicano(false)
        }}
      />
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
        <div className="event-duration-control" aria-label="Event duration">
          <label htmlFor="event-duration-range" className="event-duration-label">Duration: {eventDurationMinutes} min</label>
          <input
            id="event-duration-range"
            className="event-duration-slider"
            type="range"
            min={60}
            max={120}
            step={30}
            value={eventDurationMinutes}
            onChange={(e) => setEventDurationMinutes(Number(e.target.value) as 60 | 90 | 120)}
            aria-label="Event duration in minutes"
          />
          <div className="event-duration-marks" aria-hidden="true">
            <span>60</span>
            <span>90</span>
            <span>120</span>
          </div>
        </div>
      </div>
      {/* T011: Set manuallyEditedName on every keystroke in the name field */}
      <input
        className="input"
        placeholder="Event name"
        value={eventName}
        onChange={(e) => {
          manuallyEditedName.current = true
          setEventName(e.target.value)
        }}
      />
      {(pastScheduleWarning || duplicateWarning) && (
        <p className="warning-text" aria-live="polite">
          {pastScheduleWarning ? "This event is scheduled in the past. You can still save it." : ""}
          {pastScheduleWarning && duplicateWarning ? " " : ""}
          {duplicateWarning ? "A similar slot already exists for the same name, date, and time." : ""}
        </p>
      )}
      <button
        className={withInteractiveSurface("button")}
        type="button"
        onClick={handleNext}
        disabled={step0NextDisabled || step1Saving}
      >
        Next
      </button>
      {/* T016: Create Event Slot button */}
      <button
        className={withInteractiveSurface("button-secondary")}
        type="button"
        onClick={handleCreateEventSlot}
        disabled={slotSaving || step1Saving || step0NextDisabled}
      >
        Create Event Slot
      </button>
      {slotError && (
        <p className="warning-text" aria-live="polite">
          {slotError}
        </p>
      )}
      <hr className="stepper-divider" />
      <button
        className={withInteractiveSurface("button-secondary")}
        type="button"
        onClick={() => navigate("/")}
        aria-label="Main menu"
      >
        Main Menu
      </button>
      {step1Error && (
        <p className="warning-text" aria-live="polite">
          {step1Error}
        </p>
      )}
    </div>
  )

  // Step 1 — Roster
  const rosterHints = getRosterHints(courts, assignedPlayers, eventType)
  const rosterPanel = (
    <div className="panel form-grid">
      <CourtSelector selectedCourts={courts} onChange={setCourts} />
      {rosterHints.showChooseCourts && (
        <p className="warning-text" aria-live="polite">Choose courts</p>
      )}
      {rosterHints.showAmericanoMinCourts && (
        <p className="warning-text" aria-live="polite">Americano requires 2 or more courts (minimum 8 players)</p>
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
          className={withInteractiveSurface("button")}
          type="button"
          onClick={handleNext}
          disabled={step1NextDisabled}
        >
          Next
        </button>
        <hr className="stepper-divider" />
        <button
          className={withInteractiveSurface("button-secondary")}
          type="button"
          onClick={() => navigate("/")}
          aria-label="Main menu"
        >
          Main Menu
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

  // Step 2 — Assign Teams (Team Mexicano only)
  // Players are displayed as a list; user clicks pairs to group them into fixed teams.
  const pairedPlayerIds = new Set(teamPairs.flat())
  const unpairedPlayers = assignedPlayers.filter((p) => !pairedPlayerIds.has(p.id))
  const playerById = Object.fromEntries(assignedPlayers.map((p) => [p.id, p.displayName]))

  const handleTeamPlayerClick = (playerId: string) => {
    if (pendingPick === null) {
      setPendingPick(playerId)
    } else if (pendingPick === playerId) {
      setPendingPick(null)
    } else {
      setTeamPairs((prev) => [...prev, [pendingPick, playerId]])
      setPendingPick(null)
      setTeamsError("")
    }
  }

  const removeTeamPair = (index: number) => {
    setTeamPairs((prev) => prev.filter((_, i) => i !== index))
  }

  const assignTeamsPanel = (
    <div className="panel form-grid">
      <p className="section-label">Assign fixed teams</p>
      <p className="muted">Click two players to pair them as a team. All players must be paired.</p>

      {teamPairs.length > 0 && (
        <ul className="summary-list" aria-label="Assigned teams">
          {teamPairs.map(([p1, p2], idx) => (
            <li key={idx} className="summary-row">
              <span>{playerById[p1] ?? p1} + {playerById[p2] ?? p2}</span>
              <button
                type="button"
                className={withInteractiveSurface("button-secondary")}
                style={{ padding: "0.25rem 0.6rem", minHeight: "unset", fontSize: "0.8rem" }}
                onClick={() => removeTeamPair(idx)}
                aria-label={`Remove team ${idx + 1}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {unpairedPlayers.length > 0 && (
        <>
          <p className="muted">Unpaired players ({unpairedPlayers.length}):</p>
          <div className="form-grid form-grid--two-col" style={{ gap: "0.5rem" }}>
            {unpairedPlayers.map((player) => (
              <button
                key={player.id}
                type="button"
                className={withInteractiveSurface(pendingPick === player.id ? "button" : "button-secondary")}
                onClick={() => handleTeamPlayerClick(player.id)}
                aria-pressed={pendingPick === player.id}
              >
                {player.displayName}
              </button>
            ))}
          </div>
        </>
      )}

      {teamsError && (
        <p className="warning-text" aria-live="polite">{teamsError}</p>
      )}

      <div className="form-grid">
        <button
          className={withInteractiveSurface("button")}
          type="button"
          onClick={handleNext}
          disabled={step2NextDisabled}
        >
          Next
        </button>
        <hr className="stepper-divider" />
        <button
          className={withInteractiveSurface("button-secondary")}
          type="button"
          onClick={() => navigate("/")}
          aria-label="Main menu"
        >
          Main Menu
        </button>
        <button
          className={withInteractiveSurface("button-secondary")}
          type="button"
          onClick={handlePrevious}
        >
          Previous
        </button>
      </div>
    </div>
  )
  const confirmPanel = (
    <div className="panel form-grid">
      <ul className="summary-list" aria-label="Event summary">
        <li className="summary-row">
          <span className="muted">Event</span>
          <span>{eventName || "—"}</span>
        </li>
        <li className="summary-row">
          <span className="muted">Mode</span>
          <span>{getEventModeLabel(eventType)}{teamMexicanoActive ? " (Team Mexicano)" : ""}</span>
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
          <span className="muted">Duration</span>
          <span>{eventDurationMinutes} min</span>
        </li>
        <li className="summary-row">
          <span className="muted">Courts</span>
          <span>{courts.length}</span>
        </li>
        <li className="summary-row">
          <span className="muted">Players</span>
          <span>{assignedPlayers.length}</span>
        </li>
        {teamMexicanoActive && (
          <li className="summary-row">
            <span className="muted">Teams</span>
            <span>{teamPairs.length}</span>
          </li>
        )}
      </ul>
      {step2StartDisabled && missingForStart && (
        <p className="warning-text" aria-live="polite">
          {missingForStart}
        </p>
      )}
      <div className="form-grid">
        <button
          className={withInteractiveSurface("button")}
          type="button"
          onClick={handleStartEvent}
          disabled={step2StartDisabled}
        >
          Start Event
        </button>
        <hr className="stepper-divider" />
        <button
          className={withInteractiveSurface("button-secondary")}
          type="button"
          onClick={() => navigate("/")}
          aria-label="Main menu"
        >
          Main Menu
        </button>
        <button
          className={withInteractiveSurface("button-secondary")}
          type="button"
          onClick={handlePrevious}
        >
          Previous
        </button>
      </div>
      {(teamMexicanoActive ? step3Error : step2Error) && (
        <p className="warning-text" aria-live="polite">
          {teamMexicanoActive ? step3Error : step2Error}
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
        steps={stepperSteps}
        currentStep={currentStep}
        direction={direction}
        onStepClick={handleStepClick}
      >
        {currentStep === 0 && setupPanel}
        {currentStep === 1 && rosterPanel}
        {currentStep === 2 && teamMexicanoActive && assignTeamsPanel}
        {currentStep === 2 && !teamMexicanoActive && confirmPanel}
        {currentStep === 3 && confirmPanel}
      </Stepper>
    </section>
  )
}
