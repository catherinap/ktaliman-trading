# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Ktaliman Trading** is a full-stack web application for analyzing and visualizing COT (Commitment of Traders) reports from the CFTC. It features real-time COT signal generation from institutional positioning data, AI-powered macro context analysis, multi-language support (English, Ukrainian), and automated weekly data updates via a scheduled worker.

**Architecture**: Monorepo with three distinct systems:
1. **Frontend** (`frontend/`) — React + Vite, port 5173
2. **Backend** (`backend/`) — FastAPI + PostgreSQL, port 8000
3. **Worker** (`worker/`) — Python script for scheduled COT data ingestion

---

## Development Commands

### Frontend

```bash
cd frontend
npm install
npm run dev      # Dev server at http://localhost:5173 (proxies /api -> :8000)
npm run build    # Production build to dist/
npm run preview  # Preview production build
```

Key dependencies: React 18.3, Recharts 3.8.1, React i18next, Vite 8.0, Lucide-react, html2canvas.

Vite proxy config: `frontend/vite.config.js` — `/api` proxied to `http://127.0.0.1:8000`.

### Backend

```bash
cd backend
pip install -r requirements.txt
python main.py      # Start server at http://127.0.0.1:8000
python migrate.py   # Add momentum columns to cot_analytics table if missing
```

Key dependencies: FastAPI + Uvicorn, SQLAlchemy + psycopg2, APScheduler, Groq API, yfinance, pandas.

`.env.local` (gitignored) must contain:
- `DATABASE_URL` — PostgreSQL connection string
- `GROQ_API_KEY` — from console.groq.com
- `FINNHUB_API_KEY` — market data
- `WORKER_PATH` — path to worker script relative to backend dir
- `ALERT_EMAIL_*` — email config for alerts

### Worker

```bash
cd worker
pip install -r requirements.txt
python cot_python_worker.py   # Manually trigger COT fetch & DB update
```

Worker runs automatically every Friday at 21:00 UTC (configurable in `backend/app/scheduler.py`), triggered by APScheduler on backend startup.

---

## Architecture & Key Data Flows

### Database Schema

**Table: `cot_analytics`** (primary data store, PostgreSQL)

- Identity: `symbol`, `name`, `sector`, `source_type` (`TFF` or `disaggregated`)
- `report_date`, `open_interest`
- Trader positioning (funds/dealers/asset managers/producers): `*_long`, `*_short`, `*_net`, `*_pct_oi`, `*_percentile_3y`
- Momentum indices (computed by worker at ingestion): `funds_index_3w_avg`, `funds_index_8w_avg`, `funds_index_direction`, `funds_index_momentum`, `funds_index_acceleration`, `funds_index_wow_change`
- `flow_state` — cached classification of current institutional flow

### API Endpoints

**Scheduler / Status:**
- `GET /api/health`
- `GET /api/scheduler/status` — next auto-run time
- `POST /api/scheduler/trigger` — manual trigger
- `POST /api/update/run` — alternative manual trigger
- `GET /api/update/status` — worker job state, logs, errors

**Data (all return latest COT report + history):**
- `GET /api/signals` — top signals filtered to non-NEUTRAL directions
- `GET /api/assets` — all assets in latest report
- `GET /api/assets/{symbol}` — single asset + full history
- `GET /api/macro-context` — VIX, DXY, yield curve, SPX via yfinance
- `GET /api/seasonality` — seasonal patterns by sector/symbol
- `GET /api/signals-history` — historical signal performance

**AI Analysis:**
- `POST /api/gpt/ai-analysis` — Groq LLM analysis; accepts `type` (asset | macro | signals), `language` (en | uk), `data` object; uses llama-3.3-70b-versatile at temperature 0.25

### Signal Generation Logic (`backend/app/routes/signals.py`)

1. Raw COT fields normalized via `NORMALIZED_SELECT` SQL — CASE statements unify TFF and disaggregated formats under consistent names
2. Direction from `funds_percentile_3y`:
   - `>= 90` or `>= 65` → `"LONG"`
   - `<= 10` or `<= 35` → `"SHORT"`
   - else → `"NEUTRAL"` (filtered out of `/api/signals` response)
3. Sorted by `abs(score - 50)` descending (most extreme positions first)

### Frontend Structure (`frontend/src/`)

**`App.jsx`** — single root component managing all state and navigation
- 12 views: workspace, macro, watchlist, summary, explorer, correlation, seasonality, signals, history, guide, update, settings
- Core utilities: `cotIndex156()`, `positionBiasFromLongShort()`, `signalStrengthLabel()`, `groupLong()`, `groupShort()`, `flowColor()`, `MomentumBadge()`
- All API calls via native `fetch()` — no HTTP client library

**Sub-components:**
- `AIAnalysisPanel.jsx` — streams Groq LLM output from `/api/gpt/ai-analysis`
- `CustomSelect.jsx` — multi-select dropdown for asset/sector filtering
- `LanguageSettings.jsx` — i18n toggle
- `GuideButton.jsx` — inline help/tooltip system

**i18n:** `src/i18n/translations/en.json` and `uk.json`

---

## Key Architectural Decisions

1. **Signal direction computed at query time:** Percentile scores stored in DB; LONG/SHORT/NEUTRAL labels derived on-demand in `signals.py`. Allows threshold tuning without reprocessing data.

2. **Dual trader schemas normalized in SQL:** CFTC publishes TFF (newer) and disaggregated (legacy) formats. Backend unifies both via SQL CASE in `NORMALIZED_SELECT` so frontend sees one model.

3. **Momentum indices stored, not computed on query:** Worker pre-computes 3w/8w averages, momentum deltas, and acceleration state at ingestion time. Avoids expensive rolling-window calculations per request.

4. **Worker runs as subprocess:** `/api/update/run` spawns worker via subprocess with 15-min timeout and thread-safe job-state lock to prevent concurrent runs.

5. **Groq free tier LLM:** 14,400 req/day limit. Context-specific prompts (asset / macro / signals) in `backend/app/routes/ai_analysis.py`.

6. **CORS locked to localhost:5173:** Change `allow_origins` in `backend/main.py` for production deployment.

---

## Adding New Features

### New API endpoint
1. Create route file in `backend/app/routes/`
2. Import router in `backend/main.py`: `app.include_router(router, prefix="/api")`
3. Use `engine.connect()` with raw SQL (see `signals.py` for the pattern)

### New frontend view
1. Add to `NAV_ITEMS` in `App.jsx`
2. Add conditional render in App's main view switch
3. Call API with `fetch()` — follow existing patterns in App.jsx
4. Add i18n keys to both `en.json` and `uk.json`

---

## Deployment Notes

- Current dev environment: Windows; code is Linux/Docker-compatible
- Secrets in `.env.local` (gitignored) — must be present before backend starts
- No automated DB backup — use `pg_dump` for snapshots
- Schema expected to exist; `migrate.py` only adds missing columns, does not create tables
