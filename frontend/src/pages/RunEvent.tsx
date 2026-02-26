import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { CourtGrid, selectTeamGrouping } from "../components/courts/CourtGrid"
import { ResultModal } from "../components/matches/ResultModal"
import { goToNextRound } from "../features/run-event/nextRound"
import type { TeamSide, WinnerPayload } from "../features/run-event/resultEntry"
import { getWinnerSelectionKey } from "../features/run-event/resultEntry"
import { finishEvent, getCurrentRound, getEvent, searchPlayers, submitResult } from "../lib/api"

export const RUN_PAGE_ACTIONS = ["Next Match", "Finish", "Go to Summary"] as const

type RunMatch = {
  matchId: string
  courtNumber: number
  team1: string[]
  team2: string[]
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

export default function RunEventPage() {
  const navigate = useNavigate()
  const { eventId = "" } = useParams()
  const [eventData, setEventData] = useState<any>(null)
  const [roundData, setRoundData] = useState<any>(null)
  const [completed, setCompleted] = useState<Record<string, boolean>>({})
  const [submittedPayloads, setSubmittedPayloads] = useState<Record<string, WinnerPayload>>({})
  const [selectedTeamGroupings, setSelectedTeamGroupings] = useState<Record<string, 1 | 2>>({})
  const [hoveredTeamGroupings, setHoveredTeamGroupings] = useState<Record<string, 1 | 2>>({})
  const [modalContext, setModalContext] = useState<{ matchId: string; selectedSide: TeamSide } | null>(null)

  const load = async () => {
    const [eventRes, roundRes, playersCatalog] = await Promise.all([
      getEvent(eventId),
      getCurrentRound(eventId),
      searchPlayers(""),
    ])

    const playerNameById = Object.fromEntries(playersCatalog.map((player) => [player.id, player.displayName]))

    setEventData(eventRes)
    setRoundData({
      ...roundRes,
      matches: mapMatchPlayersToDisplayNames(roundRes.matches, playerNameById),
    })
  }

  useEffect(() => {
    if (eventId) void load()
  }, [eventId])

  const isComplete = useMemo(() => canAdvanceRound(roundData, completed), [completed, roundData])
  const isFinalRound = useMemo(
    () => Number(eventData?.totalRounds ?? 0) > 0 && roundData?.roundNumber >= Number(eventData.totalRounds),
    [eventData, roundData],
  )

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

  if (!eventData || !roundData) return <div className="panel">Loading run view...</div>

  return (
    <section className="page-shell" aria-label="Run event page">
      <header className="page-header panel">
        <h2 className="page-title">Run Event - Round {roundData.roundNumber}</h2>
        <p className="page-subtitle">Submit each result to unlock the next round.</p>
      </header>

      <section className="panel run-grid">
        <CourtGrid
          matches={roundData.matches}
          showCourtImage
          selectedTeamByMatch={selectedTeamGroupings}
          hoveredTeamByMatch={hoveredTeamGroupings}
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
          renderMatchFooter={(matchId) => (
            <p className="muted">
              {submittedPayloads[matchId]
                ? `Selected: ${getWinnerSelectionKey(submittedPayloads[matchId])}`
                : "Click a team side to enter result"}
            </p>
          )}
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
        <button className="button" onClick={() => void onAdvanceClick()} disabled={!isComplete}>
          {isFinalRound ? RUN_PAGE_ACTIONS[1] : RUN_PAGE_ACTIONS[0]}
        </button>
        <button className="button-secondary" onClick={() => navigate(`/events/${eventId}/summary`)}>
          {RUN_PAGE_ACTIONS[2]}
        </button>
      </section>
    </section>
  )
}
