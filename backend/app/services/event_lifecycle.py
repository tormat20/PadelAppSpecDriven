from app.domain.enums import EventStatus, SetupStatus
from app.domain.models import Event


def derive_lifecycle_status(event: Event) -> str:
    if event.status == EventStatus.FINISHED:
        return "finished"
    if event.status == EventStatus.RUNNING:
        return "ongoing"
    return "ready" if event.setup_status == SetupStatus.READY else "planned"
