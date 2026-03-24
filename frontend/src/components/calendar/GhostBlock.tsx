// GhostBlock — rendered inside a day column while dragging or creating.
// position: absolute; opacity: 0.45; pointer-events: none; z-index: 10
// border: 2px dashed var(--color-accent)

type GhostBlockProps = {
  top: number
  height: number
  label: string
  mode: "drag" | "create" | "invalid"
}

export default function GhostBlock({ top, height, label, mode }: GhostBlockProps) {
  return (
    <div
      className={`calendar-ghost-block calendar-ghost-block--${mode}`}
      aria-hidden="true"
      style={{
        position: "absolute",
        top: `${top}px`,
        height: `${height}px`,
        left: 0,
        right: 0,
        opacity: 0.45,
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      <span className="calendar-ghost-block__label">{label}</span>
    </div>
  )
}
