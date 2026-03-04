import { buildPodiumSlots } from "../../features/summary/podium"
import type { EventType, ProgressSummaryPlayerRow } from "../../lib/types"

type PodiumProps = {
  eventType: EventType
  playerRows: ProgressSummaryPlayerRow[]
}

/**
 * Renders a 3-position winner podium.
 * Visual layout: 2nd (left) · 1st (center, tallest) · 3rd (right)
 *
 * Mexicano:     1 player per slot
 * WinnersCourt: 2 players per slot
 * BeatTheBox:   not rendered (caller is responsible for the guard)
 */
export function Podium({ eventType, playerRows }: PodiumProps) {
  const slots = buildPodiumSlots(eventType, playerRows)

  if (slots.length === 0) return null

  // Reorder for visual display: 2nd left, 1st center, 3rd right
  const ordered = [
    slots.find((s) => s.place === 2),
    slots.find((s) => s.place === 1),
    slots.find((s) => s.place === 3),
  ].filter(Boolean) as NonNullable<(typeof slots)[number]>[]

  return (
    <section className="podium-container panel" aria-label="Winner podium">
      {ordered.map((slot) => (
        <div
          key={slot.place}
          className={`podium-slot ${slot.heightClass}`}
          aria-label={`${slot.label} place`}
        >
          <div className="podium-players">
            {slot.players.map((name) => (
              <span key={name} className="podium-player-name">
                {name}
              </span>
            ))}
          </div>
          <div className="podium-block">
            <span className="podium-place-label">{slot.label}</span>
          </div>
        </div>
      ))}
    </section>
  )
}
