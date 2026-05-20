import os
import sys
import subprocess
import threading
from fastapi import APIRouter
from sqlalchemy import text
from app.db import engine

router = APIRouter()

# ── Worker state ──────────────────────────────────────────────────────────────
_worker_state = {
    "history": {"running": False, "last_status": None, "last_run": None},
    "update":  {"running": False, "last_status": None, "last_run": None},
}


def _find_worker_path() -> str:
    base = os.path.dirname(os.path.abspath(__file__))
    for levels in range(4):
        candidate = os.path.normpath(
            os.path.join(base, *[".."] * levels, "worker", "cot_python_worker.py")
        )
        if os.path.isfile(candidate):
            return candidate
    raise FileNotFoundError("cot_python_worker.py not found")


def _run_worker(mode: str):
    from datetime import datetime, timezone
    key = "history" if mode == "history" else "update"
    _worker_state[key]["running"] = True
    _worker_state[key]["last_status"] = "running"
    _worker_state[key]["last_run"] = datetime.now(timezone.utc).isoformat()
    try:
        worker_path = _find_worker_path()
        env = os.environ.copy()
        env["COT_MODE"] = mode
        result = subprocess.run(
            [sys.executable, worker_path],
            env=env, capture_output=True, text=True, timeout=3600,
        )
        _worker_state[key]["last_status"] = (
            "ok" if result.returncode == 0 else f"error (exit {result.returncode})"
        )
    except FileNotFoundError as e:
        _worker_state[key]["last_status"] = f"error: {e}"
    except subprocess.TimeoutExpired:
        _worker_state[key]["last_status"] = "error: timeout"
    except Exception as e:
        _worker_state[key]["last_status"] = f"error: {e}"
    finally:
        _worker_state[key]["running"] = False


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/system/status")
def system_status():
    with engine.connect() as conn:
        latest_date = conn.execute(text(
            "SELECT MAX(report_date) FROM cot_analytics"
        )).scalar()
        total_rows = conn.execute(text(
            "SELECT COUNT(*) FROM cot_analytics"
        )).scalar()
        asset_count = conn.execute(text(
            "SELECT COUNT(DISTINCT symbol) FROM cot_analytics"
        )).scalar()
    return {
        "latest_report_date": latest_date,
        "total_rows": total_rows,
        "asset_count": asset_count,
        "worker": _worker_state,
    }


@router.post("/system/run-history")
def run_history():
    """
    Full historical bootstrap (COT_MODE=history).
    Downloads all CFTC zip files 2016→present. Takes 10–30 min.
    Non-blocking — returns immediately, poll /system/worker-status.
    """
    if _worker_state["history"]["running"]:
        return {"ok": False, "message": "History bootstrap is already running."}
    threading.Thread(target=_run_worker, args=("history",), daemon=True).start()
    return {
        "ok": True,
        "message": "History bootstrap started. Takes 10–30 minutes. Poll /api/system/worker-status.",
        "mode": "history",
    }


@router.post("/system/run-update")
def run_update():
    """Weekly update — latest CFTC file only. Takes ~1 min."""
    if _worker_state["update"]["running"]:
        return {"ok": False, "message": "Weekly update is already running."}
    threading.Thread(target=_run_worker, args=("update",), daemon=True).start()
    return {"ok": True, "message": "Weekly update started.", "mode": "update"}


@router.get("/system/worker-status")
def worker_status():
    """Poll to track worker progress."""
    return {"ok": True, "worker": _worker_state}