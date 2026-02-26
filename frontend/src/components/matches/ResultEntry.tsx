type ResultEntryProps = {
  label: string
  onSelect: (value: string) => void
  options: string[]
}

export function ResultEntry({ label, onSelect, options }: ResultEntryProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className="rounded-md border px-3 py-1 text-sm"
            onClick={() => onSelect(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}
