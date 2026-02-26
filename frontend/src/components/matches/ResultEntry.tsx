type ResultEntryProps = {
  label: string
  onSelect: (value: string) => void
  options: string[]
  selectedValue?: string
  layout?: "dual" | "triple" | "grid24"
}

export function ResultEntry({ label, onSelect, options, selectedValue, layout }: ResultEntryProps) {
  return (
    <div className="result-entry">
      {label ? <p className="muted">{label}</p> : null}
      <div className="result-options" data-layout={layout}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className="result-option"
            data-selected={selectedValue === option}
            onClick={() => onSelect(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}
