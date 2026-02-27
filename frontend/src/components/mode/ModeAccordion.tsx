type Props = {
  selected: string
  onSelect: (value: "Americano" | "Mexicano" | "BeatTheBox") => void
}

const modes: Array<{ key: "Americano" | "Mexicano" | "BeatTheBox"; blurb: string }> = [
  { key: "Americano", blurb: "Win/loss court movement" },
  { key: "Mexicano", blurb: "24-point score regrouping" },
  { key: "BeatTheBox", blurb: "3-round box rotations" },
]

export function ModeAccordion({ selected, onSelect }: Props) {
  return (
    <div className="mode-list" aria-label="Game mode selector">
      {modes.map((mode) => {
        const active = selected === mode.key
        return (
          <button
            key={mode.key}
            className="mode-card"
            data-active={active}
            onClick={() => onSelect(mode.key)}
          >
            <div className="mode-title">{mode.key}</div>
            <div className="mode-copy">{mode.blurb}</div>
          </button>
        )
      })}
    </div>
  )
}
