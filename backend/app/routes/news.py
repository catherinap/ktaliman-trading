"""
news.py — Financial news aggregator.

Sources:
  - NewsAPI.org (set NEWSAPI_KEY in .env.local — covers 80,000+ sources)
  - Official RSS: Federal Reserve, ECB, CFTC, BLS, U.S. Treasury, Bank of England
  - Market RSS: ForexLive, Investing.com, MarketWatch, Cointelegraph

Note: Bloomberg/Reuters direct RSS and Google News RSS removed —
they only return headlines without article body content.

Filters: ?category=POLICY&source=Federal+Reserve&priority=1&limit=50
Cache: 10 minutes.
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

# ── RSS sources (verified working) ────────────────────────────────────────────
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
    {
        "name": "Yahoo Finance",
        "url": "https://finance.yahoo.com/news/rssindex",
        "category": "MARKETS",
        "priority": 3,
    },
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


def parse_date(entry) -> Optional[str]:
    for field in ["published_parsed", "updated_parsed", "created_parsed"]:
        val = getattr(entry, field, None)
        if val:
            try:
                return datetime(*val[:6], tzinfo=timezone.utc).isoformat()
            except Exception:
                pass
    return None


def is_recent(dt_iso: Optional[str], days: int = 7) -> bool:
    if not dt_iso:
        return True
    try:
        dt = datetime.fromisoformat(dt_iso.replace("Z", "+00:00"))
        return dt >= datetime.now(timezone.utc) - timedelta(days=days)
    except Exception:
        return True


def classify(title: str, summary: str) -> str:
    text = (title + " " + summary).lower()
    if any(k in text for k in HIGH_KEYWORDS):
        return "high"
    if any(k in text for k in MEDIUM_KEYWORDS):
        return "medium"
    return "low"


def clean_html(text: str) -> str:
    text = re.sub(r"<[^>]+>", " ", text or "")
    text = re.sub(r"&amp;", "&", text)
    text = re.sub(r"&lt;", "<", text)
    text = re.sub(r"&gt;", ">", text)
    text = re.sub(r"&nbsp;", " ", text)
    return re.sub(r"\s+", " ", text).strip()


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
        if not feed.entries:
            return items

        for i, entry in enumerate(feed.entries[:15]):
            title   = clean_html(getattr(entry, "title", "")).strip()
            summary = clean_html(getattr(entry, "summary", "")).strip()
            link    = getattr(entry, "link", "#")
            pub     = parse_date(entry)

            if not title or len(title) < 5:
                continue
            if not is_recent(pub, days=7):
                continue

            # Don't repeat summary if same as title
            if summary == title or summary.startswith(title[:40]):
                summary = ""

            items.append({
                "id":           f"{source['name'].lower().replace(' ', '-')}-{i}",
                "source":       source["name"],
                "category":     source["category"],
                "title":        title,
                "summary":      summary[:300],
                "url":          link,
                "published_at": pub,
                "importance":   classify(title, summary),
                "priority":     source["priority"],
            })

    except Exception:
        pass

    return items


def fetch_newsapi() -> list:
    """
    NewsAPI.org — covers Bloomberg, Reuters, FT, WSJ, 80,000+ sources.
    Free tier: 100 req/day. Set NEWSAPI_KEY in .env.local.
    Register at: https://newsapi.org
    """
    api_key = os.getenv("NEWSAPI_KEY", "")
    if not api_key:
        return []

    items = []
    # Fetch multiple categories for diversity
    queries = [
        {"category": "business", "params": {"category": "business", "language": "en", "pageSize": 30}},
    ]

    for q in queries:
        try:
            r = requests.get(
                "https://newsapi.org/v2/top-headlines",
                params={**q["params"], "apiKey": api_key},
                timeout=8,
            )
            if not r.ok:
                continue

            for i, article in enumerate(r.json().get("articles", [])):
                title   = clean_html(article.get("title") or "").strip()
                summary = clean_html(article.get("description") or "").strip()
                source  = (article.get("source", {}).get("name") or "NewsAPI").strip()
                pub_raw = article.get("publishedAt", "")
                link    = article.get("url", "#")

                if not title or title == "[Removed]" or len(title) < 5:
                    continue

                dt_iso = None
                if pub_raw:
                    try:
                        dt_iso = datetime.fromisoformat(
                            pub_raw.replace("Z", "+00:00")
                        ).isoformat()
                    except Exception:
                        pass

                # Classify category by source name
                cat = "MARKETS"
                sn = source.lower()
                if any(x in sn for x in ["reserve", "ecb", "central bank", "treasury", "government"]):
                    cat = "POLICY"
                elif any(x in sn for x in ["crypto", "bitcoin", "coin"]):
                    cat = "CRYPTO"
                elif any(x in sn for x in ["forex", "fx", "currency"]):
                    cat = "FOREX"

                if summary == title or summary.startswith(title[:40]):
                    summary = ""

                items.append({
                    "id":           f"newsapi-{source.lower().replace(' ', '-')}-{i}",
                    "source":       source,
                    "category":     cat,
                    "title":        title,
                    "summary":      summary[:300],
                    "url":          link,
                    "published_at": dt_iso,
                    "importance":   classify(title, summary),
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

    # NewsAPI
    all_items.extend(fetch_newsapi())

    # ── Sort: newest first (primary), then importance (secondary) ──────────────
    def sort_key(item):
        pub = item.get("published_at") or "1970-01-01T00:00:00+00:00"
        imp = {"high": 0, "medium": 1, "low": 2}.get(item.get("importance", "low"), 2)
        return (pub, -imp)  # DESC by date, ASC by importance within same second

    all_items.sort(key=sort_key, reverse=True)

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
                _cache = {"items": fetch_all_news(), "fetched_at": now}
            except Exception:
                pass
    return _cache["items"]


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/news")
def get_news(
    limit:    int           = Query(100, ge=1, le=500),
    category: Optional[str] = Query(None),
    source:   Optional[str] = Query(None),
    priority: Optional[str] = Query(None, description="1, 2, 3 or all"),
    importance: Optional[str] = Query(None, description="high, medium, low or all"),
):
    all_items = get_news_cached()
    items = all_items

    if category and category.lower() != "all":
        items = [i for i in items if i.get("category", "").upper() == category.upper()]

    if source and source.lower() != "all":
        items = [i for i in items if source.lower() in i.get("source", "").lower()]

    if priority and priority != "all":
        try:
            p = int(priority)
            items = [i for i in items if i.get("priority", 3) <= p]
        except ValueError:
            pass

    if importance and importance.lower() != "all":
        items = [i for i in items if i.get("importance", "low") == importance.lower()]

    available_categories = sorted({i.get("category", "") for i in all_items if i.get("category")})
    available_sources    = sorted({i.get("source", "")   for i in all_items if i.get("source")})

    return {
        "ok":                   True,
        "count":                len(items[:limit]),
        "total":                len(all_items),
        "newsapi_enabled":      bool(os.getenv("NEWSAPI_KEY", "")),
        "available_categories": available_categories,
        "available_sources":    available_sources,
        "items":                items[:limit],
    }


@router.get("/news/refresh")
def refresh_news():
    global _cache
    with _cache_lock:
        _cache = {"items": [], "fetched_at": 0}
    items = get_news_cached()
    return {"ok": True, "count": len(items), "message": "Cache refreshed"}