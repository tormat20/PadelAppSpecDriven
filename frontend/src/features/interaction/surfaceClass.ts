const SURFACE_CLASS = "interactive-surface"

export function withInteractiveSurface(className: string): string {
  const normalized = className.trim()
  if (!normalized) return SURFACE_CLASS
  if (normalized.split(/\s+/).includes(SURFACE_CLASS)) return normalized
  return `${normalized} ${SURFACE_CLASS}`
}

export function hasInteractiveSurface(className: string): boolean {
  return className.split(/\s+/).includes(SURFACE_CLASS)
}
