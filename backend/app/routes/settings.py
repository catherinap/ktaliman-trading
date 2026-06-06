"""
Backend app settings — persisted to a JSON file so that both the UI
and background jobs (scheduler / worker) read the same source of truth.

Currently stores:
  - email_language: "uk" | "en" | "sync"
      "sync" means: follow the UI language passed from the frontend.
      "uk"/"en" means: always use that language for email alerts.

The file lives next to the backend at backend/app_settings.json
"""

import json
import os
import logging
from pathlib import Path

logger = logging.getLogger(__name__)
router = None  # set below

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

# Path: backend/app_settings.json (one level up from app/routes/)
_SETTINGS_PATH = Path(__file__).resolve().parents[2] / "app_settings.json"

_DEFAULTS = {
    "email_language": "en",   # "uk" | "en" | "sync"
    "ui_language":    "en",   # last known UI language (for "sync" mode)
}


def _read() -> dict:
    try:
        if _SETTINGS_PATH.exists():
            with open(_SETTINGS_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            return {**_DEFAULTS, **data}
    except Exception as e:
        logger.warning(f"[Settings] read failed: {e}")
    return dict(_DEFAULTS)


def _write(data: dict) -> None:
    try:
        merged = {**_read(), **data}
        with open(_SETTINGS_PATH, "w", encoding="utf-8") as f:
            json.dump(merged, f, indent=2)
    except Exception as e:
        logger.error(f"[Settings] write failed: {e}")


def get_email_language() -> str:
    """
    Resolve the effective email language.
    If email_language == "sync", fall back to ui_language.
    Returns "uk" or "en".
    """
    s = _read()
    choice = s.get("email_language", "en")
    if choice == "sync":
        choice = s.get("ui_language", "en")
    return "uk" if choice == "uk" else "en"


# ── API ───────────────────────────────────────────────────────────────────────
class AppSettingsPayload(BaseModel):
    email_language: str | None = None   # "uk" | "en" | "sync"
    ui_language:    str | None = None   # "uk" | "en"


@router.get("/settings")
def get_settings():
    return _read()


@router.post("/settings")
def update_settings(payload: AppSettingsPayload):
    patch = {}
    if payload.email_language in ("uk", "en", "sync"):
        patch["email_language"] = payload.email_language
    if payload.ui_language in ("uk", "en"):
        patch["ui_language"] = payload.ui_language
    if patch:
        _write(patch)
    return _read()
