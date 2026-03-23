import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"

import { CourtSelector } from "../courts/CourtSelector"
import { PlayerSelector } from "../players/PlayerSelector"
import Stepper from "../stepper/Stepper"
import type { AssignedPlayer } from "../../features/create-event/draftPlayers"
import { getRequiredPlayerCount, isCreateEventDisabled, isStrictCreateEventDisabled } from "../../features/create-event/validation"
import { withInteractiveSurface } from "../../features/interaction/surfaceClass"
import { searchPlayers } from "../../lib/api"
import { getEventModeLabel } from "../../lib/eventMode"
import type { UpdateEventPayload } from "../../lib/types"
import type { DrawerState } from "../../pages/Calendar"
import type { CalendarEventViewModel, DurationOption } from "./calendarEventModel"
import { normalizeDurationMinutes } from "./duration"
import type { PopupEditorFormValues } from "./popupEditorTypes"
import {
  POPUP_EDITOR_DELETE_CONFIRM,
  POPUP_EDITOR_DELETE_ERROR_FALLBACK,
  POPUP_EDITOR_DELETE_LABEL,
  POPUP_EDITOR_DISCARD_CONFIRM,
  POPUP_EDITOR_TITLE_EDIT,
} from "./popupEditorCopy"
import { toPopupSaveErrorMessage } from "./popupSaveErrorMap"
import { getEventTypeVisualClass } from "./eventTypeVisualMap"

export type DrawerFormValues = PopupEditorFormValues & {
  isTeamMexicano: boolean
}

export function isDrawerDirty(original: DrawerFormValues, current: DrawerFormValues): boolean {
  if (original.eventName !== current.eventName) return true
  if (original.eventType !== current.eventType) return true
  if (original.eventDate !== current.eventDate) return true
  if (original.eventTime24h !== current.eventTime24h) return true
  if (original.durationMinutes !== current.durationMinutes) return true
  if (original.isTeamMexicano !== current.isTeamMexicano) return true
  if (original.courts.length !== current.courts.length) return true
  for (let i = 0; i < original.courts.length; i++) {
    if (original.courts[i] !== current.courts[i]) return true
  }
  return false
}

type DrawerMode = "edit" | "readonly" | "create"

export function getDrawerTitle(mode: DrawerMode): string {
  return mode === "edit" ? POPUP_EDITOR_TITLE_EDIT : mode === "create" ? "New Event" : "Event Details"
}

export function shouldConfirmDiscard(
  mode: DrawerMode,
  originalForm: DrawerFormValues,
  form: DrawerFormValues,
): boolean {
  return mode === "edit" && isDrawerDirty(originalForm, form)
}

type EventDrawerProps = {
  state: DrawerState
  onSave: (
    payload: UpdateEventPayload,
    options?: { closeOnSuccess?: boolean },
  ) => Promise<CalendarEventViewModel | void>
  onDelete: (eventId: string, version: number) => Promise<void>
  onStart: (eventId: string) => Promise<void>
  onClose: () => void
  onDurationChange?: (eventId: string, durationMinutes: DurationOption) => void
}

const EVENT_TYPES = [
  { id: "WinnersCourt", label: "Winners Court", copy: "Win/loss court movement" },
  { id: "Mexicano", label: "Mexicano", copy: "24-point score regrouping" },
  { id: "Americano", label: "Americano", copy: "Pre-set Whist schedule, 24-point scoring" },
  { id: "RankedBox", label: "Ranked Box", copy: "3-round box rotations" },
] as const

function eventToFormValues(event: {
  eventName: string
  eventType: "WinnersCourt" | "Mexicano" | "RankedBox" | "Americano"
  eventDate: string
  eventTime24h: string | null
  durationMinutes: number
  selectedCourts: number[]
  isTeamMexicano: boolean
}): DrawerFormValues {
  return {
    eventName: event.eventName,
    eventType: event.eventType,
    eventDate: event.eventDate,
    eventTime24h: event.eventTime24h ?? "",
    durationMinutes: normalizeDurationMinutes(event.durationMinutes),
    courts: [...event.selectedCourts],
    isTeamMexicano: Boolean(event.isTeamMexicano),
  }
}

function idsFromPlayers(players: AssignedPlayer[]): string[] {
  return players.map((player) => player.id)
}

function initialStepForEvent(event: CalendarEventViewModel): 0 | 1 | 2 {
  const selectedCourts = event.selectedCourts.length
  const players = event.playerIds.length
  const requiredPlayers = selectedCourts * 4

  if (event.setupStatus === "ready") return 2
  if (selectedCourts === 0) return 0
  if (players > 0 && requiredPlayers > 0 && players === requiredPlayers) return 2
  return 1
}

function areSameIds(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

export default function EventDrawer({ state, onSave, onDelete, onStart, onClose }: EventDrawerProps) {
  const isOpen = state.open
  const mode = isOpen ? state.mode : null
  const event = isOpen && (state.mode === "edit" || state.mode === "readonly") ? state.event : null

  const [form, setForm] = useState<DrawerFormValues>({
    eventName: "",
    eventType: "Mexicano",
    eventDate: "",
    eventTime24h: "",
    durationMinutes: 90,
    courts: [],
    isTeamMexicano: false,
  })
  const [originalForm, setOriginalForm] = useState<DrawerFormValues>(form)
  const [assignedPlayers, setAssignedPlayers] = useState<AssignedPlayer[]>([])
  const [originalPlayerIds, setOriginalPlayerIds] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState<0 | 1 | 2>(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [inlineError, setInlineError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const wasOpenRef = useRef(false)
  const lastEventIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!isOpen || !event) {
      wasOpenRef.current = false
      lastEventIdRef.current = null
      return
    }

    const justOpened = wasOpenRef.current === false
    const previousEventId = lastEventIdRef.current
    const next = eventToFormValues(event)

    if (justOpened) {
      setForm(next)
      setCurrentStep(initialStepForEvent(event))
      setDirection(1)
      setAssignedPlayers(event.playerIds.map((id) => ({ id, displayName: id })))
    }

    setOriginalForm(next)
    setInlineError(null)
    setIsSaving(false)
    setIsDeleting(false)
    setIsStarting(false)
    setOriginalPlayerIds(event.playerIds)
    if (!justOpened) {
      setForm(next)
      setAssignedPlayers((current) => {
        const byId = new Map(current.map((player) => [player.id, player.displayName]))
        return event.playerIds.map((id) => ({ id, displayName: byId.get(id) ?? id }))
      })
      if (previousEventId !== event.id && event.playerIds.length > 0) {
        setCurrentStep((step) => (step === 0 ? 2 : step))
      }
    }

    wasOpenRef.current = true
    lastEventIdRef.current = event.id

    let cancelled = false
    void searchPlayers("")
      .then((catalog) => {
        if (cancelled) return
        const byId = new Map(catalog.map((entry) => [entry.id, entry.displayName]))
        setAssignedPlayers(event.playerIds.map((id) => ({ id, displayName: byId.get(id) ?? id })))
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [event, isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        handleCloseRequest()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  })

  const stepperSteps = useMemo(() => [{ label: "Setup" }, { label: "Roster" }, { label: "Confirm" }], [])
  const isReadOnly = mode === "readonly"
  const requiredPlayers = getRequiredPlayerCount(form.courts)
  const setupInvalid = isCreateEventDisabled({
    eventName: form.eventName,
    eventDate: form.eventDate,
    eventTime24h: form.eventTime24h,
    courts: [],
    playerIds: [],
  })
  const startDisabled = isStrictCreateEventDisabled({
    eventName: form.eventName,
    eventDate: form.eventDate,
    eventTime24h: form.eventTime24h,
    courts: form.courts,
    playerIds: idsFromPlayers(assignedPlayers),
    eventType: form.eventType,
  })

  function handleFieldChange<K extends keyof DrawerFormValues>(field: K, value: DrawerFormValues[K]) {
    setForm((previous) => ({ ...previous, [field]: value }))
    setInlineError(null)
  }

  function buildSavePayload(targetEvent: CalendarEventViewModel): UpdateEventPayload {
    return {
      expectedVersion: targetEvent.version,
      eventName: form.eventName,
      eventType: form.eventType,
      eventDate: form.eventDate,
      eventTime24h: form.eventTime24h,
      eventDurationMinutes: form.durationMinutes,
      selectedCourts: form.courts,
      playerIds: idsFromPlayers(assignedPlayers),
      isTeamMexicano: form.eventType === "Mexicano" ? form.isTeamMexicano : false,
    }
  }

  function handleCloseRequest() {
    if (!mode) return onClose()
    const playersDirty = !areSameIds(originalPlayerIds, idsFromPlayers(assignedPlayers))
    if (shouldConfirmDiscard(mode, originalForm, form) || playersDirty) {
      if (!window.confirm(POPUP_EDITOR_DISCARD_CONFIRM)) return
    }
    onClose()
  }

  async function persistCurrentStep(options?: { closeOnSuccess?: boolean }) {
    if (!event) return undefined
    setInlineError(null)
    setIsSaving(true)
    try {
      const persisted = await onSave(buildSavePayload(event), options)
      if (persisted) {
        const next = eventToFormValues(persisted)
        setOriginalForm(next)
        setForm(next)
        setOriginalPlayerIds(persisted.playerIds)
      }
      return persisted
    } catch (error) {
      setInlineError(toPopupSaveErrorMessage(error))
      return undefined
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    if (!event) return
    if (!window.confirm(POPUP_EDITOR_DELETE_CONFIRM)) return
    setInlineError(null)
    setIsDeleting(true)
    try {
      await onDelete(event.id, event.version)
    } catch (error) {
      setInlineError(error instanceof Error ? error.message : POPUP_EDITOR_DELETE_ERROR_FALLBACK)
      setIsDeleting(false)
    }
  }

  async function handleStartEvent() {
    if (!event) return
    setInlineError(null)
    setIsStarting(true)
    try {
      const persisted = await persistCurrentStep({ closeOnSuccess: false })
      const eventId = persisted?.id ?? event.id
      await onStart(eventId)
    } catch (error) {
      setInlineError(toPopupSaveErrorMessage(error))
    } finally {
      setIsStarting(false)
    }
  }

  async function handleNext() {
    if (currentStep >= 2) return
    const persisted = await persistCurrentStep({ closeOnSuccess: false })
    if (!persisted) return
    setDirection(1)
    setCurrentStep((step) => (step < 2 ? ((step + 1) as 0 | 1 | 2) : step))
  }

  const summaryModeLabel = getEventModeLabel(form.eventType)

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="event-popup-backdrop" role="presentation" onMouseDown={handleCloseRequest}>
          <motion.div
            className="event-popup panel form-grid"
            role="dialog"
            aria-modal="true"
            aria-label="Edit event"
            data-testid="event-drawer"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="event-popup__header">
              <h2 className="event-popup__title">{mode ? getDrawerTitle(mode) : "Event Details"}</h2>
              <button
                className={withInteractiveSurface("event-popup__close")}
                type="button"
                aria-label="Close popup"
                onClick={handleCloseRequest}
              >
                x
              </button>
            </div>

            {inlineError && (
              <p className="event-popup__error" role="alert">
                {inlineError}
              </p>
            )}

            <Stepper steps={stepperSteps} currentStep={currentStep} direction={direction}>
              {currentStep === 0 && (
                <div className="form-grid">
                  <p className="section-label">Choose mode</p>
                  <div className="mode-list" aria-label="Game mode selector">
                    {EVENT_TYPES.map((item) => (
                      <div
                        key={item.id}
                        className={withInteractiveSurface(
                          `mode-card ${getEventTypeVisualClass(
                            item.id,
                            item.id === "Mexicano" && form.isTeamMexicano,
                          )}`,
                        )}
                        data-active={form.eventType === item.id}
                        role="button"
                        tabIndex={0}
                        aria-pressed={form.eventType === item.id}
                        aria-disabled={isReadOnly || isSaving || isDeleting || isStarting}
                        onClick={() => {
                          if (isReadOnly || isSaving || isDeleting || isStarting) return
                          handleFieldChange("eventType", item.id)
                        }}
                        onKeyDown={(event) => {
                          if (isReadOnly || isSaving || isDeleting || isStarting) return
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault()
                            handleFieldChange("eventType", item.id)
                          }
                        }}
                      >
                        <div className="mode-title mode-title--row">
                          <span>{item.label}</span>
                          {item.id === "Mexicano" && (
                            <span className="team-mexicano-inline" onClick={(e) => e.stopPropagation()}>
                              <span className="team-mexicano-inline__label">Team Mexicano</span>
                              <button
                                type="button"
                                role="switch"
                                aria-checked={form.isTeamMexicano}
                                className={`toggle-switch${form.isTeamMexicano ? " toggle-switch--on" : ""}`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (form.eventType !== "Mexicano") {
                                    handleFieldChange("eventType", "Mexicano")
                                  }
                                  handleFieldChange("isTeamMexicano", !form.isTeamMexicano)
                                }}
                                aria-label="Team Mexicano mode"
                                disabled={isReadOnly || isSaving || isDeleting || isStarting}
                              >
                                <span className="toggle-switch__thumb" />
                              </button>
                            </span>
                          )}
                        </div>
                        <div className="mode-copy">{item.copy}</div>
                      </div>
                    ))}
                  </div>

                  <p className="section-label">Choose date and time</p>
                  <div className="event-schedule-row" aria-label="Event schedule">
                    <input
                      type="date"
                      className="input"
                      value={form.eventDate}
                      onChange={(e) => handleFieldChange("eventDate", e.target.value)}
                      disabled={isReadOnly || isSaving || isDeleting || isStarting}
                      data-testid="drawer-event-date"
                    />
                    <input
                      type="time"
                      step={1800}
                      className="input"
                      value={form.eventTime24h}
                      onChange={(e) => handleFieldChange("eventTime24h", e.target.value)}
                      disabled={isReadOnly || isSaving || isDeleting || isStarting}
                      data-testid="drawer-event-time"
                    />
                    <div className="event-duration-control" aria-label="Event duration">
                      <label htmlFor="popup-duration" className="event-duration-label">
                        Duration: {form.durationMinutes} min
                      </label>
                      <input
                        id="popup-duration"
                        className="event-duration-slider"
                        type="range"
                        min={60}
                        max={120}
                        step={30}
                        value={form.durationMinutes}
                        onChange={(e) =>
                          handleFieldChange("durationMinutes", normalizeDurationMinutes(Number(e.target.value)))
                        }
                        disabled={isReadOnly || isSaving || isDeleting || isStarting}
                        data-testid="drawer-duration-select"
                      />
                      <div className="event-duration-marks" aria-hidden="true">
                        <span>60</span>
                        <span>90</span>
                        <span>120</span>
                      </div>
                    </div>
                  </div>

                  <input
                    className="input"
                    value={form.eventName}
                    onChange={(e) => handleFieldChange("eventName", e.target.value)}
                    minLength={3}
                    maxLength={120}
                    placeholder="Event name"
                    disabled={isReadOnly || isSaving || isDeleting || isStarting}
                    data-testid="drawer-event-name"
                  />
                </div>
              )}

              {currentStep === 1 && (
                <div className="form-grid">
                  <CourtSelector
                    selectedCourts={form.courts}
                    onChange={(next) => handleFieldChange("courts", next)}
                  />
                  <p className="muted">
                    {assignedPlayers.length} / {requiredPlayers} players assigned
                    {form.courts.length > 0
                      ? ` (${form.courts.length} court${form.courts.length === 1 ? "" : "s"} x 4 required)`
                      : ""}
                  </p>
                  <PlayerSelector
                    assignedPlayers={assignedPlayers}
                    totalPlayersRequired={requiredPlayers}
                    onAssignedPlayersChange={setAssignedPlayers}
                  />
                </div>
              )}

              {currentStep === 2 && (
                <div className="form-grid">
                  <ul className="summary-list" aria-label="Event summary">
                    <li className="summary-row">
                      <span className="muted">Event</span>
                      <span>{form.eventName || "-"}</span>
                    </li>
                    <li className="summary-row">
                      <span className="muted">Mode</span>
                      <span>{summaryModeLabel}{form.eventType === "Mexicano" && form.isTeamMexicano ? " (Team Mexicano)" : ""}</span>
                    </li>
                    <li className="summary-row">
                      <span className="muted">Date</span>
                      <span>{form.eventDate || "-"}</span>
                    </li>
                    <li className="summary-row">
                      <span className="muted">Time</span>
                      <span>{form.eventTime24h || "-"}</span>
                    </li>
                    <li className="summary-row">
                      <span className="muted">Duration</span>
                      <span>{form.durationMinutes} min</span>
                    </li>
                    <li className="summary-row">
                      <span className="muted">Courts</span>
                      <span>{form.courts.length}</span>
                    </li>
                    <li className="summary-row">
                      <span className="muted">Players</span>
                      <span>{assignedPlayers.length}</span>
                    </li>
                  </ul>

                  {startDisabled && (
                    <p className="warning-text" aria-live="polite">
                      Add players and courts to start event
                    </p>
                  )}
                </div>
              )}
            </Stepper>

            <div className="event-popup__actions">
              {!isReadOnly && (
                <button
                  type="button"
                  className={withInteractiveSurface("button--danger")}
                  onClick={() => {
                    void handleDelete()
                  }}
                  disabled={isSaving || isDeleting || isStarting}
                  data-testid="drawer-delete-btn"
                >
                  {isDeleting ? "Deleting..." : POPUP_EDITOR_DELETE_LABEL}
                </button>
              )}

              {!isReadOnly && currentStep > 0 && (
                <button
                  type="button"
                  className={withInteractiveSurface("button-secondary")}
                  onClick={() => {
                    setDirection(-1)
                    setCurrentStep((step) => (step > 0 ? ((step - 1) as 0 | 1 | 2) : step))
                  }}
                  disabled={isSaving || isDeleting || isStarting}
                >
                  Previous
                </button>
              )}

              {!isReadOnly && currentStep < 2 && (
                <button
                  type="button"
                  className={withInteractiveSurface("button-secondary")}
                  onClick={() => {
                    void handleNext()
                  }}
                  disabled={isSaving || isDeleting || isStarting || (currentStep === 0 && setupInvalid)}
                >
                  Next
                </button>
              )}

              {!isReadOnly && currentStep === 2 && (
                <button
                  type="button"
                  className={withInteractiveSurface("button")}
                  onClick={() => {
                    void handleStartEvent()
                  }}
                  disabled={isSaving || isDeleting || isStarting || startDisabled}
                >
                  {isStarting ? "Starting..." : "Start Event"}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
