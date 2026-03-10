import type { EventRecord } from "../../lib/types"
import type { DrawerState } from "../../pages/Calendar"

// Stub — full implementation in Phase 5 (T035)
type EventDrawerProps = {
  state: DrawerState
  onSave: (payload: Partial<EventRecord>) => void
  onDelete: (eventId: string) => void
  onClose: () => void
}

export default function EventDrawer({ state, onClose }: EventDrawerProps) {
  if (!state.open) return null

  return (
    <div
      className="calendar-drawer"
      role="dialog"
      aria-label="Event details"
      data-testid="event-drawer"
    >
      <button
        className="calendar-drawer__close"
        aria-label="Close drawer"
        onClick={onClose}
        type="button"
      >
        ×
      </button>
      {/* Full drawer content implemented in Phase 5 */}
      <div className="calendar-drawer__body" />
    </div>
  )
}
