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

    CASE WHEN source_type = 'TFF' THEN leveraged_funds_long       ELSE managed_money_long       END AS funds_long,
    CASE WHEN source_type = 'TFF' THEN leveraged_funds_short      ELSE managed_money_short      END AS funds_short,
    CASE WHEN source_type = 'TFF' THEN leveraged_funds_net        ELSE managed_money_net        END AS funds_net,
    CASE WHEN source_type = 'TFF' THEN leveraged_funds_pct_oi     ELSE managed_money_pct_oi     END AS funds_pct_oi,
    CASE WHEN source_type = 'TFF' THEN leveraged_funds_percentile_3y ELSE managed_money_percentile_3y END AS funds_percentile_3y,

    CASE WHEN source_type = 'TFF' THEN dealer_intermediary_long        ELSE swap_dealers_long        END AS dealer_long,
    CASE WHEN source_type = 'TFF' THEN dealer_intermediary_short       ELSE swap_dealers_short       END AS dealer_short,
    CASE WHEN source_type = 'TFF' THEN dealer_intermediary_net         ELSE swap_dealers_net         END AS dealer_net,
    CASE WHEN source_type = 'TFF' THEN dealer_intermediary_pct_oi      ELSE swap_dealers_pct_oi      END AS dealer_pct_oi,
    CASE WHEN source_type = 'TFF' THEN dealer_intermediary_percentile_3y ELSE swap_dealers_percentile_3y END AS dealer_percentile_3y,

    CASE WHEN source_type = 'TFF' THEN asset_manager_long            ELSE NULL END AS asset_manager_long,
    CASE WHEN source_type = 'TFF' THEN asset_manager_short           ELSE NULL END AS asset_manager_short,
    CASE WHEN source_type = 'TFF' THEN asset_manager_net             ELSE NULL END AS asset_manager_net,
    CASE WHEN source_type = 'TFF' THEN asset_manager_pct_oi          ELSE NULL END AS asset_manager_pct_oi,
    CASE WHEN source_type = 'TFF' THEN asset_manager_percentile_3y   ELSE NULL END AS asset_manager_percentile_3y,

    CASE WHEN source_type = 'TFF' THEN NULL ELSE producer_merchant_long            END AS producer_long,
    CASE WHEN source_type = 'TFF' THEN NULL ELSE producer_merchant_short           END AS producer_short,
    CASE WHEN source_type = 'TFF' THEN NULL ELSE producer_merchant_net             END AS producer_net,
    CASE WHEN source_type = 'TFF' THEN NULL ELSE producer_merchant_pct_oi          END AS producer_pct_oi,
    CASE WHEN source_type = 'TFF' THEN NULL ELSE producer_merchant_percentile_3y   END AS producer_percentile_3y

FROM cot_analytics
"""


def compute_momentum(history_rows: list) -> dict:
    """
    Given a list of rows sorted ASC by report_date,
    compute momentum fields from the most recent 8 weeks.

    Returns dict with momentum fields to merge into latest row.
    """
    if not history_rows:
        return _empty_momentum()

    # Get last 8 rows (most recent last due to ASC sort)
    recent = history_rows[-8:]
    indices = [
        float(r["funds_percentile_3y"])
        for r in recent
        if r.get("funds_percentile_3y") is not None
    ]

    if len(indices) < 2:
        return _empty_momentum()

    current = indices[-1]

    # Rolling averages
    avg_3w = round(sum(indices[-3:]) / len(indices[-3:]), 1) if len(indices) >= 3 else None
    avg_8w = round(sum(indices) / len(indices), 1)

    # Direction: compare current to 3w ago (or oldest available)
    lookback = indices[-4] if len(indices) >= 4 else indices[0]
    diff = current - lookback
    if abs(diff) < 2.0:
        direction = "flat"
    elif diff > 0:
        direction = "rising"
    else:
        direction = "falling"

    # Momentum score: current vs 8w avg (how far above/below trend)
    momentum_score = round(current - avg_8w, 1)

    # Acceleration: slope of last 3 weeks vs slope of 3 weeks before that
    acceleration = None
    if len(indices) >= 6:
        slope_recent = indices[-1] - indices[-3]
        slope_prior  = indices[-3] - indices[-5]
        accel_diff   = slope_recent - slope_prior
        if   accel_diff >  3: acceleration = "accelerating"
        elif accel_diff < -3: acceleration = "decelerating"
        else:                  acceleration = "steady"

    # Week-over-week change in index
    wow_change = round(current - indices[-2], 1) if len(indices) >= 2 else None

    return {
        "funds_index_3w_avg":    avg_3w,
        "funds_index_8w_avg":    avg_8w,
        "funds_index_direction": direction,
        "funds_index_momentum":  momentum_score,
        "funds_index_acceleration": acceleration,
        "funds_index_wow_change": wow_change,
    }


def _empty_momentum() -> dict:
    return {
        "funds_index_3w_avg":       None,
        "funds_index_8w_avg":       None,
        "funds_index_direction":    None,
        "funds_index_momentum":     None,
        "funds_index_acceleration": None,
        "funds_index_wow_change":   None,
    }


@router.get("/assets")
def get_assets():
    with engine.connect() as conn:
        latest_date = conn.execute(
            text("SELECT MAX(report_date) FROM cot_analytics")
        ).scalar()

        if latest_date is None:
            return {"report_date": None, "items": []}

        # Latest snapshot
        rows = conn.execute(
            text(f"{NORMALIZED_SELECT} WHERE report_date = :latest_date ORDER BY sector, name"),
            {"latest_date": latest_date},
        ).mappings().all()

        # Last 8 weeks per symbol for momentum
        recent_rows = conn.execute(text("""
            SELECT
                symbol,
                source_type,
                report_date,
                CASE WHEN source_type = 'TFF' THEN leveraged_funds_percentile_3y
                     ELSE managed_money_percentile_3y
                END AS funds_percentile_3y
            FROM cot_analytics
            WHERE report_date >= (
                SELECT MAX(report_date) - INTERVAL '12 weeks' FROM cot_analytics
            )
            ORDER BY symbol, source_type, report_date ASC
        """)).mappings().all()

    # Group recent rows by (symbol, source_type)
    from collections import defaultdict
    history_by_key = defaultdict(list)
    for r in recent_rows:
        key = (r["symbol"], r["source_type"])
        history_by_key[key].append(dict(r))

    # Merge momentum into each asset
    items = []
    for row in rows:
        d = dict(row)
        key = (d["symbol"], d["source_type"])
        momentum = compute_momentum(history_by_key.get(key, []))
        d.update(momentum)
        items.append(d)

    return {"report_date": str(latest_date), "items": items}


@router.get("/assets/{symbol}")
def get_asset(symbol: str):
    with engine.connect() as conn:
        latest = conn.execute(
            text(f"{NORMALIZED_SELECT} WHERE symbol = :symbol ORDER BY report_date DESC LIMIT 1"),
            {"symbol": symbol},
        ).mappings().first()

        if not latest:
            raise HTTPException(status_code=404, detail="Symbol not found")

        history = conn.execute(
            text(f"{NORMALIZED_SELECT} WHERE symbol = :symbol ORDER BY report_date ASC"),
            {"symbol": symbol},
        ).mappings().all()

    history_list = [dict(r) for r in history]
    momentum = compute_momentum(history_list)

    result = dict(latest)
    result.update(momentum)

    return {
        "latest":  result,
        "history": history_list,
    }
