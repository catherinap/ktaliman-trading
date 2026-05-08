from fastapi import APIRouter
from sqlalchemy import text
from app.db import engine
import requests

router = APIRouter(prefix="/api/workspace", tags=["workspace"])

MACRO_API_BASE = "http://127.0.0.1:8001"


def fetch_macro_data(path):
    try:
        response = requests.get(f"{MACRO_API_BASE}{path}", timeout=5)
        response.raise_for_status()
        payload = response.json()
        if isinstance(payload, dict) and payload.get("ok") is True:
            data = payload.get("data")
            if isinstance(data, list):
                return data
    except Exception:
        pass
    return None

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
        symbol,
        name,
        sector,
        source_type,
        report_date,
        open_interest,
        flow_state,

        CASE
            WHEN source_type = 'TFF' THEN leveraged_funds_long
            ELSE managed_money_long
        END AS funds_long,

        CASE
            WHEN source_type = 'TFF' THEN leveraged_funds_short
            ELSE managed_money_short
        END AS funds_short,

        CASE
            WHEN source_type = 'TFF' THEN leveraged_funds_net
            ELSE managed_money_net
        END AS funds_net,

        CASE
            WHEN source_type = 'TFF' THEN leveraged_funds_pct_oi
            ELSE managed_money_pct_oi
        END AS funds_pct_oi,

        CASE
            WHEN source_type = 'TFF' THEN leveraged_funds_percentile_3y
            ELSE managed_money_percentile_3y
        END AS funds_percentile_3y,

        CASE
            WHEN source_type = 'TFF' THEN dealer_intermediary_long
            ELSE swap_dealers_long
        END AS dealer_long,

        CASE
            WHEN source_type = 'TFF' THEN dealer_intermediary_short
            ELSE swap_dealers_short
        END AS dealer_short,

        CASE
            WHEN source_type = 'TFF' THEN dealer_intermediary_net
            ELSE swap_dealers_net
        END AS dealer_net,

        CASE
            WHEN source_type = 'TFF' THEN dealer_intermediary_pct_oi
            ELSE swap_dealers_pct_oi
        END AS dealer_pct_oi,

        CASE
            WHEN source_type = 'TFF' THEN dealer_intermediary_percentile_3y
            ELSE swap_dealers_percentile_3y
        END AS dealer_percentile_3y
    FROM cot_analytics
"""


@router.get("")
def get_workspace():
    with engine.connect() as conn:
        latest = conn.execute(
            text("""
                SELECT MAX(report_date) AS latest_report_date
                FROM cot_analytics
            """)
        ).mappings().first()

        latest_report_date = latest["latest_report_date"]

        if latest_report_date is None:
            return {
                "macro_regime": {
                    "title": "No Data",
                    "tag": "Awaiting worker update",
                    "growth": "No COT data available yet.",
                    "inflation": "No COT data available yet.",
                    "policy": "No COT data available yet.",
                    "verdict": "Run the worker to populate cot_analytics."
                },
                "releases": [],
                "calendar": [],
                "news": []
            }

        rows = conn.execute(
            text(f"""
                {NORMALIZED_SELECT}
                WHERE report_date = :report_date
                ORDER BY sector, symbol
            """),
            {"report_date": latest_report_date},
        ).mappings().all()

    by_symbol = {row["symbol"]: row for row in rows}
    by_name = {row["name"]: row for row in rows}

    usd = by_symbol.get("US") or by_name.get("US Dollar")
    gold = by_symbol.get("Gold")
    wti = by_symbol.get("WTI") or by_name.get("WTI Crude")
    natgas = by_symbol.get("Natural") or by_name.get("Nat Gas")
    euro = by_symbol.get("Euro")
    jpy = by_symbol.get("Japanese") or by_name.get("JPY")
    spx = by_symbol.get("SP") or by_name.get("SP 500")
    nasdaq = by_symbol.get("Nasdaq")
    djia = by_symbol.get("DJIA") or by_name.get("Dow Jones")
    cocoa = by_symbol.get("Cocoa")
    coffee = by_symbol.get("Coffee")

    growth_assets = [x for x in [spx, nasdaq, djia, cocoa, coffee] if x]
    inflation_assets = [x for x in [gold, wti, natgas] if x]
    policy_assets = [x for x in [usd, euro, jpy] if x]

    def avg_percentile(items):
        vals = [
            float(x["funds_percentile_3y"])
            for x in items
            if x and x["funds_percentile_3y"] is not None
        ]
        return round(sum(vals) / len(vals), 1) if vals else None

    growth_score = avg_percentile(growth_assets)
    inflation_score = avg_percentile(inflation_assets)
    policy_score = avg_percentile(policy_assets)

    growth_bucket = pct_to_bucket(growth_score)
    inflation_bucket = pct_to_bucket(inflation_score)
    policy_bucket = pct_to_bucket(policy_score)

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
            return f"{label} positioning is supportive, with strength concentrated in {names}. Composite percentile: {score_text}."
        if bucket == "bearish":
            return f"{label} positioning is defensive, with weak sponsorship across {names}. Composite percentile: {score_text}."
        return f"{label} positioning is balanced, with mixed signals across {names}. Composite percentile: {score_text}."

    growth_text = narrative("Growth", growth_bucket, growth_score, growth_assets)
    inflation_text = narrative("Inflation", inflation_bucket, inflation_score, inflation_assets)
    policy_text = narrative("Policy", policy_bucket, policy_score, policy_assets)

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
        verdict_parts.append("USD and policy-sensitive positioning stay defensive for global liquidity")
    elif policy_bucket == "bearish":
        verdict_parts.append("policy positioning is easing")

    verdict = (
        "Current COT backdrop suggests " + ", while ".join(verdict_parts) + "."
        if verdict_parts else
        "Current COT backdrop is balanced across major sleeves."
    )
    releases = [
        {
            "source": "SYSTEM",
            "title": f"Latest COT report processed for {latest_report_date}",
            "time": str(latest_report_date),
            "impact": "High",
        },
        {
            "source": "DB",
            "title": f"{len(rows)} asset rows loaded into workspace snapshot",
            "time": "live",
            "impact": "Med",
        },
        {
            "source": "FLOW",
            "title": regime_title,
            "time": "live",
            "impact": "Med",
        },
    ]

    eligible = [x for x in rows if x["funds_percentile_3y"] is not None]

    real_calendar = fetch_macro_data("/api/economic-calendar")
    real_news = fetch_macro_data("/api/market-news")

    if real_calendar:
        calendar = real_calendar[:12]
    else:
        calendar = []
        for item in sorted(
            eligible,
            key=lambda x: abs(float(x["funds_percentile_3y"]) - 50),
            reverse=True,
        )[:3]:
            pct = float(item["funds_percentile_3y"])
            importance = "high" if pct >= 85 or pct <= 15 else "medium"

            calendar.append(
                {
                    "id": f'cal-{item["symbol"]}',
                    "datetime": None,
                    "country": item["sector"] or "",
                    "currency": item["symbol"] or "",
                    "title": f'{item["name"]} positioning at {pct:.1f} percentile',
                    "importance": importance,
                    "actual": round(pct, 1),
                    "forecast": None,
                    "previous": item.get("flow_state"),
                    "source": "Workspace",
                }
            )

    if real_news:
        news = real_news[:12]
    else:
        news = []

        for item in sorted(eligible, key=lambda x: float(x["funds_percentile_3y"]))[:2]:
            news.append(
                {
                    "id": f'news-weak-{item["symbol"]}',
                    "published_at": None,
                    "source": "Workspace",
                    "title": f'{item["name"]} in weak positioning territory',
                    "summary": f'{item["name"]} is in weak positioning territory with flow state "{item["flow_state"]}".',
                    "url": None,
                    "category": "flows",
                    "image": "",
                }
            )

        for item in sorted(eligible, key=lambda x: float(x["funds_percentile_3y"]), reverse=True)[:2]:
            news.append(
                {
                    "id": f'news-strong-{item["symbol"]}',
                    "published_at": None,
                    "source": "Workspace",
                    "title": f'{item["name"]} in strong positioning territory',
                    "summary": f'{item["name"]} is in strong positioning territory with flow state "{item["flow_state"]}".',
                    "url": None,
                    "category": "flows",
                    "image": "",
                }
            )

    return {
        "macro_regime": {
            "title": regime_title,
            "tag": "COT live composite",
            "growth": growth_text,
            "inflation": inflation_text,
            "policy": policy_text,
            "verdict": verdict,
        },
        "releases": releases,
        "calendar": calendar,
        "news": news[:4],
    }