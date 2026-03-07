import { withInteractiveSurface } from "../../features/interaction/surfaceClass"
import { getEventModeLabel } from "../../lib/eventMode"

type Props = {
  selected: string
  onSelect: (value: "WinnersCourt" | "Mexicano" | "RankedBox") => void
  isTeamMexicano?: boolean
  onTeamMexicanoChange?: (v: boolean) => void
}

const modes: Array<{ key: "WinnersCourt" | "Mexicano" | "RankedBox"; blurb: string }> = [
  { key: "WinnersCourt", blurb: "Win/loss court movement" },
  { key: "Mexicano", blurb: "24-point score regrouping" },
  { key: "RankedBox", blurb: "3-round box rotations" },
]

export function ModeAccordion({ selected, onSelect, isTeamMexicano, onTeamMexicanoChange }: Props) {
  return (
    <div className="mode-list" aria-label="Game mode selector">
      {modes.map((mode) => {
        const active = selected === mode.key
        return (
          <button
            key={mode.key}
            className={withInteractiveSurface("mode-card")}
            data-active={active}
            onClick={() => onSelect(mode.key)}
          >
            <div className="mode-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{getEventModeLabel(mode.key)}</span>
              {mode.key === "Mexicano" && active && onTeamMexicanoChange !== undefined && (
                <button
                  type="button"
                  role="switch"
                  aria-checked={isTeamMexicano ?? false}
                  className={`toggle-switch${isTeamMexicano ? " toggle-switch--on" : ""}`}
                  onClick={(e) => { e.stopPropagation(); onTeamMexicanoChange(!(isTeamMexicano ?? false)) }}
                  aria-label="Team Mexicano mode"
                >
                  <span className="toggle-switch__thumb" />
                </button>
              )}
            </div>
            <div className="mode-copy">{mode.blurb}</div>
          </button>
        )
      })}
    </div>
  )
}
