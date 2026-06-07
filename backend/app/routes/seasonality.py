from fastapi import APIRouter
from sqlalchemy import text
from app.db import engine
from app.cache import cached
from datetime import datetime

router = APIRouter()


@router.get("/seasonality")
def get_seasonality():
    return cached("seasonality", 3600, _compute_seasonality)


def _compute_seasonality():
    """
    Computes real seasonal tendencies from historical COT data.

    For each asset and each month (1-12):
      - Averages the funds/managed-money net position across all years
      - Normalises to 0-100  (0 = historically weakest month, 100 = strongest)

    Uses last 5 years of data so the window stays relevant.
    """
    with engine.connect() as conn:
        rows = conn.execute(text("""
            SELECT
                symbol,
                name,
                sector,
                source_type,
                EXTRACT(MONTH FROM report_date)::int  AS month,
                AVG(
                    CASE
                        WHEN source_type = 'TFF'    THEN leveraged_funds_net
                        ELSE                              managed_money_net
                    END
                ) AS avg_net,
                COUNT(*) AS data_points
            FROM cot_analytics
            WHERE
                report_date >= CURRENT_DATE - INTERVAL '5 years'
                AND (
                    (source_type = 'TFF'    AND leveraged_funds_net IS NOT NULL)
                    OR
                    (source_type = 'DISAGG' AND managed_money_net    IS NOT NULL)
                )
            GROUP BY symbol, name, sector, source_type,
                     EXTRACT(MONTH FROM report_date)
            ORDER BY symbol, month
        """)).mappings().all()

    # ── group by symbol ──────────────────────────────────────────────────────
    assets: dict = {}
    for row in rows:
        sym = row["symbol"]
        if sym not in assets:
            assets[sym] = {
                "symbol":      row["symbol"],
                "name":        row["name"],
                "sector":      row["sector"],
                "source_type": row["source_type"],
                "monthly":     {},          # month (1-12) → avg_net
            }
        # keep only the row with more data points if duplicate month appears
        month = row["month"]
        existing = assets[sym]["monthly"].get(month)
        if existing is None or row["data_points"] > existing.get("dp", 0):
            assets[sym]["monthly"][month] = {
                "avg": float(row["avg_net"]),
                "dp":  int(row["data_points"]),
            }

    current_month_idx = datetime.now().month - 1   # 0-based

    result = []
    for sym, asset in assets.items():
        monthly = asset["monthly"]

        # raw values for months 1-12  (None if month has no data)
        values_raw = [
            monthly[m]["avg"] if m in monthly else None
            for m in range(1, 13)
        ]

        valid = [v for v in values_raw if v is not None]
        if len(valid) < 3:
            continue        # not enough history — skip asset

        min_v = min(valid)
        max_v = max(valid)
        rng   = max_v - min_v

        if rng == 0:
            # flat series — all months equal → neutral 50
            normalised = [50.0] * 12
        else:
            normalised = [
                round((v - min_v) / rng * 100, 1) if v is not None else None
                for v in values_raw
            ]

        # replace None with 50 for display purposes only
        display = [v if v is not None else 50.0 for v in normalised]

        current_val = display[current_month_idx]

        result.append({
            "symbol":  asset["symbol"],
            "name":    asset["name"],
            "sector":  asset["sector"],
            "values":  display,                                # [Jan..Dec]
            "current": current_val,
            "best":    max(display),
            "worst":   min(display),
            "average": round(sum(display) / len(display), 1),
        })

    # sort by current-month score descending (best seasonal window first)
    result.sort(key=lambda x: x["current"], reverse=True)

    return {"items": result}
