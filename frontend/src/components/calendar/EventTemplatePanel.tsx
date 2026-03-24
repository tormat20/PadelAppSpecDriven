import { withInteractiveSurface } from "../../features/interaction/surfaceClass"
import {
  CALENDAR_TEMPLATE_DRAG_TYPE,
  CALENDAR_TEMPLATE_TYPES,
  type CalendarTemplateType,
} from "./calendarTemplateTypes"
import { getEventTypeVisualClass } from "./eventTypeVisualMap"

type EventTemplatePanelProps = {
  onTemplateClick?: (template: CalendarTemplateType) => void
  deleteDropHover?: boolean
  onDeleteDrop?: (e: React.DragEvent<HTMLButtonElement>) => void
  onDeleteDragOver?: (e: React.DragEvent<HTMLButtonElement>) => void
  onDeleteDragLeave?: () => void
  isRecurringSelectMode?: boolean
  recurringSelectedCount?: number
  recurringSaving?: boolean
  isCollapsed?: boolean
  onCollapseToggle?: () => void
  onRecurringModeToggle?: () => void
  onRecurringSave?: () => void
  onRecurringCancel?: () => void
}

export default function EventTemplatePanel({
  onTemplateClick,
  deleteDropHover = false,
  onDeleteDrop,
  onDeleteDragOver,
  onDeleteDragLeave,
  isRecurringSelectMode = false,
  recurringSelectedCount = 0,
  recurringSaving = false,
  isCollapsed = false,
  onCollapseToggle,
  onRecurringModeToggle,
  onRecurringSave,
  onRecurringCancel,
}: EventTemplatePanelProps) {
  return (
    <aside
      className={`panel calendar-template-panel${isCollapsed ? " calendar-template-panel--collapsed" : ""}`}
      aria-label="Event templates"
    >
      <div className="calendar-template-panel__header">
        {!isCollapsed && <h2 className="calendar-template-panel__title">Event Templates</h2>}
        <button
          type="button"
          className={withInteractiveSurface("calendar-template-panel__collapse")}
          onClick={onCollapseToggle}
          aria-label={isCollapsed ? "Expand event template panel" : "Collapse event template panel"}
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? "+" : "-"}
        </button>
      </div>

      {isCollapsed ? null : (
        <>
          <p className="calendar-template-panel__copy">Drag a template into the week grid to create an event slot.</p>
      <div className="calendar-template-panel__list">
        {CALENDAR_TEMPLATE_TYPES.map((template) => (
          <button
            key={template.templateId}
            type="button"
            draggable
            className={withInteractiveSurface(
              [
                "button-secondary calendar-template-item",
                getEventTypeVisualClass(template.eventType, template.isTeamMexicano),
              ].join(" "),
            )}
            onDragStart={(e) => {
              e.dataTransfer.setData(CALENDAR_TEMPLATE_DRAG_TYPE, template.templateId)
              e.dataTransfer.effectAllowed = "copyMove"
            }}
            onClick={() => onTemplateClick?.(template)}
          >
            <span className="calendar-template-item__title">{template.displayLabel}</span>
            <span className="calendar-template-item__hint">Drag to calendar</span>
          </button>
        ))}
      </div>
      <div className="calendar-template-panel__recurring-actions">
        {!isRecurringSelectMode ? (
          <button
            type="button"
            className={withInteractiveSurface("button-secondary")}
            onClick={onRecurringModeToggle}
          >
            Select Recurring
          </button>
        ) : (
          <>
            <p className="calendar-template-panel__recurring-copy">
              {recurringSelectedCount} selected
            </p>
            <div className="calendar-template-panel__recurring-buttons">
              <button
                type="button"
                className={withInteractiveSurface("button-secondary")}
                onClick={onRecurringCancel}
                disabled={recurringSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className={withInteractiveSurface("button")}
                onClick={onRecurringSave}
                disabled={recurringSaving || recurringSelectedCount === 0}
              >
                {recurringSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </>
        )}
      </div>
      <button
        type="button"
        className="calendar-template-trash"
        data-active={deleteDropHover}
        onDrop={onDeleteDrop}
        onDragOver={onDeleteDragOver}
        onDragLeave={onDeleteDragLeave}
        aria-label="Delete calendar event"
        title="Drag event blocks here to delete"
      >
        <span className="calendar-template-trash__icon" aria-hidden="true">🗑</span>
      </button>
        </>
      )}
    </aside>
  )
}
