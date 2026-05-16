from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from app.db import engine

router = APIRouter()

WINDOW_WEEKS = {
    "3y":  156,   # 3 years
    "5y":  260,   # 5 years
    "10y": 520,   # 10 years
}
DEFAULT_WINDOW = "3y"


def pct_long(long, short):
    try:
        total = float(long or 0) + float(short or 0)
        if total == 0: return None
        return round(float(long or 0) / total * 100, 1)
    except Exception:
        return None


def pct_short(long, short):
    try:
        total = float(long or 0) + float(short or 0)
        if total == 0: return None
        return round(float(short or 0) / total * 100, 1)
    except Exception:
        return None


def net_change(current, previous):
    try:
        if current is None or previous is None: return None
        return round(float(current) - float(previous), 0)
    except Exception:
        return None


def compute_cot_index_series(net_values: list, window: int, min_periods: int = 20) -> list:
    """
    Rolling Min-Max normalization over `window` periods.
    Returns list of floats (or None where insufficient data).
    net_values: list in chronological order (oldest first).
    """
    result = []
    for i in range(len(net_values)):
        start = max(0, i - window + 1)
        chunk = [v for v in net_values[start:i+1] if v is not None]
        if len(chunk) < min_periods:
            result.append(None)
            continue
        mn, mx = min(chunk), max(chunk)
        if mx == mn:
            result.append(50.0)
            continue
        current = net_values[i]
        if current is None:
            result.append(None)
        else:
            result.append(round((current - mn) / (mx - mn) * 100, 2))
    return result


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
def get_history(symbol: str, window: str = DEFAULT_WINDOW):
    """
    Returns COT history for a symbol.
    window: "3y" | "5y" | "10y" — controls the COT Index normalization window.
    Default: "3y" (156 weeks) — matches the stored percentile_3y columns.
    """
    window_weeks = WINDOW_WEEKS.get(window.lower(), WINDOW_WEEKS[DEFAULT_WINDOW])

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
                CASE WHEN source_type='TFF' THEN asset_manager_long    ELSE producer_merchant_long  END AS am_long,
                CASE WHEN source_type='TFF' THEN asset_manager_short   ELSE producer_merchant_short END AS am_short,
                CASE WHEN source_type='TFF' THEN asset_manager_net     ELSE producer_merchant_net   END AS am_net,
                CASE WHEN source_type='TFF' THEN dealer_intermediary_long  ELSE swap_dealers_long  END AS dealer_long,
                CASE WHEN source_type='TFF' THEN dealer_intermediary_short ELSE swap_dealers_short END AS dealer_short,
                CASE WHEN source_type='TFF' THEN dealer_intermediary_net   ELSE swap_dealers_net   END AS dealer_net,
                funds_index_3w_avg,
                funds_index_8w_avg,
                funds_index_direction,
                funds_index_momentum,
                funds_index_acceleration,
                funds_index_wow_change
            FROM cot_analytics
            WHERE symbol = :symbol
            ORDER BY report_date ASC
        """), {"symbol": symbol}).mappings().all()

    if not rows:
        raise HTTPException(status_code=404, detail=f"No data for '{symbol}'")

    rows_list = list(rows)

    # ── Compute COT Index for all three participant groups ───────────────────
    funds_net_series  = [row["funds_net"]  for row in rows_list]
    am_net_series     = [row["am_net"]     for row in rows_list]
    dealer_net_series = [row["dealer_net"] for row in rows_list]

    funds_index_series  = compute_cot_index_series(funds_net_series,  window_weeks)
    am_index_series     = compute_cot_index_series(am_net_series,     window_weeks)
    dealer_index_series = compute_cot_index_series(dealer_net_series, window_weeks)

    # ── Build result (newest first for frontend) ─────────────────────────────
    result = []
    n = len(rows_list)
    for i in range(n - 1, -1, -1):
        row  = rows_list[i]
        prev = rows_list[i - 1] if i > 0 else None

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
            "funds_index":      funds_index_series[i],

            "am_long":          row["am_long"],
            "am_short":         row["am_short"],
            "am_pct_long":      pct_long(row["am_long"],    row["am_short"]),
            "am_pct_short":     pct_short(row["am_long"],   row["am_short"]),
            "am_net":           row["am_net"],
            "am_net_change":    net_change(row["am_net"],   prev["am_net"]   if prev else None),
            "am_index":         am_index_series[i],

            "dealer_long":      row["dealer_long"],
            "dealer_short":     row["dealer_short"],
            "dealer_pct_long":  pct_long(row["dealer_long"],  row["dealer_short"]),
            "dealer_pct_short": pct_short(row["dealer_long"], row["dealer_short"]),
            "dealer_net":       row["dealer_net"],
            "dealer_net_change":net_change(row["dealer_net"], prev["dealer_net"] if prev else None),
            "dealer_index":     dealer_index_series[i],

            "funds_index_3w_avg":       row["funds_index_3w_avg"],
            "funds_index_8w_avg":       row["funds_index_8w_avg"],
            "funds_index_direction":    row["funds_index_direction"],
            "funds_index_momentum":     row["funds_index_momentum"],
            "funds_index_acceleration": row["funds_index_acceleration"],
            "funds_index_wow_change":   row["funds_index_wow_change"],
        })

    return {
        "symbol":      symbol,
        "name":        rows_list[0]["name"],
        "sector":      rows_list[0]["sector"],
        "source_type": rows_list[0]["source_type"],
        "total_rows":  len(result),
        "window":      window.lower(),
        "window_weeks": window_weeks,
        "items":       result,
    }
