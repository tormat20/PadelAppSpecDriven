import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { CourtGrid, selectTeamGrouping } from "../components/courts/CourtGrid"
import { ResultModal } from "../components/matches/ResultModal"
import Stepper from "../components/stepper/Stepper"
import { withInteractiveSurface } from "../features/interaction/surfaceClass"
import { goToNextRound } from "../features/run-event/nextRound"
import type { TeamSide, WinnerPayload } from "../features/run-event/resultEntry"
import { getMirroredBadgePair } from "../features/run-event/resultEntry"
import { SubstituteModal } from "../features/run-event/SubstituteModal"
import { finishEvent, getCurrentRound, getEvent, searchPlayers, submitResult } from "../lib/api"
import type { EventRecord, RunEventTeamBadgeView } from "../lib/types"

export const RUN_PAGE_ACTIONS = ["Next Match", "Finish", "Go to Summary"] as const

type RunMatch = {
  matchId: string
  courtNumber: number
  team1: string[]
  team2: string[]
}

export function mapSubmittedPayloadsToBadges(
  submittedPayloads: Record<string, WinnerPayload>,
): Record<string, RunEventTeamBadgeView> {
  return Object.fromEntries(
    Object.entries(submittedPayloads).map(([matchId, payload]) => [matchId, getMirroredBadgePair(payload)]),
  )
}

export function mapMatchPlayersToDisplayNames(
  matches: RunMatch[],
  playerNameById: Record<string, string>,
): RunMatch[] {
  return matches.map((match) => ({
    ...match,
    team1: match.team1.map((id) => playerNameById[id] ?? id),
    team2: match.team2.map((id) => playerNameById[id] ?? id),
  }))
}

export function canAdvanceRound(roundData: any, completed: Record<string, boolean>) {
  return !!roundData && roundData.matches.every((m: any) => completed[m.matchId])
}

/**
 * Derives the props needed to render a read-only round-progress Stepper.
 * Returns null when totalRounds is not a positive integer (stepper should not render).
 *
 * @param totalRounds - event.totalRounds from the API (0 or positive integer)
 * @param roundNumber - roundData.roundNumber from the API (1-indexed)
 */
export function getRoundStepperProps(
  totalRounds: number,
  roundNumber: number,
): { steps: { label: string }[]; currentStep: number } | null {
  if (totalRounds < 1) return null
  const clampedRound = roundNumber < 1 ? 1 : roundNumber
  return {
    steps: Array.from({ length: totalRounds }, (_, i) => ({ label: String(i + 1) })),
    currentStep: clampedRound - 1,
  }
}

export default function RunEventPage() {
  const navigate = useNavigate()
  const { eventId = "" } = useParams()
  const [eventData, setEventData] = useState<any>(null)
  const [roundData, setRoundData] = useState<any>(null)
  const [loadError, setLoadError] = useState("")
  const [completed, setCompleted] = useState<Record<string, boolean>>({})
  const [submittedPayloads, setSubmittedPayloads] = useState<Record<string, WinnerPayload>>({})
  const [selectedTeamGroupings, setSelectedTeamGroupings] = useState<Record<string, 1 | 2>>({})
  const [hoveredTeamGroupings, setHoveredTeamGroupings] = useState<Record<string, 1 | 2>>({})
  const [modalContext, setModalContext] = useState<{ matchId: string; selectedSide: TeamSide } | null>(null)
  const [showSubstituteModal, setShowSubstituteModal] = useState(false)
  const [assignedPlayers, setAssignedPlayers] = useState<{ id: string; displayName: string }[]>([])

  const load = async () => {
    setLoadError("")
    // Sequential fetches to avoid concurrent DuckDB file-lock contention
    const eventRes = await getEvent(eventId)
    const playersCatalog = await searchPlayers("")
    const playerNameById = Object.fromEntries(playersCatalog.map((player) => [player.id, player.displayName]))

    const typedEvent = eventRes as EventRecord
    const lifecycleStatus =
      typedEvent.lifecycleStatus ??
      (typedEvent.status === "Finished" ? "finished" : typedEvent.status === "Running" ? "ongoing" : typedEvent.setupStatus === "ready" ? "ready" : "planned")
    if (lifecycleStatus === "finished") {
      navigate(`/events/${eventId}/summary`, { replace: true })
      return
    }
    if (lifecycleStatus !== "ongoing") {
      navigate(`/events/${eventId}/preview`, { replace: true })
      return
    }

    const roundRes = await getCurrentRound(eventId)
    setEventData(typedEvent)
    // Build assigned players from event playerIds matched to catalog
    const players = (typedEvent.playerIds ?? [])
      .map((id: string) => ({ id, displayName: playerNameById[id] ?? id }))
    setAssignedPlayers(players)
    setRoundData({
      ...roundRes,
      matches: mapMatchPlayersToDisplayNames(roundRes.matches, playerNameById),
    })
  }

  useEffect(() => {
    if (!eventId) return
    load().catch((error) => {
      const msg = error instanceof Error ? error.message : "Failed to load run view"
      // "Failed to fetch" means the backend is unreachable — give a clearer hint
      setLoadError(
        msg === "Failed to fetch"
          ? "Could not reach the server. Make sure the backend is running and try again."
          : msg
      )
    })
  }, [eventId])

  const isComplete = useMemo(() => canAdvanceRound(roundData, completed), [completed, roundData])
  const isMexicano = eventData?.eventType === "Mexicano"
  const isFinalRound = useMemo(
    () => !isMexicano && Number(eventData?.totalRounds ?? 0) > 0 && roundData?.roundNumber >= Number(eventData.totalRounds),
    [eventData, roundData, isMexicano],
  )

  const badgeByMatch = useMemo(() => mapSubmittedPayloadsToBadges(submittedPayloads), [submittedPayloads])

  const submit = async (matchId: string, payload: WinnerPayload) => {
    setSubmittedPayloads((current) => ({ ...current, [matchId]: payload }))
    await submitResult(matchId, payload)
    setCompleted((prev) => ({ ...prev, [matchId]: true }))
    setModalContext(null)
  }

  const next = async () => {
    await goToNextRound(eventId)
    setCompleted({})
    setSubmittedPayloads({})
    setSelectedTeamGroupings({})
    setHoveredTeamGroupings({})
    setModalContext(null)
    await load()
  }

  const onAdvanceClick = async () => {
    if (isFinalRound) {
      await finishEvent(eventId)
      navigate(`/events/${eventId}/summary`)
      return
    }

    await next()
  }

  const onTeamSideClick = (matchId: string, teamNumber: TeamSide) => {
    setSelectedTeamGroupings((current) => selectTeamGrouping(current, matchId, teamNumber))
    setModalContext({ matchId, selectedSide: teamNumber })
  }

  if (loadError) {
    return (
      <section className="page-shell" aria-label="Run event page">
        <section className="panel list-stack">
          <p className="warning-text">{loadError}</p>
          <button
            className={withInteractiveSurface("button")}
            onClick={() => load().catch((error) => {
              const msg = error instanceof Error ? error.message : "Failed to load run view"
              setLoadError(msg === "Failed to fetch" ? "Could not reach the server. Make sure the backend is running and try again." : msg)
            })}
          >
            Retry
          </button>
          <button className={withInteractiveSurface("button-secondary")} onClick={() => navigate(`/events/${eventId}/preview`)}>
            Go to Preview
          </button>
        </section>
      </section>
    )
  }

  if (!eventData || !roundData) return <div className="panel">Loading run view...</div>

  // For Mexicano: stepper is hidden (pass totalRounds=0 so getRoundStepperProps returns null)
  const stepperTotalRounds = isMexicano ? 0 : Number(eventData.totalRounds ?? 0)
  const roundStepperProps = getRoundStepperProps(stepperTotalRounds, roundData.roundNumber)

  return (
    <section className="page-shell" aria-label="Run event page">
      <header className="page-header panel">
        <h2 className="page-title">Run Event - Round {roundData.roundNumber}</h2>
        <p className="page-subtitle">Submit each result to unlock the next round.</p>
        {roundStepperProps && (
          <Stepper
            steps={roundStepperProps.steps}
            currentStep={roundStepperProps.currentStep}
            direction={1}
          >
            <></>
          </Stepper>
        )}
      </header>

      <section className="panel run-grid">
        <CourtGrid
          matches={roundData.matches}
          showCourtImage
          selectedTeamByMatch={selectedTeamGroupings}
          hoveredTeamByMatch={hoveredTeamGroupings}
          resultBadgeByMatch={badgeByMatch}
          onTeamGroupClick={onTeamSideClick}
          onTeamGroupHover={(matchId, teamNumber) => {
            setHoveredTeamGroupings((current) => {
              if (!teamNumber) {
                const next = { ...current }
                delete next[matchId]
                return next
              }
              return { ...current, [matchId]: teamNumber }
            })
          }}
        />
      </section>

      <ResultModal
        isOpen={!!modalContext}
        mode={eventData.eventType}
        selectedSide={modalContext?.selectedSide ?? 1}
        selectedPayload={modalContext ? submittedPayloads[modalContext.matchId] : undefined}
        onClose={() => setModalContext(null)}
        onSubmitPayload={(payload) => {
          if (!modalContext) return
          void submit(modalContext.matchId, payload)
        }}
      />

      <section className="panel grid-columns-2">
        {isMexicano ? (
          <>
            <button className={withInteractiveSurface("button")} onClick={() => void next()} disabled={!isComplete}>
              {RUN_PAGE_ACTIONS[0]}
            </button>
            <button
              className={withInteractiveSurface("button-secondary")}
              onClick={async () => { await finishEvent(eventId); navigate(`/events/${eventId}/summary`) }}
              disabled={!isComplete}
            >
              {RUN_PAGE_ACTIONS[1]}
            </button>
          </>
        ) : (
          <>
            <button className={withInteractiveSurface("button")} onClick={() => void onAdvanceClick()} disabled={!isComplete}>
              {isFinalRound ? RUN_PAGE_ACTIONS[1] : RUN_PAGE_ACTIONS[0]}
            </button>
            <button className={withInteractiveSurface("button-secondary")} onClick={() => navigate(`/events/${eventId}/summary`)}>
              {RUN_PAGE_ACTIONS[2]}
            </button>
          </>
        )}
      </section>

      {eventData?.lifecycleStatus === "ongoing" && (
        <section className="panel">
          <button
            className={withInteractiveSurface("button-secondary")}
            type="button"
            onClick={() => setShowSubstituteModal(true)}
          >
            Substitute Player
          </button>
        </section>
      )}

      <SubstituteModal
        isOpen={showSubstituteModal}
        eventId={eventId}
        currentPlayers={assignedPlayers}
        onClose={() => setShowSubstituteModal(false)}
        onSubstituted={() => {
          setShowSubstituteModal(false)
          setCompleted({})
          setSubmittedPayloads({})
          setSelectedTeamGroupings({})
          setHoveredTeamGroupings({})
          setModalContext(null)
          void load()
        }}
      />
    </section>
  )
}
