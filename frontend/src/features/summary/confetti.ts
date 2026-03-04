import confetti from "canvas-confetti"

const BURST_COUNT = 10
const BURST_INTERVAL_MS = 100

/**
 * Schedules 10 confetti bursts from random screen positions, one every 100ms.
 * Returns a cleanup function that cancels any pending bursts (for useEffect cleanup).
 *
 * Designed as progressive enhancement — if canvas-confetti fails, the caller
 * should swallow the error and let the page render normally.
 */
export function scheduleConfettiBursts(): () => void {
  const timeouts: ReturnType<typeof setTimeout>[] = []

  for (let i = 0; i < BURST_COUNT; i++) {
    const timeout = setTimeout(() => {
      confetti({
        origin: {
          x: Math.random(),
          y: Math.random() * 0.6,
        },
        particleCount: 60,
        spread: 70,
        startVelocity: 30,
      })
    }, i * BURST_INTERVAL_MS)
    timeouts.push(timeout)
  }

  return () => {
    for (const t of timeouts) clearTimeout(t)
  }
}
