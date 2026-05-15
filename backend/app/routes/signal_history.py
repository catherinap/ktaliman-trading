"""
Signal History — persistent signal lifecycle tracking.

Table: signal_history
- One row per (symbol, direction, first_seen_date)
- Updated every week when worker runs
- Tracks: weeks_active, peak_score, current_score, state transitions

Routes:
  POST /api/signals/persist   — called by worker after weekly update
  GET  /api/signals/history   — returns signal history with lifecycle data
"""

from datetime import date, timedelta
from fastapi import APIRouter
from sqlalchemy import text
from app.db import engine

router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# DB init
# ─────────────────────────────────────────────────────────────────────────────
def init_signal_history_table():
    with engine.begin() as conn:
        conn.execute(text("""
        CREATE TABLE IF NOT EXISTS signal_history (
            id                  SERIAL PRIMARY KEY,
            symbol              VARCHAR(20) NOT NULL,
            name                VARCHAR(120),
            sector              VARCHAR(20),
            direction           VARCHAR(10) NOT NULL,  -- long | short

            first_seen_date     DATE NOT NULL,
            last_seen_date      DATE NOT NULL,
            resolved_date       DATE,

            weeks_active        INT DEFAULT 1,
            peak_score          FLOAT,
            peak_score_date     DATE,
            current_score       FLOAT,
            current_state       VARCHAR(20),           -- active | aging | stale | invalidated | candidate

            -- Transition tracking
            became_active_date  DATE,
            became_aging_date   DATE,
            became_stale_date   DATE,
            invalidated_date    DATE,

            -- Score snapshots (last 8 weeks JSON array)
            score_history       TEXT,

            UNIQUE(symbol, direction, first_seen_date)
        );
        """))
        # Add columns if DB already exists without them
        for col, col_type in [
            ('became_active_date',  'DATE'),
            ('became_aging_date',   'DATE'),
            ('became_stale_date',   'DATE'),
            ('invalidated_date',    'DATE'),
            ('score_history',       'TEXT'),
        ]:
            try:
                conn.execute(text(
                    f"ALTER TABLE signal_history ADD COLUMN IF NOT EXISTS {col} {col_type}"
                ))
            except Exception:
                pass


# ─────────────────────────────────────────────────────────────────────────────
# Signal state classifier (mirrors frontend logic)
# ─────────────────────────────────────────────────────────────────────────────
def classify_state(percentile: float, direction: str, weeks_active: int) -> str:
    if percentile is None:
        return "candidate"

    is_long  = direction == "long"
    is_short = direction == "short"

    # Active zone
    if is_long  and percentile >= 65: return "active"
    if is_short and percentile <= 35: return "active"

    # Extreme → still active but watch
    if is_long  and percentile >= 90: return "active"
    if is_short and percentile <= 10: return "active"

    # Aging — signal weakening but not invalidated
    if is_long  and 45 <= percentile < 65: return "aging"
    if is_short and 35 < percentile <= 55: return "aging"

    # Invalidated — crossed to opposite side
    if is_long  and percentile <= 35: return "invalidated"
    if is_short and percentile >= 65: return "invalidated"

    # Stale — flat zone for too long
    if weeks_active > 6: return "stale"

    return "candidate"


def signal_direction(percentile: float) -> str | None:
    if percentile is None:
        return None
    if percentile >= 65:
        return "long"
    if percentile <= 35:
        return "short"
    return None


# ─────────────────────────────────────────────────────────────────────────────
# Core persist logic
# ─────────────────────────────────────────────────────────────────────────────
def persist_signals(report_date: date):
    """
    Called after each weekly update. Reads latest COT data and
    updates signal_history table.
    """
    import json as json_lib

    with engine.connect() as conn:
        # Get latest snapshot
        rows = conn.execute(text("""
            SELECT
                symbol, name, sector, source_type, report_date,
                CASE WHEN source_type='TFF' THEN leveraged_funds_percentile_3y
                     ELSE managed_money_percentile_3y END AS funds_percentile_3y,
                flow_state
            FROM cot_analytics
            WHERE report_date = :d
            ORDER BY sector, name
        """), {"d": report_date}).mappings().all()

    for row in rows:
        symbol      = row["symbol"]
        name        = row["name"]
        sector      = row["sector"]
        percentile  = row["funds_percentile_3y"]
        direction   = signal_direction(percentile)

        if direction is None or percentile is None:
            continue

        state = classify_state(float(percentile), direction, 1)

        with engine.begin() as conn:
            # Check if there's an open signal for this symbol+direction
            existing = conn.execute(text("""
                SELECT id, weeks_active, peak_score, current_state,
                       first_seen_date, score_history,
                       became_active_date, became_aging_date
                FROM signal_history
                WHERE symbol = :symbol
                  AND direction = :direction
                  AND resolved_date IS NULL
                ORDER BY first_seen_date DESC
                LIMIT 1
            """), {"symbol": symbol, "direction": direction}).mappings().first()

            if existing:
                # Update existing signal
                weeks_active = (existing["weeks_active"] or 1) + 1
                state = classify_state(float(percentile), direction, weeks_active)

                peak_score      = existing["peak_score"] or percentile
                peak_score_date = report_date
                if direction == "long" and percentile > peak_score:
                    peak_score = percentile
                elif direction == "short" and percentile < peak_score:
                    peak_score = percentile
                else:
                    peak_score_date = None  # not updated

                # Score history (keep last 8 entries)
                try:
                    hist = json_lib.loads(existing["score_history"] or "[]")
                except Exception:
                    hist = []
                hist.append({"date": str(report_date), "score": float(percentile)})
                hist = hist[-8:]  # keep last 8 weeks

                # Transition dates
                became_active   = existing["became_active_date"]
                became_aging    = existing["became_aging_date"]
                invalidated_dt  = None
                resolved_date   = None

                prev_state = existing["current_state"]
                if state == "active"      and prev_state != "active":   became_active = report_date
                if state == "aging"       and prev_state != "aging":    became_aging  = report_date
                if state == "invalidated":
                    invalidated_dt = report_date
                    resolved_date  = report_date

                conn.execute(text("""
                    UPDATE signal_history SET
                        last_seen_date      = :d,
                        weeks_active        = :wa,
                        current_score       = :score,
                        current_state       = :state,
                        peak_score          = :peak,
                        peak_score_date     = COALESCE(:psd, peak_score_date),
                        score_history       = :hist,
                        became_active_date  = COALESCE(:bad, became_active_date),
                        became_aging_date   = COALESCE(:baged, became_aging_date),
                        invalidated_date    = COALESCE(:inv, invalidated_date),
                        resolved_date       = :resolved
                    WHERE id = :id
                """), {
                    "d":       report_date,
                    "wa":      weeks_active,
                    "score":   float(percentile),
                    "state":   state,
                    "peak":    float(peak_score),
                    "psd":     peak_score_date,
                    "hist":    json_lib.dumps(hist),
                    "bad":     became_active,
                    "baged":   became_aging,
                    "inv":     invalidated_dt,
                    "resolved":resolved_date,
                    "id":      existing["id"],
                })

            else:
                # New signal — insert
                conn.execute(text("""
                    INSERT INTO signal_history (
                        symbol, name, sector, direction,
                        first_seen_date, last_seen_date,
                        weeks_active, peak_score, peak_score_date,
                        current_score, current_state,
                        became_active_date, score_history
                    ) VALUES (
                        :symbol, :name, :sector, :direction,
                        :d, :d,
                        1, :score, :d,
                        :score, :state,
                        :bad, :hist
                    )
                    ON CONFLICT (symbol, direction, first_seen_date) DO NOTHING
                """), {
                    "symbol":  symbol,
                    "name":    name,
                    "sector":  sector,
                    "direction": direction,
                    "d":       report_date,
                    "score":   float(percentile),
                    "state":   state,
                    "bad":     report_date if state == "active" else None,
                    "hist":    json_lib.dumps([{"date": str(report_date), "score": float(percentile)}]),
                })


# ─────────────────────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────────────────────
@router.post("/signals/persist")
def run_persist():
    """Trigger signal persistence for latest report date."""
    init_signal_history_table()
    with engine.connect() as conn:
        latest = conn.execute(
            text("SELECT MAX(report_date) FROM cot_analytics")
        ).scalar()
    if not latest:
        return {"ok": False, "message": "No COT data found"}
    persist_signals(latest)
    return {"ok": True, "report_date": str(latest)}


@router.get("/signals/history")
def get_signal_history(active_only: bool = False, limit: int = 100):
    """
    Returns signal history with lifecycle data.
    active_only=true returns only open signals (not resolved).
    """
    import json as json_lib

    init_signal_history_table()

    where = "WHERE resolved_date IS NULL" if active_only else ""

    with engine.connect() as conn:
        rows = conn.execute(text(f"""
            SELECT
                id, symbol, name, sector, direction,
                first_seen_date, last_seen_date, resolved_date,
                weeks_active, peak_score, peak_score_date,
                current_score, current_state,
                became_active_date, became_aging_date,
                invalidated_date, score_history
            FROM signal_history
            {where}
            ORDER BY
                CASE current_state
                    WHEN 'active'      THEN 1
                    WHEN 'aging'       THEN 2
                    WHEN 'candidate'   THEN 3
                    WHEN 'stale'       THEN 4
                    WHEN 'invalidated' THEN 5
                    ELSE 6
                END,
                weeks_active DESC
            LIMIT :limit
        """), {"limit": limit}).mappings().all()

    items = []
    for row in rows:
        d = dict(row)
        # Parse score_history JSON
        try:
            d["score_history"] = json_lib.loads(d["score_history"] or "[]")
        except Exception:
            d["score_history"] = []
        # Stringify dates
        for field in ["first_seen_date", "last_seen_date", "resolved_date",
                      "peak_score_date", "became_active_date",
                      "became_aging_date", "invalidated_date"]:
            if d.get(field):
                d[field] = str(d[field])
        items.append(d)

    return {"items": items, "total": len(items)}
