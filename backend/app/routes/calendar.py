"""
calendar.py — Economic Calendar aggregator with impact/country filters.
"""

from fastapi import APIRouter, Query
from datetime import datetime, timezone, timedelta
from typing import Optional
import feedparser
import requests
import os
import time
import threading
import re

router = APIRouter()

_cache: dict = {"items": [], "fetched_at": 0}
_cache_lock = threading.Lock()
CACHE_TTL = 1800

HIGH_KEYWORDS = [
    "federal funds", "fomc", "interest rate decision", "rate decision",
    "nonfarm payroll", "non-farm", "unemployment rate", "cpi", "consumer price",
    "pce", "gdp", "gross domestic product", "ecb rate", "bank of england",
    "bank of japan", "fed chair", "powell", "lagarde", "inflation",
]
MEDIUM_KEYWORDS = [
    "ppi", "producer price", "retail sales", "ism", "pmi",
    "housing starts", "durable goods", "trade balance", "industrial production",
    "consumer confidence", "jolts", "adp employment",
]

ALLOWED_COUNTRIES = ("US", "EU", "GB", "JP", "CN", "DE", "FR", "CA", "AU")


def classify_importance(title: str, summary: str = "") -> str:
    text = (title + " " + summary).lower()
    if any(k in text for k in HIGH_KEYWORDS):
        return "high"
    if any(k in text for k in MEDIUM_KEYWORDS):
        return "medium"
    return "low"


def parse_date(entry):
    for field in ["published_parsed", "updated_parsed"]:
        val = getattr(entry, field, None)
        if val:
            try:
                return datetime(*val[:6], tzinfo=timezone.utc).isoformat()
            except Exception:
                pass
    return None


def is_today_or_future(dt_iso) -> bool:
    if not dt_iso:
        return True
    try:
        dt = datetime.fromisoformat(str(dt_iso).replace("Z", "+00:00"))
        return dt.date() >= datetime.now(timezone.utc).date()
    except Exception:
        return True


def is_rss_recent(dt_iso) -> bool:
    if not dt_iso:
        return False
    try:
        dt = datetime.fromisoformat(str(dt_iso).replace("Z", "+00:00"))
        return dt >= datetime.now(timezone.utc) - timedelta(days=2)
    except Exception:
        return False


def fetch_finnhub_calendar() -> list:
    api_key = os.getenv("FINNHUB_API_KEY", "")
    if not api_key:
        return []
    try:
        today = datetime.now(timezone.utc)
        r = requests.get(
            "https://finnhub.io/api/v1/calendar/economic",
            params={
                "from":  today.strftime("%Y-%m-%d"),
                "to":    (today + timedelta(days=14)).strftime("%Y-%m-%d"),
                "token": api_key,
            },
            timeout=8,
        )
        if not r.ok:
            return []
        events = r.json().get("economicCalendar", [])
        items = []
        for ev in events:
            title   = ev.get("event", "")
            country = ev.get("country", "")
            if not title:
                continue
            if country and country not in ALLOWED_COUNTRIES:
                continue
            importance = ev.get("impact", "").lower()
            if importance not in ("high", "medium", "low"):
                importance = classify_importance(title)
            date_str = ev.get("time", ev.get("date", ""))
            dt_iso = None
            if date_str:
                try:
                    dt_iso = datetime.fromisoformat(date_str.replace("Z", "+00:00")).isoformat()
                except Exception:
                    dt_iso = date_str

            if not is_today_or_future(dt_iso):
                continue

            items.append({
                "id":         f"fh-{ev.get('id', title[:20])}",
                "datetime":   dt_iso,
                "country":    country,
                "currency":   ev.get("currency", country),
                "title":      title,
                "importance": importance,
                "actual":     ev.get("actual"),
                "forecast":   ev.get("estimate"),
                "previous":   ev.get("prev"),
                "source":     "Finnhub",
            })

        items.sort(key=lambda x: (x.get("datetime") or "9999"))
        return items
    except Exception:
        return []


RSS_SOURCES = [
    {"url": "https://www.bls.gov/feed/bls_latest.rss",                "source": "BLS",             "currency": "USD", "country": "US"},
    {"url": "https://www.federalreserve.gov/feeds/press_monetary.xml", "source": "Federal Reserve", "currency": "USD", "country": "US"},
    {"url": "https://www.ecb.europa.eu/rss/press.html",                "source": "ECB",             "currency": "EUR", "country": "EU"},
]


def fetch_rss_calendar() -> list:
    items = []
    for src in RSS_SOURCES:
        try:
            feed = feedparser.parse(src["url"], request_headers={"User-Agent": "Mozilla/5.0"})
            for i, entry in enumerate(feed.entries[:5]):
                title   = getattr(entry, "title", "").strip()
                summary = re.sub(r"<[^>]+>", " ", getattr(entry, "summary", "")).strip()
                summary = " ".join(summary.split())[:150]
                if not title:
                    continue
                dt_iso = parse_date(entry)
                if not is_rss_recent(dt_iso):
                    continue
                items.append({
                    "id":         f"rss-{src['source'].lower().replace(' ', '-')}-{i}",
                    "datetime":   dt_iso,
                    "country":    src["country"],
                    "currency":   src["currency"],
                    "title":      title,
                    "importance": classify_importance(title, summary),
                    "actual":     None,
                    "forecast":   None,
                    "previous":   None,
                    "url":        getattr(entry, "link", "#"),
                    "source":     src["source"],
                })
        except Exception:
            pass
    return items


FOMC_DATES = [
    "2025-01-29", "2025-03-19", "2025-05-07", "2025-06-18",
    "2025-07-30", "2025-09-17", "2025-10-29", "2025-12-10",
    "2026-01-28", "2026-03-18", "2026-04-29", "2026-06-17",
    "2026-07-29", "2026-09-16", "2026-10-28", "2026-12-09",
]


def get_fomc_events() -> list:
    today = datetime.now(timezone.utc).date()
    items = []
    for ds in FOMC_DATES:
        d = datetime.fromisoformat(ds).date()
        if today <= d <= today + timedelta(days=90):
            items.append({
                "id":         f"fomc-{ds}",
                "datetime":   f"{ds}T19:00:00+00:00",
                "country":    "US",
                "currency":   "USD",
                "title":      "FOMC Rate Decision",
                "importance": "high",
                "actual":     None,
                "forecast":   None,
                "previous":   None,
                "source":     "Federal Reserve",
            })
    return items


def fetch_all_calendar() -> list:
    items = fetch_finnhub_calendar()
    rss   = fetch_rss_calendar()
    fomc  = get_fomc_events()

    if items:
        seen = {i["title"].lower()[:40] for i in items}
        for r in rss + fomc:
            if r["title"].lower()[:40] not in seen:
                items.append(r)
    else:
        items = rss + fomc

    items.sort(key=lambda x: (x.get("datetime") or "9999"))

    seen, deduped = set(), []
    for item in items:
        key = item["title"].lower()[:50]
        if key not in seen:
            seen.add(key)
            deduped.append(item)
    return deduped


def get_calendar_cached() -> list:
    global _cache
    now = time.time()
    with _cache_lock:
        if now - _cache["fetched_at"] > CACHE_TTL or not _cache["items"]:
            try:
                _cache = {"items": fetch_all_calendar(), "fetched_at": now}
            except Exception:
                pass
    return _cache["items"]


@router.get("/calendar")
def get_calendar(
    limit:   int           = Query(20, ge=1, le=100),
    impact:  Optional[str] = Query(None, description="high, medium, low or comma-separated combo"),
    country: Optional[str] = Query(None, description="US, GB, EU, JP, ... comma-separated"),
):
    all_items = get_calendar_cached()
    items = all_items

    if impact and impact.lower() != "all":
        allowed = {i.strip().lower() for i in impact.split(",")}
        items = [i for i in items if i.get("importance", "").lower() in allowed]

    if country and country.lower() != "all":
        allowed = {c.strip().upper() for c in country.split(",")}
        items = [i for i in items if i.get("country", "").upper() in allowed]

    return {
        "ok":    True,
        "count": len(items[:limit]),
        "total": len(all_items),
        "filters": {
            "impact":  impact or "all",
            "country": country or "all",
        },
        "available_countries": sorted({i.get("country", "") for i in all_items if i.get("country")}),
        "items": items[:limit],
    }


@router.get("/calendar/refresh")
def refresh_calendar():
    global _cache
    with _cache_lock:
        _cache = {"items": [], "fetched_at": 0}
    items = get_calendar_cached()
    return {"ok": True, "count": len(items), "message": "Calendar cache refreshed"}