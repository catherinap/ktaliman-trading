"""
news.py — Financial news aggregator from verified working RSS sources.

Sources verified to work from server-side requests (no auth required):
  - Federal Reserve, ECB, CFTC, BLS, U.S. Treasury, Bank of England
  - ForexLive, Investing.com, MarketWatch, Cointelegraph
  - NewsAPI.org (optional, set NEWSAPI_KEY in .env.local for Bloomberg-level coverage)

Bloomberg RSS (feeds.bloomberg.com) requires authentication from server IPs
and cannot be used without a paid API key. Use NewsAPI.org as an alternative.

Cache: 10 minutes.
Filters: ?category=POLICY&source=Federal+Reserve&limit=20
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

_cache: dict = {"items": [], "fetched_at": 0}
_cache_lock = threading.Lock()
CACHE_TTL = 600  # 10 minutes

# ── Verified working RSS sources ──────────────────────────────────────────────
NEWS_SOURCES = [
    # Official central bank / regulatory sources — most reliable
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
        "priority": 1,
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
    # Market / financial news
    {
        "name": "ForexLive",
        "url": "https://www.forexlive.com/feed/news",
        "category": "FOREX",
        "priority": 2,
    },
    {
        "name": "Investing.com",
        "url": "https://www.investing.com/rss/news.rss",
        "category": "MARKETS",
        "priority": 2,
    },
    {
        "name": "MarketWatch",
        "url": "https://feeds.content.dowjones.io/public/rss/mw_marketpulse",
        "category": "MARKETS",
        "priority": 2,
    },
    {
        "name": "Cointelegraph",
        "url": "https://cointelegraph.com/rss",
        "category": "CRYPTO",
        "priority": 3,
    },
    # Seeking Alpha — good macro coverage
    {
        "name": "Seeking Alpha Macro",
        "url": "https://seekingalpha.com/feed.xml",
        "category": "MACRO",
        "priority": 3,
    },
    # Yahoo Finance — broad market news
    {
        "name": "Yahoo Finance",
        "url": "https://finance.yahoo.com/news/rssindex",
        "category": "MARKETS",
        "priority": 3,
    },
    # Bloomberg via Google News RSS — free, no auth needed, last 24h
    # Google indexes Bloomberg articles and serves them via RSS
    {
        "name": "Bloomberg",
        "url": "https://news.google.com/rss/search?q=when:24h+allinurl:bloomberg.com&hl=en-US&gl=US&ceid=US:en",
        "category": "MARKETS",
        "priority": 1,
    },
    # Reuters via Google News RSS
    {
        "name": "Reuters",
        "url": "https://news.google.com/rss/search?q=when:24h+allinurl:reuters.com&hl=en-US&gl=US&ceid=US:en",
        "category": "MARKETS",
        "priority": 1,
    },
    # Financial Times via Google News RSS
    {
        "name": "Financial Times",
        "url": "https://news.google.com/rss/search?q=when:24h+allinurl:ft.com&hl=en-US&gl=US&ceid=US:en",
        "category": "FINANCE",
        "priority": 2,
    },
]

HIGH_IMPORTANCE_KEYWORDS = [
    "federal reserve", "fed ", "fomc", "interest rate", "rate hike", "rate cut",
    "inflation", "cpi", "pce", "gdp", "unemployment", "nonfarm payroll",
    "ecb", "bank of england", "bank of japan", "cftc", "cot report",
    "oil", "crude", "opec", "gold", "commodity", "dollar", "yen", "euro",
    "recession", "default", "crisis", "emergency", "historic", "record",
    "powell", "lagarde", "ueda", "yellen", "tariff", "sanctions",
]

MEDIUM_IMPORTANCE_KEYWORDS = [
    "pmi", "ism", "retail sales", "housing", "consumer", "producer price",
    "trade balance", "industrial production", "earnings", "jobs",
    "yield", "bond", "treasury", "equity", "market", "rally", "selloff",
]


def parse_date(entry) -> Optional[str]:
    for field in ["published_parsed", "updated_parsed", "created_parsed"]:
        val = getattr(entry, field, None)
        if val:
            try:
                dt = datetime(*val[:6], tzinfo=timezone.utc)
                return dt.isoformat()
            except Exception:
                pass
    return None


def is_recent(dt_iso: Optional[str], days: int = 3) -> bool:
    """Keep only news from last N days."""
    if not dt_iso:
        return True  # keep if no date
    try:
        dt = datetime.fromisoformat(dt_iso.replace("Z", "+00:00"))
        return dt >= datetime.now(timezone.utc) - timedelta(days=days)
    except Exception:
        return True


def check_importance(title: str, summary: str) -> str:
    text = (title + " " + summary).lower()
    if any(kw in text for kw in HIGH_IMPORTANCE_KEYWORDS):
        return "high"
    if any(kw in text for kw in MEDIUM_IMPORTANCE_KEYWORDS):
        return "medium"
    return "low"


def clean_html(text: str) -> str:
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"&amp;", "&", text)
    text = re.sub(r"&lt;", "<", text)
    text = re.sub(r"&gt;", ">", text)
    text = re.sub(r"&nbsp;", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()[:300]


def fetch_feed(source: dict) -> list:
    items = []
    try:
        feed = feedparser.parse(
            source["url"],
            request_headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "application/rss+xml, application/xml, text/xml, */*",
            },
        )
        # bozo=True means parse error, but entries may still exist
        if not feed.entries:
            return items

        for i, entry in enumerate(feed.entries[:10]):
            title   = clean_html(getattr(entry, "title", "")).strip()
            summary = clean_html(getattr(entry, "summary", "")).strip()
            link    = getattr(entry, "link", "#")
            pub     = parse_date(entry)

            if not title or len(title) < 5:
                continue

            # Skip items older than 3 days
            if not is_recent(pub, days=3):
                continue

            importance = check_importance(title, summary)

            items.append({
                "id":           f"{source['name'].lower().replace(' ', '-')}-{i}",
                "source":       source["name"],
                "category":     source["category"],
                "title":        title,
                "summary":      summary[:300] if summary != title else "",
                "url":          link,
                "published_at": pub,
                "importance":   importance,
                "priority":     source["priority"],
            })

    except Exception:
        pass

    return items


def fetch_newsapi(limit: int = 20) -> list:
    """
    Optional NewsAPI.org integration.
    Free tier: 100 req/day. Set NEWSAPI_KEY in .env.local.
    Covers Bloomberg, Reuters, Financial Times, WSJ and 80,000+ sources.
    Register free at: https://newsapi.org
    """
    api_key = os.getenv("NEWSAPI_KEY", "")
    if not api_key:
        return []

    items = []
    try:
        r = requests.get(
            "https://newsapi.org/v2/top-headlines",
            params={
                "category": "business",
                "language": "en",
                "pageSize": limit,
                "apiKey": api_key,
            },
            timeout=8,
        )
        if not r.ok:
            return []

        for i, article in enumerate(r.json().get("articles", [])):
            title   = (article.get("title") or "").strip()
            summary = (article.get("description") or "").strip()
            source  = (article.get("source", {}).get("name") or "NewsAPI")
            pub_raw = article.get("publishedAt", "")
            link    = article.get("url", "#")

            if not title or title == "[Removed]":
                continue

            dt_iso = None
            if pub_raw:
                try:
                    dt_iso = datetime.fromisoformat(
                        pub_raw.replace("Z", "+00:00")
                    ).isoformat()
                except Exception:
                    pass

            importance = check_importance(title, summary)

            items.append({
                "id":           f"newsapi-{i}",
                "source":       source,
                "category":     "MARKETS",
                "title":        title,
                "summary":      summary[:300],
                "url":          link,
                "published_at": dt_iso,
                "importance":   importance,
                "priority":     2,
            })
    except Exception:
        pass

    return items


def fetch_all_news() -> list:
    import concurrent.futures

    all_items = []

    # Parallel RSS fetch
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(fetch_feed, src): src for src in NEWS_SOURCES}
        for future in concurrent.futures.as_completed(futures, timeout=12):
            try:
                all_items.extend(future.result())
            except Exception:
                pass

    # Optional NewsAPI
    newsapi_items = fetch_newsapi(limit=20)
    all_items.extend(newsapi_items)

    # Sort: high importance first, then newer first
    def sort_key(item):
        imp_rank = 0 if item["importance"] == "high" else (1 if item["importance"] == "medium" else 2)
        pri = item.get("priority", 3)
        pub = item.get("published_at") or "1970-01-01"
        return (imp_rank, pri, pub)

    all_items.sort(key=lambda x: (
        0 if x["importance"] == "high" else (1 if x["importance"] == "medium" else 2),
        x.get("priority", 3),
        # newer = higher = sorts later in ascending, so negate via trick:
        "9999" if not x.get("published_at") else x["published_at"],
    ), reverse=False)

    # Re-sort so newest within same importance group comes first
    all_items.sort(key=lambda x: (
        0 if x["importance"] == "high" else (1 if x["importance"] == "medium" else 2),
        x.get("priority", 3),
        -(ord(x["published_at"][0]) if x.get("published_at") else 0),
    ))

    # Deduplicate by title
    seen, deduped = set(), []
    for item in all_items:
        key = item["title"].lower()[:60]
        if key not in seen:
            seen.add(key)
            deduped.append(item)

    return deduped


def get_news_cached() -> list:
    global _cache
    now = time.time()
    with _cache_lock:
        if now - _cache["fetched_at"] > CACHE_TTL or not _cache["items"]:
            try:
                items = fetch_all_news()
                _cache = {"items": items, "fetched_at": now}
            except Exception:
                pass
    return _cache["items"]


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/news")
def get_news(
    limit:    int           = Query(20, ge=1, le=100),
    category: Optional[str] = Query(None, description="Filter by category: POLICY, MACRO, MARKETS, FOREX, CRYPTO, COT"),
    source:   Optional[str] = Query(None, description="Filter by source name (partial match)"),
):
    all_items = get_news_cached()
    items = all_items

    if category and category.lower() != "all":
        items = [i for i in items if i.get("category", "").upper() == category.upper()]

    if source and source.lower() != "all":
        items = [i for i in items if source.lower() in i.get("source", "").lower()]

    # Collect available filter options from full unfiltered list
    available_categories = sorted({i.get("category", "") for i in all_items if i.get("category")})
    available_sources    = sorted({i.get("source", "")   for i in all_items if i.get("source")})

    return {
        "ok":                  True,
        "count":               len(items[:limit]),
        "total":               len(all_items),
        "filters": {
            "category": category or "all",
            "source":   source   or "all",
        },
        "available_categories": available_categories,
        "available_sources":    available_sources,
        "items":               items[:limit],
        "cached_at":           _cache.get("fetched_at", 0),
        "newsapi_enabled":     bool(os.getenv("NEWSAPI_KEY", "")),
    }


@router.get("/news/refresh")
def refresh_news():
    global _cache
    with _cache_lock:
        _cache = {"items": [], "fetched_at": 0}
    items = get_news_cached()
    return {"ok": True, "count": len(items), "message": "Cache refreshed"}