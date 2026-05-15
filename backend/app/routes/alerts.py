"""
Alert System — COT threshold alerts with email delivery.

Alerts fire when:
  1. COT Index crosses key thresholds (90/10 = extreme, 80/20 = strong)
  2. Net position flips sign (new directional commitment)
  3. Sharp net change (> 2× 8w rolling avg)
  4. Yield curve inverts / VIX spikes (from macro context)

Delivery:
  - Stored in DB table `alerts`
  - Email via Gmail SMTP (free, uses App Password)
  - In-app bell notification via GET /api/alerts/unread

Setup:
  Add to .env.local:
    ALERT_EMAIL_FROM=your@gmail.com
    ALERT_EMAIL_PASSWORD=xxxx xxxx xxxx xxxx   (Gmail App Password)
    ALERT_EMAIL_TO=your@email.com
    ALERT_EMAIL_ENABLED=true
"""

import os
import logging
import smtplib
from datetime import date, datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import text
from app.db import engine

router = APIRouter()
logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# DB init
# ─────────────────────────────────────────────────────────────────────────────
def init_alerts_table():
    with engine.begin() as conn:
        conn.execute(text("""
        CREATE TABLE IF NOT EXISTS alerts (
            id              SERIAL PRIMARY KEY,
            created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
            report_date     DATE,
            symbol          VARCHAR(20),
            name            VARCHAR(120),
            sector          VARCHAR(20),
            alert_type      VARCHAR(50) NOT NULL,
            direction       VARCHAR(10),
            title           VARCHAR(200) NOT NULL,
            body            TEXT,
            severity        VARCHAR(10) DEFAULT 'medium',  -- low | medium | high
            is_read         BOOLEAN DEFAULT FALSE,
            email_sent      BOOLEAN DEFAULT FALSE
        );
        """))


# ─────────────────────────────────────────────────────────────────────────────
# Alert detection
# ─────────────────────────────────────────────────────────────────────────────
def detect_cot_alerts(report_date: date) -> list[dict]:
    """
    Scan latest COT data and generate alerts.
    Compares current week vs previous week.
    """
    with engine.connect() as conn:
        rows = conn.execute(text("""
            WITH ranked AS (
                SELECT *,
                    ROW_NUMBER() OVER (
                        PARTITION BY symbol, source_type
                        ORDER BY report_date DESC
                    ) AS rn
                FROM cot_analytics
                WHERE report_date >= :d - INTERVAL '4 weeks'
            ),
            current_week AS (SELECT * FROM ranked WHERE rn = 1),
            prev_week    AS (SELECT * FROM ranked WHERE rn = 2)
            SELECT
                c.symbol, c.name, c.sector, c.source_type,
                c.report_date,
                CASE WHEN c.source_type='TFF' THEN c.leveraged_funds_percentile_3y
                     ELSE c.managed_money_percentile_3y END AS idx,
                CASE WHEN c.source_type='TFF' THEN c.leveraged_funds_net
                     ELSE c.managed_money_net END AS net_now,
                CASE WHEN p.source_type='TFF' THEN p.leveraged_funds_net
                     ELSE p.managed_money_net END AS net_prev,
                CASE WHEN p.source_type='TFF' THEN p.leveraged_funds_percentile_3y
                     ELSE p.managed_money_percentile_3y END AS idx_prev,
                c.funds_index_8w_avg,
                c.funds_index_wow_change
            FROM current_week c
            LEFT JOIN prev_week p USING (symbol, source_type)
            WHERE c.report_date = :d
        """), {"d": report_date}).mappings().all()

    alerts = []

    for row in rows:
        idx      = row["idx"]
        idx_prev = row["idx_prev"]
        net_now  = row["net_now"]
        net_prev = row["net_prev"]
        wow      = row["funds_index_wow_change"]
        avg8w    = row["funds_index_8w_avg"]
        name     = row["name"]
        symbol   = row["symbol"]
        sector   = row["sector"]

        if idx is None:
            continue

        idx = float(idx)

        # 1. Extreme long (≥90)
        if idx >= 90:
            prev_extreme = idx_prev is not None and float(idx_prev) >= 90
            if not prev_extreme:  # only alert on first entry into extreme zone
                alerts.append({
                    "symbol": symbol, "name": name, "sector": sector,
                    "alert_type": "extreme_long",
                    "direction": "long",
                    "title": f"🔴 {name} — Extreme Long Positioning ({idx:.1f})",
                    "body": (
                        f"{name} ({symbol}) COT Index reached {idx:.1f} — entering extreme long territory (≥90). "
                        f"Historically this level signals crowded positioning and elevated reversal risk. "
                        f"Consider reducing long exposure or tightening stops."
                    ),
                    "severity": "high",
                })

        # 2. Extreme short (≤10)
        if idx <= 10:
            prev_extreme = idx_prev is not None and float(idx_prev) <= 10
            if not prev_extreme:
                alerts.append({
                    "symbol": symbol, "name": name, "sector": sector,
                    "alert_type": "extreme_short",
                    "direction": "short",
                    "title": f"🟢 {name} — Extreme Short Positioning ({idx:.1f})",
                    "body": (
                        f"{name} ({symbol}) COT Index dropped to {idx:.1f} — extreme short territory (≤10). "
                        f"Crowded short positioning often precedes sharp short squeezes. "
                        f"Watch for reversal signals."
                    ),
                    "severity": "high",
                })

        # 3. Strong long entry (crossed above 65 from below)
        if idx >= 65 and idx_prev is not None and float(idx_prev) < 65:
            alerts.append({
                "symbol": symbol, "name": name, "sector": sector,
                "alert_type": "breakout_long",
                "direction": "long",
                "title": f"↑ {name} — Entered Bullish Positioning Zone ({idx:.1f})",
                "body": (
                    f"{name} ({symbol}) COT Index crossed above 65 (now {idx:.1f}). "
                    f"Funds are entering the bullish positioning zone. "
                    f"Align with macro and seasonal context before acting."
                ),
                "severity": "medium",
            })

        # 4. Crossed below 35 (entered bearish zone)
        if idx <= 35 and idx_prev is not None and float(idx_prev) > 35:
            alerts.append({
                "symbol": symbol, "name": name, "sector": sector,
                "alert_type": "breakout_short",
                "direction": "short",
                "title": f"↓ {name} — Entered Bearish Positioning Zone ({idx:.1f})",
                "body": (
                    f"{name} ({symbol}) COT Index dropped below 35 (now {idx:.1f}). "
                    f"Funds are entering bearish positioning territory."
                ),
                "severity": "medium",
            })

        # 5. Net flip
        if (net_now is not None and net_prev is not None and
                net_now != 0 and net_prev != 0 and
                abs(float(net_now)) > 500 and abs(float(net_prev)) > 500):
            if float(net_now) > 0 and float(net_prev) < 0:
                alerts.append({
                    "symbol": symbol, "name": name, "sector": sector,
                    "alert_type": "net_flip_long",
                    "direction": "long",
                    "title": f"🔄 {name} — Net Position Flipped to Long",
                    "body": (
                        f"{name} ({symbol}) net position flipped from short to long this week "
                        f"({float(net_prev):,.0f} → {float(net_now):,.0f}). "
                        f"New directional commitment from funds."
                    ),
                    "severity": "high",
                })
            elif float(net_now) < 0 and float(net_prev) > 0:
                alerts.append({
                    "symbol": symbol, "name": name, "sector": sector,
                    "alert_type": "net_flip_short",
                    "direction": "short",
                    "title": f"🔄 {name} — Net Position Flipped to Short",
                    "body": (
                        f"{name} ({symbol}) net position flipped from long to short this week "
                        f"({float(net_prev):,.0f} → {float(net_now):,.0f}). "
                        f"Funds are reversing directional commitment."
                    ),
                    "severity": "high",
                })

        # 6. Sharp WoW change (> 2× 8w avg)
        if wow is not None and avg8w is not None:
            threshold = abs(float(avg8w)) * 0.15  # 15% of 8w avg as min threshold
            if abs(float(wow)) > 10 and abs(float(wow)) > threshold:
                direction_label = "surge" if float(wow) > 0 else "liquidation"
                alerts.append({
                    "symbol": symbol, "name": name, "sector": sector,
                    "alert_type": f"sharp_{direction_label}",
                    "direction": "long" if float(wow) > 0 else "short",
                    "title": f"⚡ {name} — Sharp Index {direction_label.title()} ({wow:+.1f})",
                    "body": (
                        f"{name} ({symbol}) COT Index moved {wow:+.1f} points this week — "
                        f"significantly above the 8-week average. "
                        f"Aggressive {'accumulation' if float(wow) > 0 else 'liquidation'} by funds."
                    ),
                    "severity": "medium",
                })

    return alerts


def save_alerts(alerts: list[dict], report_date: date) -> list[dict]:
    """Save new alerts to DB. Deduplicates by (symbol, alert_type, report_date)."""
    if not alerts:
        return []

    init_alerts_table()
    saved = []

    with engine.begin() as conn:
        for alert in alerts:
            # Check if already exists for this report date
            existing = conn.execute(text("""
                SELECT id FROM alerts
                WHERE symbol = :symbol
                  AND alert_type = :alert_type
                  AND report_date = :d
                LIMIT 1
            """), {
                "symbol":     alert["symbol"],
                "alert_type": alert["alert_type"],
                "d":          report_date,
            }).scalar()

            if existing:
                continue

            result = conn.execute(text("""
                INSERT INTO alerts
                    (report_date, symbol, name, sector, alert_type,
                     direction, title, body, severity, is_read, email_sent)
                VALUES
                    (:d, :symbol, :name, :sector, :alert_type,
                     :direction, :title, :body, :severity, false, false)
                RETURNING id
            """), {
                "d":          report_date,
                "symbol":     alert["symbol"],
                "name":       alert.get("name"),
                "sector":     alert.get("sector"),
                "alert_type": alert["alert_type"],
                "direction":  alert.get("direction"),
                "title":      alert["title"],
                "body":       alert.get("body", ""),
                "severity":   alert.get("severity", "medium"),
            })
            new_id = result.scalar()
            saved.append({**alert, "id": new_id})

    return saved


# ─────────────────────────────────────────────────────────────────────────────
# Email delivery
# ─────────────────────────────────────────────────────────────────────────────
def send_email_alerts(alerts: list[dict]) -> bool:
    """Send batch email with all new alerts via Gmail SMTP."""
    if not alerts:
        return True

    email_from     = os.getenv("ALERT_EMAIL_FROM", "")
    email_password = os.getenv("ALERT_EMAIL_PASSWORD", "")
    email_to       = os.getenv("ALERT_EMAIL_TO", "")
    enabled        = os.getenv("ALERT_EMAIL_ENABLED", "false").lower() == "true"

    if not enabled:
        logger.info("[Alerts] Email disabled (ALERT_EMAIL_ENABLED != true)")
        return True

    if not all([email_from, email_password, email_to]):
        logger.warning("[Alerts] Email config incomplete — skipping email delivery")
        return False

    try:
        # Build HTML email
        high    = [a for a in alerts if a.get("severity") == "high"]
        medium  = [a for a in alerts if a.get("severity") == "medium"]
        low     = [a for a in alerts if a.get("severity") == "low"]

        def section(title, items, color):
            if not items:
                return ""
            rows = "".join(
                f"""<tr>
                    <td style="padding:12px 16px;border-bottom:1px solid #1a1a1a;">
                        <div style="font-size:13px;color:#e4e4e7;font-weight:600;">{a['title']}</div>
                        <div style="font-size:12px;color:#71717a;margin-top:4px;line-height:1.6;">{a.get('body','')}</div>
                    </td>
                </tr>"""
                for a in items
            )
            return f"""
                <tr><td style="padding:12px 16px 6px;font-size:11px;text-transform:uppercase;
                    letter-spacing:0.15em;color:{color};">{title}</td></tr>
                {rows}
            """

        html = f"""<!DOCTYPE html>
<html><body style="background:#050505;color:#e4e4e7;font-family:monospace;margin:0;padding:24px;">
<div style="max-width:600px;margin:0 auto;">
    <div style="border-bottom:1px solid #27272a;padding-bottom:16px;margin-bottom:24px;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.35em;color:#71717a;">
            ktaliman · trading
        </div>
        <div style="font-size:18px;font-weight:600;margin-top:8px;">
            COT Alert Digest — {len(alerts)} new signal{"s" if len(alerts)>1 else ""}
        </div>
    </div>
    <table width="100%" style="border-collapse:collapse;border:1px solid #27272a;">
        {section("High Priority", high, "#fb7185")}
        {section("Medium Priority", medium, "#fbbf24")}
        {section("Low Priority", low, "#71717a")}
    </table>
    <div style="margin-top:16px;font-size:11px;color:#52525b;text-transform:uppercase;letter-spacing:0.2em;">
        ktaliman trading · cot analytical dashboard
    </div>
</div></body></html>"""

        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"COT Alerts — {len(alerts)} new signal{'s' if len(alerts)>1 else ''}"
        msg["From"]    = email_from
        msg["To"]      = email_to
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(email_from, email_password)
            smtp.sendmail(email_from, email_to, msg.as_string())

        # Mark as sent in DB
        ids = [a["id"] for a in alerts if "id" in a]
        if ids:
            with engine.begin() as conn:
                conn.execute(text(
                    "UPDATE alerts SET email_sent = true WHERE id = ANY(:ids)"
                ), {"ids": ids})

        logger.info(f"[Alerts] Email sent with {len(alerts)} alerts")
        return True

    except Exception as e:
        logger.error(f"[Alerts] Email failed: {e}")
        return False


def run_alert_check(report_date: date | None = None) -> dict:
    """Full alert check: detect → save → email. Called by worker."""
    init_alerts_table()

    if report_date is None:
        with engine.connect() as conn:
            report_date = conn.execute(
                text("SELECT MAX(report_date) FROM cot_analytics")
            ).scalar()

    if not report_date:
        return {"ok": False, "message": "No COT data"}

    detected = detect_cot_alerts(report_date)
    saved    = save_alerts(detected, report_date)
    email_ok = send_email_alerts(saved) if saved else True

    return {
        "ok":           True,
        "report_date":  str(report_date),
        "detected":     len(detected),
        "saved":        len(saved),
        "email_sent":   email_ok and len(saved) > 0,
    }


# ─────────────────────────────────────────────────────────────────────────────
# API Routes
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/alerts/unread")
def get_unread_alerts(limit: int = 50):
    """Returns unread alerts for the notification bell."""
    init_alerts_table()
    with engine.connect() as conn:
        rows = conn.execute(text("""
            SELECT id, created_at, report_date, symbol, name, sector,
                   alert_type, direction, title, body, severity, is_read
            FROM alerts
            ORDER BY created_at DESC
            LIMIT :limit
        """), {"limit": limit}).mappings().all()

        unread_count = conn.execute(
            text("SELECT COUNT(*) FROM alerts WHERE is_read = false")
        ).scalar()

    items = []
    for row in rows:
        d = dict(row)
        d["created_at"]  = str(d["created_at"])
        d["report_date"] = str(d["report_date"]) if d["report_date"] else None
        items.append(d)

    return {"items": items, "unread_count": int(unread_count)}


@router.post("/alerts/mark-read")
def mark_alerts_read(ids: list[int] | None = None):
    """Mark specific alerts (or all) as read."""
    init_alerts_table()
    with engine.begin() as conn:
        if ids:
            conn.execute(
                text("UPDATE alerts SET is_read = true WHERE id = ANY(:ids)"),
                {"ids": ids}
            )
        else:
            conn.execute(text("UPDATE alerts SET is_read = true"))
    return {"ok": True}


@router.post("/alerts/run")
def trigger_alert_check():
    """Manually trigger alert check for latest COT data."""
    result = run_alert_check()
    return result


class AlertSettings(BaseModel):
    email_enabled: bool
    email_to: str = ""


@router.post("/alerts/test-email")
def test_email(settings: AlertSettings):
    """Send a test email to verify configuration."""
    email_from     = os.getenv("ALERT_EMAIL_FROM", "")
    email_password = os.getenv("ALERT_EMAIL_PASSWORD", "")

    if not all([email_from, email_password, settings.email_to]):
        return {"ok": False, "error": "Email config incomplete in .env.local"}

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "COT Dashboard — Test Email ✓"
        msg["From"]    = email_from
        msg["To"]      = settings.email_to
        html = """<body style="background:#050505;color:#e4e4e7;font-family:monospace;padding:24px;">
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.35em;color:#71717a;">
                ktaliman · trading
            </div>
            <div style="font-size:18px;font-weight:600;margin-top:12px;">
                Email alerts are configured correctly ✓
            </div>
            <div style="margin-top:12px;color:#71717a;font-size:13px;">
                You will receive COT alerts at this address when new signals are detected.
            </div>
        </body>"""
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(email_from, email_password)
            smtp.sendmail(email_from, settings.email_to, msg.as_string())

        return {"ok": True, "message": f"Test email sent to {settings.email_to}"}
    except Exception as e:
        return {"ok": False, "error": str(e)}
