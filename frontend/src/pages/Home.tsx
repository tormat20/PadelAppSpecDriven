import { useCallback, useEffect, useState } from "react"

import { rankLeaderboardEntries } from "../features/leaderboards/rankLeaderboard"
import { getMexicanoHighscore, getMexicanoOfMonthLeaderboard, getOnFirePlayerIds, getPlayerOfMonthLeaderboard, getRankedBoxLadder } from "../lib/api"
import type { EventRecord, EventType, Leaderboard, MexicanoHighscore, RankedBoxLadder } from "../lib/types"

// ── Fetch helpers ──────────────────────────────────────────────────────────────

const RETRY_DELAY_MS = 150

async function fetchWithRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    if (retries <= 0) throw err
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
    return fetchWithRetry(fn, retries - 1)
  }
}

export type EventSlotFilter = "all" | "planned" | "ready" | "ongoing" | "finished"
export type EventSortOption = "default" | "date"

const MODE_ORDER: EventType[] = ["WinnersCourt", "Mexicano", "Americano", "RankedBox"]

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
  const modeFiltered = modeFilters.length < MODE_ORDER.length
    ? filtered.filter((event) => modeFilters.includes(event.eventType))
    : filtered

  if (sortOption === "default") return modeFiltered

  return [...modeFiltered].sort((left, right) => {
    if (sortOption === "date") {
      return toScheduleTimestamp(left) - toScheduleTimestamp(right)
    }
    return 0
  })
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
  onRetry: () => void
  onFireIds?: Set<string>
}

function LeaderboardSection({ title, board, error, scoreLabel, scoreKey, onRetry, onFireIds }: LeaderboardSectionProps) {
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

      {error && (
        <div className="leaderboard-error-row">
          <p className="leaderboard-error" role="alert">{error}</p>
          <button className="leaderboard-retry-btn" type="button" onClick={onRetry}>
            Retry
          </button>
        </div>
      )}

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
                <span className="leaderboard-name">
                  {entry.displayName}
                  {onFireIds?.has(entry.playerId) && (
                    <img
                      src="/images/icons/fire.svg"
                      alt="Hot streak"
                      className="leaderboard-fire-icon"
                      title="Won an event in the last 7 days"
                    />
                  )}
                </span>
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
  onRetry: () => void
  onFireIds?: Set<string>
}

function RankedLadderSection({ ladder, error, onRetry, onFireIds }: RankedLadderSectionProps) {
  const entries = ladder?.entries ?? []
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? entries : entries.slice(0, PAGE_SIZE)
  const hasMore = entries.length > PAGE_SIZE

  return (
    <section className="panel leaderboard-section">
      <h2 className="leaderboard-heading">Ranked Ladder</h2>

      {error && (
        <div className="leaderboard-error-row">
          <p className="leaderboard-error" role="alert">{error}</p>
          <button className="leaderboard-retry-btn" type="button" onClick={onRetry}>
            Retry
          </button>
        </div>
      )}

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
                <span className="leaderboard-name">
                  {entry.displayName}
                  {onFireIds?.has(entry.playerId) && (
                    <img
                      src="/images/icons/fire.svg"
                      alt="Hot streak"
                      className="leaderboard-fire-icon"
                      title="Won an event in the last 7 days"
                    />
                  )}
                </span>
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

// ── Mexicano Highscore section ────────────────────────────────────────────────

interface MexicanoHighscoreSectionProps {
  highscore: MexicanoHighscore | null
  error: string
  onRetry: () => void
  onFireIds?: Set<string>
}

function MexicanoHighscoreSection({ highscore, error, onRetry, onFireIds }: MexicanoHighscoreSectionProps) {
  const entries = highscore?.entries ?? []
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? entries : entries.slice(0, PAGE_SIZE)
  const hasMore = entries.length > PAGE_SIZE

  return (
    <section className="panel leaderboard-section">
      <h2 className="leaderboard-heading">Mexicano Highscore</h2>

      {error && (
        <div className="leaderboard-error-row">
          <p className="leaderboard-error" role="alert">{error}</p>
          <button className="leaderboard-retry-btn" type="button" onClick={onRetry}>
            Retry
          </button>
        </div>
      )}

      {!error && entries.length === 0 && (
        <p className="leaderboard-empty">No Mexicano events finished yet.</p>
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
                <span className="leaderboard-name">
                  {entry.displayName}
                  {onFireIds?.has(entry.playerId) && (
                    <img
                      src="/images/icons/fire.svg"
                      alt="Hot streak"
                      className="leaderboard-fire-icon"
                      title="Won an event in the last 7 days"
                    />
                  )}
                </span>
                <span className={`leaderboard-score${entry.rank === 1 ? " leaderboard-score--highlight" : ""}`}>
                  {entry.mexicanoBestEventScore} pts
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

const STAGGER_MS = 60

export default function HomePage() {
  const [potmBoard, setPotmBoard] = useState<Leaderboard | null>(null)
  const [potmError, setPotmError] = useState("")
  const [mexBoard, setMexBoard] = useState<Leaderboard | null>(null)
  const [mexError, setMexError] = useState("")
  const [ladder, setLadder] = useState<RankedBoxLadder | null>(null)
  const [ladderError, setLadderError] = useState("")
  const [highscore, setHighscore] = useState<MexicanoHighscore | null>(null)
  const [highscoreError, setHighscoreError] = useState("")
  const [onFireIds, setOnFireIds] = useState<Set<string>>(new Set())

  const fetchPotm = useCallback(() => {
    setPotmError("")
    fetchWithRetry(getPlayerOfMonthLeaderboard)
      .then(setPotmBoard)
      .catch(() => setPotmError("Could not load leaderboard."))
  }, [])

  const fetchMex = useCallback(() => {
    setMexError("")
    fetchWithRetry(getMexicanoOfMonthLeaderboard)
      .then(setMexBoard)
      .catch(() => setMexError("Could not load leaderboard."))
  }, [])

  const fetchLadder = useCallback(() => {
    setLadderError("")
    fetchWithRetry(getRankedBoxLadder)
      .then(setLadder)
      .catch(() => setLadderError("Could not load leaderboard."))
  }, [])

  const fetchHighscore = useCallback(() => {
    setHighscoreError("")
    fetchWithRetry(getMexicanoHighscore)
      .then(setHighscore)
      .catch(() => setHighscoreError("Could not load leaderboard."))
  }, [])

  useEffect(() => {
    // Fetch on-fire IDs once; silently ignore errors (non-critical)
    getOnFirePlayerIds()
      .then((ids) => setOnFireIds(new Set(ids)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchPotm()
    const t1 = setTimeout(fetchMex, STAGGER_MS)
    const t2 = setTimeout(fetchLadder, STAGGER_MS * 2)
    const t3 = setTimeout(fetchHighscore, STAGGER_MS * 3)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [fetchPotm, fetchMex, fetchLadder, fetchHighscore])

  return (
    <section className="page-shell">
      <div className="leaderboard-row">
        <LeaderboardSection
          title="Player of the Month"
          board={potmBoard}
          error={potmError}
          scoreLabel="events"
          scoreKey="eventsPlayed"
          onRetry={fetchPotm}
          onFireIds={onFireIds}
        />
        <LeaderboardSection
          title="Mexicano of the Month"
          board={mexBoard}
          error={mexError}
          scoreLabel="pts"
          scoreKey="mexicanoScore"
          onRetry={fetchMex}
          onFireIds={onFireIds}
        />
        <RankedLadderSection
          ladder={ladder}
          error={ladderError}
          onRetry={fetchLadder}
          onFireIds={onFireIds}
        />
        <MexicanoHighscoreSection
          highscore={highscore}
          error={highscoreError}
          onRetry={fetchHighscore}
          onFireIds={onFireIds}
        />
      </div>
    </section>
  )
}
