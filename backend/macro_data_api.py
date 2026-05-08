# -*- coding: utf-8 -*-
import os
from datetime import datetime, timedelta, timezone

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS

load_dotenv(".env.local")

FINNHUB_API_KEY = os.getenv("FINNHUB_API_KEY", "").strip()

app = Flask(__name__)
CORS(app)


def finnhub_get(path, params=None):
    if params is None:
        params = {}

    params["token"] = FINNHUB_API_KEY
    url = f"https://finnhub.io/api/v1{path}"

    response = requests.get(url, params=params, timeout=30)
    response.raise_for_status()
    return response.json()


def safe_iso_from_unix(ts):
    try:
        return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()
    except Exception:
        return None


def safe_iso_from_string(value):
    if not value:
        return None

    raw = str(value).strip()

    for fmt in (
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
    ):
        try:
            return datetime.strptime(raw, fmt).replace(tzinfo=timezone.utc).isoformat()
        except Exception:
            continue

    return raw


def normalize_importance(value, title=""):
    v = str(value or "").strip().lower()
    if v in {"high", "3"}:
        return "high"
    if v in {"medium", "med", "2"}:
        return "medium"
    if v in {"low", "1"}:
        return "low"

    t = str(title or "").lower()
    if any(x in t for x in ["cpi", "pce", "nfp", "payroll", "gdp", "rate", "fomc", "inflation", "pmi"]):
        return "high"
    return "medium"


@app.route("/api/economic-calendar", methods=["GET"])
def economic_calendar():
    if not FINNHUB_API_KEY:
        return jsonify({
            "ok": False,
            "error": "Missing FINNHUB_API_KEY in .env.local"
        }), 500

    today = datetime.now(timezone.utc).date()
    to_day = today + timedelta(days=2)

    try:
        payload = finnhub_get(
            "/calendar/economic",
            {
                "from": today.isoformat(),
                "to": to_day.isoformat(),
            },
        )
    except Exception as e:
        return jsonify({
            "ok": False,
            "error": f"Finnhub economic calendar fetch failed: {e}"
        }), 500

    raw_events = payload.get("economicCalendar", payload if isinstance(payload, list) else [])
    events = []

    for item in raw_events:
        title = item.get("event") or item.get("title") or "Untitled event"
        dt_value = (
            item.get("time")
            or item.get("datetime")
            or item.get("date")
        )

        events.append({
            "id": str(item.get("id") or f"econ-{len(events)+1}"),
            "datetime": safe_iso_from_string(dt_value),
            "country": item.get("country") or "",
            "currency": item.get("currency") or "",
            "title": title,
            "importance": normalize_importance(item.get("impact"), title),
            "actual": item.get("actual"),
            "forecast": item.get("forecast"),
            "previous": item.get("prev") or item.get("previous"),
            "source": "Finnhub",
        })

    importance_rank = {"high": 0, "medium": 1, "low": 2}
    events.sort(key=lambda x: (importance_rank.get(x["importance"], 9), x["datetime"] or ""))

    return jsonify({
        "ok": True,
        "data": events[:12]
    })


@app.route("/api/market-news", methods=["GET"])
def market_news():
    if not FINNHUB_API_KEY:
        return jsonify({
            "ok": False,
            "error": "Missing FINNHUB_API_KEY in .env.local"
        }), 500

    categories = ["general", "forex", "crypto"]
    merged = []

    for category in categories:
        try:
            items = finnhub_get("/news", {"category": category})
        except Exception:
            items = []

        for item in items[:12]:
            merged.append({
                "id": f"{category}-{item.get('id') or item.get('headline')}",
                "published_at": safe_iso_from_unix(item.get("datetime")),
                "source": item.get("source") or "Finnhub",
                "title": item.get("headline") or "Untitled article",
                "summary": item.get("summary") or "",
                "url": item.get("url") or "#",
                "category": category,
                "image": item.get("image") or "",
            })

    seen = set()
    deduped = []

    for item in merged:
        key = str(item["title"]).strip().lower()
        if not key or key in seen:
            continue
        seen.add(key)
        deduped.append(item)

    deduped.sort(key=lambda x: x["published_at"] or "", reverse=True)

    return jsonify({
        "ok": True,
        "data": deduped[:12]
    })


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "ok": True,
        "service": "macro_data_api",
        "finnhub_configured": bool(FINNHUB_API_KEY),
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8001, debug=True)