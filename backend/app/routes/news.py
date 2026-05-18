"""
news.py — Financial news aggregator from verified free RSS sources.
Debug: GET /api/news/sources — shows items per source and any errors.
"""

from fastapi import APIRouter, Query
from datetime import datetime, timezone, timedelta
import feedparser
import requests
import time
import threading
import re
import os
from typing import Optional

router = APIRouter()

_cache: dict = {"items": [], "fetched_at": 0, "source_stats": {}}
_cache_lock = threading.Lock()
CACHE_TTL = 600

NEWS_SOURCES = [
    # Official / Regulatory — never block, most reliable
    {"name": "Federal Reserve",   "url": "https://www.federalreserve.gov/feeds/press_all.xml",          "category": "POLICY",  "priority": 1},
    {"name": "ECB",               "url": "https://www.ecb.europa.eu/rss/press.html",                    "category": "POLICY",  "priority": 1},
    {"name": "CFTC",              "url": "https://www.cftc.gov/RSS/index.htm",                          "category": "COT",     "priority": 1},
    {"name": "BLS",               "url": "https://www.bls.gov/feed/bls_latest.rss",                     "category": "MACRO",   "priority": 1},
    {"name": "Bank of England",   "url": "https://www.bankofengland.co.uk/rss/publications",            "category": "POLICY",  "priority": 1},
    # Market news — verified working
    {"name": "Investing.com",     "url": "https://www.investing.com/rss/news.rss",                      "category": "MARKETS", "priority": 2},
    {"name": "ForexLive",         "url": "https://www.forexlive.com/feed/news",                         "category": "FOREX",   "priority": 2},
    {"name": "Cointelegraph",     "url": "https://cointelegraph.com/rss",                               "category": "CRYPTO",  "priority": 2},
    {"name": "FXStreet",          "url": "https://www.fxstreet.com/rss/news",                           "category": "FOREX",   "priority": 2},
    # AP / NPR — always public
    {"name": "NPR Business",      "url": "https://feeds.npr.org/1006/rss.xml",                          "category": "MACRO",   "priority": 3},
    # Guardian — fully open RSS
    {"name": "Guardian Business", "url": "https://www.theguardian.com/business/rss",                    "category": "MARKETS", "priority": 2},
    {"name": "Guardian Economics","url": "https://www.theguardian.com/business/economics/rss",          "category": "MACRO",   "priority": 2},
    # CNBC — public RSS
    {"name": "CNBC Markets",      "url": "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664", "category": "MARKETS", "priority": 2},
    {"name": "CNBC Economy",      "url": "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=20910258", "category": "MACRO",   "priority": 2},
    # MarketWatch / Yahoo
    {"name": "Yahoo Finance",     "url": "https://finance.yahoo.com/news/rssindex",                     "category": "MARKETS", "priority": 3},
    # Reuters + Bloomberg via Google News RSS (free, no auth)
    {"name": "Reuters",   "url": "https://news.google.com/rss/search?q=when:24h+site:reuters.com+finance+OR+economy&hl=en-US&gl=US&ceid=US:en", "category": "MARKETS", "priority": 2},
    {"name": "Bloomberg", "url": "https://news.google.com/rss/search?q=when:24h+site:bloomberg.com+markets+OR+economy&hl=en-US&gl=US&ceid=US:en", "category": "MARKETS", "priority": 2},
]

HIGH_KEYWORDS = [
    "federal reserve", "fed ", "fomc", "interest rate", "rate hike", "rate cut",
    "inflation", " cpi", " pce", " gdp", "unemployment", "nonfarm payroll",
    "ecb ", "bank of england", "bank of japan", "cftc", "cot report",
    "crude oil", "opec", "gold price", "dollar index", "yen", "euro ",
    "recession", "default", "crisis", "emergency", "historic", "record high",
    "powell", "lagarde", "ueda", "yellen", "tariff", "sanctions",
]
MEDIUM_KEYWORDS = [
    "pmi", " ism", "retail sales", "housing starts", "consumer confidence",
    "producer price", "trade balance", "industrial production", "earnings",
    "jobs report", "treasury yield", "bond market", "equity", "stock market",
    "oil prices", "commodity", "currency", "central bank",
]

UA_CHROME  = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
UA_FIREFOX = "Mozilla/5.0 (X11; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0"
UA_BOT     = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"

UA_MAP = {
    "Investing.com": UA_CHROME, "ForexLive": UA_CHROME,
    "MarketWatch": UA_CHROME, "Yahoo Finance": UA_CHROME,
    "FXStreet": UA_CHROME, "CNBC Markets": UA_CHROME,
    "CNBC Economy": UA_CHROME, "Reuters": UA_BOT, "Bloomberg": UA_BOT,
}


def get_ua(name):
    return UA_MAP.get(name, UA_FIREFOX)


def parse_date(entry):
    for field in ["published_parsed", "updated_parsed", "created_parsed"]:
        val = getattr(entry, field, None)
        if val:
            try:
                return datetime(*val[:6], tzinfo=timezone.utc).isoformat()
            except Exception:
                pass
    return None


def is_recent(dt_iso, days=7):
    if not dt_iso:
        return True
    try:
        return datetime.fromisoformat(dt_iso.replace("Z", "+00:00")) >= datetime.now(timezone.utc) - timedelta(days=days)
    except Exception:
        return True


def classify(title, summary):
    text = (title + " " + summary).lower()
    if any(k in text for k in HIGH_KEYWORDS):
        return "high"
    if any(k in text for k in MEDIUM_KEYWORDS):
        return "medium"
    return "low"


def clean_html(text):
    text = re.sub(r"<[^>]+>", " ", text or "")
    for ent, rep in [("&amp;","&"),("&lt;","<"),("&gt;",">"),("&nbsp;"," "),("&#39;","'"),("&quot;",'"')]:
        text = text.replace(ent, rep)
    return re.sub(r"\s+", " ", text).strip()


def fetch_feed(source):
    """Returns (items, error_string). Always returns a tuple, never raises."""
    items = []
    try:
        feed = feedparser.parse(
            source["url"],
            request_headers={
                "User-Agent": get_ua(source["name"]),
                "Accept": "application/rss+xml, application/xml, text/xml, */*",
                "Accept-Language": "en-US,en;q=0.9",
            },
        )
        status = getattr(feed, "status", 200)
        if status in (401, 403, 404, 429, 500, 503):
            return [], f"HTTP {status}"
        if not feed.entries:
            exc = getattr(feed, "bozo_exception", None)
            return [], f"No entries{f': {exc}' if exc else ''}"

        for i, entry in enumerate(feed.entries[:15]):
            title   = clean_html(getattr(entry, "title", "")).strip()
            summary = clean_html(getattr(entry, "summary", "")).strip()
            link    = getattr(entry, "link", "#")
            pub     = parse_date(entry)
            if not title or len(title) < 5:
                continue
            if not is_recent(pub, days=7):
                continue
            if summary == title or summary.startswith(title[:40]):
                summary = ""
            items.append({
                "id":           f"{source['name'].lower().replace(' ','-')}-{i}",
                "source":       source["name"],
                "category":     source["category"],
                "title":        title,
                "summary":      summary[:300],
                "url":          link,
                "published_at": pub,
                "importance":   classify(title, summary),
                "priority":     source["priority"],
            })
        return items, ""
    except Exception as e:
        return [], str(e)[:120]


def fetch_newsapi():
    api_key = os.getenv("NEWSAPI_KEY", "")
    if not api_key:
        return []
    items = []
    try:
        r = requests.get("https://newsapi.org/v2/top-headlines",
            params={"category": "business", "language": "en", "pageSize": 30, "apiKey": api_key}, timeout=8)
        if not r.ok:
            return []
        for i, a in enumerate(r.json().get("articles", [])):
            title   = clean_html(a.get("title") or "").strip()
            summary = clean_html(a.get("description") or "").strip()
            source  = (a.get("source", {}).get("name") or "NewsAPI").strip()
            pub_raw = a.get("publishedAt", "")
            link    = a.get("url", "#")
            if not title or title == "[Removed]" or len(title) < 5:
                continue
            dt_iso = None
            if pub_raw:
                try:
                    dt_iso = datetime.fromisoformat(pub_raw.replace("Z", "+00:00")).isoformat()
                except Exception:
                    pass
            cat = "MARKETS"
            sn = source.lower()
            if any(x in sn for x in ["reserve", "ecb", "central bank", "treasury"]):
                cat = "POLICY"
            elif any(x in sn for x in ["crypto", "bitcoin", "coin"]):
                cat = "CRYPTO"
            elif any(x in sn for x in ["forex", "fx", "currency"]):
                cat = "FOREX"
            if summary == title or summary.startswith(title[:40]):
                summary = ""
            items.append({
                "id": f"newsapi-{source.lower().replace(' ','-')}-{i}",
                "source": source, "category": cat, "title": title,
                "summary": summary[:300], "url": link, "published_at": dt_iso,
                "importance": classify(title, summary), "priority": 2,
            })
    except Exception:
        pass
    return items


def fetch_all_news():
    import concurrent.futures
    all_items = []
    source_stats = {}

    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        future_map = {executor.submit(fetch_feed, src): src for src in NEWS_SOURCES}
        for future in concurrent.futures.as_completed(future_map, timeout=15):
            src = future_map[future]
            try:
                items, error = future.result()
                source_stats[src["name"]] = {"count": len(items), "error": error, "ok": len(items) > 0}
                all_items.extend(items)
            except Exception as e:
                source_stats[src["name"]] = {"count": 0, "error": str(e)[:80], "ok": False}

    newsapi_items = fetch_newsapi()
    if newsapi_items:
        source_stats["NewsAPI"] = {"count": len(newsapi_items), "error": "", "ok": True}
    all_items.extend(newsapi_items)

    # Sort newest first
    all_items.sort(key=lambda x: (
        x.get("published_at") or "1970",
        {"high": 1, "medium": 0, "low": -1}.get(x.get("importance", "low"), 0),
    ), reverse=True)

    # Deduplicate
    seen, deduped = set(), []
    for item in all_items:
        key = item["title"].lower()[:60]
        if key not in seen:
            seen.add(key)
            deduped.append(item)

    return deduped, source_stats


def get_news_cached():
    global _cache
    now = time.time()
    with _cache_lock:
        if now - _cache["fetched_at"] > CACHE_TTL or not _cache["items"]:
            try:
                items, stats = fetch_all_news()
                _cache = {"items": items, "fetched_at": now, "source_stats": stats}
            except Exception:
                pass
    return _cache["items"]


@router.get("/news")
def get_news(
    limit:      int           = Query(100, ge=1, le=500),
    category:   Optional[str] = Query(None),
    source:     Optional[str] = Query(None),
    priority:   Optional[str] = Query(None),
    importance: Optional[str] = Query(None),
):
    all_items = get_news_cached()
    items = all_items
    if category and category.lower() != "all":
        items = [i for i in items if i.get("category","").upper() == category.upper()]
    if source and source.lower() != "all":
        items = [i for i in items if source.lower() in i.get("source","").lower()]
    if priority and priority != "all":
        try:
            p = int(priority)
            items = [i for i in items if i.get("priority", 3) <= p]
        except ValueError:
            pass
    if importance and importance.lower() != "all":
        items = [i for i in items if i.get("importance","low") == importance.lower()]
    return {
        "ok": True, "count": len(items[:limit]), "total": len(all_items),
        "newsapi_enabled": bool(os.getenv("NEWSAPI_KEY","")),
        "available_categories": sorted({i.get("category","") for i in all_items if i.get("category")}),
        "available_sources":    sorted({i.get("source","")   for i in all_items if i.get("source")}),
        "items": items[:limit],
    }


@router.get("/news/sources")
def news_sources_debug():
    """Shows item count and errors per source. Use to diagnose broken feeds."""
    get_news_cached()
    stats   = _cache.get("source_stats", {})
    working = {k: v for k, v in stats.items() if v["ok"]}
    broken  = {k: v for k, v in stats.items() if not v["ok"]}
    return {
        "ok": True,
        "total_items":     sum(v["count"] for v in stats.values()),
        "sources_working": len(working),
        "sources_broken":  len(broken),
        "working":         working,
        "broken":          broken,
    }


@router.get("/news/refresh")
def refresh_news():
    global _cache
    with _cache_lock:
        _cache = {"items": [], "fetched_at": 0, "source_stats": {}}
    items = get_news_cached()
    return {"ok": True, "count": len(items), "message": "Cache refreshed"}