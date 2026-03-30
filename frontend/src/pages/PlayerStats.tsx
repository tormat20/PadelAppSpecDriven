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
  RoundAvgCourt,
  RoundAvgScore,
  RoundWDL,
  Score24ModeStats,
} from "../lib/types"

// ── Colour constants ──────────────────────────────────────────────────────────

const COLOR_TEAL = "#0c8a8f"
const COLOR_RED = "#ef4444"
const COLOR_AMBER = "#f59e0b"

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

// ── Avg Score Bar Chart ───────────────────────────────────────────────────────

const BAR_W = 340
const BAR_H = 120
const BAR_PAD_X = 32
const BAR_PAD_Y = 12
const SCORE24_Y_MIN = 0
const SCORE24_Y_MAX = 24

interface AvgScoreBarChartProps {
  data: RoundAvgScore[]
}

function AvgScoreBarChart({ data }: AvgScoreBarChartProps) {
  const bars = buildBarSegments(
    data.map((r) => ({ label: `R${r.round}`, value: r.avgScore })),
    COLOR_TEAL,
    BAR_W,
    BAR_H,
    BAR_PAD_X,
    BAR_PAD_Y,
    SCORE24_Y_MIN,
    SCORE24_Y_MAX,
  )
  const plotH = BAR_H - BAR_PAD_Y * 2

  return (
    <div className="dd-chart-wrap" aria-label="Average score per round">
      <p className="dd-chart-label">Avg score per round</p>
      <div className="dd-chart-scroll">
        <svg
          width={Math.max(BAR_W, data.length * 32)}
          height={BAR_H}
          viewBox={`0 0 ${Math.max(BAR_W, data.length * 32)} ${BAR_H}`}
          role="img"
          aria-label="Average score per round bar chart"
        >
          {/* Y-axis reference lines */}
          {[0, 6, 12, 18, 24].map((v) => {
            const y = BAR_PAD_Y + plotH - ((v - SCORE24_Y_MIN) / (SCORE24_Y_MAX - SCORE24_Y_MIN)) * plotH
            return (
              <g key={v}>
                <line
                  x1={BAR_PAD_X}
                  y1={y}
                  x2={Math.max(BAR_W, data.length * 32) - BAR_PAD_X}
                  y2={y}
                  stroke="var(--color-border)"
                  strokeWidth={1}
                />
                <text x={BAR_PAD_X - 4} y={y + 4} textAnchor="end" className="dd-axis-tick">
                  {v}
                </text>
              </g>
            )
          })}
          {/* Bars */}
          {bars.map((b) => (
            <g key={b.label}>
              <rect x={b.x} y={b.y} width={b.width} height={b.height} fill={b.color} rx={3} />
            </g>
          ))}
          {/* X-axis labels */}
          {bars.map((b) => (
            <text
              key={`lbl-${b.label}`}
              x={b.x + b.width / 2}
              y={BAR_H - 2}
              textAnchor="middle"
              className="dd-axis-tick"
            >
              {b.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  )
}

// ── Avg Court Bar Chart ───────────────────────────────────────────────────────

interface AvgCourtBarChartProps {
  data: RoundAvgCourt[]
  avgCourtOverall: number | null
}

function AvgCourtBarChart({ data, avgCourtOverall }: AvgCourtBarChartProps) {
  if (data.length === 0) return null
  const maxCourt = Math.max(...data.map((r) => r.avgCourt), 1)
  const bars = buildBarSegments(
    data.map((r) => ({ label: `R${r.round}`, value: r.avgCourt })),
    COLOR_TEAL,
    BAR_W,
    BAR_H,
    BAR_PAD_X,
    BAR_PAD_Y,
    1,
    maxCourt,
  )
  const plotH = BAR_H - BAR_PAD_Y * 2

  return (
    <div className="dd-chart-wrap" aria-label="Average court per round">
      <p className="dd-chart-label">
        Avg court per round
        {avgCourtOverall !== null && (
          <span className="dd-sub-stat"> — overall avg: {avgCourtOverall.toFixed(1)}</span>
        )}
      </p>
      <div className="dd-chart-scroll">
        <svg
          width={Math.max(BAR_W, data.length * 32)}
          height={BAR_H}
          viewBox={`0 0 ${Math.max(BAR_W, data.length * 32)} ${BAR_H}`}
          role="img"
          aria-label="Average court per round bar chart"
        >
          {/* Y-axis reference lines */}
          {[1, Math.ceil(maxCourt / 2), Math.ceil(maxCourt)].map((v) => {
            const y = BAR_PAD_Y + plotH - ((v - 1) / (maxCourt - 1 || 1)) * plotH
            return (
              <g key={v}>
                <line
                  x1={BAR_PAD_X}
                  y1={y}
                  x2={Math.max(BAR_W, data.length * 32) - BAR_PAD_X}
                  y2={y}
                  stroke="var(--color-border)"
                  strokeWidth={1}
                />
                <text x={BAR_PAD_X - 4} y={y + 4} textAnchor="end" className="dd-axis-tick">
                  {v}
                </text>
              </g>
            )
          })}
          {bars.map((b) => (
            <g key={b.label}>
              <rect x={b.x} y={b.y} width={b.width} height={b.height} fill={b.color} rx={3} />
            </g>
          ))}
          {bars.map((b) => (
            <text
              key={`lbl-${b.label}`}
              x={b.x + b.width / 2}
              y={BAR_H - 2}
              textAnchor="middle"
              className="dd-axis-tick"
            >
              {b.label}
            </text>
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
      return (
        <div className="stats-cards-row">
          <StatCard label="Events Attended" value={stats.eventsAttended} />
          <StatCard label="Event Wins" value={stats.eventWins} />
          <StatCard label="Mexicano Total" value={stats.mexicanoScoreTotal} />
          <StatCard label="Americano Total" value={stats.americanoScoreTotal} />
          <StatCard label="RB Score" value={stats.rbScoreTotal} />
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
      {/* Avg score per round */}
      {data.avgScorePerRound.length > 0 && <AvgScoreBarChart data={data.avgScorePerRound} />}

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

      {/* Avg court per round */}
      {data.avgCourtPerRound.length > 0 && (
        <AvgCourtBarChart data={data.avgCourtPerRound} avgCourtOverall={data.avgCourtOverall} />
      )}
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
