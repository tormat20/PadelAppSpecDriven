import { withInteractiveSurface } from "../../features/interaction/surfaceClass"
import { getEventModeLabel } from "../../lib/eventMode"
import { getEventTypeVisualClass } from "../calendar/eventTypeVisualMap"

type Props = {
  selected: string
  onSelect: (value: "WinnersCourt" | "Mexicano" | "RankedBox" | "Americano") => void
  isTeamMexicano?: boolean
  onTeamMexicanoChange?: (v: boolean) => void
}

const modes: Array<{ key: "WinnersCourt" | "Mexicano" | "RankedBox" | "Americano"; blurb: string }> = [
  { key: "WinnersCourt", blurb: "Win/loss court movement" },
  { key: "Mexicano", blurb: "24-point score regrouping" },
  { key: "Americano", blurb: "Pre-set Whist schedule, 24-point scoring" },
  { key: "RankedBox", blurb: "3-round box rotations" },
]

export function ModeAccordion({ selected, onSelect, isTeamMexicano, onTeamMexicanoChange }: Props) {
  return (
    <div className="mode-list" aria-label="Game mode selector">
      {modes.map((mode) => {
        const active = selected === mode.key
        const visualClass = getEventTypeVisualClass(
          mode.key,
          mode.key === "Mexicano" && Boolean(isTeamMexicano),
        )
        return (
          <div
            key={mode.key}
            className={withInteractiveSurface(`mode-card ${visualClass}`)}
            data-active={active}
            role="button"
            tabIndex={0}
            aria-pressed={active}
            onClick={() => onSelect(mode.key)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                onSelect(mode.key)
              }
            }}
          >
            <div className="mode-title mode-title--row">
              <span>{getEventModeLabel(mode.key)}</span>
              {mode.key === "Mexicano" && onTeamMexicanoChange !== undefined && (
                <span className="team-mexicano-inline" onClick={(e) => e.stopPropagation()}>
                  <span className="team-mexicano-inline__label">Team Mexicano</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isTeamMexicano ?? false}
                    className={`toggle-switch${isTeamMexicano ? " toggle-switch--on" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!active) onSelect("Mexicano")
                      onTeamMexicanoChange(!(isTeamMexicano ?? false))
                    }}
                    aria-label="Team Mexicano mode"
                  >
                    <span className="toggle-switch__thumb" />
                  </button>
                </span>
              )}
            </div>
            <div className="mode-copy">{mode.blurb}</div>
          </div>
        )
      })}
    </div>
  )
}
