/**
 * SVG chart primitives: doughnut arcs, bar segments, stacked bars, line points.
 *
 * All helpers are pure functions — no DOM/React dependencies.
 *
 * Doughnut: the 100%/0% edge case is handled by splitting the 100% segment
 * into two 180° arcs — SVG arcs with sweep-flag=1 cannot cover exactly 360°.
 * All-zeros case: returns a single grey placeholder ring.
 */

export type ChartSegment = {
  label: string
  value: number
  color: string
  /** SVG path `d` attribute for the arc */
  arcPath: string
}

const EMPTY_COLOR = "#d1d5db"

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

function arcPoint(cx: number, cy: number, radius: number, angleRad: number): [number, number] {
  return [cx + radius * Math.cos(angleRad), cy + radius * Math.sin(angleRad)]
}

/**
 * Build the SVG `d` path for a single doughnut ring segment.
 *
 * @param cx       - centre x
 * @param cy       - centre y
 * @param r        - outer radius
 * @param innerR   - inner radius (hole)
 * @param startDeg - start angle in degrees (0 = 3 o'clock)
 * @param endDeg   - end angle in degrees
 */
function buildArcPath(
  cx: number,
  cy: number,
  r: number,
  innerR: number,
  startDeg: number,
  endDeg: number,
): string {
  const startRad = toRad(startDeg)
  const endRad = toRad(endDeg)
  const [ox1, oy1] = arcPoint(cx, cy, r, startRad)
  const [ox2, oy2] = arcPoint(cx, cy, r, endRad)
  const [ix1, iy1] = arcPoint(cx, cy, innerR, endRad)
  const [ix2, iy2] = arcPoint(cx, cy, innerR, startRad)
  const largeArc = endDeg - startDeg > 180 ? 1 : 0
  return [
    `M ${ox1} ${oy1}`,
    `A ${r} ${r} 0 ${largeArc} 1 ${ox2} ${oy2}`,
    `L ${ix1} ${iy1}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2}`,
    "Z",
  ].join(" ")
}

/**
 * Build an array of SVG arc segments for a doughnut chart.
 * Returns a single "empty" grey segment if all values are zero.
 */
export function buildDoughnutSegments(
  segments: Array<{ label: string; value: number; color: string }>,
  cx: number,
  cy: number,
  r: number,
  innerR: number,
): ChartSegment[] {
  const total = segments.reduce((sum, s) => sum + s.value, 0)

  // All-zeros fallback — one grey full ring (two 180° arcs to avoid the 360° limitation)
  if (total === 0) {
    const path =
      buildArcPath(cx, cy, r, innerR, -90, 90) +
      " " +
      buildArcPath(cx, cy, r, innerR, 90, 270)
    return [{ label: "empty", value: 0, color: EMPTY_COLOR, arcPath: path }]
  }

  // 100% single-segment case — render using two 180° arcs
  const nonZero = segments.filter((s) => s.value > 0)
  if (nonZero.length === 1) {
    const seg = nonZero[0]
    const arc1 = buildArcPath(cx, cy, r, innerR, -90, 90)
    const arc2 = buildArcPath(cx, cy, r, innerR, 90, 270)
    return [
      { label: seg.label, value: seg.value, color: seg.color, arcPath: arc1 },
      { label: seg.label, value: seg.value, color: seg.color, arcPath: arc2 },
    ]
  }

  // Normal multi-segment case
  const result: ChartSegment[] = []
  let currentDeg = -90 // start at 12 o'clock

  for (const seg of segments) {
    if (seg.value === 0) continue
    const fraction = seg.value / total
    const sweep = fraction * 360
    const startDeg = currentDeg
    const endDeg = currentDeg + sweep
    result.push({
      label: seg.label,
      value: seg.value,
      color: seg.color,
      arcPath: buildArcPath(cx, cy, r, innerR, startDeg, endDeg),
    })
    currentDeg = endDeg
  }

  return result
}

// ── Bar chart ─────────────────────────────────────────────────────────────────

export type BarSegment = {
  /** Round or X-axis label */
  label: string
  /** Absolute value for this bar */
  value: number
  color: string
  /** x offset within the SVG viewBox */
  x: number
  /** y offset (top of the bar) */
  y: number
  width: number
  height: number
}

/**
 * Build an array of bar rects for a simple vertical bar chart.
 *
 * @param items     - data points with label + value
 * @param color     - fill colour for all bars
 * @param svgW      - SVG total width
 * @param svgH      - SVG total height
 * @param paddingX  - horizontal padding (each side)
 * @param paddingY  - vertical padding (each side)
 * @param yMin      - axis minimum
 * @param yMax      - axis maximum
 */
export function buildBarSegments(
  items: Array<{ label: string; value: number }>,
  color: string,
  svgW: number,
  svgH: number,
  paddingX: number,
  paddingY: number,
  yMin: number,
  yMax: number,
): BarSegment[] {
  if (items.length === 0) return []
  const plotW = svgW - paddingX * 2
  const plotH = svgH - paddingY * 2
  const barW = Math.max(4, plotW / items.length - 4)
  const range = yMax - yMin || 1

  return items.map((item, i) => {
    const slotW = plotW / items.length
    const x = paddingX + i * slotW + (slotW - barW) / 2
    const fraction = (item.value - yMin) / range
    const h = Math.max(1, fraction * plotH)
    const y = paddingY + plotH - h
    return { label: item.label, value: item.value, color, x, y, width: barW, height: h }
  })
}

// ── Stacked proportional bar chart ───────────────────────────────────────────

export type StackedBarRect = {
  /** Round label */
  roundLabel: string
  /** Segment label: "Win" | "Draw" | "Loss" */
  segmentLabel: string
  color: string
  /** 0–1 proportion within the bar */
  proportion: number
  /** x position */
  x: number
  /** y position (top of rect) */
  y: number
  width: number
  height: number
  /** Raw count for tooltip/legend */
  count: number
}

export type StackedBarColumn = {
  roundLabel: string
  rects: StackedBarRect[]
}

/**
 * Build proportional stacked bars summing to 100%.
 * Segments order: wins (teal) / draws (amber) / losses (red).
 * Rounds with total = 0 are omitted.
 *
 * @param rounds  - per-round WDL data
 * @param colors  - { win, draw, loss }
 * @param svgW    - total SVG width
 * @param svgH    - total SVG height
 * @param padX    - horizontal padding
 * @param padY    - vertical padding
 */
export function buildStackedBars(
  rounds: Array<{ round: number; wins: number; draws: number; losses: number }>,
  colors: { win: string; draw: string; loss: string },
  svgW: number,
  svgH: number,
  padX: number,
  padY: number,
): StackedBarColumn[] {
  const activeRounds = rounds.filter((r) => r.wins + r.draws + r.losses > 0)
  if (activeRounds.length === 0) return []

  const plotW = svgW - padX * 2
  const plotH = svgH - padY * 2
  const barW = Math.max(8, plotW / activeRounds.length - 6)

  return activeRounds.map((r, i) => {
    const total = r.wins + r.draws + r.losses
    const segments = [
      { label: "Win", color: colors.win, count: r.wins },
      { label: "Draw", color: colors.draw, count: r.draws },
      { label: "Loss", color: colors.loss, count: r.losses },
    ]
    const slotW = plotW / activeRounds.length
    const x = padX + i * slotW + (slotW - barW) / 2
    let runningY = padY
    const rects: StackedBarRect[] = []
    for (const seg of segments) {
      const proportion = seg.count / total
      const h = proportion * plotH
      if (h > 0) {
        rects.push({
          roundLabel: `R${r.round}`,
          segmentLabel: seg.label,
          color: seg.color,
          proportion,
          x,
          y: runningY,
          width: barW,
          height: h,
          count: seg.count,
        })
        runningY += h
      }
    }
    return { roundLabel: `R${r.round}`, rects }
  })
}

// ── Line chart ────────────────────────────────────────────────────────────────

export type LinePoint = {
  /** Formatted label for X axis */
  dateLabel: string
  cumulativeScore: number
  /** SVG x coordinate */
  x: number
  /** SVG y coordinate */
  y: number
}

/**
 * Build SVG (x, y) coordinates for a line chart of cumulative elo scores.
 *
 * @param points  - sorted list of { eventDate: "YYYY-MM-DD", cumulativeScore }
 * @param svgW    - total SVG width
 * @param svgH    - total SVG height
 * @param padX    - horizontal padding
 * @param padY    - vertical padding
 */
export function buildLinePoints(
  points: Array<{ eventDate: string; cumulativeScore: number }>,
  svgW: number,
  svgH: number,
  padX: number,
  padY: number,
): LinePoint[] {
  if (points.length === 0) return []

  const plotW = svgW - padX * 2
  const plotH = svgH - padY * 2
  const scores = points.map((p) => p.cumulativeScore)
  const minScore = Math.min(...scores)
  const maxScore = Math.max(...scores)
  const range = maxScore - minScore || 1

  return points.map((p, i) => {
    const x = points.length === 1 ? padX + plotW / 2 : padX + (i / (points.length - 1)) * plotW
    const y = padY + plotH - ((p.cumulativeScore - minScore) / range) * plotH
    // "15 Mar" style date label
    const d = new Date(p.eventDate)
    const dateLabel = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    return { dateLabel, cumulativeScore: p.cumulativeScore, x, y }
  })
}
