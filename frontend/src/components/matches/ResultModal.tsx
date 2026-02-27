import { ModeInputs } from "../../features/run-event/modeInputs"
import type { EventType } from "../../lib/types"
import type { TeamSide, WinnerPayload } from "../../features/run-event/resultEntry"
import { withInteractiveSurface } from "../../features/interaction/surfaceClass"

type Props = {
  isOpen: boolean
  mode: EventType
  selectedSide: TeamSide
  selectedPayload?: WinnerPayload
  onClose: () => void
  onSubmitPayload: (payload: WinnerPayload) => void
}

export function ResultModal({
  isOpen,
  mode,
  selectedSide,
  selectedPayload,
  onClose,
  onSubmitPayload,
}: Props) {
  if (!isOpen) return null

  return (
    <div className="result-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="result-modal" role="dialog" aria-modal="true" aria-label="Submit match result" onClick={(e) => e.stopPropagation()}>
        <header className="result-modal-header">
          <h3 className="match-title">Submit Result</h3>
          <button type="button" className={withInteractiveSurface("button-secondary")} onClick={onClose}>Close</button>
        </header>

        <ModeInputs
          mode={mode}
          selectedSide={selectedSide}
          selectedPayload={selectedPayload}
          onPayload={onSubmitPayload}
        />
      </div>
    </div>
  )
}
