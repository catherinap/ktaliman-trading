import os
import sys
import threading
import subprocess
from datetime import datetime

from fastapi import APIRouter, HTTPException

from app.cache import clear_cache

router = APIRouter(prefix="/api/update", tags=["update"])

JOB_STATE = {
    "status": "idle",
    "started_at": None,
    "finished_at": None,
    "return_code": None,
    "log": "",
    "error": "",
}

LOCK = threading.Lock()


def _run_worker():
    worker_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "worker", "cot_python_worker.py")
    )

    with LOCK:
        JOB_STATE["status"] = "running"
        JOB_STATE["started_at"] = datetime.utcnow().isoformat()
        JOB_STATE["finished_at"] = None
        JOB_STATE["return_code"] = None
        JOB_STATE["log"] = ""
        JOB_STATE["error"] = ""

    try:
        result = subprocess.run(
            [sys.executable, worker_path],
            capture_output=True,
            text=True,
            cwd=os.path.dirname(worker_path),
            timeout=900,
        )

        combined_log = ""
        if result.stdout:
            combined_log += result.stdout
        if result.stderr:
            combined_log += ("\n" if combined_log else "") + result.stderr

        with LOCK:
            JOB_STATE["status"] = "success" if result.returncode == 0 else "error"
            JOB_STATE["finished_at"] = datetime.utcnow().isoformat()
            JOB_STATE["return_code"] = result.returncode
            JOB_STATE["log"] = combined_log[-12000:]
            JOB_STATE["error"] = "" if result.returncode == 0 else "Worker exited with error."

        if result.returncode == 0:
            clear_cache()  # свіжі дані — скидаємо кеш, щоб одразу підхопились
    except Exception as e:
        with LOCK:
            JOB_STATE["status"] = "error"
            JOB_STATE["finished_at"] = datetime.utcnow().isoformat()
            JOB_STATE["return_code"] = -1
            JOB_STATE["error"] = str(e)
            JOB_STATE["log"] = JOB_STATE["log"] + f"\n{e}"


@router.get("/status")
def get_update_status():
    with LOCK:
        return dict(JOB_STATE)


@router.post("/run")
def run_update():
    with LOCK:
        if JOB_STATE["status"] == "running":
            raise HTTPException(status_code=409, detail="Worker is already running.")

    thread = threading.Thread(target=_run_worker, daemon=True)
    thread.start()

    with LOCK:
        return {
            "ok": True,
            "message": "Worker started.",
            "status": JOB_STATE["status"],
            "started_at": JOB_STATE["started_at"],
        }