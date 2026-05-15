"""
COT Auto-Update Scheduler

CFTC publishes COT reports every Friday at ~15:30 EST (20:30 UTC).
This scheduler runs the worker automatically at 21:00 UTC every Friday
(30 min buffer to ensure data is published before we fetch).

Also provides:
  - GET  /api/scheduler/status  — current schedule info + next run time
  - POST /api/scheduler/trigger — manual trigger (same as /api/update/run)
"""

import logging
import threading
from datetime import datetime, timezone

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from fastapi import APIRouter

from app.routes.update import _run_worker, JOB_STATE, LOCK

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/scheduler", tags=["scheduler"])

# ── Scheduler instance ────────────────────────────────────────────────────────
_scheduler = BackgroundScheduler(timezone="UTC")
_SCHEDULE = {
    "day_of_week": "fri",   # Friday
    "hour":        20,      # 21:00 UTC = 16:00 EST / 17:00 EDT
    "minute":      0,
}

SCHEDULE_STATE = {
    "enabled":   True,
    "last_auto_run": None,
    "next_run":  None,
}


def _auto_run():
    """Called by scheduler — runs worker if not already running."""
    with LOCK:
        if JOB_STATE["status"] == "running":
            logger.info("[Scheduler] Worker already running — skipping auto-run.")
            return

    logger.info("[Scheduler] Auto-triggering COT worker (Friday update)...")
    SCHEDULE_STATE["last_auto_run"] = datetime.now(timezone.utc).isoformat()

    thread = threading.Thread(target=_run_worker, daemon=True)
    thread.start()


def start_scheduler():
    """Call this once on app startup."""
    _scheduler.add_job(
        _auto_run,
        trigger=CronTrigger(
            day_of_week=_SCHEDULE["day_of_week"],
            hour=_SCHEDULE["hour"],
            minute=_SCHEDULE["minute"],
            timezone="UTC",
        ),
        id="cot_weekly_update",
        name="COT Weekly Auto-Update",
        replace_existing=True,
        misfire_grace_time=3600,  # Run even if up to 1h late (server was down)
    )
    _scheduler.start()

    # Update next run time
    job = _scheduler.get_job("cot_weekly_update")
    if job and job.next_run_time:
        SCHEDULE_STATE["next_run"] = job.next_run_time.isoformat()

    logger.info(
        f"[Scheduler] Started. Next auto-run: {SCHEDULE_STATE['next_run']}"
    )


def stop_scheduler():
    """Call this on app shutdown."""
    if _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("[Scheduler] Stopped.")


# ── API routes ────────────────────────────────────────────────────────────────

@router.get("/status")
def get_scheduler_status():
    job = _scheduler.get_job("cot_weekly_update")
    next_run = job.next_run_time.isoformat() if job and job.next_run_time else None
    SCHEDULE_STATE["next_run"] = next_run

    with LOCK:
        worker_status = JOB_STATE["status"]
        last_run = JOB_STATE.get("finished_at")

    return {
        "scheduler_running": _scheduler.running,
        "enabled":           SCHEDULE_STATE["enabled"],
        "schedule":          "Every Friday at 21:00 UTC (16:00 EST / 17:00 EDT)",
        "next_run_utc":      next_run,
        "last_auto_run_utc": SCHEDULE_STATE["last_auto_run"],
        "worker_status":     worker_status,
        "last_worker_run":   last_run,
    }


@router.post("/trigger")
def trigger_manual():
    """Same as /api/update/run — triggers worker immediately."""
    with LOCK:
        if JOB_STATE["status"] == "running":
            return {"ok": False, "message": "Worker is already running."}

    thread = threading.Thread(target=_run_worker, daemon=True)
    thread.start()
    return {"ok": True, "message": "Worker triggered manually."}
