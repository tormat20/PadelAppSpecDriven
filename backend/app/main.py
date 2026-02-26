from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers.events import router as events_router
from app.api.routers.health import router as health_router
from app.api.routers.players import router as players_router
from app.api.routers.rounds import router as rounds_router
from app.core.config import settings
from app.db.migrate import run_migrations


app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    run_migrations()


app.include_router(health_router)
app.include_router(players_router, prefix=settings.api_prefix)
app.include_router(events_router, prefix=settings.api_prefix)
app.include_router(rounds_router, prefix=settings.api_prefix)
