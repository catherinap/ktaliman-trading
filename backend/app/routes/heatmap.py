from fastapi import APIRouter
from sqlalchemy import text
from app.db import engine

router = APIRouter()

SECTOR_MAP = {
    "FX": "FX",
    "MET": "METALS",
    "IDX": "INDICES",
    "NRG": "ENERGY",
    "SFT": "SOFTS",
}

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

@router.get("/heatmap")
def get_heatmap():
    with engine.connect() as conn:
        latest_date = conn.execute(
            text("SELECT MAX(report_date) FROM cot_analytics")
        ).scalar()

        if latest_date is None:
            return {
                "report_date": None,
                "sectors": {}
            }

        rows = conn.execute(
            text(f"""
                {NORMALIZED_SELECT}
                WHERE report_date = :latest_date
                ORDER BY sector, name
            """),
            {"latest_date": latest_date},
        ).mappings().all()

    grouped = {}
    for row in rows:
        sector_name = SECTOR_MAP.get(row["sector"], row["sector"])
        grouped.setdefault(sector_name, []).append({
            "symbol": row["symbol"],
            "name": row["name"],
            "sector": row["sector"],
            "source_type": row["source_type"],
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
            "flow_state": row["flow_state"],
        })

    return {
        "report_date": latest_date,
        "sectors": grouped,
    }