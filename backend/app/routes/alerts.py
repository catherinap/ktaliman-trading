"""
Alert System — COT threshold alerts with email delivery.

Alerts fire when:
  1. COT Index crosses key thresholds (90/10 = extreme, 65/35 = zone entry)
  2. Net position flips sign (new directional commitment)
  3. Sharp WoW change

Delivery:
  - Stored in DB table `alerts`
  - Email via Gmail SMTP (free, uses App Password)
  - In-app bell notification via GET /api/alerts/unread

Setup (.env.local):
    ALERT_EMAIL_FROM=your@gmail.com
    ALERT_EMAIL_PASSWORD=xxxx xxxx xxxx xxxx   (Gmail App Password)
    ALERT_EMAIL_TO=your@email.com
    ALERT_EMAIL_ENABLED=true
    ALERT_EMAIL_LANGUAGE=uk      (uk | en — language for email + stored alerts)
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


def alert_language() -> str:
    lang = os.getenv("ALERT_EMAIL_LANGUAGE", "en").lower()
    return "uk" if lang == "uk" else "en"


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
            severity        VARCHAR(10) DEFAULT 'medium',
            is_read         BOOLEAN DEFAULT FALSE,
            email_sent      BOOLEAN DEFAULT FALSE
        );
        """))


# ─────────────────────────────────────────────────────────────────────────────
# Bilingual alert text builders
# ─────────────────────────────────────────────────────────────────────────────
def build_alert_text(kind: str, lang: str, **kw) -> tuple[str, str]:
    """Returns (title, body) in the requested language."""
    name   = kw.get("name", "")
    symbol = kw.get("symbol", "")
    idx    = kw.get("idx")
    net_now  = kw.get("net_now")
    net_prev = kw.get("net_prev")
    wow      = kw.get("wow")
    uk = lang == "uk"

    if kind == "extreme_long":
        if uk:
            return (
                f"🔴 {name} — Екстремальне лонг-позиціонування ({idx:.1f})",
                f"{name} ({symbol}): COT Index сягнув {idx:.1f} — екстремальна лонг-зона (≥90). "
                f"Історично цей рівень сигналізує про переповнене позиціонування і підвищений ризик розвороту. "
                f"Розглянь скорочення лонг-експозиції або підтягування стопів."
            )
        return (
            f"🔴 {name} — Extreme Long Positioning ({idx:.1f})",
            f"{name} ({symbol}) COT Index reached {idx:.1f} — extreme long territory (≥90). "
            f"Historically this signals crowded positioning and elevated reversal risk. "
            f"Consider reducing long exposure or tightening stops."
        )

    if kind == "extreme_short":
        if uk:
            return (
                f"🟢 {name} — Екстремальне шорт-позиціонування ({idx:.1f})",
                f"{name} ({symbol}): COT Index впав до {idx:.1f} — екстремальна шорт-зона (≤10). "
                f"Переповнений шорт часто передує різким шорт-сквізам. Стеж за сигналами розвороту."
            )
        return (
            f"🟢 {name} — Extreme Short Positioning ({idx:.1f})",
            f"{name} ({symbol}) COT Index dropped to {idx:.1f} — extreme short territory (≤10). "
            f"Crowded short positioning often precedes sharp short squeezes. Watch for reversal signals."
        )

    if kind == "breakout_long":
        if uk:
            return (
                f"↑ {name} — Вхід у бичачу зону ({idx:.1f})",
                f"{name} ({symbol}): COT Index перетнув 65 (зараз {idx:.1f}). "
                f"Фонди входять у бичачу зону позиціонування. Звір з macro та сезонним контекстом перед дією."
            )
        return (
            f"↑ {name} — Entered Bullish Zone ({idx:.1f})",
            f"{name} ({symbol}) COT Index crossed above 65 (now {idx:.1f}). "
            f"Funds are entering the bullish positioning zone. Align with macro and seasonal context before acting."
        )

    if kind == "breakout_short":
        if uk:
            return (
                f"↓ {name} — Вхід у ведмежу зону ({idx:.1f})",
                f"{name} ({symbol}): COT Index впав нижче 35 (зараз {idx:.1f}). "
                f"Фонди входять у ведмежу зону позиціонування."
            )
        return (
            f"↓ {name} — Entered Bearish Zone ({idx:.1f})",
            f"{name} ({symbol}) COT Index dropped below 35 (now {idx:.1f}). "
            f"Funds are entering bearish positioning territory."
        )

    if kind == "net_flip_long":
        if uk:
            return (
                f"🔄 {name} — Нетто-позиція розвернулась у лонг",
                f"{name} ({symbol}): нетто-позиція цього тижня змінилась з шорт на лонг "
                f"({net_prev:,.0f} → {net_now:,.0f}). Нове напрямкове зобов'язання фондів."
            )
        return (
            f"🔄 {name} — Net Position Flipped to Long",
            f"{name} ({symbol}) net position flipped from short to long this week "
            f"({net_prev:,.0f} → {net_now:,.0f}). New directional commitment from funds."
        )

    if kind == "net_flip_short":
        if uk:
            return (
                f"🔄 {name} — Нетто-позиція розвернулась у шорт",
                f"{name} ({symbol}): нетто-позиція цього тижня змінилась з лонг на шорт "
                f"({net_prev:,.0f} → {net_now:,.0f}). Фонди розвертають напрямкове зобов'язання."
            )
        return (
            f"🔄 {name} — Net Position Flipped to Short",
            f"{name} ({symbol}) net position flipped from long to short this week "
            f"({net_prev:,.0f} → {net_now:,.0f}). Funds are reversing directional commitment."
        )

    if kind == "sharp_surge":
        if uk:
            return (
                f"⚡ {name} — Різкий стрибок індексу ({wow:+.1f})",
                f"{name} ({symbol}): COT Index зрушив на {wow:+.1f} пунктів цього тижня — "
                f"значно вище 8-тижневого середнього. Агресивне накопичення фондами."
            )
        return (
            f"⚡ {name} — Sharp Index Surge ({wow:+.1f})",
            f"{name} ({symbol}) COT Index moved {wow:+.1f} points this week — "
            f"significantly above the 8-week average. Aggressive accumulation by funds."
        )

    if kind == "sharp_liquidation":
        if uk:
            return (
                f"⚡ {name} — Різка ліквідація індексу ({wow:+.1f})",
                f"{name} ({symbol}): COT Index зрушив на {wow:+.1f} пунктів цього тижня — "
                f"значно вище 8-тижневого середнього. Агресивна ліквідація фондами."
            )
        return (
            f"⚡ {name} — Sharp Index Liquidation ({wow:+.1f})",
            f"{name} ({symbol}) COT Index moved {wow:+.1f} points this week — "
            f"significantly above the 8-week average. Aggressive liquidation by funds."
        )

    return ("", "")


# ─────────────────────────────────────────────────────────────────────────────
# Alert detection
# ─────────────────────────────────────────────────────────────────────────────
def detect_cot_alerts(report_date: date, lang: str = "en") -> list[dict]:
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

        def mk(kind, direction, severity, **kw):
            title, body = build_alert_text(kind, lang, name=name, symbol=symbol, **kw)
            alerts.append({
                "symbol": symbol, "name": name, "sector": sector,
                "alert_type": kind, "direction": direction,
                "title": title, "body": body, "severity": severity,
            })

        # 1. Extreme long
        if idx >= 90:
            if not (idx_prev is not None and float(idx_prev) >= 90):
                mk("extreme_long", "long", "high", idx=idx)

        # 2. Extreme short
        if idx <= 10:
            if not (idx_prev is not None and float(idx_prev) <= 10):
                mk("extreme_short", "short", "high", idx=idx)

        # 3. Bullish zone entry
        if idx >= 65 and idx_prev is not None and float(idx_prev) < 65:
            mk("breakout_long", "long", "medium", idx=idx)

        # 4. Bearish zone entry
        if idx <= 35 and idx_prev is not None and float(idx_prev) > 35:
            mk("breakout_short", "short", "medium", idx=idx)

        # 5. Net flip
        if (net_now is not None and net_prev is not None and
                net_now != 0 and net_prev != 0 and
                abs(float(net_now)) > 500 and abs(float(net_prev)) > 500):
            if float(net_now) > 0 and float(net_prev) < 0:
                mk("net_flip_long", "long", "high",
                   net_now=float(net_now), net_prev=float(net_prev))
            elif float(net_now) < 0 and float(net_prev) > 0:
                mk("net_flip_short", "short", "high",
                   net_now=float(net_now), net_prev=float(net_prev))

        # 6. Sharp WoW change
        if wow is not None and avg8w is not None:
            threshold = abs(float(avg8w)) * 0.15
            if abs(float(wow)) > 10 and abs(float(wow)) > threshold:
                if float(wow) > 0:
                    mk("sharp_surge", "long", "medium", wow=float(wow))
                else:
                    mk("sharp_liquidation", "short", "medium", wow=float(wow))

    return alerts


def save_alerts(alerts: list[dict], report_date: date) -> list[dict]:
    if not alerts:
        return []
    init_alerts_table()
    saved = []
    with engine.begin() as conn:
        for alert in alerts:
            existing = conn.execute(text("""
                SELECT id FROM alerts
                WHERE symbol = :symbol AND alert_type = :alert_type AND report_date = :d
                LIMIT 1
            """), {
                "symbol": alert["symbol"], "alert_type": alert["alert_type"], "d": report_date,
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
                "d": report_date, "symbol": alert["symbol"], "name": alert.get("name"),
                "sector": alert.get("sector"), "alert_type": alert["alert_type"],
                "direction": alert.get("direction"), "title": alert["title"],
                "body": alert.get("body", ""), "severity": alert.get("severity", "medium"),
            })
            saved.append({**alert, "id": result.scalar()})
    return saved


# ─────────────────────────────────────────────────────────────────────────────
# Email delivery — styled to match the app
# ─────────────────────────────────────────────────────────────────────────────
def _email_html(alerts: list[dict], lang: str) -> str:
    uk = lang == "uk"
    high   = [a for a in alerts if a.get("severity") == "high"]
    medium = [a for a in alerts if a.get("severity") == "medium"]
    low    = [a for a in alerts if a.get("severity") == "low"]

    sev_label = {
        "high":   "Високий пріоритет" if uk else "High Priority",
        "medium": "Середній пріоритет" if uk else "Medium Priority",
        "low":    "Низький пріоритет" if uk else "Low Priority",
    }
    sev_color = {"high": "#f87171", "medium": "#fbbf24", "low": "#94a3b8"}

    def sev_dot(color):
        return (f'<span style="display:inline-block;width:7px;height:7px;border-radius:50%;'
                f'background:{color};box-shadow:0 0 6px {color};margin-right:8px;"></span>')

    def card(a):
        c = sev_color.get(a.get("severity"), "#94a3b8")
        return f"""
        <tr><td style="padding:0 0 10px 0;">
          <table width="100%" style="border-collapse:collapse;background:#transparent;
              border:1px solid #18181b;border-left:2px solid {c};border-radius:4px;">
            <tr><td style="padding:14px 16px;">
              <div style="font-size:13px;color:#f1f5f9;font-weight:600;line-height:1.5;">{a['title']}</div>
              <div style="font-size:12px;color:#94a3b8;margin-top:6px;line-height:1.7;">{a.get('body','')}</div>
            </td></tr>
          </table>
        </td></tr>"""

    def section(items, sev):
        if not items:
            return ""
        c = sev_color[sev]
        header = f"""
        <tr><td style="padding:18px 0 10px 0;">
          <span style="font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:{c};">
            {sev_dot(c)}{sev_label[sev]} · {len(items)}
          </span>
        </td></tr>"""
        return header + "".join(card(a) for a in items)

    count = len(alerts)
    title_line = (f"COT Дайджест — {count} нов{'ий сигнал' if count==1 else 'их сигнали' if 2<=count<=4 else 'их сигналів'}"
                  if uk else
                  f"COT Alert Digest — {count} new signal{'s' if count != 1 else ''}")
    footer = ("Panchenko trading · аналітична панель COT" if uk
              else "Panchenko trading · cot analytical dashboard")
    date_str = datetime.now().strftime("%d.%m.%Y · %H:%M")

    return f"""<!DOCTYPE html>
<html><body style="background:#001341;margin:0;padding:0;
    font-family:"'Inter',ui-sans-serif, system-ui, sans-serif;">
<table width="100%" style="background:#001341;border-collapse:collapse;">
<tr><td align="center" style="padding:32px 16px;">
<table width="100%" style="max-width:580px;border-collapse:collapse;">

  <!-- Header -->
  <tr><td style="padding-bottom:20px;border-bottom:1px solid #d6dff5;">
    <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.4em;color:#6085ff;">
      · Panchenko trading ·
    </div>
    <div style="font-size:19px;font-weight:600;color:var(--accent-color);margin-top:10px;letter-spacing:-0.01em;">
      {title_line}
    </div>
    <div style="font-size:11px;color:#52525b;margin-top:6px;letter-spacing:0.05em;">
      {date_str}
    </div>
  </td></tr>

  <!-- Alerts -->
  <tr><td style="padding-top:8px;">
    <table width="100%" style="border-collapse:collapse;">
      {section(high, "high")}
      {section(medium, "medium")}
      {section(low, "low")}
    </table>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding-top:24px;border-top:1px solid #d6dff5;">
    <div style="font-size:10px;color:#6085ff;text-transform:uppercase;letter-spacing:0.25em;">
      {footer}
    </div>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>"""


def send_email_alerts(alerts: list[dict], lang: str | None = None) -> bool:
    if not alerts:
        return True
    if lang is None:
        lang = alert_language()

    email_from     = os.getenv("ALERT_EMAIL_FROM", "")
    email_password = os.getenv("ALERT_EMAIL_PASSWORD", "")
    email_to       = os.getenv("ALERT_EMAIL_TO", "")
    enabled        = os.getenv("ALERT_EMAIL_ENABLED", "false").lower() == "true"

    if not enabled:
        logger.info("[Alerts] Email disabled")
        return True
    if not all([email_from, email_password, email_to]):
        logger.warning("[Alerts] Email config incomplete")
        return False

    try:
        html = _email_html(alerts, lang)
        count = len(alerts)
        uk = lang == "uk"
        subject = (f"COT Сповіщення — {count} нов{'ий' if count==1 else 'их'} сигнал{'' if count==1 else 'и' if 2<=count<=4 else 'ів'}"
                   if uk else
                   f"COT Alerts — {count} new signal{'s' if count != 1 else ''}")

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = email_from
        msg["To"]      = email_to
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(email_from, email_password)
            smtp.sendmail(email_from, email_to, msg.as_string())

        ids = [a["id"] for a in alerts if "id" in a]
        if ids:
            with engine.begin() as conn:
                conn.execute(text(
                    "UPDATE alerts SET email_sent = true WHERE id = ANY(:ids)"
                ), {"ids": ids})

        logger.info(f"[Alerts] Email sent with {count} alerts ({lang})")
        return True
    except Exception as e:
        logger.error(f"[Alerts] Email failed: {e}")
        return False


def run_alert_check(report_date: date | None = None) -> dict:
    init_alerts_table()
    lang = alert_language()

    if report_date is None:
        with engine.connect() as conn:
            report_date = conn.execute(
                text("SELECT MAX(report_date) FROM cot_analytics")
            ).scalar()
    if not report_date:
        return {"ok": False, "message": "No COT data"}

    detected = detect_cot_alerts(report_date, lang)
    saved    = save_alerts(detected, report_date)
    email_ok = send_email_alerts(saved, lang) if saved else True

    cleanup_old_alerts(keep_days=90)

    return {
        "ok": True, "report_date": str(report_date),
        "detected": len(detected), "saved": len(saved),
        "email_sent": email_ok and len(saved) > 0, "language": lang,
    }


def cleanup_old_alerts(keep_days: int = 90):
    with engine.begin() as conn:
        result = conn.execute(text(
            f"DELETE FROM alerts WHERE created_at < NOW() - INTERVAL '{int(keep_days)} days'"
        ))
        deleted = result.rowcount
    if deleted:
        logger.info(f"[Alerts] Cleaned up {deleted} alerts older than {keep_days} days")
    return deleted


# ─────────────────────────────────────────────────────────────────────────────
# API Routes
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/alerts/unread")
def get_unread_alerts(limit: int = 50):
    init_alerts_table()
    with engine.connect() as conn:
        rows = conn.execute(text("""
            SELECT id, created_at, report_date, symbol, name, sector,
                   alert_type, direction, title, body, severity, is_read
            FROM alerts ORDER BY created_at DESC LIMIT :limit
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
    init_alerts_table()
    with engine.begin() as conn:
        if ids:
            conn.execute(text("UPDATE alerts SET is_read = true WHERE id = ANY(:ids)"), {"ids": ids})
        else:
            conn.execute(text("UPDATE alerts SET is_read = true"))
    return {"ok": True}


@router.post("/alerts/run")
def trigger_alert_check():
    return run_alert_check()


class AlertSettings(BaseModel):
    email_enabled: bool
    email_to: str = ""


@router.post("/alerts/test-email")
def test_email(settings: AlertSettings):
    email_from     = os.getenv("ALERT_EMAIL_FROM", "")
    email_password = os.getenv("ALERT_EMAIL_PASSWORD", "")
    lang = alert_language()
    uk = lang == "uk"

    if not all([email_from, email_password, settings.email_to]):
        return {"ok": False, "error": "Email config incomplete in .env.local"}

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "COT Dashboard — Тест ✓" if uk else "COT Dashboard — Test Email ✓"
        msg["From"]    = email_from
        msg["To"]      = settings.email_to

        headline = ("Email-сповіщення налаштовано правильно ✓" if uk
                    else "Email alerts are configured correctly ✓")
        sub = ("Ти отримуватимеш COT сповіщення на цю адресу, коли з'являться нові сигнали."
               if uk else
               "You will receive COT alerts at this address when new signals are detected.")

        html = f"""<!DOCTYPE html>
<html><body style="background:#001341;margin:0;padding:0;
    font-family:"'Inter',ui-sans-serif, system-ui, sans-serif;">
<table width="100%" style="background:#001341;border-collapse:collapse;">
<tr><td align="center" style="padding:32px 16px;">
<table width="100%" style="max-width:580px;border-collapse:collapse;">
  <tr><td style="padding-bottom:20px;border-bottom:1px solid #d6dff5;">
    <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.4em;color:#6085ff;">
     · Panchenko trading ·
    </div>
  </td></tr>
  <tr><td style="padding-top:20px;">
    <div style="font-size:18px;font-weight:600;color:#4ade80;letter-spacing:-0.01em;">
      {headline}
    </div>
    <div style="margin-top:12px;color:#94a3b8;font-size:13px;line-height:1.7;">
      {sub}
    </div>
  </td></tr>
  <tr><td style="padding-top:24px;border-top:1px solid #d6dff5;margin-top:24px;">
    <div style="font-size:10px;color:#6085ff;text-transform:uppercase;letter-spacing:0.25em;padding-top:24px;">
      {'Panchenko trading · аналітична панель COT' if uk else 'Panchenko trading · cot analytical dashboard'}
    </div>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>"""
        msg.attach(MIMEText(html, "html"))

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(email_from, email_password)
            smtp.sendmail(email_from, settings.email_to, msg.as_string())

        ok_msg = (f"Тестовий лист надіслано на {settings.email_to}" if uk
                  else f"Test email sent to {settings.email_to}")
        return {"ok": True, "message": ok_msg}
    except Exception as e:
        return {"ok": False, "error": str(e)}