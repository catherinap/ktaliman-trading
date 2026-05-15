"""
Macro Context Route — real market data to complement COT analysis.

Fetches via yfinance (free, no API key needed):
  - VIX  (^VIX)     — risk appetite / fear gauge
  - DXY  (DX-Y.NYB) — US Dollar Index
  - 10Y  (^TNX)     — 10-year Treasury yield
  - 2Y   (^IRX)     — 2-year Treasury yield (proxy: 13-week)
  - SPX  (^GSPC)    — S&P 500 price (regime confirmation)

Derived:
  - Yield curve spread (10Y - 2Y) — recession / expansion indicator
  - Yield curve regime: normal / flat / inverted
  - Macro regime label based on VIX + yield curve + DXY
"""

import logging
from datetime import datetime, timedelta
from fastapi import APIRouter

router = APIRouter()
logger = logging.getLogger(__name__)


def _fetch_yfinance():
    """Returns dict of latest values from Yahoo Finance."""
    try:
        import yfinance as yf
    except ImportError:
        return None, "yfinance not installed. Run: pip install yfinance"

    tickers = {
        "vix":  "^VIX",
        "dxy":  "DX-Y.NYB",
        "t10y": "^TNX",
        "t2y":  "^IRX",   # 13-week T-bill as 2Y proxy
        "spx":  "^GSPC",
    }

    end   = datetime.now()
    start = end - timedelta(days=7)   # grab last 7 days, take latest close

    result = {}
    errors = []

    for key, symbol in tickers.items():
        try:
            ticker = yf.Ticker(symbol)
            hist   = ticker.history(start=start.strftime("%Y-%m-%d"),
                                    end=end.strftime("%Y-%m-%d"),
                                    interval="1d",
                                    auto_adjust=True)
            if hist.empty:
                errors.append(f"{symbol}: no data")
                result[key] = None
                continue

            latest_row  = hist.iloc[-1]
            prev_row    = hist.iloc[-2] if len(hist) >= 2 else None

            result[key] = {
                "symbol":  symbol,
                "value":   round(float(latest_row["Close"]), 3),
                "date":    str(hist.index[-1].date()),
                "change":  round(float(latest_row["Close"]) - float(prev_row["Close"]), 3)
                           if prev_row is not None else None,
                "change_pct": round(
                    (float(latest_row["Close"]) - float(prev_row["Close"]))
                    / float(prev_row["Close"]) * 100, 2
                ) if prev_row is not None else None,
            }
        except Exception as e:
            errors.append(f"{symbol}: {e}")
            result[key] = None

    return result, errors


def _classify_vix(value):
    """Risk regime from VIX."""
    if value is None:
        return "unknown"
    if value < 15:
        return "complacent"     # very low fear — often precedes corrections
    if value < 20:
        return "calm"           # normal risk-on
    if value < 30:
        return "elevated"       # caution
    if value < 40:
        return "fear"           # risk-off
    return "extreme_fear"       # crisis territory


def _classify_yield_curve(spread):
    """Yield curve regime from 10Y-2Y spread."""
    if spread is None:
        return "unknown"
    if spread > 0.75:
        return "steep"          # growth optimism / early cycle
    if spread > 0.0:
        return "normal"
    if spread > -0.25:
        return "flat"           # late cycle / uncertainty
    return "inverted"           # recession warning


def _classify_dxy(value, change_pct):
    """Dollar trend."""
    if value is None:
        return "unknown"
    if change_pct is None:
        return "neutral"
    if change_pct >  0.3:
        return "strengthening"  # risk-off signal for EM/commodities
    if change_pct < -0.3:
        return "weakening"      # risk-on signal
    return "neutral"


def _macro_regime_label(vix_regime, curve_regime, dxy_regime):
    """Combine three signals into one macro regime label."""
    if vix_regime in ("fear", "extreme_fear"):
        return "Risk-Off / Stress"
    if vix_regime == "complacent" and curve_regime in ("steep", "normal") and dxy_regime == "weakening":
        return "Risk-On Expansion"
    if curve_regime == "inverted" and vix_regime in ("elevated", "fear"):
        return "Late Cycle / Contraction"
    if curve_regime == "inverted":
        return "Inversion Warning"
    if dxy_regime == "strengthening" and vix_regime == "elevated":
        return "Dollar Stress / EM Pressure"
    if vix_regime in ("calm", "complacent") and curve_regime in ("normal", "steep"):
        return "Benign / Constructive"
    return "Mixed / Transition"


def _vix_interpretation(value, regime):
    labels = {
        "complacent":   f"VIX at {value:.1f} — markets are complacent. Low fear often precedes sharp reversals.",
        "calm":         f"VIX at {value:.1f} — calm risk environment. Normal conditions for trend-following.",
        "elevated":     f"VIX at {value:.1f} — elevated uncertainty. Reduce size, watch for volatility spikes.",
        "fear":         f"VIX at {value:.1f} — fear mode. Risk-off positioning favoured.",
        "extreme_fear": f"VIX at {value:.1f} — extreme fear / crisis. Contrarian long opportunities may emerge.",
        "unknown":      "VIX data unavailable.",
    }
    return labels.get(regime, "")


def _curve_interpretation(spread, regime):
    if spread is None:
        return "Yield curve data unavailable."
    s = f"{spread:+.2f}%"
    labels = {
        "steep":    f"Yield curve steep ({s}). Growth optimism, early expansion cycle.",
        "normal":   f"Yield curve normal ({s}). Healthy macro backdrop.",
        "flat":     f"Yield curve flat ({s}). Late cycle signal — watch for inversion.",
        "inverted": f"Yield curve inverted ({s}). Recession warning — historically reliable signal.",
        "unknown":  "Yield curve data unavailable.",
    }
    return labels.get(regime, "")


def _dxy_interpretation(value, regime, change_pct):
    if value is None:
        return "DXY data unavailable."
    chg = f"{change_pct:+.2f}%" if change_pct is not None else ""
    labels = {
        "strengthening": f"DXY {value:.1f} ({chg}) — Dollar strengthening. Bearish for commodities and EM assets.",
        "weakening":     f"DXY {value:.1f} ({chg}) — Dollar weakening. Supportive for gold, commodities, EM.",
        "neutral":       f"DXY {value:.1f} ({chg}) — Dollar neutral. No strong directional signal.",
        "unknown":       "DXY data unavailable.",
    }
    return labels.get(regime, "")


@router.get("/macro-context")
def get_macro_context():
    """
    Returns current macro context indicators:
    VIX, DXY, yield curve (10Y-2Y), macro regime label.
    """
    data, errors = _fetch_yfinance()

    if data is None:
        return {
            "ok":    False,
            "error": errors,
            "items": [],
        }

    vix  = data.get("vix")
    dxy  = data.get("dxy")
    t10y = data.get("t10y")
    t2y  = data.get("t2y")
    spx  = data.get("spx")

    # Yield curve spread
    spread = None
    if t10y and t2y and t10y["value"] and t2y["value"]:
        spread = round(t10y["value"] - t2y["value"], 3)

    # Classify
    vix_regime   = _classify_vix(vix["value"]   if vix  else None)
    curve_regime = _classify_yield_curve(spread)
    dxy_regime   = _classify_dxy(
        dxy["value"]      if dxy else None,
        dxy["change_pct"] if dxy else None,
    )

    macro_regime = _macro_regime_label(vix_regime, curve_regime, dxy_regime)

    # Build items list for frontend
    items = []

    if vix:
        items.append({
            "key":             "vix",
            "label":           "VIX",
            "value":           vix["value"],
            "change":          vix["change"],
            "change_pct":      vix["change_pct"],
            "date":            vix["date"],
            "regime":          vix_regime,
            "interpretation":  _vix_interpretation(vix["value"], vix_regime),
            "alert":           vix_regime in ("fear", "extreme_fear", "complacent"),
        })

    if t10y and t2y:
        items.append({
            "key":             "yield_curve",
            "label":           "Yield Curve (10Y−2Y)",
            "value":           spread,
            "t10y":            t10y["value"] if t10y else None,
            "t2y":             t2y["value"]  if t2y  else None,
            "change":          None,
            "change_pct":      None,
            "date":            t10y["date"]  if t10y else None,
            "regime":          curve_regime,
            "interpretation":  _curve_interpretation(spread, curve_regime),
            "alert":           curve_regime in ("inverted", "flat"),
        })

    if dxy:
        items.append({
            "key":             "dxy",
            "label":           "DXY",
            "value":           dxy["value"],
            "change":          dxy["change"],
            "change_pct":      dxy["change_pct"],
            "date":            dxy["date"],
            "regime":          dxy_regime,
            "interpretation":  _dxy_interpretation(dxy["value"], dxy_regime, dxy["change_pct"]),
            "alert":           dxy_regime == "strengthening",
        })

    if spx:
        items.append({
            "key":             "spx",
            "label":           "S&P 500",
            "value":           spx["value"],
            "change":          spx["change"],
            "change_pct":      spx["change_pct"],
            "date":            spx["date"],
            "regime":          None,
            "interpretation":  f"S&P 500 at {spx['value']:,.0f}.",
            "alert":           False,
        })

    return {
        "ok":           True,
        "macro_regime": macro_regime,
        "vix_regime":   vix_regime,
        "curve_regime": curve_regime,
        "dxy_regime":   dxy_regime,
        "items":        items,
        "errors":       errors,
        "fetched_at":   datetime.utcnow().isoformat() + "Z",
    }
