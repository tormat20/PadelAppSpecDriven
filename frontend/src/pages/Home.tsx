import { useEffect, useState } from "react"

import { rankLeaderboardEntries } from "../features/leaderboards/rankLeaderboard"
import { getMexicanoOfMonthLeaderboard, getPlayerOfMonthLeaderboard, getRankedBoxLadder } from "../lib/api"
import type { EventRecord, EventType, Leaderboard, RankedBoxLadder } from "../lib/types"

export type EventSlotFilter = "all" | "planned" | "ready" | "ongoing" | "finished"
export type EventSortOption = "default" | "mode" | "date"

const MODE_ORDER: EventType[] = ["WinnersCourt", "Mexicano", "RankedBox"]

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

// ── Month label helper ─────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function monthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1] ?? ""} ${year}`
}

// ── Rank badge colour ──────────────────────────────────────────────────────────

function rankClass(rank: number): string {
  if (rank === 1) return "leaderboard-rank leaderboard-rank--gold"
  if (rank === 2) return "leaderboard-rank leaderboard-rank--silver"
  if (rank === 3) return "leaderboard-rank leaderboard-rank--bronze"
  return "leaderboard-rank"
}

const PAGE_SIZE = 10

// ── Monthly leaderboard section ────────────────────────────────────────────────

interface LeaderboardSectionProps {
  title: string
  board: Leaderboard | null
  error: string
  scoreLabel: string
  scoreKey: "eventsPlayed" | "mexicanoScore"
}

function LeaderboardSection({ title, board, error, scoreLabel, scoreKey }: LeaderboardSectionProps) {
  const label = board ? monthLabel(board.year, board.month) : ""
  const ranked = board ? rankLeaderboardEntries(board.entries) : []
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? ranked : ranked.slice(0, PAGE_SIZE)
  const hasMore = ranked.length > PAGE_SIZE

  return (
    <section className="panel leaderboard-section">
      <h2 className="leaderboard-heading">
        {title}
        {label && <span className="leaderboard-month">{label}</span>}
      </h2>

      {error && <p className="leaderboard-error" role="alert">{error}</p>}

      {!error && ranked.length === 0 && (
        <p className="leaderboard-empty">No results yet this month.</p>
      )}

      {!error && ranked.length > 0 && (
        <>
          <ul className="leaderboard-list" role="list">
            {visible.map((entry) => (
              <li key={entry.playerId} className="leaderboard-entry">
                <span className={rankClass(entry.rank)} aria-label={`Rank ${entry.rank}`}>
                  #{entry.rank}
                </span>
                <span className="leaderboard-name">{entry.displayName}</span>
                <span className={`leaderboard-score${entry.rank === 1 ? " leaderboard-score--highlight" : ""}`}>
                  {entry[scoreKey]} {scoreLabel}
                </span>
              </li>
            ))}
          </ul>
          {hasMore && (
            <button
              className="leaderboard-show-more"
              type="button"
              onClick={() => setShowAll((prev) => !prev)}
            >
              {showAll ? "Show less" : "Show more..."}
            </button>
          )}
        </>
      )}
    </section>
  )
}

// ── Ranked Ladder section ─────────────────────────────────────────────────────

interface RankedLadderSectionProps {
  ladder: RankedBoxLadder | null
  error: string
}

function RankedLadderSection({ ladder, error }: RankedLadderSectionProps) {
  const entries = ladder?.entries ?? []
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? entries : entries.slice(0, PAGE_SIZE)
  const hasMore = entries.length > PAGE_SIZE

  return (
    <section className="panel leaderboard-section">
      <h2 className="leaderboard-heading">Ranked Ladder</h2>

      {error && <p className="leaderboard-error" role="alert">{error}</p>}

      {!error && entries.length === 0 && (
        <p className="leaderboard-empty">No Ranked Box results yet.</p>
      )}

      {!error && entries.length > 0 && (
        <>
          <ul className="leaderboard-list" role="list">
            {visible.map((entry) => (
              <li
                key={entry.playerId}
                className={`leaderboard-entry${entry.rank === 1 ? " leaderboard-entry--top" : ""}`}
              >
                <span className={rankClass(entry.rank)} aria-label={`Rank ${entry.rank}`}>
                  #{entry.rank}
                </span>
                <span className="leaderboard-name">{entry.displayName}</span>
                <span className={`leaderboard-score${entry.rank === 1 ? " leaderboard-score--highlight" : ""}`}>
                  {entry.rbScoreTotal} pts
                </span>
              </li>
            ))}
          </ul>
          {hasMore && (
            <button
              className="leaderboard-show-more"
              type="button"
              onClick={() => setShowAll((prev) => !prev)}
            >
              {showAll ? "Show less" : "Show more..."}
            </button>
          )}
        </>
      )}
    </section>
  )
}

// ── Default export ─────────────────────────────────────────────────────────────

export default function HomePage() {
  const [potmBoard, setPotmBoard] = useState<Leaderboard | null>(null)
  const [potmError, setPotmError] = useState("")
  const [mexBoard, setMexBoard] = useState<Leaderboard | null>(null)
  const [mexError, setMexError] = useState("")
  const [ladder, setLadder] = useState<RankedBoxLadder | null>(null)
  const [ladderError, setLadderError] = useState("")

  useEffect(() => {
    getPlayerOfMonthLeaderboard()
      .then(setPotmBoard)
      .catch(() => setPotmError("Could not load leaderboard."))

    getMexicanoOfMonthLeaderboard()
      .then(setMexBoard)
      .catch(() => setMexError("Could not load leaderboard."))

    getRankedBoxLadder()
      .then(setLadder)
      .catch(() => setLadderError("Could not load leaderboard."))
  }, [])

  return (
    <section className="page-shell">
      <div className="leaderboard-row">
        <LeaderboardSection
          title="Player of the Month"
          board={potmBoard}
          error={potmError}
          scoreLabel="events"
          scoreKey="eventsPlayed"
        />
        <LeaderboardSection
          title="Mexicano of the Month"
          board={mexBoard}
          error={mexError}
          scoreLabel="pts"
          scoreKey="mexicanoScore"
        />
        <RankedLadderSection
          ladder={ladder}
          error={ladderError}
        />
      </div>
    </section>
  )
}
