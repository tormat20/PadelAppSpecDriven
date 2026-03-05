/**
 * SVG arc path segment data for doughnut charts.
 *
 * The 100% / 0% edge case is handled by splitting the 100% segment into two
 * 180° arcs — SVG arcs with sweep-flag=1 cannot cover exactly 360°.
 *
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
