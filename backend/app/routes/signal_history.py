"""
Signal History — persistent signal lifecycle tracking.

FIXED: classify_state now mirrors frontend classifySignalState exactly:
  weeks_active is checked BEFORE the directional zone check.
  A signal in active zone for 4+ weeks → aging (not active).
"""

from datetime import date
from fastapi import APIRouter
from sqlalchemy import text
from app.db import engine

router = APIRouter()


def init_signal_history_table():
    with engine.begin() as conn:
        conn.execute(text("""
        CREATE TABLE IF NOT EXISTS signal_history (
            id                  SERIAL PRIMARY KEY,
            symbol              VARCHAR(20) NOT NULL,
            name                VARCHAR(120),
            sector              VARCHAR(20),
            direction           VARCHAR(10) NOT NULL,
            first_seen_date     DATE NOT NULL,
            last_seen_date      DATE NOT NULL,
            resolved_date       DATE,
            weeks_active        INT DEFAULT 1,
            peak_score          FLOAT,
            peak_score_date     DATE,
            current_score       FLOAT,
            current_state       VARCHAR(20),
            became_active_date  DATE,
            became_aging_date   DATE,
            became_stale_date   DATE,
            invalidated_date    DATE,
            score_history       TEXT,
            UNIQUE(symbol, direction, first_seen_date)
        );
        """))
        for col, col_type in [
            ('became_active_date', 'DATE'), ('became_aging_date', 'DATE'),
            ('became_stale_date',  'DATE'), ('invalidated_date',  'DATE'),
            ('score_history',      'TEXT'),
        ]:
            try:
                conn.execute(text(f"ALTER TABLE signal_history ADD COLUMN IF NOT EXISTS {col} {col_type}"))
            except Exception:
                pass


# ── FIXED classify_state — weeks checked BEFORE zone ─────────────────────────
def classify_state(percentile: float, direction: str, weeks_active: int) -> str:
    """
    Mirrors frontend classifySignalState exactly:
      1. neutral direction  → candidate
      2. crossed to opposite zone → invalidated
      3. weeks >= 6        → stale
      4. weeks >= 4        → aging   ← BEFORE active zone check!
      5. in directional zone → active
      6. else              → candidate
    """
    if percentile is None or direction == "neutral":
        return "candidate"

    is_long  = direction == "long"
    is_short = direction == "short"

    # 1. Invalidated — crossed to opposite zone
    if is_long  and percentile <= 35: return "invalidated"
    if is_short and percentile >= 65: return "invalidated"

    # 2. Stale — signal too old regardless of current position
    if weeks_active >= 6: return "stale"

    # 3. Aging — still in zone but signal has matured (weeks BEFORE zone check!)
    if weeks_active >= 4: return "aging"

    # 4. Active — fresh signal in correct directional zone
    if is_long  and percentile >= 65: return "active"
    if is_short and percentile <= 35: return "active"

    return "candidate"

def calculate_peak_from_history(symbol: str, direction: str, first_seen_date) -> float | None:
    """
    Calculate real peak score from cot_analytics history.
    For long signals: max percentile since first_seen_date
    For short signals: min percentile since first_seen_date
    """
    with engine.connect() as conn:
        if direction == 'long':
            result = conn.execute(text("""
                SELECT MAX(
                    CASE WHEN source_type='TFF'
                    THEN leveraged_funds_percentile_3y
                    ELSE managed_money_percentile_3y END
                )
                FROM cot_analytics
                WHERE symbol = :symbol
                  AND report_date >= :since
            """), {"symbol": symbol, "since": first_seen_date}).scalar()
        else:
            result = conn.execute(text("""
                SELECT MIN(
                    CASE WHEN source_type='TFF'
                    THEN leveraged_funds_percentile_3y
                    ELSE managed_money_percentile_3y END
                )
                FROM cot_analytics
                WHERE symbol = :symbol
                  AND report_date >= :since
            """), {"symbol": symbol, "since": first_seen_date}).scalar()
    return float(result) if result is not None else None

def signal_direction(percentile):
    if percentile is None: return None
    if percentile >= 65:   return "long"
    if percentile <= 35:   return "short"
    return None


def persist_signals(report_date: date):
    import json as json_lib

    with engine.connect() as conn:
        rows = conn.execute(text("""
            SELECT symbol, name, sector, source_type,
                CASE WHEN source_type='TFF' THEN leveraged_funds_percentile_3y
                     ELSE managed_money_percentile_3y END AS funds_percentile_3y
            FROM cot_analytics
            WHERE report_date = :d
            ORDER BY sector, name
        """), {"d": report_date}).mappings().all()

    for row in rows:
        symbol    = row["symbol"]
        name      = row["name"]
        sector    = row["sector"]
        pct       = row["funds_percentile_3y"]
        direction = signal_direction(pct)
        if direction is None or pct is None:
            continue

        with engine.begin() as conn:
            from datetime import timedelta
            cutoff = report_date - timedelta(weeks=20)
            existing = conn.execute(text("""
                SELECT id, weeks_active, peak_score, current_state,
                    score_history, became_active_date, became_aging_date
                FROM signal_history
                WHERE symbol = :s AND direction = :d
                AND resolved_date IS NULL
                AND first_seen_date >= :cutoff
                ORDER BY first_seen_date DESC LIMIT 1
            """), {"s": symbol, "d": direction, "cutoff": cutoff}).mappings().first()

            if existing:
                weeks_active = (existing["weeks_active"] or 1) + 1
                state = classify_state(float(pct), direction, weeks_active)

                peak = existing["peak_score"] or pct
                peak_date = None
                if direction == "long"  and pct > peak:  peak = pct; peak_date = report_date
                elif direction == "short" and pct < peak: peak = pct; peak_date = report_date

                try:    hist = json_lib.loads(existing["score_history"] or "[]")
                except: hist = []
                hist.append({"date": str(report_date), "score": float(pct)})
                hist = hist[-8:]

                became_active = existing["became_active_date"]
                became_aging  = existing["became_aging_date"]
                inv_dt = None; resolved = None
                prev = existing["current_state"]
                if state == "active"      and prev != "active": became_active = report_date
                if state == "aging"       and prev != "aging":  became_aging  = report_date
                if state == "invalidated": inv_dt = report_date; resolved = report_date

                conn.execute(text("""
                    UPDATE signal_history SET
                        last_seen_date = :d, weeks_active = :wa,
                        current_score = :score, current_state = :state,
                        peak_score = :peak,
                        peak_score_date = COALESCE(:psd, peak_score_date),
                        score_history = :hist,
                        became_active_date = COALESCE(:bad, became_active_date),
                        became_aging_date  = COALESCE(:baged, became_aging_date),
                        invalidated_date   = COALESCE(:inv, invalidated_date),
                        resolved_date = :resolved
                    WHERE id = :id
                """), {"d": report_date, "wa": weeks_active, "score": float(pct),
                       "state": state, "peak": float(peak), "psd": peak_date,
                       "hist": json_lib.dumps(hist), "bad": became_active,
                       "baged": became_aging, "inv": inv_dt,
                       "resolved": resolved, "id": existing["id"]})
            else:
                state = classify_state(float(pct), direction, 1)
                conn.execute(text("""
                    INSERT INTO signal_history (
                        symbol, name, sector, direction,
                        first_seen_date, last_seen_date, weeks_active,
                        peak_score, peak_score_date, current_score, current_state,
                        became_active_date, score_history
                    ) VALUES (
                        :symbol, :name, :sector, :direction, :d, :d, 1,
                        :score, :d, :score, :state, :bad, :hist
                    ) ON CONFLICT (symbol, direction, first_seen_date) DO NOTHING
                """), {"symbol": symbol, "name": name, "sector": sector,
                       "direction": direction, "d": report_date, "score": float(pct),
                       "state": state,
                       "bad": report_date if state == "active" else None,
                       "hist": json_lib.dumps([{"date": str(report_date), "score": float(pct)}])})


def backfill_signal_history():
    """Rebuilds from ALL historical dates → gives real weeks_active."""
    init_signal_history_table()
    with engine.begin() as conn:
        conn.execute(text("DELETE FROM signal_history"))
    with engine.connect() as conn:
        from datetime import timedelta 
        cutoff = date.today() - timedelta(weeks=52)
        dates = [r[0] for r in conn.execute(text(
                "SELECT DISTINCT report_date FROM cot_analytics WHERE report_date >= :cutoff ORDER BY report_date ASC"
            ), {"cutoff": cutoff})]
    for d in dates:
        persist_signals(d)


@router.post("/signals/persist")
def run_persist():
    init_signal_history_table()
    with engine.connect() as conn:
        latest = conn.execute(text("SELECT MAX(report_date) FROM cot_analytics")).scalar()
    if not latest:
        return {"ok": False, "message": "No COT data found"}
    persist_signals(latest)
    return {"ok": True, "report_date": str(latest)}


@router.post("/signals/backfill")
def run_backfill():
    """Rebuilds signal history from all historical dates. Takes 1-2 min."""
    import threading
    threading.Thread(target=backfill_signal_history, daemon=True).start()
    return {"ok": True, "message": "Backfill started. Takes 1-2 min. Then check /api/signals/history."}

@router.get("/signals/peaks")
def get_signal_peaks():
    """
    Returns peak scores calculated from full COT history for all
    currently directional assets. Used by frontend hybrid approach.
    """
    with engine.connect() as conn:
        # Get all currently directional assets with their first directional date
        rows = conn.execute(text("""
            SELECT DISTINCT ON (symbol)
                symbol, direction, first_seen_date
            FROM signal_history
            WHERE resolved_date IS NULL
            ORDER BY symbol, first_seen_date DESC
        """)).mappings().all()

    peaks = {}
    for row in rows:
        peak = calculate_peak_from_history(
            row["symbol"], row["direction"], row["first_seen_date"]
        )
        if peak is not None:
            peaks[row["symbol"]] = {
                "peak_score":     peak,
                "direction":      row["direction"],
                "first_seen_date": str(row["first_seen_date"]),
            }
    return {"peaks": peaks}

@router.get("/signals/history")
def get_signal_history(active_only: bool = False, limit: int = 200):
    import json as json_lib
    init_signal_history_table()
    from datetime import timedelta
    cutoff = (date.today() - timedelta(weeks=52)).isoformat()
    if active_only:
        where = f"WHERE resolved_date IS NULL AND first_seen_date >= '{cutoff}'"
    else:
        where = f"WHERE first_seen_date >= '{cutoff}'"
    with engine.connect() as conn:
        rows = conn.execute(text(f"""
            SELECT id, symbol, name, sector, direction,
                first_seen_date, last_seen_date, resolved_date,
                weeks_active, peak_score, peak_score_date,
                current_score, current_state,
                became_active_date, became_aging_date,
                invalidated_date, score_history
            FROM signal_history {where}
            ORDER BY
                CASE current_state
                    WHEN 'active' THEN 1 WHEN 'aging' THEN 2
                    WHEN 'candidate' THEN 3 WHEN 'stale' THEN 4
                    WHEN 'invalidated' THEN 5 ELSE 6 END,
                weeks_active DESC
            LIMIT :limit
        """), {"limit": limit}).mappings().all()
    items = []
    for row in rows:
        d = dict(row)
        try:    d["score_history"] = json_lib.loads(d["score_history"] or "[]")
        except: d["score_history"] = []
        for f in ["first_seen_date","last_seen_date","resolved_date","peak_score_date",
                  "became_active_date","became_aging_date","invalidated_date"]:
            if d.get(f): d[f] = str(d[f])
        items.append(d)
    # Enrich peak_score from real history for active/aging signals
    for item in items:
        if item.get('current_state') in ('active', 'aging') and item.get('first_seen_date'):
            try:
                from datetime import date
                since = date.fromisoformat(item['first_seen_date'])
                real_peak = calculate_peak_from_history(
                    item['symbol'], item['direction'], since
                )
                if real_peak is not None:
                    item['peak_score'] = real_peak
            except Exception:
                pass
    return {"items": items, "total": len(items)}