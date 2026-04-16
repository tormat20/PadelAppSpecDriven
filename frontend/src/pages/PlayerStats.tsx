import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { withInteractiveSurface } from "../features/interaction/surfaceClass"
import {
  buildBarSegments,
  buildDoughnutSegments,
  buildGroupedBars,
  buildLinePoints,
  buildStackedBars,
} from "../features/player-stats/chartData"
import { formatStatValue } from "../features/player-stats/formatStats"
import { getPlayerDeepDive, getPlayerStats } from "../lib/api"
import type {
  EloPoint,
  MatchWDL,
  PlayerDeepDive,
  PlayerStats,
  RoundAvgCourtScore,
  RoundAvgScore,
  RoundWDL,
  Score24ModeStats,
  ScoreDistEntry,
  ScoreDistPerCourt,
} from "../lib/types"

// ── Colour constants ──────────────────────────────────────────────────────────

const COLOR_TEAL = "#0c8a8f"
const COLOR_RED = "#ef4444"
const COLOR_AMBER = "#f59e0b"
const COLOR_GREEN = "#22c55e"

// ── Doughnut chart ─────────────────────────────────────────────────────────────

const CX = 62
const CY = 62
const R = 47
const INNER_R = 29

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
  value: number | string
}

function StatCard({ label, value }: StatCardProps) {
  const display = typeof value === "number" ? formatStatValue(value) : value
  return (
    <div className="stats-stat-card">
      <span className="stats-stat-value">{display}</span>
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

// ── Avg Score Line Chart (multi-series) ───────────────────────────────────────

const SCORE_W = 560
const SCORE_H = 220
const SCORE_PAD_X = 32
const SCORE_PAD_Y = 14
const SCORE_Y_MIN = 0
const SCORE_Y_MAX = 24
const SCORE_Y_RANGE = SCORE_Y_MAX - SCORE_Y_MIN

interface AvgScoreLineChartProps {
  allTime: RoundAvgScore[]
  lastMonth: RoundAvgScore[]
  lastWeek: RoundAvgScore[]
}

function AvgScoreLineChart({ allTime, lastMonth, lastWeek }: AvgScoreLineChartProps) {
  if (allTime.length === 0 && lastMonth.length === 0 && lastWeek.length === 0) return null

  // Use the all-time series as the X-axis spine; fall back to whichever series has data
  const spine = allTime.length > 0 ? allTime : lastMonth.length > 0 ? lastMonth : lastWeek
  const rounds = spine.map((r) => r.round)
  const plotW = SCORE_W - SCORE_PAD_X * 2
  const plotH = SCORE_H - SCORE_PAD_Y * 2

  // Map a round number → X pixel position based on its index in the spine
  function xForRound(round: number): number {
    const idx = rounds.indexOf(round)
    if (idx === -1) return SCORE_PAD_X
    return SCORE_PAD_X + (rounds.length === 1 ? plotW / 2 : (idx / (rounds.length - 1)) * plotW)
  }

  // Map an avg score → Y pixel position (clamped to axis range)
  function yForScore(score: number): number {
    const clamped = Math.max(SCORE_Y_MIN, Math.min(SCORE_Y_MAX, score))
    return SCORE_PAD_Y + plotH - ((clamped - SCORE_Y_MIN) / SCORE_Y_RANGE) * plotH
  }

  // Build SVG path + dot list for one series
  function buildSeries(data: RoundAvgScore[]) {
    if (data.length === 0) return { pathD: "", pts: [] as Array<{ x: number; y: number }> }
    const pts = data.map((r) => ({ x: xForRound(r.round), y: yForScore(r.avgScore) }))
    const pathD =
      pts.length === 1
        ? ""
        : pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
    return { pathD, pts }
  }

  const seriesAllTime = buildSeries(allTime)
  const seriesMonth = buildSeries(lastMonth)
  const seriesWeek = buildSeries(lastWeek)

  // Legend — only show entries that have data, and only if >1 series is present
  const activeSeries = [
    lastMonth.length > 0 && { color: COLOR_GREEN, label: "Last 30 days" },
    lastWeek.length > 0 && { color: COLOR_AMBER, label: "Last 7 days" },
    allTime.length > 0 && { color: COLOR_RED, label: "All time" },
  ].filter(Boolean) as Array<{ color: string; label: string }>

  return (
    <div className="dd-chart-wrap" aria-label="Average score per round">
      <p className="dd-chart-label">Avg score per round</p>
      <p className="dd-chart-desc">Your average match score (0–24) across rounds, showing how consistently you score over time.</p>
      <div className="dd-chart-scroll">
        <svg
          width={SCORE_W}
          height={SCORE_H}
          viewBox={`0 0 ${SCORE_W} ${SCORE_H}`}
          role="img"
          aria-label="Average score per round line chart"
        >
          {/* Y-axis reference lines */}
          {[0, 6, 12, 18, 24].map((v) => {
            const y = yForScore(v)
            return (
              <g key={v}>
                <line
                  x1={SCORE_PAD_X}
                  y1={y}
                  x2={SCORE_W - SCORE_PAD_X}
                  y2={y}
                  stroke="var(--color-border)"
                  strokeWidth={1}
                />
                <text x={SCORE_PAD_X - 4} y={y + 4} textAnchor="end" className="dd-axis-tick">
                  {v}
                </text>
              </g>
            )
          })}

          {/* All-time series — red, drawn first (bottom layer) */}
          {seriesAllTime.pathD && (
            <path
              d={seriesAllTime.pathD}
              fill="none"
              stroke={COLOR_RED}
              strokeWidth={2}
              strokeLinejoin="round"
            />
          )}
          {seriesAllTime.pts.map((p, i) => (
            <circle key={`at-${i}`} cx={p.x} cy={p.y} r={3} fill={COLOR_RED} />
          ))}

          {/* Last-month series — green */}
          {seriesMonth.pathD && (
            <path
              d={seriesMonth.pathD}
              fill="none"
              stroke={COLOR_GREEN}
              strokeWidth={2}
              strokeLinejoin="round"
            />
          )}
          {seriesMonth.pts.map((p, i) => (
            <circle key={`lm-${i}`} cx={p.x} cy={p.y} r={3} fill={COLOR_GREEN} />
          ))}

          {/* Last-week series — amber, drawn last (top layer) */}
          {seriesWeek.pathD && (
            <path
              d={seriesWeek.pathD}
              fill="none"
              stroke={COLOR_AMBER}
              strokeWidth={2}
              strokeLinejoin="round"
            />
          )}
          {seriesWeek.pts.map((p, i) => (
            <circle key={`lw-${i}`} cx={p.x} cy={p.y} r={3} fill={COLOR_AMBER} />
          ))}

          {/* X-axis labels (round numbers from spine) */}
          {spine.map((r, i) => (
            <text
              key={`lbl-${r.round}`}
              x={SCORE_PAD_X + (rounds.length === 1 ? plotW / 2 : (i / (rounds.length - 1)) * plotW)}
              y={SCORE_H - 2}
              textAnchor="middle"
              className="dd-axis-tick"
            >
              R{r.round}
            </text>
          ))}
        </svg>
      </div>

      {/* Legend — only when more than one series has data */}
      {activeSeries.length > 1 && (
        <div className="dd-score-legend">
          {activeSeries.map(({ color, label }) => (
            <span key={label} className="dd-score-legend-item">
              <svg width="16" height="4" aria-hidden="true">
                <rect x="0" y="0" width="16" height="4" rx="2" fill={color} />
              </svg>
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Avg Court Score Line Chart ────────────────────────────────────────────────

const COURT_W = 560
const COURT_H = 220
const COURT_PAD_X = 32
const COURT_PAD_Y = 14

interface CourtLineChartProps {
  allTime: RoundAvgCourtScore[]
  lastMonth: RoundAvgCourtScore[]
  lastWeek: RoundAvgCourtScore[]
  avgCourtScoreOverall: number | null
}

function CourtLineChart({ allTime, lastMonth, lastWeek, avgCourtScoreOverall }: CourtLineChartProps) {
  if (allTime.length === 0 && lastMonth.length === 0 && lastWeek.length === 0) return null

  const minScore = 0
  const maxScore = 10
  const plotW = COURT_W - COURT_PAD_X * 2
  const plotH = COURT_H - COURT_PAD_Y * 2
  const range = maxScore - minScore

  // Use all-time as X-axis spine; fall back to whichever series has data
  const spine = allTime.length > 0 ? allTime : lastMonth.length > 0 ? lastMonth : lastWeek
  const rounds = spine.map((r) => r.round)

  function xForRound(round: number): number {
    const idx = rounds.indexOf(round)
    if (idx === -1) return COURT_PAD_X
    return COURT_PAD_X + (rounds.length === 1 ? plotW / 2 : (idx / (rounds.length - 1)) * plotW)
  }

  function yForScore(score: number): number {
    const clamped = Math.max(minScore, Math.min(maxScore, score))
    return COURT_PAD_Y + plotH - ((clamped - minScore) / range) * plotH
  }

  function buildSeries(data: RoundAvgCourtScore[]) {
    if (data.length === 0) return { pathD: "", pts: [] as Array<{ x: number; y: number }> }
    const pts = data.map((r) => ({ x: xForRound(r.round), y: yForScore(r.avgCourtScore) }))
    const pathD =
      pts.length === 1
        ? ""
        : pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
    return { pathD, pts }
  }

  const seriesAllTime = buildSeries(allTime)
  const seriesMonth = buildSeries(lastMonth)
  const seriesWeek = buildSeries(lastWeek)

  const activeSeries = [
    lastMonth.length > 0 && { color: COLOR_GREEN, label: "Last 30 days" },
    lastWeek.length > 0 && { color: COLOR_AMBER, label: "Last 7 days" },
    allTime.length > 0 && { color: COLOR_RED, label: "All time" },
  ].filter(Boolean) as Array<{ color: string; label: string }>

  const yTicks = [0, 2, 4, 6, 8, 10]

  return (
    <div className="dd-chart-wrap" aria-label="Average court-score per round">
      <p className="dd-chart-label">
        Avg court-score per round
        {avgCourtScoreOverall !== null && (
          <span className="dd-sub-stat"> — overall avg: {avgCourtScoreOverall.toFixed(1)}</span>
        )}
      </p>
      <p className="dd-chart-desc">Court score is normalized to 0–10 regardless of format, so results are comparable across event types.</p>
      <div className="dd-chart-scroll">
        <svg
          width={COURT_W}
          height={COURT_H}
          viewBox={`0 0 ${COURT_W} ${COURT_H}`}
          role="img"
          aria-label="Average court-score per round line chart"
        >
          {/* Y-axis reference lines + labels */}
          {yTicks.map((v) => {
            const y = yForScore(v)
            return (
              <g key={v}>
                <line
                  x1={COURT_PAD_X}
                  y1={y}
                  x2={COURT_W - COURT_PAD_X}
                  y2={y}
                  stroke="var(--color-border)"
                  strokeWidth={1}
                />
                <text x={COURT_PAD_X - 4} y={y + 4} textAnchor="end" className="dd-axis-tick">
                  {v}
                </text>
              </g>
            )
          })}

          {/* All-time series — red, drawn first (bottom layer) */}
          {seriesAllTime.pathD && (
            <path d={seriesAllTime.pathD} fill="none" stroke={COLOR_RED} strokeWidth={2} strokeLinejoin="round" />
          )}
          {seriesAllTime.pts.map((p, i) => (
            <circle key={`at-${i}`} cx={p.x} cy={p.y} r={3.5} fill={COLOR_RED} />
          ))}

          {/* Last-month series — green */}
          {seriesMonth.pathD && (
            <path d={seriesMonth.pathD} fill="none" stroke={COLOR_GREEN} strokeWidth={2} strokeLinejoin="round" />
          )}
          {seriesMonth.pts.map((p, i) => (
            <circle key={`lm-${i}`} cx={p.x} cy={p.y} r={3.5} fill={COLOR_GREEN} />
          ))}

          {/* Last-week series — amber, drawn last (top layer) */}
          {seriesWeek.pathD && (
            <path d={seriesWeek.pathD} fill="none" stroke={COLOR_AMBER} strokeWidth={2} strokeLinejoin="round" />
          )}
          {seriesWeek.pts.map((p, i) => (
            <circle key={`lw-${i}`} cx={p.x} cy={p.y} r={3.5} fill={COLOR_AMBER} />
          ))}

          {/* X-axis labels */}
          {spine.map((r, i) => (
            <text
              key={`lbl-${r.round}`}
              x={COURT_PAD_X + (rounds.length === 1 ? plotW / 2 : (i / (rounds.length - 1)) * plotW)}
              y={COURT_H - 2}
              textAnchor="middle"
              className="dd-axis-tick"
            >
              R{r.round}
            </text>
          ))}
        </svg>
      </div>

      {/* Legend — only when more than one series has data */}
      {activeSeries.length > 1 && (
        <div className="dd-score-legend">
          {activeSeries.map(({ color, label }) => (
            <span key={label} className="dd-score-legend-item">
              <svg width="16" height="4" aria-hidden="true">
                <rect x="0" y="0" width="16" height="4" rx="2" fill={color} />
              </svg>
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Score Distribution Bar Chart ─────────────────────────────────────────────

const DIST_W = 420
const DIST_H = 120
const DIST_PAD_X = 8
const DIST_PAD_Y = 8

interface ScoreDistChartProps {
  distribution: ScoreDistEntry[]
  title: string
}

function ScoreDistChart({ distribution, title }: ScoreDistChartProps) {
  const allZero = distribution.every((d) => d.count === 0)
  if (allZero) {
    return (
      <div className="dd-chart-wrap">
        <p className="dd-chart-label">{title}</p>
        <p className="dd-empty-state muted">No score data yet.</p>
      </div>
    )
  }

  const maxCount = Math.max(1, ...distribution.map((d) => d.count))
  const items = distribution.map((d) => ({ label: String(d.score), value: d.count }))
  const bars = buildBarSegments(items, COLOR_TEAL, DIST_W, DIST_H, DIST_PAD_X, DIST_PAD_Y, 0, maxCount)

  return (
    <div className="dd-chart-wrap">
      <p className="dd-chart-label">{title}</p>
      <div className="dd-chart-scroll">
        <svg
          width={DIST_W}
          height={DIST_H}
          viewBox={`0 0 ${DIST_W} ${DIST_H}`}
          role="img"
          aria-label={title}
        >
          <title>{title}</title>
          {bars.map((b) => (
            <rect
              key={b.label}
              x={b.x}
              y={b.y}
              width={b.width}
              height={b.height}
              fill={b.color}
              rx={1}
            />
          ))}
        </svg>
      </div>
    </div>
  )
}

// ── Stacked proportional bar chart ───────────────────────────────────────────

interface StackedBarChartProps {
  rounds: RoundWDL[]
  showDraw: boolean
  title: string
}

function StackedBarChart({ rounds, showDraw, title }: StackedBarChartProps) {
  const STACKED_W = 260
  const STACKED_H = 120
  const PAD_X = 8
  const PAD_Y = 8

  const activeRounds = rounds.filter((r) => r.wins + r.draws + r.losses > 0)
  const columns = buildStackedBars(
    activeRounds,
    { win: COLOR_TEAL, draw: COLOR_AMBER, loss: COLOR_RED },
    STACKED_W,
    STACKED_H,
    PAD_X,
    PAD_Y,
  )

  // Legend aggregates
  const totalWins = activeRounds.reduce((s, r) => s + r.wins, 0)
  const totalDraws = activeRounds.reduce((s, r) => s + r.draws, 0)
  const totalLosses = activeRounds.reduce((s, r) => s + r.losses, 0)

  return (
    <div className="dd-stacked-wrap">
      <div className="dd-chart-scroll">
        <svg
          width={STACKED_W}
          height={STACKED_H}
          viewBox={`0 0 ${STACKED_W} ${STACKED_H}`}
          role="img"
          aria-label={title}
        >
          <title>{title}</title>
          {columns.map((col) => (
            <g key={col.roundLabel}>
              {col.rects.map((rect) => (
                <rect
                  key={`${rect.roundLabel}-${rect.segmentLabel}`}
                  x={rect.x}
                  y={rect.y}
                  width={rect.width}
                  height={rect.height}
                  fill={rect.color}
                  rx={2}
                />
              ))}
              <text
                x={col.rects[0]?.x + (col.rects[0]?.width ?? 0) / 2 || 0}
                y={STACKED_H - 2}
                textAnchor="middle"
                className="dd-axis-tick"
              >
                {col.roundLabel}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="stats-chart-details">
        <LegendRow color={COLOR_TEAL} label="Wins" value={totalWins} />
        {showDraw && <LegendRow color={COLOR_AMBER} label="Draws" value={totalDraws} />}
        <LegendRow color={COLOR_RED} label="Losses" value={totalLosses} />
      </div>
    </div>
  )
}

// ── RB Elo line chart ─────────────────────────────────────────────────────────

const ELO_W = 320
const ELO_H = 120
const ELO_PAD_X = 36
const ELO_PAD_Y = 14

interface EloLineChartProps {
  timeline: EloPoint[]
}

function EloLineChart({ timeline }: EloLineChartProps) {
  const pts = buildLinePoints(timeline, ELO_W, ELO_H, ELO_PAD_X, ELO_PAD_Y)
  if (pts.length === 0) return null

  const pathD =
    pts.length === 1
      ? ""
      : pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")

  const scores = pts.map((p) => p.cumulativeScore)
  const minScore = Math.min(...scores)
  const maxScore = Math.max(...scores)

  return (
    <div className="dd-chart-wrap" aria-label="RB score timeline">
      <p className="dd-chart-label">RB score over time</p>
      <div className="dd-chart-scroll">
        <svg
          width={ELO_W}
          height={ELO_H}
          viewBox={`0 0 ${ELO_W} ${ELO_H}`}
          role="img"
          aria-label="Cumulative RB elo line chart"
        >
          {/* Y axis min/max labels */}
          <text x={ELO_PAD_X - 4} y={ELO_PAD_Y + 4} textAnchor="end" className="dd-axis-tick">
            {maxScore}
          </text>
          <text
            x={ELO_PAD_X - 4}
            y={ELO_H - ELO_PAD_Y + 4}
            textAnchor="end"
            className="dd-axis-tick"
          >
            {minScore}
          </text>
          {/* baseline */}
          <line
            x1={ELO_PAD_X}
            y1={ELO_H - ELO_PAD_Y}
            x2={ELO_W - ELO_PAD_X}
            y2={ELO_H - ELO_PAD_Y}
            stroke="var(--color-border)"
            strokeWidth={1}
          />
          {/* line */}
          {pathD && (
            <path d={pathD} fill="none" stroke={COLOR_TEAL} strokeWidth={2} strokeLinejoin="round" />
          )}
          {/* dots */}
          {pts.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={3.5} fill={COLOR_TEAL} />
          ))}
          {/* X-axis labels — only first and last to avoid crowding */}
          {pts.length > 0 && (
            <text
              x={pts[0].x}
              y={ELO_H - 2}
              textAnchor="middle"
              className="dd-axis-tick"
            >
              {pts[0].dateLabel}
            </text>
          )}
          {pts.length > 1 && (
            <text
              x={pts[pts.length - 1].x}
              y={ELO_H - 2}
              textAnchor="middle"
              className="dd-axis-tick"
            >
              {pts[pts.length - 1].dateLabel}
            </text>
          )}
        </svg>
      </div>
    </div>
  )
}

// ── Grouped bar chart ─────────────────────────────────────────────────────────

const GROUPED_W = 260
const GROUPED_H = 120
const GROUPED_PAD_X = 8
const GROUPED_PAD_Y = 8

interface GroupedBarChartProps {
  rounds: RoundWDL[]
  showDraw: boolean
  title: string
}

function GroupedBarChart({ rounds, showDraw, title }: GroupedBarChartProps) {
  const groups = buildGroupedBars(
    rounds,
    showDraw,
    GROUPED_W,
    GROUPED_H,
    GROUPED_PAD_X,
    GROUPED_PAD_Y,
  )

  const baseline = GROUPED_PAD_Y + (GROUPED_H - GROUPED_PAD_Y * 2)

  // Legend aggregates
  const totalWins = rounds.reduce((s, r) => s + r.wins, 0)
  const totalDraws = rounds.reduce((s, r) => s + r.draws, 0)
  const totalLosses = rounds.reduce((s, r) => s + r.losses, 0)

  return (
    <div className="dd-stacked-wrap">
      <div className="dd-chart-scroll">
        <svg
          width={GROUPED_W}
          height={GROUPED_H}
          viewBox={`0 0 ${GROUPED_W} ${GROUPED_H}`}
          role="img"
          aria-label={title}
        >
          <title>{title}</title>
          {/* Shared baseline */}
          <line
            x1={GROUPED_PAD_X}
            y1={baseline}
            x2={GROUPED_W - GROUPED_PAD_X}
            y2={baseline}
            stroke="var(--color-border)"
            strokeWidth={1}
          />
          {groups.map((group) => (
            <g key={group.roundLabel}>
              {group.bars.map((bar) => (
                <rect
                  key={`${group.roundLabel}-${bar.label}`}
                  x={bar.x}
                  y={bar.y}
                  width={bar.width}
                  height={bar.height}
                  fill={bar.color}
                  rx={2}
                />
              ))}
              <text
                x={group.labelX}
                y={GROUPED_H - 2}
                textAnchor="middle"
                className="dd-axis-tick"
              >
                {group.roundLabel}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="stats-chart-details">
        <LegendRow color="#0c8a8f" label="Wins" value={totalWins} />
        {showDraw && <LegendRow color="#f59e0b" label="Draws" value={totalDraws} />}
        <LegendRow color="#ef4444" label="Losses" value={totalLosses} />
      </div>
    </div>
  )
}

// ── Overview panel with tabs ──────────────────────────────────────────────────

type OverviewTab = "all" | "mexicano" | "americano" | "team_mexicano"

const OVERVIEW_TABS: Array<{ id: OverviewTab; label: string }> = [
  { id: "all", label: "All Stats" },
  { id: "mexicano", label: "Mexicano" },
  { id: "americano", label: "Americano" },
  { id: "team_mexicano", label: "Team Mexicano" },
]

interface OverviewPanelProps {
  stats: PlayerStats
  deepDive: PlayerDeepDive | null
}

function OverviewPanel({ stats, deepDive }: OverviewPanelProps) {
  const [activeTab, setActiveTab] = useState<OverviewTab>("all")

  function renderTabContent() {
    if (activeTab === "all") {
      const mexAvg =
        stats.mexicanoEventsPlayed > 0
          ? Math.round(stats.mexicanoScoreTotal / stats.mexicanoEventsPlayed)
          : "—"
      const tmAvg =
        stats.teamMexicanoEventsPlayed > 0
          ? Math.round(stats.teamMexicanoScoreTotal / stats.teamMexicanoEventsPlayed)
          : "—"
      return (
        <div className="stats-cards-row">
          <StatCard label="Events Attended" value={stats.eventsAttended} />
          <StatCard label="Event Wins" value={stats.eventWins} />
          <StatCard label="Mexicano Total" value={stats.mexicanoScoreTotal} />
          <StatCard label="TM Total" value={stats.teamMexicanoScoreTotal} />
          <StatCard label="Americano Total" value={stats.americanoScoreTotal} />
          <StatCard label="RB Score" value={stats.rbScoreTotal} />
          <StatCard label="Mex Avg/Event" value={mexAvg} />
          <StatCard label="TM Avg/Event" value={tmAvg} />
        </div>
      )
    }

    if (deepDive === null) {
      return <p className="muted">Loading…</p>
    }

    let wdl: MatchWDL
    if (activeTab === "mexicano") {
      wdl = deepDive.mexicano.matchWdl
    } else if (activeTab === "americano") {
      wdl = deepDive.americano.matchWdl
    } else {
      wdl = deepDive.teamMexicano.matchWdl
    }

    return (
      <div className="stats-cards-row">
        <StatCard label="Matches Played" value={wdl.wins + wdl.draws + wdl.losses} />
        <StatCard label="Wins" value={wdl.wins} />
        <StatCard label="Draws" value={wdl.draws} />
        <StatCard label="Losses" value={wdl.losses} />
      </div>
    )
  }

  return (
    <section className="panel">
      <h2 className="stats-section-heading">Overview</h2>

      {/* Tab pills */}
      <div className="dd-tab-bar" role="tablist" aria-label="Overview mode">
        {OVERVIEW_TABS.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            aria-controls={`ov-panel-${id}`}
            id={`ov-tab-${id}`}
            className={`dd-tab-pill${activeTab === id ? " dd-tab-pill--active" : ""}`}
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        id={`ov-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`ov-tab-${activeTab}`}
      >
        {renderTabContent()}
      </div>
    </section>
  )
}



function DeepDiveEmpty() {
  return (
    <p className="dd-empty-state muted">No data yet for this mode.</p>
  )
}

// ── Score-24 tab (Mexicano / Americano / Team Mexicano) ───────────────────────

interface Score24TabProps {
  data: Score24ModeStats
  tabLabel: string
}

function Score24Tab({ data, tabLabel }: Score24TabProps) {
  const hasData =
    data.avgScorePerRound.length > 0 || data.matchWdl.wins + data.matchWdl.draws + data.matchWdl.losses > 0

  if (!hasData) return <DeepDiveEmpty />

  const { wins, draws, losses } = data.matchWdl

  return (
    <div className="dd-tab-content">
      <div className="dd-two-col">
        {/* Left column: doughnut + line charts */}
        <div className="dd-col-left">
          {/* Win/Draw/Loss doughnut */}
          <div className="dd-row">
            <div className="stats-doughnut-wrapper">
              <Doughnut
                title={`${tabLabel} match win/draw/loss`}
                segments={[
                  { label: "Wins", value: wins, color: COLOR_TEAL },
                  { label: "Draws", value: draws, color: COLOR_AMBER },
                  { label: "Losses", value: losses, color: COLOR_RED },
                ]}
              />
            </div>
            <div className="stats-chart-details">
              <p className="stats-matches-played">
                {formatStatValue(wins + draws + losses, "matches played")}
              </p>
              <LegendRow color={COLOR_TEAL} label="Wins" value={wins} />
              <LegendRow color={COLOR_AMBER} label="Draws" value={draws} />
              <LegendRow color={COLOR_RED} label="Losses" value={losses} />
            </div>
          </div>

          {/* Avg score per round — multi-series line chart */}
          <AvgScoreLineChart
            allTime={data.avgScorePerRound}
            lastMonth={data.avgScorePerRoundLastMonth}
            lastWeek={data.avgScorePerRoundLastWeek}
          />

          {/* Avg court-score per round */}
          {(data.avgCourtScorePerRound.length > 0 || data.avgCourtScorePerRoundLastMonth.length > 0 || data.avgCourtScorePerRoundLastWeek.length > 0) && (
            <CourtLineChart
              allTime={data.avgCourtScorePerRound}
              lastMonth={data.avgCourtScorePerRoundLastMonth}
              lastWeek={data.avgCourtScorePerRoundLastWeek}
              avgCourtScoreOverall={data.avgCourtScoreOverall}
            />
          )}
        </div>

        {/* Right column: score distribution charts */}
        <div className="dd-col-right">
          {/* Score distribution — All courts */}
          <ScoreDistChart title="Score distribution — All courts" distribution={data.scoreDistribution} />

          {/* Score distribution — Per court */}
          {data.scoreDistributionPerCourt.map((c) => (
            <ScoreDistChart key={c.courtNumber} title={`Court ${c.courtNumber}`} distribution={c.distribution} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Ranked Box tab ────────────────────────────────────────────────────────────

interface RankedBoxTabProps {
  perRoundWdl: RoundWDL[]
  eloTimeline: EloPoint[]
}

function RankedBoxTab({ perRoundWdl, eloTimeline }: RankedBoxTabProps) {
  const hasData = perRoundWdl.length > 0 || eloTimeline.length > 0
  if (!hasData) return <DeepDiveEmpty />

  return (
    <div className="dd-tab-content">
      {perRoundWdl.length > 0 && (
        <div className="dd-chart-wrap">
          <p className="dd-chart-label">Win / Draw / Loss per round</p>
          <GroupedBarChart rounds={perRoundWdl} showDraw={true} title="Ranked Box per-round WDL" />
        </div>
      )}
      {eloTimeline.length > 0 && <EloLineChart timeline={eloTimeline} />}
    </div>
  )
}

// ── Winners Court tab ─────────────────────────────────────────────────────────

interface WinnersCourtTabProps {
  perRoundWdl: RoundWDL[]
  wcWins: number
  wcLosses: number
  wcMatchesPlayed: number
}

function WinnersCourtTab({ perRoundWdl, wcWins, wcLosses, wcMatchesPlayed }: WinnersCourtTabProps) {
  const hasData = perRoundWdl.length > 0
  if (!hasData) return <DeepDiveEmpty />

  return (
    <div className="dd-tab-content">
      {/* Summary doughnut */}
      <div className="dd-row">
        <div className="stats-doughnut-wrapper">
          <Doughnut
            title="WinnersCourt win/loss split"
            segments={[
              { label: "Wins", value: wcWins, color: COLOR_TEAL },
              { label: "Losses", value: wcLosses, color: COLOR_RED },
            ]}
          />
        </div>
        <div className="stats-chart-details">
          <p className="stats-matches-played">
            {formatStatValue(wcMatchesPlayed, "matches played")}
          </p>
          <LegendRow color={COLOR_TEAL} label="Wins" value={wcWins} />
          <LegendRow color={COLOR_RED} label="Losses" value={wcLosses} />
        </div>
      </div>
      <div className="dd-chart-wrap">
        <p className="dd-chart-label">Win / Loss per round</p>
        <GroupedBarChart rounds={perRoundWdl} showDraw={false} title="Winners Court per-round WL" />
      </div>
    </div>
  )
}

// ── Deep-dive panel ───────────────────────────────────────────────────────────

type DeepDiveTab = "mexicano" | "americano" | "team_mexicano" | "ranked_box" | "winners_court"

const TAB_LABELS: Array<{ id: DeepDiveTab; label: string }> = [
  { id: "mexicano", label: "Mexicano" },
  { id: "americano", label: "Americano" },
  { id: "team_mexicano", label: "Team Mexicano" },
  { id: "ranked_box", label: "Ranked Box" },
  { id: "winners_court", label: "Winners Court" },
]

interface DeepDivePanelProps {
  data: PlayerDeepDive
  stats: PlayerStats
}

function DeepDivePanel({ data, stats }: DeepDivePanelProps) {
  const [activeTab, setActiveTab] = useState<DeepDiveTab>("mexicano")

  return (
    <section className="panel">
      <h2 className="stats-section-heading">Deep Dive</h2>

      {/* Tab pills */}
      <div className="dd-tab-bar" role="tablist" aria-label="Event mode">
        {TAB_LABELS.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeTab === id}
            aria-controls={`dd-panel-${id}`}
            id={`dd-tab-${id}`}
            className={`dd-tab-pill${activeTab === id ? " dd-tab-pill--active" : ""}`}
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div
        id={`dd-panel-mexicano`}
        role="tabpanel"
        aria-labelledby="dd-tab-mexicano"
        hidden={activeTab !== "mexicano"}
      >
        <Score24Tab data={data.mexicano} tabLabel="Mexicano" />
      </div>
      <div
        id={`dd-panel-americano`}
        role="tabpanel"
        aria-labelledby="dd-tab-americano"
        hidden={activeTab !== "americano"}
      >
        <Score24Tab data={data.americano} tabLabel="Americano" />
      </div>
      <div
        id={`dd-panel-team_mexicano`}
        role="tabpanel"
        aria-labelledby="dd-tab-team_mexicano"
        hidden={activeTab !== "team_mexicano"}
      >
        <Score24Tab data={data.teamMexicano} tabLabel="Team Mexicano" />
      </div>
      <div
        id={`dd-panel-ranked_box`}
        role="tabpanel"
        aria-labelledby="dd-tab-ranked_box"
        hidden={activeTab !== "ranked_box"}
      >
        <RankedBoxTab perRoundWdl={data.rankedBox.perRoundWdl} eloTimeline={data.rankedBox.eloTimeline} />
      </div>
      <div
        id={`dd-panel-winners_court`}
        role="tabpanel"
        aria-labelledby="dd-tab-winners_court"
        hidden={activeTab !== "winners_court"}
      >
        <WinnersCourtTab
            perRoundWdl={data.winnersCourt.perRoundWdl}
            wcWins={stats.wcWins}
            wcLosses={stats.wcLosses}
            wcMatchesPlayed={stats.wcMatchesPlayed}
          />
      </div>
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PlayerStatsPage() {
  const { playerId } = useParams<{ playerId: string }>()
  const navigate = useNavigate()
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [deepDive, setDeepDive] = useState<PlayerDeepDive | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = () => {
    if (!playerId) return
    setLoading(true)
    setError("")
    Promise.all([getPlayerStats(playerId), getPlayerDeepDive(playerId)])
      .then(([s, dd]) => {
        setStats(s)
        setDeepDive(dd)
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
          {/* ── Overview (tabbed) ── */}
          <OverviewPanel stats={stats} deepDive={deepDive} />

          {/* ── Deep-dive panel ── */}
          {deepDive && <DeepDivePanel data={deepDive} stats={stats} />}
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
