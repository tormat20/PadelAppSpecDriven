import { withInteractiveSurface } from "../../features/interaction/surfaceClass"
import {
  CALENDAR_TEMPLATE_DRAG_TYPE,
  CALENDAR_TEMPLATE_TYPES,
  type CalendarTemplateType,
} from "./calendarTemplateTypes"
import { getEventTypeVisualClass } from "./eventTypeVisualMap"

type EventTemplatePanelProps = {
  onTemplateClick?: (template: CalendarTemplateType) => void
}

export default function EventTemplatePanel({ onTemplateClick }: EventTemplatePanelProps) {
  return (
    <aside className="panel calendar-template-panel" aria-label="Event templates">
      <h2 className="calendar-template-panel__title">Event Templates</h2>
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
    </aside>
  )
}
