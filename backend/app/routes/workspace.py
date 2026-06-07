"""
workspace.py — Main workspace endpoint.
News now fetched from the internal /api/news route (RSS aggregator).
"""

from fastapi import APIRouter
from sqlalchemy import text
from app.db import engine
from app.cache import cached
import requests

router = APIRouter(prefix="/api/workspace", tags=["workspace"])


def pct_to_bucket(value):
    if value is None:
        return "neutral"
    if value >= 70:
        return "bullish"
    if value <= 30:
        return "bearish"
    return "neutral"


NORMALIZED_SELECT = """
    SELECT
        symbol, name, sector, source_type, report_date, open_interest, flow_state,
        CASE WHEN source_type = 'TFF' THEN leveraged_funds_long  ELSE managed_money_long  END AS funds_long,
        CASE WHEN source_type = 'TFF' THEN leveraged_funds_short ELSE managed_money_short END AS funds_short,
        CASE WHEN source_type = 'TFF' THEN leveraged_funds_net   ELSE managed_money_net   END AS funds_net,
        CASE WHEN source_type = 'TFF' THEN leveraged_funds_pct_oi ELSE managed_money_pct_oi END AS funds_pct_oi,
        CASE WHEN source_type = 'TFF' THEN leveraged_funds_percentile_3y ELSE managed_money_percentile_3y END AS funds_percentile_3y,
        CASE WHEN source_type = 'TFF' THEN dealer_intermediary_long  ELSE swap_dealers_long  END AS dealer_long,
        CASE WHEN source_type = 'TFF' THEN dealer_intermediary_short ELSE swap_dealers_short END AS dealer_short,
        CASE WHEN source_type = 'TFF' THEN dealer_intermediary_net   ELSE swap_dealers_net   END AS dealer_net,
        CASE WHEN source_type = 'TFF' THEN dealer_intermediary_pct_oi ELSE swap_dealers_pct_oi END AS dealer_pct_oi,
        CASE WHEN source_type = 'TFF' THEN dealer_intermediary_percentile_3y ELSE swap_dealers_percentile_3y END AS dealer_percentile_3y
    FROM cot_analytics
"""


def fetch_news_internal(limit: int = 8) -> list:
    """Fetch news from internal /api/news (RSS aggregator)."""
    try:
        r = requests.get(
            "http://localhost:8000/api/news",
            params={"limit": limit},
            timeout=8,
        )
        if r.ok:
            data = r.json()
            return data.get("items", [])
    except Exception:
        pass
    return []


def fetch_calendar_internal(limit: int = 12) -> list:
    """Fetch calendar from internal /api/calendar route."""
    try:
        r = requests.get("http://localhost:8000/api/calendar", params={"limit": limit}, timeout=8)
        if r.ok:
            return r.json().get("items", [])
    except Exception:
        pass
    return []


def fetch_calendar_external(limit: int = 10) -> list:
    """Fetch economic calendar from external service if available."""
    try:
        r = requests.get("http://127.0.0.1:8001/api/economic-calendar", timeout=5)
        if r.ok:
            payload = r.json()
            if isinstance(payload, dict) and payload.get("ok"):
                data = payload.get("data", [])
                if isinstance(data, list):
                    return data[:limit]
    except Exception:
        pass
    return []


@router.get("")
def get_workspace():
    return cached("workspace", 300, _compute_workspace)


def _compute_workspace():
    with engine.connect() as conn:
        latest = conn.execute(
            text("SELECT MAX(report_date) AS latest_report_date FROM cot_analytics")
        ).mappings().first()
        latest_report_date = latest["latest_report_date"]

        if latest_report_date is None:
            return {
                "macro_regime": {
                    "title": "No Data",
                    "tag": "Awaiting worker update",
                    "verdict": "Run the worker to populate cot_analytics."
                },
                "releases": [],
                "calendar": [],
                "news": [],
            }

        rows = conn.execute(
            text(f"{NORMALIZED_SELECT} WHERE report_date = :report_date ORDER BY sector, symbol"),
            {"report_date": latest_report_date},
        ).mappings().all()

    by_symbol = {row["symbol"]: row for row in rows}
    by_name   = {row["name"]:   row for row in rows}

    usd    = by_symbol.get("USD")    or by_name.get("US Dollar Index")
    gold   = by_symbol.get("XAU")    or by_name.get("Gold")
    silver = by_symbol.get("XAG")    or by_name.get("Silver")
    copper = by_symbol.get("COPPER") or by_name.get("Copper")
    wti    = by_symbol.get("WTI")    or by_name.get("Crude Oil")
    euro   = by_symbol.get("EUR")    or by_name.get("Euro")
    jpy    = by_symbol.get("JPY")    or by_name.get("Japanese Yen")
    gbp    = by_symbol.get("GBP")    or by_name.get("British Pound")
    chf    = by_symbol.get("CHF")    or by_name.get("Swiss Franc")
    spx    = by_symbol.get("SPX")    or by_name.get("SP 500")
    nasdaq = by_symbol.get("NDX")    or by_name.get("Nasdaq")
    djia   = by_symbol.get("DJIA")   or by_name.get("Dow Jones")

    growth_assets    = [x for x in [spx, nasdaq, djia] if x]
    inflation_assets = [x for x in [gold, silver, copper, wti] if x]
    policy_assets    = [x for x in [usd, euro, jpy, gbp, chf] if x]

    def avg_percentile(items):
        vals = [float(x["funds_percentile_3y"]) for x in items if x and x["funds_percentile_3y"] is not None]
        return round(sum(vals) / len(vals), 1) if vals else None

    growth_score    = avg_percentile(growth_assets)
    inflation_score = avg_percentile(inflation_assets)
    policy_score    = avg_percentile(policy_assets)

    growth_bucket    = pct_to_bucket(growth_score)
    inflation_bucket = pct_to_bucket(inflation_score)
    policy_bucket    = pct_to_bucket(policy_score)

    regime_title = "Mixed Positioning Regime"
    if inflation_bucket == "bullish" and policy_bucket == "bullish":
        regime_title = "Inflation Pressure Regime"
    elif growth_bucket == "bullish" and policy_bucket == "bearish":
        regime_title = "Risk-On Expansion Regime"
    elif growth_bucket == "bearish" and policy_bucket == "bullish":
        regime_title = "Defensive Dollar Regime"
    elif growth_bucket == "bearish" and inflation_bucket == "bullish":
        regime_title = "Stagflation Stress Regime"

    def narrative(label, bucket, score, refs):
        names = ", ".join([r["name"] for r in refs[:3]]) if refs else "available contracts"
        score_text = "n/a" if score is None else f"{score:.1f}"
        if bucket == "bullish":
            return f"{label} positioning is supportive across {names}. Composite percentile: {score_text}."
        if bucket == "bearish":
            return f"{label} positioning is defensive across {names}. Composite percentile: {score_text}."
        return f"{label} positioning is balanced across {names}. Composite percentile: {score_text}."

    verdict_parts = []
    if growth_bucket == "bullish":
        verdict_parts.append("risk assets retain sponsorship")
    elif growth_bucket == "bearish":
        verdict_parts.append("risk appetite is fragile")
    if inflation_bucket == "bullish":
        verdict_parts.append("inflation-sensitive contracts remain firm")
    elif inflation_bucket == "bearish":
        verdict_parts.append("inflation pressure is fading in positioning")
    if policy_bucket == "bullish":
        verdict_parts.append("USD and policy-sensitive positioning stay defensive")
    elif policy_bucket == "bearish":
        verdict_parts.append("policy positioning is easing")

    verdict = (
        "Current COT backdrop suggests " + ", while ".join(verdict_parts) + "."
        if verdict_parts else "Current COT backdrop is balanced across major sleeves."
    )

    # ── Calendar ──────────────────────────────────────────────────────────────
    calendar = fetch_calendar_internal(limit=12)
    if not calendar:
        calendar = fetch_calendar_external(limit=12)
    if not calendar:
        eligible = [x for x in rows if x["funds_percentile_3y"] is not None]
        for item in sorted(eligible, key=lambda x: abs(float(x["funds_percentile_3y"]) - 50), reverse=True)[:4]:
            pct = float(item["funds_percentile_3y"])
            calendar.append({
                "id":         f'cal-{item["symbol"]}',
                "datetime":   None,
                "country":    item["sector"] or "",
                "currency":   item["symbol"] or "",
                "title":      f'{item["name"]} COT at {pct:.0f}th percentile',
                "importance": "high" if pct >= 85 or pct <= 15 else "medium",
                "actual":     round(pct, 1),
                "forecast":   None,
                "previous":   item.get("flow_state"),
                "source":     "COT",
            })

    # ── News — from RSS aggregator ────────────────────────────────────────────
    news = fetch_news_internal(limit=10)

    # Fallback: generate from COT data if news service not available
    if not news:
        eligible = [x for x in rows if x["funds_percentile_3y"] is not None]
        for item in sorted(eligible, key=lambda x: abs(float(x["funds_percentile_3y"]) - 50), reverse=True)[:6]:
            pct = float(item["funds_percentile_3y"])
            direction = "bullish extreme" if pct >= 85 else "bearish extreme" if pct <= 15 else "notable positioning"
            news.append({
                "id":           f'news-cot-{item["symbol"]}',
                "source":       "COT Flow",
                "category":     "FLOW",
                "title":        f'{item["name"]} at {direction} ({pct:.0f})',
                "summary":      f'Funds are positioned at {pct:.1f} percentile in {item["name"]}. Flow state: {item.get("flow_state", "n/a")}.',
                "url":          "#",
                "published_at": str(latest_report_date),
                "importance":   "high" if pct >= 85 or pct <= 15 else "medium",
            })

    return {
        "macro_regime": {
            "title":     regime_title,
            "tag":       "COT live composite",
            "growth":    narrative("Growth",    growth_bucket,    growth_score,    growth_assets),
            "inflation": narrative("Inflation", inflation_bucket, inflation_score, inflation_assets),
            "policy":    narrative("Policy",    policy_bucket,    policy_score,    policy_assets),
            "verdict":   verdict,
        },
        "releases": [
            {"source": "CFTC",  "title": f"COT report processed — {latest_report_date}", "time": str(latest_report_date), "impact": "High"},
            {"source": "DB",    "title": f"{len(rows)} assets loaded",                   "time": "live",                  "impact": "Med"},
            {"source": "FLOW",  "title": regime_title,                                   "time": "live",                  "impact": "Med"},
        ],
        "calendar": calendar,
        "news":     news[:10],
    }