import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { withInteractiveSurface } from "../features/interaction/surfaceClass"
import { buildDoughnutSegments } from "../features/player-stats/chartData"
import { formatStatValue } from "../features/player-stats/formatStats"
import { getPlayerStats } from "../lib/api"
import type { PlayerStats } from "../lib/types"

// ── Doughnut chart ─────────────────────────────────────────────────────────────

const CX = 48
const CY = 48
const R = 36
const INNER_R = 22

interface DoughnutProps {
  segments: Array<{ label: string; value: number; color: string }>
  title: string
}

function Doughnut({ segments, title }: DoughnutProps) {
  const arcs = buildDoughnutSegments(segments, CX, CY, R, INNER_R)
  return (
    <svg
      width={CX * 2}
      height={CY * 2}
      viewBox={`0 0 ${CX * 2} ${CY * 2}`}
      role="img"
      aria-label={title}
      className="stats-doughnut-svg"
    >
      <title>{title}</title>
      {arcs.map((arc, i) => (
        <path key={i} d={arc.arcPath} fill={arc.color} />
      ))}
    </svg>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: number
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="stats-stat-card">
      <span className="stats-stat-value">{formatStatValue(value)}</span>
      <span className="stats-stat-label">{label}</span>
    </div>
  )
}

// ── Legend row ────────────────────────────────────────────────────────────────

interface LegendRowProps {
  color: string
  label: string
  value: number
}

function LegendRow({ color, label, value }: LegendRowProps) {
  return (
    <div className="stats-legend-row">
      <span className="stats-legend-swatch" style={{ background: color }} />
      <span className="stats-legend-label">{label}</span>
      <span className="stats-legend-value">{value}</span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PlayerStatsPage() {
  const { playerId } = useParams<{ playerId: string }>()
  const navigate = useNavigate()
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = () => {
    if (!playerId) return
    setLoading(true)
    setError("")
    getPlayerStats(playerId)
      .then((s) => {
        setStats(s)
        setLoading(false)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load stats.")
        setLoading(false)
      })
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId])

  return (
    <section className="page-shell">
      <header className="page-header panel">
        <h1 className="page-title">
          {stats ? stats.displayName : loading ? "Loading…" : "Player Stats"}
        </h1>
        <p className="page-subtitle">All-time statistics</p>
      </header>

      {loading && (
        <section className="panel stats-empty-state">
          <p className="muted">Loading stats…</p>
        </section>
      )}

      {!loading && error && (
        <section className="panel stats-empty-state">
          <p className="warning-text" role="alert">{error}</p>
          <div className="action-row">
            <button className={withInteractiveSurface("button-secondary")} onClick={load}>
              Retry
            </button>
          </div>
        </section>
      )}

      {!loading && !error && stats && (
        <>
          {/* ── Summary cards ── */}
          <section className="panel">
            <h2 className="stats-section-heading">Overview</h2>
            <div className="stats-cards-row">
              <StatCard label="Events Attended" value={stats.eventsAttended} />
              <StatCard label="Event Wins" value={stats.eventWins} />
              <StatCard label="Mexicano / Americano Total" value={stats.mexicanoScoreTotal} />
              <StatCard label="Ranked Box Total" value={stats.rbScoreTotal} />
            </div>
          </section>

          {/* ── WinnersCourt ── */}
          <section className="panel">
            <h2 className="stats-section-heading">WinnersCourt</h2>
            <div className="stats-chart-row">
              <div className="stats-doughnut-wrapper">
                <Doughnut
                  title="WinnersCourt win/loss split"
                  segments={[
                    { label: "Wins", value: stats.wcWins, color: "#0c8a8f" },
                    { label: "Losses", value: stats.wcLosses, color: "#ef4444" },
                  ]}
                />
              </div>
              <div className="stats-chart-details">
                <p className="stats-matches-played">
                  {formatStatValue(stats.wcMatchesPlayed, "matches played")}
                </p>
                <LegendRow color="#0c8a8f" label="Wins" value={stats.wcWins} />
                <LegendRow color="#ef4444" label="Losses" value={stats.wcLosses} />
              </div>
            </div>
          </section>

          {/* ── Ranked Box ── */}
          <section className="panel">
            <h2 className="stats-section-heading">Ranked Box</h2>
            <div className="stats-chart-row">
              <div className="stats-doughnut-wrapper">
                <Doughnut
                  title="Ranked Box win/loss/draw split"
                  segments={[
                    { label: "Wins", value: stats.rbWins, color: "#0c8a8f" },
                    { label: "Losses", value: stats.rbLosses, color: "#ef4444" },
                    { label: "Draws", value: stats.rbDraws, color: "#f59e0b" },
                  ]}
                />
              </div>
              <div className="stats-chart-details">
                <p className="stats-rb-score">
                  {formatStatValue(stats.rbScoreTotal, "pts total")}
                </p>
                <LegendRow color="#0c8a8f" label="Wins (+25)" value={stats.rbWins} />
                <LegendRow color="#ef4444" label="Losses (−15)" value={stats.rbLosses} />
                <LegendRow color="#f59e0b" label="Draws (+5)" value={stats.rbDraws} />
              </div>
            </div>
          </section>
        </>
      )}

      <section className="panel">
        <div className="action-row">
          <button
            aria-label="Back to search"
            className={withInteractiveSurface("button-secondary")}
            onClick={() => navigate("/players/search")}
          >
            Back to Search
          </button>
          <button
            aria-label="Main menu"
            className={withInteractiveSurface("button-secondary")}
            onClick={() => navigate("/")}
          >
            Main Menu
          </button>
        </div>
      </section>
    </section>
  )
}
