from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from app.db import engine

router = APIRouter()


def pct_long(long, short):
    try:
        total = float(long or 0) + float(short or 0)
        if total == 0:
            return None
        return round(float(long or 0) / total * 100, 1)
    except Exception:
        return None


def pct_short(long, short):
    try:
        total = float(long or 0) + float(short or 0)
        if total == 0:
            return None
        return round(float(short or 0) / total * 100, 1)
    except Exception:
        return None


def net_change(current, previous):
    try:
        if current is None or previous is None:
            return None
        return round(float(current) - float(previous), 0)
    except Exception:
        return None


@router.get("/history/symbols")
def get_history_symbols():
    with engine.connect() as conn:
        rows = conn.execute(text("""
            SELECT DISTINCT symbol, name, sector, source_type
            FROM cot_analytics
            ORDER BY sector, name
        """)).mappings().all()
    return {"items": [dict(r) for r in rows]}


@router.get("/history/{symbol}")
def get_history(symbol: str):
    with engine.connect() as conn:
        exists = conn.execute(
            text("SELECT 1 FROM cot_analytics WHERE symbol = :s LIMIT 1"),
            {"s": symbol}
        ).scalar()
        if not exists:
            raise HTTPException(status_code=404, detail=f"Symbol '{symbol}' not found")

        rows = conn.execute(text("""
            SELECT
                report_date, symbol, name, sector, source_type, open_interest,
                CASE WHEN source_type='TFF' THEN leveraged_funds_long  ELSE managed_money_long  END AS funds_long,
                CASE WHEN source_type='TFF' THEN leveraged_funds_short ELSE managed_money_short END AS funds_short,
                CASE WHEN source_type='TFF' THEN leveraged_funds_net   ELSE managed_money_net   END AS funds_net,
                CASE WHEN source_type='TFF' THEN leveraged_funds_percentile_3y ELSE managed_money_percentile_3y END AS funds_index,
                CASE WHEN source_type='TFF' THEN asset_manager_long    ELSE producer_merchant_long  END AS am_long,
                CASE WHEN source_type='TFF' THEN asset_manager_short   ELSE producer_merchant_short END AS am_short,
                CASE WHEN source_type='TFF' THEN asset_manager_net     ELSE producer_merchant_net   END AS am_net,
                CASE WHEN source_type='TFF' THEN asset_manager_percentile_3y ELSE producer_merchant_percentile_3y END AS am_index,
                CASE WHEN source_type='TFF' THEN dealer_intermediary_long  ELSE swap_dealers_long  END AS dealer_long,
                CASE WHEN source_type='TFF' THEN dealer_intermediary_short ELSE swap_dealers_short END AS dealer_short,
                CASE WHEN source_type='TFF' THEN dealer_intermediary_net   ELSE swap_dealers_net   END AS dealer_net,
                CASE WHEN source_type='TFF' THEN dealer_intermediary_percentile_3y ELSE swap_dealers_percentile_3y END AS dealer_index
            FROM cot_analytics
            WHERE symbol = :symbol
            ORDER BY report_date DESC
        """), {"symbol": symbol}).mappings().all()

    if not rows:
        raise HTTPException(status_code=404, detail=f"No data for '{symbol}'")

    rows_list = list(rows)
    result = []
    for i, row in enumerate(rows_list):
        prev = rows_list[i + 1] if i + 1 < len(rows_list) else None
        result.append({
            "date":             str(row["report_date"]),
            "open_interest":    row["open_interest"],
            "oi_change":        net_change(row["open_interest"], prev["open_interest"] if prev else None),
            "funds_long":       row["funds_long"],
            "funds_short":      row["funds_short"],
            "funds_pct_long":   pct_long(row["funds_long"],   row["funds_short"]),
            "funds_pct_short":  pct_short(row["funds_long"],  row["funds_short"]),
            "funds_net":        row["funds_net"],
            "funds_net_change": net_change(row["funds_net"],  prev["funds_net"]  if prev else None),
            "funds_index":      row["funds_index"],
            "am_long":          row["am_long"],
            "am_short":         row["am_short"],
            "am_pct_long":      pct_long(row["am_long"],      row["am_short"]),
            "am_pct_short":     pct_short(row["am_long"],     row["am_short"]),
            "am_net":           row["am_net"],
            "am_net_change":    net_change(row["am_net"],     prev["am_net"]     if prev else None),
            "am_index":         row["am_index"],
            "dealer_long":      row["dealer_long"],
            "dealer_short":     row["dealer_short"],
            "dealer_pct_long":  pct_long(row["dealer_long"],  row["dealer_short"]),
            "dealer_pct_short": pct_short(row["dealer_long"], row["dealer_short"]),
            "dealer_net":       row["dealer_net"],
            "dealer_net_change":net_change(row["dealer_net"], prev["dealer_net"] if prev else None),
            "dealer_index":     row["dealer_index"],
        })

    return {
        "symbol":      symbol,
        "name":        rows_list[0]["name"],
        "sector":      rows_list[0]["sector"],
        "source_type": rows_list[0]["source_type"],
        "total_rows":  len(result),
        "items":       result,
    }
