from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env.local"
load_dotenv(dotenv_path=ENV_PATH, override=True)

from app.routes.health import router as health_router
from app.routes.system import router as system_router
from app.routes.heatmap import router as heatmap_router
from app.routes.assets import router as assets_router
from app.routes.signals import router as signals_router
from app.routes.gpt import router as gpt_router
from app.routes.history import router as history_router
from app.routes.workspace import router as workspace_router
from app.routes.update import router as update_router
from app.routes.seasonality import router as seasonality_router
from app.routes.scheduler import router as scheduler_router
from app.routes.scheduler import start_scheduler, stop_scheduler

app = FastAPI(title="Ktaliman Trading API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router,     prefix="/api")
app.include_router(system_router,     prefix="/api")
app.include_router(heatmap_router,    prefix="/api")
app.include_router(assets_router,     prefix="/api")
app.include_router(signals_router,    prefix="/api")
app.include_router(gpt_router,        prefix="/api")
app.include_router(workspace_router)
app.include_router(history_router,    prefix="/api")
app.include_router(update_router)
app.include_router(seasonality_router, prefix="/api")
app.include_router(scheduler_router)


@app.on_event("startup")
async def on_startup():
    start_scheduler()


@app.on_event("shutdown")
async def on_shutdown():
    stop_scheduler()
