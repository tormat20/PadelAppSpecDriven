export type CalendarInteractionMode = "idle" | "move" | "resize"

export const RESIZE_ZONE_HEIGHT_PX = 4

export function isInBottomResizeZone(eventHeightPx: number, offsetY: number, zonePx = RESIZE_ZONE_HEIGHT_PX): boolean {
  if (!Number.isFinite(eventHeightPx) || !Number.isFinite(offsetY)) return false
  if (eventHeightPx <= 0) return false
  const boundary = Math.max(eventHeightPx - zonePx, 0)
  return offsetY >= boundary && offsetY <= eventHeightPx
}

export function resolveInteractionMode(eventHeightPx: number, offsetY: number): CalendarInteractionMode {
  return isInBottomResizeZone(eventHeightPx, offsetY) ? "resize" : "move"
}
