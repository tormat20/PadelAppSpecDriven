import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { CourtGrid, selectTeamGrouping } from "../components/courts/CourtGrid"
import { ResultModal } from "../components/matches/ResultModal"
import InlineSummaryPanel from "../components/run-event/InlineSummaryPanel"
import Stepper from "../components/stepper/Stepper"
import { withInteractiveSurface } from "../features/interaction/surfaceClass"
import { goToNextRound } from "../features/run-event/nextRound"
import type { TeamSide, WinnerPayload } from "../features/run-event/resultEntry"
import { getMirroredBadgePair } from "../features/run-event/resultEntry"
import { SubstituteModal } from "../features/run-event/SubstituteModal"
import {
  finishEvent,
  getCurrentRound,
  getEvent,
  getOngoingInlineSummary,
  previousRound,
  PREVIOUS_ROUND_BOUNDARY_WARNING,
  searchPlayers,
  submitResult,
} from "../lib/api"
import type { EventRecord, InlineSummaryView, RunEventTeamBadgeView } from "../lib/types"
import { shortDisplayNames } from "../lib/playerNames"

export const RUN_PAGE_ACTIONS = ["Previous Round", "Next Round", "View Summary", "Finish Event"] as const

type RunMatch = {
  matchId: string
  courtNumber: number
  team1: string[]
  team2: string[]
  status?: "Pending" | "Completed"
  winnerTeam?: 1 | 2 | null
  isDraw?: boolean
  team1Score?: number | null
  team2Score?: number | null
}

function toPayloadFromSavedMatch(
  match: RunMatch,
  eventType: EventRecord["eventType"],
): WinnerPayload | null {
  if (match.status !== "Completed") return null

  if (eventType === "WinnersCourt") {
    if (match.winnerTeam === 1 || match.winnerTeam === 2) {
      return { mode: "WinnersCourt", winningTeam: match.winnerTeam }
    }
    return null
  }

  if (eventType === "RankedBox") {
    if (match.isDraw) return { mode: "RankedBox", outcome: "Draw" }
    if (match.winnerTeam === 1) return { mode: "RankedBox", outcome: "Team1Win" }
    if (match.winnerTeam === 2) return { mode: "RankedBox", outcome: "Team2Win" }
    return null
  }

  if (typeof match.team1Score === "number" && typeof match.team2Score === "number") {
    if (eventType === "Mexicano") {
      return { mode: "Mexicano", team1Score: match.team1Score, team2Score: match.team2Score }
    }
    return { mode: "Americano", team1Score: match.team1Score, team2Score: match.team2Score }
  }

  return null
}

function restoreSubmittedPayloads(
  matches: RunMatch[],
  eventType: EventRecord["eventType"],
): Record<string, WinnerPayload> {
  const entries = matches
    .map((match) => {
      const payload = toPayloadFromSavedMatch(match, eventType)
      return payload ? ([match.matchId, payload] as const) : null
    })
    .filter((entry): entry is readonly [string, WinnerPayload] => entry !== null)
  return Object.fromEntries(entries)
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

// Errors that indicate a transient backend-busy state (new-tab race on start).
// The initial load will retry automatically before surfacing these to the user.
const TRANSIENT_LOAD_ERRORS = new Set([
  "Failed to fetch",
  "No active round found. Start or resume the event first.",
])

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
  const [hotStreakNames, setHotStreakNames] = useState<Set<string>>(new Set())
  const [coldStreakNames, setColdStreakNames] = useState<Set<string>>(new Set())
  const [showInlineSummary, setShowInlineSummary] = useState(false)
  const [inlineSummary, setInlineSummary] = useState<InlineSummaryView | null>(null)
  const [inlineSummaryError, setInlineSummaryError] = useState("")
  const [previousRoundWarning, setPreviousRoundWarning] = useState("")

  const applyMomentumNames = (
    summary: InlineSummaryView,
    shortById: Record<string, string>,
    fallbackById: Record<string, string>,
  ) => {
    const hotNames = new Set(
      summary.playerRows
        .filter((row) => row.momentumBadge === "fire")
        .map((row) => shortById[row.playerId] ?? fallbackById[row.playerId] ?? row.displayName)
        .filter(Boolean),
    )
    const coldNames = new Set(
      summary.playerRows
        .filter((row) => row.momentumBadge === "snowflake")
        .map((row) => shortById[row.playerId] ?? fallbackById[row.playerId] ?? row.displayName)
        .filter(Boolean),
    )
    setHotStreakNames(hotNames)
    setColdStreakNames(coldNames)
  }

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

    // Build short display names (disambiguate shared first names within this event)
    const shortNameById = shortDisplayNames(players)

    setRoundData({
      ...roundRes,
      matches: mapMatchPlayersToDisplayNames(roundRes.matches, shortNameById),
    })
    setSubmittedPayloads(restoreSubmittedPayloads(roundRes.matches, typedEvent.eventType))
    setCompleted(
      Object.fromEntries(
        roundRes.matches.map((match: any) => [match.matchId, match.status === "Completed"]),
      ),
    )

    getOngoingInlineSummary(eventId)
      .then((summary) => {
        applyMomentumNames(summary, shortNameById, playerNameById)
      })
      .catch(() => {
        setHotStreakNames(new Set())
        setColdStreakNames(new Set())
      })

    if (showInlineSummary) {
      getOngoingInlineSummary(eventId)
        .then((summary) => {
          setInlineSummary(summary)
          setInlineSummaryError("")
        })
        .catch((err) => {
          setInlineSummaryError(err instanceof Error ? err.message : "Could not load inline summary.")
        })
    }
  }

  // On initial mount, the RunEvent page may open in a new tab immediately after
  // the backend finishes writing the first round (DuckDB sequential writes). The
  // first fetch can land while the backend is still busy, producing a transient
  // "Failed to fetch" or ROUND_NOT_FOUND. We retry up to 4 times with a short
  // exponential backoff (300 ms, 600 ms, 1200 ms, 2400 ms) before surfacing an
  // error to the user.
  useEffect(() => {
    if (!eventId) return
    let cancelled = false
    const loadWithRetry = async () => {
      const MAX_ATTEMPTS = 5
      let delay = 300
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          await load()
          return
        } catch (error) {
          if (cancelled) return
          const msg = error instanceof Error ? error.message : "Failed to load run view"
          const isTransient = TRANSIENT_LOAD_ERRORS.has(msg)
          if (!isTransient || attempt === MAX_ATTEMPTS) {
            setLoadError(
              msg === "Failed to fetch"
                ? "Could not reach the server. Make sure the backend is running and try again."
                : msg,
            )
            return
          }
          // Transient error — wait and retry
          await new Promise((resolve) => setTimeout(resolve, delay))
          delay *= 2
        }
      }
    }
    loadWithRetry()
    return () => { cancelled = true }
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
    setPreviousRoundWarning("")
    await goToNextRound(eventId)
    setCompleted({})
    setSubmittedPayloads({})
    setSelectedTeamGroupings({})
    setHoveredTeamGroupings({})
    setModalContext(null)
    await load()
  }

  const previous = async () => {
    const response = await previousRound(eventId)
    if (response.status === "blocked") {
      setPreviousRoundWarning(response.warningMessage ?? PREVIOUS_ROUND_BOUNDARY_WARNING)
      return
    }

    setPreviousRoundWarning("")
    setCompleted({})
    setSubmittedPayloads({})
    setSelectedTeamGroupings({})
    setHoveredTeamGroupings({})
    setModalContext(null)
    await load()
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
      <section className="panel run-grid">
        <div className="run-grid__round-header">
          <h2 className="page-title">Run Event - Round {roundData.roundNumber}</h2>
          {roundStepperProps && (
            <Stepper
              steps={roundStepperProps.steps}
              currentStep={roundStepperProps.currentStep}
              direction={1}
            >
              <></>
            </Stepper>
          )}
        </div>
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
          onFireNames={hotStreakNames}
          onColdNames={coldStreakNames}
          badgeVariant="fire"
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
        <div className="run-action-panel">
          <div className="run-action-row">
            <button
              className={withInteractiveSurface("button-secondary")}
              onClick={() => void previous()}
              aria-label={RUN_PAGE_ACTIONS[0]}
            >
              {RUN_PAGE_ACTIONS[0]}
            </button>
            <button
              className={withInteractiveSurface("button")}
              onClick={() => void next()}
              disabled={!isComplete || (!isMexicano && isFinalRound)}
              aria-label={RUN_PAGE_ACTIONS[1]}
            >
              {RUN_PAGE_ACTIONS[1]}
            </button>
          </div>

          <div className="run-action-row">
            <button
              className={withInteractiveSurface("button-secondary")}
              onClick={() => {
                const next = !showInlineSummary
                setShowInlineSummary(next)
                if (next) {
                  void getOngoingInlineSummary(eventId)
                    .then((summary) => {
                      setInlineSummary(summary)
                      setInlineSummaryError("")
                    })
                    .catch((err) => {
                      setInlineSummaryError(
                        err instanceof Error ? err.message : "Could not load inline summary.",
                      )
                    })
                }
              }}
              aria-label={RUN_PAGE_ACTIONS[2]}
            >
              {showInlineSummary ? "Hide Summary" : RUN_PAGE_ACTIONS[2]}
            </button>
            <button
              className={withInteractiveSurface("button-secondary")}
              onClick={async () => {
                await finishEvent(eventId)
                navigate(`/events/${eventId}/summary`)
              }}
              disabled={isMexicano ? !isComplete : !isComplete || !isFinalRound}
              aria-label={RUN_PAGE_ACTIONS[3]}
            >
              {RUN_PAGE_ACTIONS[3]}
            </button>
          </div>

          {previousRoundWarning && <p className="warning-text">{previousRoundWarning}</p>}
        </div>
      </section>

      {inlineSummaryError && <section className="panel"><p className="warning-text">{inlineSummaryError}</p></section>}

      {showInlineSummary && inlineSummary && (
        <InlineSummaryPanel
          summary={inlineSummary}
          onClose={() => setShowInlineSummary(false)}
        />
      )}

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
