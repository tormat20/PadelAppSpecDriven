import { useMemo } from "react"
import type { MouseEvent } from "react"

const ROOT = ":root"

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function isProximityAnimationEnabled(disabled: boolean, reducedMotion: boolean): boolean {
  return !disabled && !reducedMotion
}

export function toPercentage(value: number): string {
  return `${Math.max(0, Math.min(100, value)).toFixed(2)}%`
}

function findInteractiveSurface(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null
  return target.closest(".interactive-surface") as HTMLElement | null
}

function setSurfaceVariables(surface: HTMLElement, xPercent: string, yPercent: string) {
  surface.style.setProperty("--proximity-x", xPercent)
  surface.style.setProperty("--proximity-y", yPercent)
  surface.style.setProperty("--proximity-opacity", "1")
}

function resetSurfaceVariables(surface: HTMLElement) {
  surface.style.removeProperty("--proximity-x")
  surface.style.removeProperty("--proximity-y")
  surface.style.removeProperty("--proximity-opacity")
}

function isPointerStillWithinSurface(surface: HTMLElement, relatedTarget: EventTarget | null): boolean {
  return relatedTarget instanceof Node && surface.contains(relatedTarget)
}

export function usePointerProximity() {
  return useMemo(
    () => ({
      onMouseMoveCapture: (event: MouseEvent<HTMLElement>) => {
        const surface = findInteractiveSurface(event.target)
        if (!surface) return

        const isDisabled = surface.matches(":disabled") || surface.getAttribute("aria-disabled") === "true"
        const reducedMotion = prefersReducedMotion()
        if (!isProximityAnimationEnabled(isDisabled, reducedMotion)) {
          resetSurfaceVariables(surface)
          return
        }

        const rect = surface.getBoundingClientRect()
        if (!rect.width || !rect.height) return

        const x = ((event.clientX - rect.left) / rect.width) * 100
        const y = ((event.clientY - rect.top) / rect.height) * 100
        setSurfaceVariables(surface, toPercentage(x), toPercentage(y))
      },
      onMouseOutCapture: (event: MouseEvent<HTMLElement>) => {
        const surface = findInteractiveSurface(event.target)
        if (!surface) return
        if (isPointerStillWithinSurface(surface, event.relatedTarget)) return
        resetSurfaceVariables(surface)
      },
      rootSelector: ROOT,
    }),
    [],
  )
}
