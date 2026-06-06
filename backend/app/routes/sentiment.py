"""
Sentiment metrics — COT-based Fear & Greed, Velocity, Stagnation.

All three are computed from the latest cot_analytics positioning data,
blended with macro context (VIX, DXY) where relevant.

  - Fear & Greed (0-100): composite market sentiment.
      0   = extreme fear (everyone short / defensive, VIX high)
      100 = extreme greed (everyone long / crowded, VIX low)
  - Velocity (0-100): how fast positioning is changing right now.
  - Stagnation (0-100): inverse — how frozen positioning is.
"""

import logging
from datetime import date
from statistics import mean, pstdev

import requests
from fastapi import APIRouter
from sqlalchemy import text
from app.db import engine

router = APIRouter()
logger = logging.getLogger(__name__)


def _clamp(v, lo=0.0, hi=100.0):
    return max(lo, min(hi, v))


def _fetch_macro():
    """Pull VIX + DXY from the internal macro-context route. Returns dict or {}."""
    try:
        r = requests.get("http://localhost:8000/api/macro-context", timeout=8)
        if r.ok:
            data = r.json()
            out = {}
            for item in data.get("items", []):
                out[item["key"]] = item
            return out
    except Exception:
        pass
    return {}


def _latest_rows():
    """Latest-week normalized positioning rows for all assets."""
    with engine.connect() as conn:
        latest = conn.execute(
            text("SELECT MAX(report_date) FROM cot_analytics")
        ).scalar()
        if latest is None:
            return [], None
        rows = conn.execute(text("""
            SELECT
                symbol, name, sector, flow_state,
                CASE WHEN source_type='TFF' THEN leveraged_funds_percentile_3y
                     ELSE managed_money_percentile_3y END AS pct,
                funds_index_wow_change AS wow,
                funds_index_8w_avg     AS avg8w,
                funds_index_3w_avg     AS avg3w,
                funds_index_acceleration AS accel
            FROM cot_analytics
            WHERE report_date = :d
        """), {"d": latest}).mappings().all()
    return rows, latest


def compute_sentiment():
    rows, latest = _latest_rows()
    if not rows:
        return {"ok": False, "message": "No COT data"}

    pcts = [float(r["pct"]) for r in rows if r["pct"] is not None]
    wows = [float(r["wow"]) for r in rows if r["wow"] is not None]

    macro = _fetch_macro()
    vix_item = macro.get("vix") or {}
    dxy_item = macro.get("dxy") or {}
    vix_val = vix_item.get("value")
    dxy_chg = dxy_item.get("change_pct")

    # ── FEAR & GREED ──────────────────────────────────────────────
    # Component 1: positioning level (avg percentile). 50=neutral.
    avg_pct = mean(pcts) if pcts else 50.0
    pos_component = avg_pct  # already 0-100, higher = greedier

    # Component 2: VIX (inverted). VIX 10→greed(100), VIX 40→fear(0).
    if vix_val is not None:
        vix_component = _clamp((40.0 - float(vix_val)) / 30.0 * 100.0)
    else:
        vix_component = 50.0

    # Component 3: crowding via dispersion. Low spread = everyone aligned = emotional extreme.
    # We push the score AWAY from 50 when dispersion is low and positioning is one-sided.
    dispersion = pstdev(pcts) if len(pcts) > 1 else 25.0
    # normalize dispersion: 0 (all identical)→1.0 crowding, 40+ →0 crowding
    crowding = _clamp((40.0 - dispersion) / 40.0, 0.0, 1.0)
    # crowding amplifies the positioning bias
    amplified_pos = 50.0 + (pos_component - 50.0) * (1.0 + crowding)
    amplified_pos = _clamp(amplified_pos)

    # Component 4: DXY momentum. Dollar up = risk-off = fear (lower score).
    if dxy_chg is not None:
        dxy_component = _clamp(50.0 - float(dxy_chg) * 15.0)
    else:
        dxy_component = 50.0

    # Weighted blend
    fg = (
        amplified_pos * 0.45 +
        vix_component * 0.30 +
        dxy_component * 0.15 +
        pos_component * 0.10
    )
    fg = round(_clamp(fg), 1)

    if   fg >= 75: fg_label_key = "extreme_greed"
    elif fg >= 60: fg_label_key = "greed"
    elif fg >= 40: fg_label_key = "neutral"
    elif fg >= 25: fg_label_key = "fear"
    else:          fg_label_key = "extreme_fear"

    # ── VELOCITY ──────────────────────────────────────────────────
    # Average absolute weekly change, scaled. |wow| of ~15 = very fast.
    avg_abs_wow = mean(abs(w) for w in wows) if wows else 0.0
    accel_share = (
        sum(1 for r in rows if r["accel"] == "accelerating") / len(rows)
        if rows else 0.0
    )
    velocity = _clamp(avg_abs_wow / 15.0 * 100.0 * 0.75 + accel_share * 100.0 * 0.25)
    velocity = round(velocity, 1)

    # ── STAGNATION ────────────────────────────────────────────────
    # Share of assets that are barely moving (small wow AND 3w≈8w).
    stagnant = 0
    for r in rows:
        wow = abs(float(r["wow"])) if r["wow"] is not None else 0.0
        a3 = float(r["avg3w"]) if r["avg3w"] is not None else None
        a8 = float(r["avg8w"]) if r["avg8w"] is not None else None
        drift = abs(a3 - a8) if (a3 is not None and a8 is not None) else 0.0
        if wow < 3.0 and drift < 3.0:
            stagnant += 1
    stagnation = round(stagnant / len(rows) * 100.0, 1) if rows else 0.0

    return {
        "ok": True,
        "report_date": str(latest),
        "fear_greed": {
            "score": fg,
            "label_key": fg_label_key,
            "components": {
                "positioning": round(pos_component, 1),
                "vix": round(vix_component, 1),
                "crowding": round(crowding * 100, 1),
                "dxy": round(dxy_component, 1),
            },
            "vix_value": vix_val,
            "avg_percentile": round(avg_pct, 1),
            "dispersion": round(dispersion, 1),
        },
        "velocity": {
            "score": velocity,
            "avg_abs_wow": round(avg_abs_wow, 1),
            "accelerating_share": round(accel_share * 100, 1),
        },
        "stagnation": {
            "score": stagnation,
            "stagnant_count": stagnant,
            "total": len(rows),
        },
    }


@router.get("/sentiment")
def get_sentiment():
    return compute_sentiment()