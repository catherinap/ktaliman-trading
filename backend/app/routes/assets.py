from fastapi import APIRouter, HTTPException
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
    END AS dealer_percentile_3y,

    CASE
        WHEN source_type = 'TFF' THEN asset_manager_long
        ELSE NULL
    END AS asset_manager_long,

    CASE
        WHEN source_type = 'TFF' THEN asset_manager_short
        ELSE NULL
    END AS asset_manager_short,

    CASE
        WHEN source_type = 'TFF' THEN asset_manager_net
        ELSE NULL
    END AS asset_manager_net,

    CASE
        WHEN source_type = 'TFF' THEN asset_manager_pct_oi
        ELSE NULL
    END AS asset_manager_pct_oi,

    CASE
        WHEN source_type = 'TFF' THEN asset_manager_percentile_3y
        ELSE NULL
    END AS asset_manager_percentile_3y,

    CASE
        WHEN source_type = 'TFF' THEN NULL
        ELSE producer_merchant_long
    END AS producer_long,

    CASE
        WHEN source_type = 'TFF' THEN NULL
        ELSE producer_merchant_short
    END AS producer_short,

    CASE
        WHEN source_type = 'TFF' THEN NULL
        ELSE producer_merchant_net
    END AS producer_net,

    CASE
        WHEN source_type = 'TFF' THEN NULL
        ELSE producer_merchant_pct_oi
    END AS producer_pct_oi,

    CASE
        WHEN source_type = 'TFF' THEN NULL
        ELSE producer_merchant_percentile_3y
    END AS producer_percentile_3y

FROM cot_analytics
"""

@router.get("/assets")
def get_assets():
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

    return {
        "report_date": latest_date,
        "items": [dict(r) for r in rows],
    }

@router.get("/assets/{symbol}")
def get_asset(symbol: str):
    with engine.connect() as conn:
        latest = conn.execute(
            text(f"""
                {NORMALIZED_SELECT}
                WHERE symbol = :symbol
                ORDER BY report_date DESC
                LIMIT 1
            """),
            {"symbol": symbol},
        ).mappings().first()

        if not latest:
            raise HTTPException(status_code=404, detail="Symbol not found")

        history = conn.execute(
            text(f"""
                {NORMALIZED_SELECT}
                WHERE symbol = :symbol
                ORDER BY report_date
            """),
            {"symbol": symbol},
        ).mappings().all()

    return {
        "latest": dict(latest),
        "history": [dict(r) for r in history],
    }