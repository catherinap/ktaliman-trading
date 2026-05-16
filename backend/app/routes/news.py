"""
news.py — Real-time financial news aggregator from official sources.

Fetches RSS/XML feeds from:
  - Federal Reserve (press releases, speeches)
  - ECB (European Central Bank)
  - Bank of England
  - BLS (Bureau of Labor Statistics)
  - U.S. Treasury
  - CFTC (press releases)
  - Reuters Finance
  - Investing.com (macro news)

Caches results for 10 minutes to avoid hammering sources.
"""

from fastapi import APIRouter
from datetime import datetime, timezone
import feedparser
import time
import threading

router = APIRouter()

# ── Cache ─────────────────────────────────────────────────────────────────────
_cache: dict = {"items": [], "fetched_at": 0}
_cache_lock = threading.Lock()
CACHE_TTL = 600  # 10 minutes


# ── News sources ──────────────────────────────────────────────────────────────
NEWS_SOURCES = [
    {
        "name": "Federal Reserve",
        "url": "https://www.federalreserve.gov/feeds/press_all.xml",
        "category": "POLICY",
        "priority": 1,
    },
    {
        "name": "ECB",
        "url": "https://www.ecb.europa.eu/rss/press.html",
        "category": "POLICY",
        "priority": 1,
    },
    {
        "name": "CFTC",
        "url": "https://www.cftc.gov/rss/index.xml",
        "category": "COT",
        "priority": 1,
    },
    {
        "name": "BLS",
        "url": "https://www.bls.gov/feed/bls_latest.rss",
        "category": "MACRO",
        "priority": 2,
    },
    {
        "name": "U.S. Treasury",
        "url": "https://home.treasury.gov/system/files/rss/press.rss",
        "category": "POLICY",
        "priority": 2,
    },
    {
        "name": "Bank of England",
        "url": "https://www.bankofengland.co.uk/rss/publications",
        "category": "POLICY",
        "priority": 2,
    },
    {
        "name": "Reuters Finance",
        "url": "https://feeds.reuters.com/reuters/businessNews",
        "category": "FINANCE",
        "priority": 3,
    },
    {
        "name": "Reuters Markets",
        "url": "https://feeds.reuters.com/reuters/companyNews",
        "category": "MARKETS",
        "priority": 3,
    },
    {
        "name": "Investing.com",
        "url": "https://www.investing.com/rss/news.rss",
        "category": "MARKETS",
        "priority": 3,
    },
    {
        "name": "MarketWatch",
        "url": "https://feeds.content.dowjones.io/public/rss/mw_marketpulse",
        "category": "MARKETS",
        "priority": 3,
    },
    {
        "name": "Cointelegraph",
        "url": "https://cointelegraph.com/rss",
        "category": "CRYPTO",
        "priority": 4,
    },
    {
        "name": "ForexLive",
        "url": "https://www.forexlive.com/feed/news",
        "category": "FOREX",
        "priority": 3,
    },
    {
    "name": "Bloomberg Markets",
    "url": "https://feeds.bloomberg.com/markets/news.rss",
    "category": "MARKETS",
    "priority": 1,
},
{
    "name": "Bloomberg Technology",
    "url": "https://feeds.bloomberg.com/technology/news.rss",
    "category": "MARKETS",
    "priority": 2,
},
]

# Keywords that make news HIGH importance
HIGH_IMPORTANCE_KEYWORDS = [
    "federal reserve", "fed", "fomc", "interest rate", "rate hike", "rate cut",
    "inflation", "cpi", "pce", "gdp", "unemployment", "nonfarm payroll",
    "ecb", "bank of england", "bank of japan", "cftc", "cot report",
    "oil", "crude", "opec", "gold", "commodity", "dollar", "yen", "euro",
    "recession", "default", "crisis", "emergency", "historic", "record",
    "powell", "lagarde", "ueda", "yellen",
]


def parse_date(entry) -> str | None:
    """Parse publication date from feed entry."""
    for field in ["published_parsed", "updated_parsed", "created_parsed"]:
        val = getattr(entry, field, None)
        if val:
            try:
                dt = datetime(*val[:6], tzinfo=timezone.utc)
                return dt.isoformat()
            except Exception:
                pass
    return None


def check_importance(title: str, summary: str) -> str:
    text = (title + " " + summary).lower()
    if any(kw in text for kw in HIGH_IMPORTANCE_KEYWORDS):
        return "high"
    return "medium"


def fetch_feed(source: dict) -> list:
    """Fetch and parse a single RSS feed."""
    items = []
    try:
        feed = feedparser.parse(
            source["url"],
            request_headers={
                "User-Agent": "Mozilla/5.0 (compatible; MarketBot/1.0)"
            },
        )
        if feed.bozo and not feed.entries:
            return items

        for i, entry in enumerate(feed.entries[:8]):  # max 8 per source
            title   = getattr(entry, "title", "").strip()
            summary = getattr(entry, "summary", "").strip()
            link    = getattr(entry, "link", "#")
            pub     = parse_date(entry)

            if not title:
                continue

            # Strip HTML from summary
            import re
            summary = re.sub(r"<[^>]+>", " ", summary).strip()
            summary = " ".join(summary.split())[:200]

            importance = check_importance(title, summary)

            items.append({
                "id":           f"{source['name'].lower().replace(' ', '-')}-{i}",
                "source":       source["name"],
                "category":     source["category"],
                "title":        title,
                "summary":      summary or title,
                "url":          link,
                "published_at": pub,
                "importance":   importance,
                "priority":     source["priority"],
            })

    except Exception:
        pass

    return items


def fetch_all_news() -> list:
    """Fetch from all sources, sort by priority + date."""
    import concurrent.futures

    all_items = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(fetch_feed, src): src for src in NEWS_SOURCES}
        for future in concurrent.futures.as_completed(futures, timeout=12):
            try:
                all_items.extend(future.result())
            except Exception:
                pass

    # Sort: high importance first, then by priority, then by date
    def sort_key(item):
        imp_rank = 0 if item["importance"] == "high" else 1
        pri = item["priority"]
        pub = item.get("published_at") or ""
        return (imp_rank, pri, -len(pub))  # newer = longer ISO string

    all_items.sort(key=sort_key)

    # Deduplicate by title similarity
    seen_titles = set()
    deduped = []
    for item in all_items:
        title_key = item["title"].lower()[:60]
        if title_key not in seen_titles:
            seen_titles.add(title_key)
            deduped.append(item)

    return deduped


def get_news_cached(limit: int = 20) -> list:
    """Return cached news, refreshing if stale."""
    global _cache
    now = time.time()

    with _cache_lock:
        if now - _cache["fetched_at"] > CACHE_TTL or not _cache["items"]:
            try:
                items = fetch_all_news()
                _cache = {"items": items, "fetched_at": now}
            except Exception:
                pass

    return _cache["items"][:limit]


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/news")
def get_news(limit: int = 20, category: str = "all"):
    items = get_news_cached(limit=50)

    if category != "all":
        items = [i for i in items if i.get("category", "").lower() == category.lower()]

    return {
        "ok":    True,
        "count": len(items[:limit]),
        "items": items[:limit],
        "sources": [s["name"] for s in NEWS_SOURCES],
        "cached_at": _cache.get("fetched_at", 0),
    }


@router.get("/news/refresh")
def refresh_news():
    """Force refresh the news cache."""
    global _cache
    with _cache_lock:
        _cache = {"items": [], "fetched_at": 0}
    items = get_news_cached()
    return {"ok": True, "count": len(items), "message": "Cache refreshed"}
