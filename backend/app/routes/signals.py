from fastapi import APIRouter
from sqlalchemy import text
from app.db import engine

router = APIRouter()

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

def signal_from_percentile(value):
    if value is None:
        return None
    if value >= 90:
        return "LONG"
    if value >= 65:
        return "LONG"
    if value <= 10:
        return "SHORT"
    if value <= 35:
        return "SHORT"
    return "NEUTRAL"

@router.get("/signals")
def get_signals():
    with engine.connect() as conn:
        latest_date = conn.execute(
            text("SELECT MAX(report_date) FROM cot_analytics")
        ).scalar()

        if latest_date is None:
            return {
                "report_date": None,
                "items": []
            }

        rows = conn.execute(
            text(f"""
                {NORMALIZED_SELECT}
                WHERE report_date = :latest_date
                ORDER BY sector, name
            """),
            {"latest_date": latest_date},
        ).mappings().all()

    items = []
    for row in rows:
        score = row["funds_percentile_3y"]
        direction = signal_from_percentile(score)

        if direction == "NEUTRAL" or score is None:
            continue

        items.append({
            "symbol": row["symbol"],
            "name": row["name"],
            "sector": row["sector"],
            "source_type": row["source_type"],
            "direction": direction,
            "score": float(score),
            "flow_state": row["flow_state"],
            "open_interest": row["open_interest"],
            "funds_long": row["funds_long"],
            "funds_short": row["funds_short"],
            "funds_net": row["funds_net"],
            "funds_pct_oi": row["funds_pct_oi"],
            "funds_percentile_3y": row["funds_percentile_3y"],
            "dealer_long": row["dealer_long"],
            "dealer_short": row["dealer_short"],
            "dealer_net": row["dealer_net"],
            "dealer_pct_oi": row["dealer_pct_oi"],
            "dealer_percentile_3y": row["dealer_percentile_3y"],
        })

    items.sort(key=lambda x: abs(float(x["score"]) - 50), reverse=True)

    return {
        "report_date": latest_date,
        "items": items
    }