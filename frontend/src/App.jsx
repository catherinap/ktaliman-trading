import React, { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { Activity, BarChart2, Bell, Calendar, Download, BookOpen, ChevronLeft, ChevronRight, Database, Globe, Layout, LineChart, Settings, BookMarked, Star, Zap, } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSettings from "./components/LanguageSettings";
import AIAnalysisPanel from "./components/AIAnalysisPanel";
import CustomSelect from "./components/CustomSelect"
import GuideButton from "./components/GuideButton"
import SentimentPanel from "./components/SentimentPanel"
const GuideView = lazy(() => import("./views/GuideView"))
const HistoricalDataView = lazy(() => import("./views/HistoricalDataView"))
const CorrelationView = lazy(() => import("./views/CorrelationView"))
const SeasonalityView = lazy(() => import("./views/SeasonalityView"))
const Summary = lazy(() => import("./views/Summary"))
const Explorer = lazy(() => import("./views/Explorer"))
const SignalsView = lazy(() => import("./views/SignalsView"))
const WatchlistView = lazy(() => import("./views/WatchlistView"))
const ResearchNotesView = lazy(() => import("./views/ResearchNotesView"))
const UpdateDataView = lazy(() => import("./views/UpdateDataView"))
const MacroView = lazy(() => import("./views/MacroView"))
const SettingsView = lazy(() => import("./views/SettingsView"))
const Workspace = lazy(() => import("./views/Workspace"))

const NAV_ITEMS = [
  { key: "workspace", labelKey: "nav.workspace", icon: Layout },
  { key: "macro", labelKey: "nav.macro", icon: Globe },
  { key: "watchlist", labelKey: "nav.watchlist", icon: Star },
  { key: "summary", labelKey: "nav.summary", icon: BarChart2 },
  { key: "explorer", labelKey: "nav.explorer", icon: Activity },
  { key: "correlation", labelKey: "nav.correlation", icon: LineChart },
  { key: "seasonality", labelKey: "nav.seasonality", icon: Calendar },
  { key: "signals", labelKey: "nav.signals", icon: Zap },
  { key: "history", labelKey: "nav.history", icon: BarChart2 },
  { key: "guide", labelKey: "nav.guide", icon: BookOpen },
  { key: "research", labelKey: "nav.research", icon: BookMarked },
  { key: "update", labelKey: "nav.update", icon: Database },
  { key: "settings", labelKey: "nav.settings", icon: Settings },
]

export function cls(...v) {
  return v.filter(Boolean).join(' ')
}

function cotIndex156(percentile) {
  if (percentile == null || Number.isNaN(percentile)) return 'n/a'
  return `${Number(percentile).toFixed(1)}%`
}

function positionBiasFromLongShort(longValue, shortValue) {
  const longNum = Number(longValue || 0)
  const shortNum = Number(shortValue || 0)
  const total = longNum + shortNum
  if (!total) return 50
  return (longNum / total) * 100
}

function groupLong(asset, group) {
  const keys = {
    funds: ['funds_long', 'noncomm_long', 'managedmoneylong', 'managed_money_long', 'fundslong'],
    dealer: ['dealer_long', 'dealer_comm_long', 'dealerlong', 'commerciallong'],
    other: ['other_long', 'nonrep_long', 'otherlong', 'nonreportablelong'],
  }

  const hit = (keys[group] || []).find((k) => asset?.[k] != null)
  return hit ? asset[hit] : null
}

function groupShort(asset, group) {
  const keys = {
    funds: ['funds_short', 'noncomm_short', 'managedmoneyshort', 'managed_money_short', 'fundsshort'],
    dealer: ['dealer_short', 'dealer_comm_short', 'dealershort', 'commercialshort'],
    other: ['other_short', 'nonrep_short', 'othershort', 'nonreportableshort'],
  }

  const hit = (keys[group] || []).find((k) => asset?.[k] != null)
  return hit ? asset[hit] : null
}

export function translateFlowState(flowState, t) {
  if (!flowState) return ''
  if (!t) return flowState
  const map = {
    'Long Extreme':  'flowStates.longExtreme',
    'Short Extreme': 'flowStates.shortExtreme',
    'Accumulation':  'flowStates.accumulation',
    'Distribution':  'flowStates.distribution',
    'Neutral':       'flowStates.neutral',
  }
  return map[flowState] ? t(map[flowState]) : flowState
}

function signalStrengthLabel(score, t) {
  if (score == null || Number.isNaN(score)) return t ? t('signalsText.unrated') : 'Unrated'
  if (score >= 85) return t ? t('signalsText.highConviction') : 'High Conviction'
  if (score >= 70) return t ? t('signalsText.strong') : 'Strong'
  if (score >= 55) return t ? t('signalsText.moderate') : 'Moderate'
  if (score >= 40) return t ? t('signalsText.developing') : 'Developing'
  return t ? t('signalsText.weak') : 'Weak'
}

export function flowColor(percentile) {
  if (percentile == null) return "text-slate-200";
  if (percentile >= 65) return "text-emerald-400";
  if (percentile <= 35) return "text-rose-400";
  return "text-zinc-300";
}
 
export function MomentumBadge({ asset, size = "md" }) {
  const direction   = asset?.funds_index_direction
  const momentum    = asset?.funds_index_momentum
  const wow         = asset?.funds_index_wow_change
  const avg3w       = asset?.funds_index_3w_avg
  const avg8w       = asset?.funds_index_8w_avg
  const accel       = asset?.funds_index_acceleration
 
  if (!direction) return null
 
  // Arrow icon
  const arrow = direction === "rising"  ? "↑"
              : direction === "falling" ? "↓"
              : "→"
 
  // Color based on direction + momentum strength
  const strong = Math.abs(momentum ?? 0) > 8
  const dirColor = direction === "rising"
    ? (strong ? "text-emerald-300" : "text-emerald-500")
    : direction === "falling"
    ? (strong ? "text-rose-300"    : "text-rose-500")
    : "text-slate-200"
 
  // Acceleration dot
  const accelColor = accel === "accelerating" ? "bg-emerald-400"
                   : accel === "decelerating" ? "bg-rose-400"
                   : "bg-zinc-600"
 
  const isSmall = size === "sm"
 
  return (
    <div className={cls("flex items-center gap-1.5", isSmall ? "text-[10px]" : "text-md")}>
      {/* Direction arrow */}
      <span className={cls("font-bold tabular-nums", dirColor, isSmall ? "text-md" : "text-md")}>
        {arrow}
      </span>
 
      {/* WoW change */}
      {wow != null && (
        <span className={cls("tabular-nums font-bold uppercase tracking-[0.14em]", dirColor)}>
          {wow > 0 ? "+" : ""}{wow.toFixed(1)}
        </span>
      )}
 
      {/* Acceleration dot */}
      {accel && !isSmall && (
        <div className={cls("h-1.5 w-1.5 rounded-full", accelColor)} title={accel} />
      )}
 
      {/* 3w / 8w avg — only in md size */}
      {!isSmall && avg3w != null && avg8w != null && (
        <span className="text-zinc-400 tabular-nums">
          3w:{avg3w.toFixed(0)} · 8w:{avg8w.toFixed(0)}
        </span>
      )}
    </div>
  )
}

export function formatPercentile(value) {
  if (value == null || Number.isNaN(value)) return 'n/a'
  return `${Number(value).toFixed(1)}`
}

export function formatNumber(value) {
  if (value == null || Number.isNaN(value)) return 'n/a'
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
}

function formatClockTime(isoString) {
  if (!isoString) return "TBD";
  try {
    return new Date(isoString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "TBD";
  }
}

export function formatEventDateTime(isoString, tz = "Europe/Copenhagen") {
  if (!isoString) return { time: "TBD", date: "", day: "" }
  try {
    const d = new Date(isoString)
    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: tz, hour12: false })
    const date = d.toLocaleDateString([], { day: "2-digit", month: "short", timeZone: tz })
    const day  = d.toLocaleDateString([], { weekday: "short", timeZone: tz }).toUpperCase()
    return { time, date, day }
  } catch {
    return { time: "TBD", date: "", day: "" }
  }
}

export function importanceTone(level) {
  const v = String(level || "").toLowerCase();
  if (v === "high") return "text-rose-400";
  if (v === "medium") return "text-amber-300";
  return "text-slate-200";
}

// "lower is better" keywords — unemployment, inflation, etc.
const LOWER_IS_BETTER_KEYWORDS = [
  "unemployment", "jobless", "claims", "inflation", "cpi", "ppi",
  "consumer price", "producer price", "trade deficit", "deficit",
  "debt", "delinquency", "default rate", "foreclosure",
]

export function actualColor(title, actual, forecast) {
  if (actual == null || forecast == null) return '#4ade80' // no forecast = plain green
  const t = (title || "").toLowerCase()
  const lowerIsBetter = LOWER_IS_BETTER_KEYWORDS.some(k => t.includes(k))
  const actualNum   = parseFloat(String(actual).replace(/[^0-9.\-]/g, ""))
  const forecastNum = parseFloat(String(forecast).replace(/[^0-9.\-]/g, ""))
  if (isNaN(actualNum) || isNaN(forecastNum)) return '#4ade80'
  const betterThanForecast = lowerIsBetter
    ? actualNum < forecastNum
    : actualNum > forecastNum
  if (Math.abs(actualNum - forecastNum) < 0.001) return '#facc15' // in-line = yellow
  return betterThanForecast ? '#4ade80' : '#f87171'
}

export function categoryTone(category) {
  const v = String(category || "").toLowerCase();
  if (v === "policy")  return "text-rose-300";
  if (v === "macro")   return "text-amber-300";
  if (v === "markets") return "text-blue-300";
  if (v === "forex")   return "text-cyan-300";
  if (v === "crypto")  return "text-violet-300";
  if (v === "cot")     return "text-emerald-300";
  if (v === "finance") return "text-sky-300";
  return "text-blue-200";
}

export function signalLabel(percentile, t) {
  if (percentile == null) return t ? t('signalsText.noSignal') : 'No Signal'
  if (percentile >= 90) return t ? t('signalsText.strongLongBias') : 'Strong Long Bias'
  if (percentile >= 65) return t ? t('signalsText.longBias') : 'Long Bias'
  if (percentile <= 10) return t ? t('signalsText.strongShortBias') : 'Strong Short Bias'
  if (percentile <= 35) return t ? t('signalsText.shortBias') : 'Short Bias'
  return t ? t('signalsText.neutral') : 'Neutral'
}

export function regimeLabel(percentile, t) {
  if (percentile == null) return t ? t('regimes.insufficientHistory') : 'Insufficient History'
  if (percentile >= 90) return t ? t('regimes.crowdedLong') : 'Crowded Long'
  if (percentile >= 65) return t ? t('regimes.trendBuild') : 'Trend Build'
  if (percentile <= 10) return t ? t('regimes.crowdedShort') : 'Crowded Short'
  if (percentile <= 35) return t ? t('regimes.shortBuild') : 'Short Build'
  return t ? t('regimes.range') : 'Range'
}

export function normalizeSector(sector) {
  const map = {
  FX: 'Currencies', MET: 'Metals', METALS: 'Metals',
  IDX: 'Indices', NRG: 'Energy', SFT: 'Softs',
  GRAINS: 'Grains', COMMODITIES: 'Commodities', CRYPTO: 'Crypto'
}
  return map[sector] || sector
}

function isDisaggCommodityAsset(asset) {
  if (!asset) return false
  const sector = String(asset.sector || '').toUpperCase()
  const normalizedSector = normalizeSector(asset.sector)
  return (
    asset.sourcetype === 'DISAGG' &&
    (
      ['METALS', 'COMMODITIES', 'SFT', 'NRG', 'AGR'].includes(sector) ||
      ['Metals', 'Energy', 'Softs', 'Agriculture', 'Commodities'].includes(normalizedSector)
    )
  )
}

function getSummaryColumnHeaders(items = []) {
  const sample = items[0]
  const isDisaggCommodity = isDisaggCommodityAsset(sample)

  if (isDisaggCommodity) {
    return [
      { key: 'funds', label: 'Funds/Managed Money' },
      { key: 'producer', label: 'Asset Manager/Producer' },
      { key: 'dealer', label: '---' },
    ]
  }

  return [
    { key: 'funds', label: 'Funds/Managed Money' },
    { key: 'assetManager', label: 'Asset Manager/Producer' },
    { key: 'dealer', label: 'Dealer' },
  ]
}

function getSummaryGroupConfig(asset) {
  if (isDisaggCommodityAsset(asset)) {
    return [
      {
        key: 'funds',
        label: 'Funds/Managed Money',
        long: asset.managedmoneylong,
        short: asset.managedmoneyshort,
        net: asset.managedmoneynet,
        pct: asset.managedmoneypercentile3y,
      },
      {
        key: 'producer',
        label: 'Asset Manager/Producer',
        long: asset.producermerchantlong,
        short: asset.producermerchantshort,
        net: asset.producermerchantnet,
        pct: asset.producermerchantpercentile3y,
      },
      {
        key: 'dealer',
        label: '---',
        long: null,
        short: null,
        net: null,
        pct: null,
      },
    ]
  }

  return [
    {
      key: 'funds',
      label: 'Funds/Managed Money',
      long: asset.leveragedfundslong ?? asset.fundslong ?? asset.managedmoneylong,
      short: asset.leveragedfundsshort ?? asset.fundsshort ?? asset.managedmoneyshort,
      net: asset.leveragedfundsnet ?? asset.fundsnet ?? asset.managedmoneynet,
      pct: asset.leveragedfundspercentile3y ?? asset.fundspercentile3y ?? asset.managedmoneypercentile3y,
    },
    {
      key: 'assetManager',
      label: 'Asset Manager/Producer',
      long: asset.assetmanagerlong,
      short: asset.assetmanagershort,
      net: asset.assetmanagernet,
      pct: asset.assetmanagerpercentile3y,
    },
    {
      key: 'dealer',
      label: 'Dealer',
      long: asset.dealerintermediarylong ?? asset.dealerlong,
      short: asset.dealerintermediaryshort ?? asset.dealershort,
      net: asset.dealerintermediarynet ?? asset.dealernet,
      pct: asset.dealerintermediarypercentile3y ?? asset.dealerpercentile3y,
    },
  ]
}

function normalizeAssetKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function assetMatchesAlias(asset, alias) {
  const target = normalizeAssetKey(alias);

  const candidates = [
    asset?.name,
    asset?.symbol,
    asset?.display_name,
    asset?.label,
  ]
    .filter(Boolean)
    .map(normalizeAssetKey);

  return candidates.some((candidate) => {
    return (
      candidate === target ||
      candidate.includes(target) ||
      target.includes(candidate)
    );
  });
}

export function findAssetsExact(assets, aliases) {
  return assets.filter((asset) =>
    aliases.some((alias) => assetMatchesAlias(asset, alias))
  );
}

function clampScore(value, min = 0, max = 100) {
  const num = Number(value)
  if (Number.isNaN(num)) return min
  return Math.max(min, Math.min(max, num))
}

function signalDirectionFromPercentile(percentile) {
  if (percentile == null || Number.isNaN(percentile)) return 'neutral'
  if (percentile >= 65) return 'long'
  if (percentile <= 35) return 'short'
  return 'neutral'
}

function oppositeDirection(direction) {
  if (direction === 'long') return 'short'
  if (direction === 'short') return 'long'
  return 'neutral'
}

function scoreDirectionalStrength(percentile) {
  if (percentile == null || Number.isNaN(percentile)) return 0
  if (percentile >= 90 || percentile <= 10) return 100
  if (percentile >= 80 || percentile <= 20) return 88
  if (percentile >= 70 || percentile <= 30) return 74
  if (percentile >= 65 || percentile <= 35) return 62
  if (percentile >= 55 || percentile <= 45) return 38
  return 20
}

function scoreRegimeAlignment(percentile) {
  if (percentile == null || Number.isNaN(percentile)) return 0
  if (percentile >= 80 || percentile <= 20) return 90
  if (percentile >= 65 || percentile <= 35) return 72
  if (percentile >= 55 || percentile <= 45) return 52
  return 35
}

function scoreSeasonalityAlignment(value, direction) {
  if (value == null || Number.isNaN(value)) return 50
  if (direction === 'long') {
    if (value >= 70) return 92
    if (value >= 55) return 74
    if (value >= 45) return 55
    if (value >= 30) return 35
    return 20
  }
  if (direction === 'short') {
    if (value <= 30) return 92
    if (value <= 45) return 74
    if (value <= 55) return 55
    if (value <= 70) return 35
    return 20
  }
  return 50
}

function scoreMacroAlignment(asset, macroComposite) {
  const sector = asset?.sector
  if (macroComposite == null || Number.isNaN(macroComposite)) return 50
  if (!sector) return 50

  if (sector === 'IDX') {
    if (macroComposite >= 70) return 88
    if (macroComposite >= 55) return 72
    if (macroComposite >= 45) return 55
    if (macroComposite >= 30) return 34
    return 18
  }

  if (sector === 'MET' || sector === 'NRG') {
    if (macroComposite >= 65) return 72
    if (macroComposite >= 55) return 62
    if (macroComposite >= 45) return 55
    if (macroComposite >= 30) return 45
    return 35
  }

  if (sector === 'FX') {
    if (macroComposite <= 35) return 78
    if (macroComposite <= 45) return 64
    if (macroComposite <= 55) return 56
    if (macroComposite <= 70) return 48
    return 42
  }

  return 50
}

export function inferSignalAgeWeeks(asset) {
  const avg3 = asset?.funds_index_3w_avg
  const avg8 = asset?.funds_index_8w_avg
  
  // Drift between 3w and 8w avg = best proxy for signal age
  // High drift = recent move = fresh signal
  // Low drift = 3w ≈ 8w = stable for weeks = mature signal
  if (avg3 != null && avg8 != null) {
    const drift = Math.abs(avg3 - avg8)
    if (drift >= 8)  return 1  // very fresh
    if (drift >= 4)  return 3  // moderate
    if (drift >= 2)  return 4  // aging
    return 6                   // stale — barely moving
  }

  // Fallback: distance from 50 as rough proxy
  const pct = Number(asset?.funds_percentile_3y)
  if (Number.isNaN(pct)) return 99
  const d = Math.abs(pct - 50)
  if (d >= 40) return 1
  if (d >= 30) return 2
  if (d >= 20) return 3
  if (d >= 10) return 4
  return 5
}

function scoreFreshness(ageWeeks) {
  if (ageWeeks <= 1) return 100
  if (ageWeeks <= 2) return 82
  if (ageWeeks <= 3) return 64
  if (ageWeeks <= 4) return 46
  if (ageWeeks <= 5) return 28
  return 12
}

function classifySignalState({ direction, percentile, ageWeeks, entryQualityScore }) {
  if (direction === 'neutral') return 'candidate'
  if (percentile == null || Number.isNaN(percentile)) return 'stale'
  if (entryQualityScore < 35) return 'invalidated'
  if (ageWeeks >= 6) return 'stale'
  if (ageWeeks >= 4) return 'aging'
  if (percentile >= 65 || percentile <= 35) return 'active'
  return 'candidate'
}

export function stateTone(state) {
  if (state === 'active') return 'active-status'
  if (state === 'aging') return 'aging-status'
  if (state === 'stale') return 'text-zinc-400 border-zinc-700/40 bg-zinc-500/5'
  if (state === 'invalidated') return 'text-rose-300 border-rose-700/40 bg-rose-500/5'
  return 'text-sky-300 border-sky-700/40 bg-sky-500/5'
}

export function stateLabel(state, t) {
  if (state === 'active') return t ? t('stateLabels.active') : 'Active'
  if (state === 'aging') return t ? t('stateLabels.aging') : 'Aging'
  if (state === 'stale') return t ? t('stateLabels.stale') : 'Stale'
  if (state === 'invalidated') return t ? t('stateLabels.invalidated') : 'Invalidated'
  return t ? t('stateLabels.candidate') : 'Candidate'
}

export function directionTone(direction) {
  if (direction === 'long') return 'long-dir'
  if (direction === 'short') return 'short-dir'
  return 'text-zinc-400'
}

export function directionLabel(direction, t) {
  if (direction === 'long') return t ? t('directionLabels.long') : 'Long'
  if (direction === 'short') return t ? t('directionLabels.short') : 'Short'
  return t ? t('directionLabels.neutral') : 'Neutral'
}

export function entryQualityBucket(score, t) {
  if (score >= 85) return t ? t('signalsText.highConviction') : 'High Conviction'
  if (score >= 70) return t ? t('signalsText.strong') : 'Strong'
  if (score >= 55) return t ? t('signalsText.moderate') : 'Moderate'
  if (score >= 40) return t ? t('signalsText.developing') : 'Developing'
  return t ? t('signalsText.weak') : 'Weak'
}

export function alertImpactTone(impact) {
  if (impact === 'high') return 'text-rose-300 border-rose-700/40 bg-rose-500/5'
  if (impact === 'medium') return 'text-amber-300 border-amber-700/40 bg-amber-500/5'
  return 'text-sky-300 border-sky-700/40 bg-sky-500/5'
}

export function buildSignalAlerts(signal, t) {
  const alerts = []
  const tr = (key, en) => (t ? t(key) : en)
  const asset = signal.asset
 
  if (signal.state === 'active' && signal.entryQualityScore >= 70) {
    alerts.push({
      type: 'new-signal',
      impact: signal.entryQualityScore >= 85 ? 'high' : 'medium',
      title: t
        ? `${asset}: ${t('alerts.readyForAction')}`
        : `${asset} ready for action`,
      text: t
        ? `${directionLabel(signal.direction, t)} ${t('alerts.setupActive')}`
        : `${directionLabel(signal.direction, t)} setup is active with ${entryQualityBucket(signal.entryQualityScore)} conviction.`,
    })
  }
 
  if (signal.state === 'aging') {
    alerts.push({
      type: 'aging',
      impact: 'medium',
      title: t ? `${asset}: ${t('alerts.signalAging')}` : `${asset} signal is aging`,
      text: t ? t('alerts.agingText') : `The setup is still valid, but freshness is fading.`,
    })
  }
 
  if (signal.state === 'invalidated') {
    alerts.push({
      type: 'invalidated',
      impact: 'high',
      title: t ? `${asset}: ${t('alerts.signalLostQuality')}` : `${asset} signal lost quality`,
      text: t ? t('alerts.invalidatedText') : `The signal no longer meets minimum quality conditions.`,
    })
  }
 
  if (signal.state === 'stale') {
    alerts.push({
      type: 'stale',
      impact: 'low',
      title: t ? `${asset}: ${t('alerts.signalStale')}` : `${asset} signal is stale`,
      text: t ? t('alerts.staleText') : `The directional idea is too old or too weak to rank as an actionable setup.`,
    })
  }
 
  if (signal.regimeShift === 'bullish-activation') {
    alerts.push({
      type: 'regime-shift',
      impact: 'high',
      title: t ? `${asset}: ${t('alerts.bullishActivation')}` : `${asset} entered bullish activation`,
      text: t ? t('alerts.bullishActivationText') : `Positioning moved into a stronger long-biased regime with improving entry conditions.`,
    })
  }
 
  if (signal.regimeShift === 'bearish-activation') {
    alerts.push({
      type: 'regime-shift',
      impact: 'high',
      title: t ? `${asset}: ${t('alerts.bearishActivation')}` : `${asset} entered bearish activation`,
      text: t ? t('alerts.bearishActivationText') : `Positioning moved into a stronger short-biased regime with improving entry conditions.`,
    })
  }
 
  return alerts
}

export function rankSignals(signals) {
  return [...signals].sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore
    if (b.entryQualityScore !== a.entryQualityScore) return b.entryQualityScore - a.entryQualityScore
    if (a.ageWeeks !== b.ageWeeks) return a.ageWeeks - b.ageWeeks
    return a.asset.localeCompare(b.asset)
  })
}

export function buildSignalEngine(assets, seasonalityRows = [], macroComposite = null, t = null) {
  const seasonalityMap = new Map(seasonalityRows.map((row) => [row.name || row.asset, row]))

  const enriched = assets
    .filter((asset) => asset?.name)
    .map((asset) => {
      const percentile = Number(asset?.funds_percentile_3y)
      const direction = signalDirectionFromPercentile(percentile)
      const directionalStrength = scoreDirectionalStrength(percentile)
      const regimeAlignmentScore = scoreRegimeAlignment(percentile)
      const seasonality = seasonalityMap.get(asset.name)
      const seasonalityScore = scoreSeasonalityAlignment(seasonality?.current, direction)
      const macroScore = scoreMacroAlignment(asset, macroComposite)
      const ageWeeks = inferSignalAgeWeeks(asset)
      const freshnessScore = scoreFreshness(ageWeeks)

      const entryQualityScore = clampScore(
        directionalStrength * 0.40 +
        regimeAlignmentScore * 0.20 +
        seasonalityScore * 0.20 +
        macroScore * 0.20
      )

      const state = classifySignalState({
        direction,
        percentile,
        ageWeeks,
        entryQualityScore,
      })

      const regimeShift =
        percentile >= 80 ? 'bullish-activation' :
        percentile <= 20 ? 'bearish-activation' :
        null

      const priorityScore = clampScore(
        entryQualityScore * 0.55 +
        freshnessScore * 0.20 +
        directionalStrength * 0.15 +
        regimeAlignmentScore * 0.10
      )

      const signal = {
        id: `${asset.symbol}-${direction}-${Math.round(percentile || 0)}`,
        asset: asset.name,
        symbol: asset.symbol,
        sector: normalizeSector(asset.sector),
        rawSector: asset.sector,
        percentile,
        flowState: asset.flow_state || 'Neutral',
        direction,
        state,
        ageWeeks,
        regime: regimeLabel(percentile, t),
        signalLabel: signalLabel(percentile, t),
        entryQualityScore: Number(entryQualityScore.toFixed(1)),
        freshnessScore: Number(freshnessScore.toFixed(1)),
        regimeAlignmentScore: Number(regimeAlignmentScore.toFixed(1)),
        seasonalityScore: Number(seasonalityScore.toFixed(1)),
        macroScore: Number(macroScore.toFixed(1)),
        directionalStrength: Number(directionalStrength.toFixed(1)),
        priorityScore: Number(priorityScore.toFixed(1)),
        conviction: entryQualityBucket(entryQualityScore, t),
        regimeShift,
      }

      return {
        ...signal,
        alerts: buildSignalAlerts(signal, t),
      }
    })

  const ranked = rankSignals(enriched)
  const alertFeed = ranked
    .flatMap((signal) =>
      signal.alerts.map((alert, index) => ({
        id: `${signal.id}-${alert.type}-${index}`,
        asset: signal.asset,
        symbol: signal.symbol,
        state: signal.state,
        direction: signal.direction,
        priorityScore: signal.priorityScore,
        entryQualityScore: signal.entryQualityScore,
        ...alert,
      }))
    )
    .sort((a, b) => {
      const impactRank = { high: 3, medium: 2, low: 1 }
      if (impactRank[b.impact] !== impactRank[a.impact]) return impactRank[b.impact] - impactRank[a.impact]
      if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore
      return a.asset.localeCompare(b.asset)
    })

  return {
    signals: ranked,
    alerts: alertFeed,
    counts: {
      total: ranked.length,
      active: ranked.filter((x) => x.state === 'active').length,
      aging: ranked.filter((x) => x.state === 'aging').length,
      stale: ranked.filter((x) => x.state === 'stale').length,
      invalidated: ranked.filter((x) => x.state === 'invalidated').length,
      candidate: ranked.filter((x) => x.state === 'candidate').length,
      long: ranked.filter((x) => x.direction === 'long').length,
      short: ranked.filter((x) => x.direction === 'short').length,
      alerts: alertFeed.length,
    },
  }
}

export const MACRO_SLEEVES = {
  growth: {
    title: "Growth",
    members: [
      ["SP 500", "S&P 500", "S and P 500", "E-Mini S&P 500", "Emini S&P 500", "ES", "SPX"],
      ["Nasdaq", "NASDAQ", "Nasdaq 100", "E-Mini Nasdaq", "NQ"],
      ["Dow Jones", "DJIA", "Mini-Dow", "E-Mini Dow", "YM"],
    ],
    description: "Growth positioning tracks index-futures risk appetite.",
  },
   inflation: {
    title: "Inflation",
    members: [
      ["Gold", "GC", "XAU"],
      ["Silver", "SI", "XAG"],
      ["Copper", "COPPER", "COPPER GRADE #1", "COPPER #1", "HG"],
      ["WTI Crude", "WTI", "Crude Oil", "Light Sweet Crude Oil", "CL"],
      ["Natural Gas", "NATGAS", "NAT GAS", "Henry Hub"],
    ],
    description: "Inflation sleeve tracks metals and energy proxies.",
  },
  grains: {
    title: "Grains",
    members: [
      ["Corn", "CORN", "ZC"],
      ["Soybeans", "SOYBEANS", "ZS"],
      ["Wheat", "WHEAT", "ZW"],
    ],
    description: "Grains sleeve tracks agricultural COT positioning.",
  },
  policy: {
    title: "Policy",
    members: [
      ["USD", "US Dollar Index", "U.S. Dollar Index"],
      ["EUR", "Euro"],
      ["JPY", "Japanese Yen"],
      ["GBP", "British Pound"],
      ["CHF", "Swiss Franc"],
    ],
    description: "Policy sleeve tracks major reserve and policy-sensitive FX positioning.",
  },
}

export const CORRELATION_UNIVERSE = ['S&P 500','Nasdaq','Dow Jones','Russell 2000','Gold','Silver','Copper','Platinum','WTI Crude','Natural Gas','USD','EUR','JPY','GBP','CHF','Australian Dollar','Canadian Dollar','Mexican Peso','Corn','Soybeans','Wheat']
export const SEASONAL_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function buildPositioningPairs(assets) {
  const pairs = []
  for (let i = 0; i < assets.length; i += 1) {
    for (let j = i + 1; j < assets.length; j += 1) {
      const a = assets[i]
      const b = assets[j]
      const aPct = Number(a.funds_percentile_3y)
      const bPct = Number(b.funds_percentile_3y)
      if (Number.isNaN(aPct) || Number.isNaN(bPct)) continue
      const distance = Math.abs(aPct - bPct)
      const alignment = 100 - distance
      pairs.push({
        key: `${a.name}-${b.name}`,
        left: a,
        right: b,
        leftPct: aPct,
        rightPct: bPct,
        distance,
        alignment,
        sameSector: a.sector === b.sector,
        sectorLabel: a.sector === b.sector ? 'Same Sector' : 'Cross Sector',
        relationship:
          distance <= 12 ? 'Highly Aligned' : distance <= 25 ? 'Aligned' : distance >= 70 ? 'Strongly Opposed' : distance >= 50 ? 'Opposed' : 'Mixed',
      })
    }
  }
  return pairs
}

export function relationshipTone(distance) {
  if (distance <= 12) return 'text-emerald-400'
  if (distance <= 25) return 'text-emerald-300'
  if (distance >= 70) return 'text-rose-400'
  if (distance >= 50) return 'text-rose-300'
  return 'text-zinc-300'
}

export function sectorBadgeTone(isSameSector) {
  return isSameSector ? 'text-amber-300 border-amber-700/40 bg-amber-500/5' : 'text-cyan-300 border-cyan-700/40 bg-cyan-500/5'
}

export function dispersionLabel(value, t) {
  if (value == null) return t ? t('labels.unavailable') : 'Unavailable'
  if (value >= 60) return t ? t('correlationText.highlyDispersed') : 'Highly Dispersed'
  if (value >= 40) return t ? t('correlationText.dispersed') : 'Dispersed'
  if (value >= 25) return t ? t('correlationText.moderatelyClustered') : 'Moderately Clustered'
  return t ? t('correlationText.tightlyClustered') : 'Tightly Clustered'
}

export function safeName(pair, side = 'left') {
  if (!pair) return 'n/a'
  return side === 'left' ? pair.left?.name || 'n/a' : pair.right?.name || 'n/a'
}

export function buildCorrelationNarrative(
  { avgDistance, avgAlignment, alignedPairs, opposedPairs, sameSectorPairs, crossSectorPairs },
  t
) {
  const uk = t && t('__lang__') === 'uk'
  const topAligned = alignedPairs?.[0]
  const topOpposed = opposedPairs?.[0]
 
  const crossBias = crossSectorPairs > sameSectorPairs
    ? (uk ? 'Крос-секторні зв’язки домінують на поточній карті.' : 'Cross-sector relationships dominate the current map.')
    : (uk ? 'Зв’язки в межах сектору домінують на поточній карті.' : 'Same-sector relationships dominate the current map.')
 
  let summary, interpretation, tradingRelevance, whatToWatch
 
  if (avgDistance == null) {
    summary = uk ? 'Наратив live-позиціонування поки недоступний.' : 'No live positioning narrative is available yet.'
  } else if (uk) {
    summary = `Карта крос-активного позиціонування наразі ${dispersionLabel(avgDistance, t).toLowerCase()}, із середньою узгодженістю ${formatPercentile(avgAlignment)} та середнім розривом перцентилів ${formatPercentile(avgDistance)} по відстежуваному універсуму.`
  } else {
    summary = `The cross-asset positioning map is currently ${dispersionLabel(avgDistance, t).toLowerCase()}, with average alignment at ${formatPercentile(avgAlignment)} and an average percentile gap of ${formatPercentile(avgDistance)} across the tracked universe.`
  }
 
  if (!topAligned && !topOpposed) {
    interpretation = uk ? 'Недостатньо даних для інтерпретації структури live-пар.' : 'There is not enough data to interpret live pair structure.'
  } else if (uk) {
    interpretation = `Найближчий live-збіг позиціонування — ${safeName(topAligned, 'left')} ↔ ${safeName(topAligned, 'right')}, тоді як найширший поточний розрив — ${safeName(topOpposed, 'left')} ↔ ${safeName(topOpposed, 'right')}. ${crossBias}`
  } else {
    interpretation = `The closest live positioning match is ${safeName(topAligned, 'left')} ↔ ${safeName(topAligned, 'right')}, while the widest current positioning gap is ${safeName(topOpposed, 'left')} ↔ ${safeName(topOpposed, 'right')}. ${crossBias}`
  }
 
  if (avgDistance == null) {
    tradingRelevance = uk ? 'Торгова значущість недоступна без даних по парах.' : 'Trading relevance is unavailable without pair data.'
  } else if (avgDistance >= 60) {
    tradingRelevance = uk ? 'Ринок сильно фрагментований. Це на користь вибіркового relative-value мислення, а не широкої однонапрямної макро-впевненості.' : 'The market is highly fragmented. This favors selective relative-value thinking over broad one-direction macro conviction.'
  } else if (avgDistance >= 40) {
    tradingRelevance = uk ? 'Ринок помірно розсіяний. Деякі блоки узгоджені, але крос-активні сигнали все ще варто підтверджувати перед входом.' : 'The market is moderately dispersed. Some sleeves are aligned, but cross-asset signals should still be confirmed before trade execution.'
  } else {
    tradingRelevance = uk ? 'Ринок відносно згрупований. Крос-активне підтвердження сильніше, і макро-теми рухаються більш послідовно разом.' : 'The market is relatively clustered. Cross-asset confirmation is stronger, and macro themes are traveling more consistently together.'
  }
 
  if (!topAligned && !topOpposed) {
    whatToWatch = uk ? 'Очікуйте більше live-даних.' : 'Wait for more live data.'
  } else if (uk) {
    whatToWatch = `Спостерігайте, чи почне звужуватися розрив позиціонування між ${safeName(topOpposed, 'left')} та ${safeName(topOpposed, 'right')}, і чи залишиться стабільним збіг між ${safeName(topAligned, 'left')} ↔ ${safeName(topAligned, 'right')}. Розрив цих live-зв’язків може сигналізувати про зміну режиму.`
  } else {
    whatToWatch = `Watch whether the current positioning gap between ${safeName(topOpposed, 'left')} and ${safeName(topOpposed, 'right')} begins to narrow, and whether the positioning match between ${safeName(topAligned, 'left')} ↔ ${safeName(topAligned, 'right')} remains stable. A break in these live relationships can signal regime transition.`
  }
 
  return { summary, interpretation, tradingRelevance, whatToWatch }
}

export function averagePercentile(items) {
  const values = items.map((x) => x.funds_percentile_3y).filter((x) => x != null && !Number.isNaN(x))
  if (!values.length) return null
  return values.reduce((sum, x) => sum + x, 0) / values.length
}

export function macroTone(score) {
  if (score == null) return 'text-zinc-400'
  if (score >= 65) return 'text-emerald-400'
  if (score <= 35) return 'text-rose-400'
  return 'text-amber-300'
}

export function macroLabel(score, t) {
  if (score == null) return t ? t('labels.insufficientData') : 'Insufficient Data'
  if (score >= 80) return t ? t('macroText.strongRiskOn') : 'Strong Risk-On'
  if (score >= 65) return t ? t('macroText.riskOnBias') : 'Risk-On Bias'
  if (score <= 20) return t ? t('macroText.strongDefensive') : 'Strong Defensive'
  if (score <= 35) return t ? t('macroText.defensiveBias') : 'Defensive Bias'
  return t ? t('macroText.balanced') : 'Balanced'
}

export function macroVerdict(growth, inflation, policy, t) {
  const values = [growth, inflation, policy].filter((x) => x != null && !Number.isNaN(x))
  if (!values.length) return t ? t('macroText.macroCompositeUnavailable') : 'Macro composite unavailable.'
  const avg = values.reduce((sum, x) => sum + x, 0) / values.length
  if (avg >= 70) return t ? t('macroText.broadCotSupportive') : 'Broad COT backdrop is supportive of cyclical and pro-risk positioning.'
  if (avg <= 30) return t ? t('macroText.broadCotDefensive') : 'Broad COT backdrop is defensive, with risk appetite under pressure.'
  return t ? t('macroText.currentCotBalanced') : 'Current COT backdrop is balanced across major sleeves.'
}

export function macroPhase(score, t) {
  if (score == null) return t ? t('labels.unavailable') : 'Unavailable'
  if (score >= 80) return t ? t('macroText.extremeLong') : 'Extreme Long'
  if (score >= 65) return t ? t('macroText.constructive') : 'Constructive'
  if (score <= 20) return t ? t('macroText.extremeDefensive') : 'Extreme Defensive'
  if (score <= 35) return t ? t('macroText.defensive') : 'Defensive'
  return t ? t('macroText.balanced') : 'Balanced'
}

export function macroDispersionLabel(value, t) {
  if (value == null) return t ? t('labels.unavailable') : 'Unavailable'
  if (value >= 35) return t ? t('macroText.highInternalDivergence') : 'High Internal Divergence'
  if (value >= 20) return t ? t('macroText.moderateInternalDivergence') : 'Moderate Internal Divergence'
  if (value >= 10) return t ? t('macroText.mildInternalDivergence') : 'Mild Internal Divergence'
  return t ? t('macroText.tightlyAligned') : 'Tightly Aligned'
}

export function buildMacroNarrative({ growth, inflation, policy }, t) {
  const uk = t && t('__lang__') === 'uk'
  const values = [growth, inflation, policy].filter((x) => x != null && !Number.isNaN(x))
  const composite = values.length ? values.reduce((s, x) => s + x, 0) / values.length : null
 
  const sleeves = [
    { key: 'Growth', keyUk: 'Зростання', value: growth },
    { key: 'Inflation', keyUk: 'Інфляція', value: inflation },
    { key: 'Policy', keyUk: 'Політика', value: policy },
  ].filter((x) => x.value != null && !Number.isNaN(x.value))
 
  const strongestSleeve = [...sleeves].sort((a, b) => b.value - a.value)[0]
  const weakestSleeve   = [...sleeves].sort((a, b) => a.value - b.value)[0]
  const dispersion = strongestSleeve && weakestSleeve ? strongestSleeve.value - weakestSleeve.value : null
  const sName = (s) => s ? (uk ? s.keyUk : s.key) : ''
  const sLow  = (s) => s ? (uk ? s.keyUk.toLowerCase() : s.key.toLowerCase()) : ''
 
  let summary, interpretation, tradingRelevance, whatToWatch
 
  if (composite == null) {
    summary = uk ? 'Макро-наратив поки недоступний.' : 'No macro narrative is available yet.'
  } else if (uk) {
    summary = `Поточний фон макро-позиціонування ${macroLabel(composite, t).toLowerCase()}, з композитним показником ${formatPercentile(composite)} та дисперсією блоків ${formatPercentile(dispersion)} між зростанням, інфляцією та політикою.`
  } else {
    summary = `The macro positioning backdrop is currently ${macroLabel(composite, t).toLowerCase()}, with a composite score of ${formatPercentile(composite)} and sleeve dispersion at ${formatPercentile(dispersion)} across growth, inflation, and policy.`
  }
 
  if (!strongestSleeve || !weakestSleeve) {
    interpretation = uk ? 'Недостатньо даних по блоках для інтерпретації макро-структури.' : 'There is not enough sleeve data to interpret the macro structure.'
  } else if (uk) {
    interpretation = `${sName(strongestSleeve)} наразі найсильніший блок на рівні ${formatPercentile(strongestSleeve.value)}, тоді як ${sName(weakestSleeve)} найслабший на рівні ${formatPercentile(weakestSleeve.value)}. Внутрішня дисперсія блоків ${macroDispersionLabel(dispersion, t).toLowerCase()}, що вказує: композит керується більше блоком «${sLow(strongestSleeve)}», ніж рівномірно узгодженим ринком.`
  } else {
    interpretation = `${strongestSleeve.key} is currently the strongest sleeve at ${formatPercentile(strongestSleeve.value)}, while ${weakestSleeve.key} is the weakest at ${formatPercentile(weakestSleeve.value)}. Internal sleeve dispersion is ${macroDispersionLabel(dispersion, t).toLowerCase()}, which suggests the macro composite is being driven more by ${strongestSleeve.key.toLowerCase()} than by a uniformly aligned market.`
  }
 
  if (composite == null) {
    tradingRelevance = uk ? 'Торгова значущість недоступна без даних по блоках.' : 'Trading relevance is unavailable without macro sleeve data.'
  } else if (dispersion != null && dispersion >= 35) {
    tradingRelevance = uk ? 'Макро-позиціонування має високу внутрішню розбіжність. Будьте обережні з широкими припущеннями risk-on чи risk-off, бо композит не підтверджується рівномірно по блоках.' : 'Macro positioning has high internal divergence. Be careful with broad risk-on or risk-off assumptions, because the composite is not being confirmed evenly across sleeves.'
  } else if (composite >= 70) {
    tradingRelevance = uk ? 'Макро-позиціонування підтримує pro-risk та циклічні ідеї, з досить узгодженою підтримкою блоків.' : 'Macro positioning is supportive of pro-risk and cyclical expressions, with reasonably coherent sleeve support.'
  } else if (composite <= 30) {
    tradingRelevance = uk ? 'Макро-позиціонування захисне. Це на користь обережності з агресивним ризиком і підвищує важливість збереження капіталу та вибіркової експозиції.' : 'Macro positioning is defensive. This favors caution on aggressive risk-taking and raises the importance of capital preservation and selective exposure.'
  } else {
    tradingRelevance = uk ? 'Макро-позиціонування збалансоване. Це не середовище високої впевненості, тому підтвердження від структури, цінової дії чи крос-активного контексту має більше значення.' : 'Macro positioning is balanced. This is not a high-conviction broad macro environment, so confirmation from structure, price action, or cross-asset context matters more.'
  }
 
  if (!strongestSleeve || !weakestSleeve) {
    whatToWatch = uk ? 'Очікуйте більше даних по блоках.' : 'Wait for more sleeve data.'
  } else if (uk) {
    whatToWatch = `Спостерігайте, чи почне ${sName(weakestSleeve)} покращуватися і чи залишиться ${sName(strongestSleeve)} стабільним. Макро-режим стає надійнішим, коли дисперсія блоків звужується і всі три блоки переходять у кращу узгодженість, а не покладаються на один домінантний блок.`
  } else {
    whatToWatch = `Watch whether ${weakestSleeve.key} begins to improve and whether ${strongestSleeve.key} remains stable. The macro regime becomes more credible when sleeve dispersion narrows and all three sleeves move into better alignment rather than relying on one dominant sleeve.`
  }
 
  return { composite, dispersion, summary, interpretation, tradingRelevance, whatToWatch }
}

export function seasonalCellTone(value) {
  if (value == null || Number.isNaN(value)) return 'bg-zinc-950 text-zinc-600'
  if (value >= 70) return 'bg-emerald-500/20 text-emerald-300'
  if (value >= 55) return 'bg-emerald-500/10 text-emerald-200'
  if (value <= 30) return 'bg-rose-500/20 text-rose-300'
  if (value <= 45) return 'bg-rose-500/10 text-rose-200'
  return 'bg-zinc-900 text-zinc-300'
}

export function seasonalBiasLabel(value, t) {
  if (value == null || Number.isNaN(value)) return t ? t('labels.unavailable') : 'Unavailable'
  if (value >= 70) return t ? t('seasonalityText.strongTailwind') : 'Strong Tailwind'
  if (value >= 55) return t ? t('seasonalityText.tailwind') : 'Tailwind'
  if (value <= 30) return t ? t('seasonalityText.strongHeadwind') : 'Strong Headwind'
  if (value <= 45) return t ? t('seasonalityText.headwind') : 'Headwind'
  return t ? t('seasonalityText.mixed') : 'Mixed'
}

export function seasonalBiasTone(value) {
  if (value == null || Number.isNaN(value)) return 'text-slate-200'
  if (value >= 55) return 'text-emerald-300'
  if (value <= 45) return 'text-rose-300'
  return 'text-amber-300'
}

export function buildSeasonalityNarrative(rows, t) {
  const uk = t && t('__lang__') === 'uk'
  const valid = rows.filter((x) => x.current != null && !Number.isNaN(x.current))
  if (!valid.length) return {
    breadth: null, strongest: null, weakest: null,
    summary: uk ? 'Наратив сезонності поки недоступний.' : 'No seasonality narrative is available yet.',
    interpretation: uk ? 'Недостатньо сезонних даних для інтерпретації поточного календарного вікна.' : 'There is not enough seasonal data to interpret the current calendar window.',
    tradingRelevance: uk ? 'Торгова значущість недоступна без даних сезонності.' : 'Trading relevance is unavailable without seasonality data.',
    whatToWatch: uk ? 'Очікуйте більше сезонних даних.' : 'Wait for more seasonal inputs.',
  }
  const bullishCount = valid.filter((x) => x.current >= 55).length
  const bearishCount = valid.filter((x) => x.current <= 45).length
  const breadth = ((bullishCount - bearishCount) / valid.length) * 100
  const strongest = [...valid].sort((a, b) => b.current - a.current)[0]
  const weakest   = [...valid].sort((a, b) => a.current - b.current)[0]
  const sName = (s) => s.name || s.asset
 
  const summary = uk
    ? `Поточна карта сезонності показує ${bullishCount} сприятливих вікон і ${bearishCount} слабких вікон по відстежуваному універсуму, із шириною ${formatPercentile(breadth)}.`
    : `The current seasonal map shows ${bullishCount} supportive windows and ${bearishCount} weak windows across the tracked universe, with breadth at ${formatPercentile(breadth)}.`
 
  const interpretation = uk
    ? `${sName(strongest)} наразі має найсильніший сезонний попутний фон на рівні ${formatPercentile(strongest.current)}, тоді як ${sName(weakest)} показує найслабше сезонне вікно на рівні ${formatPercentile(weakest.current)}.`
    : `${sName(strongest)} currently has the strongest seasonal tailwind at ${formatPercentile(strongest.current)}, while ${sName(weakest)} shows the weakest seasonal window at ${formatPercentile(weakest.current)}.`
 
  const tradingRelevance = breadth >= 20
    ? (uk ? 'Сезонна ширина сприятлива. Календарні тенденції можуть бути корисним шаром підтвердження для long-орієнтованого вибору угод.' : 'Seasonal breadth is supportive. Calendar tendencies can act as a useful confirmation layer for long-biased trade selection.')
    : breadth <= -20
    ? (uk ? 'Сезонна ширина слабка. Це аргумент на користь більшої обережності та вибіркової експозиції, а не широкої участі.' : 'Seasonal breadth is weak. This argues for more caution and selective exposure rather than broad participation.')
    : (uk ? 'Сезонна ширина змішана. Сезонність варто розглядати як вторинний фільтр, а не як основний драйвер угод.' : 'Seasonal breadth is mixed. Seasonality should be treated as a secondary filter rather than a primary trade driver.')
 
  const whatToWatch = uk
    ? 'Спостерігайте, чи залишаються найсильніші сезонні вікна узгодженими з live-позиціонуванням і ціновою структурою, і чи почнуть покращуватися наразі слабкі сезонні активи на наступному календарному повороті.'
    : 'Watch whether the strongest seasonal windows remain aligned with live positioning and price structure, and whether currently weak seasonal assets begin to improve into the next calendar turn.'
 
  return { breadth: Number(breadth.toFixed(1)), strongest, weakest, summary, interpretation, tradingRelevance, whatToWatch }
}

export function MiniSparkline({ values = [], positive = true }) {
  if (!values.length) {
    return <div className="h-[84px] rounded border border-zinc-900 bg-[#080808]" />
  }

  const width = 320
  const height = 84
  const padding = 8
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = Math.max(1, max - min)
  const step = values.length > 1 ? (width - padding * 2) / (values.length - 1) : 0
  const points = values
    .map((value, index) => {
      const x = padding + index * step
      const y = height - padding - ((value - min) / range) * (height - padding * 2)
      return `${x},${y}`
    })
    .join(' ')

  const area = [`${padding},${height - padding}`, points, `${width - padding},${height - padding}`].join(' ')
  const stroke = positive ? '#34d399' : '#f59e0b'
  const fill = positive ? 'rgba(52,211,153,0.12)' : 'rgba(245,158,11,0.12)'

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-[84px] w-full rounded small-panel-color p-2" preserveAspectRatio="none" aria-hidden="true">
      <polyline fill={fill} stroke="none" points={area} />
      <polyline fill="none" stroke={stroke} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" points={points} />
    </svg>
  )
}

export function PairDistanceBar({ distance = 0 }) {
  const width = Math.max(4, Math.min(100, distance))
  const tone = distance <= 25 ? 'bg-emerald-400' : distance >= 50 ? 'bg-rose-400' : 'bg-amber-300'
  return (
    <div className="h-2 overflow-hidden bg-zinc-900">
      <div className={cls('h-full', tone)} style={{ width: `${width}%` }} />
    </div>
  )
}

export function PairAlignmentSpark({ left = 0, right = 0 }) {
  const width = 180
  const height = 56
  const pad = 10
  const y1 = height - pad - ((left / 100) * (height - pad * 2))
  const y2 = height - pad - ((right / 100) * (height - pad * 2))
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-14 w-full rounded border border-zinc-900 bg-[#080808] p-1" preserveAspectRatio="none" aria-hidden="true">
      <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#27272a" strokeWidth="1" />
      <line x1={pad} y1={y1} x2={width - pad} y2={y2} stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx={pad} cy={y1} r="4" fill="#e4e4e7" />
      <circle cx={width - pad} cy={y2} r="4" fill="#e4e4e7" />
    </svg>
  )
}

export function AssetPDFReport({ asset, profile, sparkProfile, seasonalityData }) {
  const { t } = useTranslation()
  const tMonth = (m) => t(`months.${m}`)
  if (!asset || !profile) return null
 
  const idx = asset.funds_percentile_3y
  const direction = asset.funds_index_direction
  const dirArrow = direction === "rising" ? "↑" : direction === "falling" ? "↓" : "→"
 
  const fmtN = (v) => {
    if (v == null) return "n/a"
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v)
  }
 
  const fmtIdx = (v) => v != null ? Number(v).toFixed(1) : "n/a"
 
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  const currentMonth = new Date().getMonth()
 
  return (
    <div id="asset-pdf-report" className="asset-pdf-report-instance" style={{ display: "none" }}>
      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        @page { margin: 16mm; size: A4; }
        body { background: #050505 !important; }
        body * { visibility: hidden !important; }
        #asset-pdf-report,
        #asset-pdf-report * { visibility: visible !important; }
        #asset-pdf-report {
          display: block !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          background: #050505 !important;
          z-index: 99999 !important;
        }
}
        #asset-pdf-report {
          background: #050505;
          color: #ffffff;
          font-family: "Inter", sans-serif;
          font-size: 11px;
          line-height: 1.6;
          max-width: 800px;
          margin: 0 auto;
          padding: 32px;
        }
        .pdf-header { border-bottom: 1px solid #27272a; padding-bottom: 16px; margin-bottom: 24px; }
        .pdf-title { font-size: 22px; font-weight: 700; color: #f4f4f5; margin-bottom: 4px; }
        .pdf-subtitle { font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; color: #71717a; }
        .pdf-section { margin-bottom: 20px; }
        .pdf-section-title { font-size: 9px; text-transform: uppercase; letter-spacing: 0.3em; color: #52525b; border-bottom: 1px solid #1a1a1a; padding-bottom: 6px; margin-bottom: 12px; }
        .pdf-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
        .pdf-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
        .pdf-metric { border: 1px solid #27272a; padding: 10px; background: #0a0a0a; }
        .pdf-metric-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.2em; color: #71717a; margin-bottom: 4px; }
        .pdf-metric-value { font-size: 16px; font-weight: 600; color: #f4f4f5; }
        .pdf-metric-sub { font-size: 10px; color: #71717a; margin-top: 2px; }
        .pdf-table { width: 100%; border-collapse: collapse; font-size: 10px; }
        .pdf-table th { background: #0a0a0a; padding: 6px 8px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.15em; color: #71717a; border-bottom: 1px solid #27272a; }
        .pdf-table td { padding: 6px 8px; border-bottom: 1px solid #1a1a1a; color: #a1a1aa; }
        .pdf-table td.highlight { color: #f4f4f5; font-weight: 600; }
        .pdf-bar-wrap { background: #18181b; height: 6px; border-radius: 2px; overflow: hidden; margin-top: 4px; }
        .pdf-bar { height: 100%; border-radius: 2px; }
        .pdf-season { display: grid; grid-template-columns: repeat(12, 1fr); gap: 3px; }
        .pdf-season-cell { aspect-ratio: 1; display: flex; align-items: center; justify-content: center; font-size: 8px; border: 1px solid #1a1a1a; }
        .pdf-footer { border-top: 1px solid #27272a; padding-top: 12px; margin-top: 24px; font-size: 9px; color: #52525b; display: flex; justify-content: space-between; }
        .c-green { color: #4ade80; }
        .c-red { color: #f87171; }
        .c-amber { color: #fbbf24; }
        .c-sky { color: #38bdf8; }
        .c-neutral { color: #a1a1aa; }
      `}</style>
 
      {/* Header */}
      <div className="pdf-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="pdf-title">{asset.name}</div>
            <div className="pdf-subtitle">
              {asset.symbol} · {asset.sector} · COT Analysis Report
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.3em", color: "#52525b" }}>
              panchenko · trading
            </div>
            <div style={{ fontSize: "10px", color: "#71717a", marginTop: "4px" }}>
              {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
            </div>
          </div>
        </div>
      </div>
 
      {/* Key Metrics */}
      <div className="pdf-section">
        <div className="pdf-section-title">{t('ui.keyMetrics')}</div>
        <div className="pdf-grid">
          <div className="pdf-metric">
            <div className="pdf-metric-label">{t('ui.cotIndex')}</div>
            <div className={`pdf-metric-value ${idx >= 65 ? "c-green" : idx <= 35 ? "c-red" : "c-neutral"}`}>
              {fmtIdx(idx)}
            </div>
            <div className="pdf-bar-wrap">
              <div className="pdf-bar" style={{
                width: `${Math.max(2, idx ?? 0)}%`,
                background: idx >= 65 ? "#4ade80" : idx <= 35 ? "#f87171" : "#71717a"
              }} />
            </div>
          </div>
          <div className="pdf-metric">
            <div className="pdf-metric-label">{t('ui.flowState')}</div>
            <div className={`pdf-metric-value ${idx >= 65 ? "c-green" : idx <= 35 ? "c-red" : "c-neutral"}`} style={{ fontSize: "13px" }}>
              {translateFlowState(asset.flow_state || 'Neutral', t)}
            </div>
            <div className="pdf-metric-sub">{profile.setupBias}</div>
          </div>
          <div className="pdf-metric">
            <div className="pdf-metric-label">{t('ui.momentum')}</div>
            <div className={`pdf-metric-value ${direction === "rising" ? "c-green" : direction === "falling" ? "c-red" : "c-neutral"}`}>
              {dirArrow} {asset.funds_index_wow_change != null ? `${asset.funds_index_wow_change > 0 ? "+" : ""}${asset.funds_index_wow_change.toFixed(1)}` : "—"}
            </div>
            <div className="pdf-metric-sub">
              {asset.funds_index_acceleration || "—"}
            </div>
          </div>
          <div className="pdf-metric">
            <div className="pdf-metric-label">{t('ui.openInterest')}</div>
            <div className="pdf-metric-value" style={{ fontSize: "13px", color: "#f4f4f5" }}>
              {fmtN(asset.open_interest)}
            </div>
          </div>
        </div>
      </div>
 
      {/* Rolling Averages */}
      <div className="pdf-section">
        <div className="pdf-section-title">{t('ui.rollingAverages')}</div>
        <div className="pdf-grid-3">
          <div className="pdf-metric">
            <div className="pdf-metric-label">3-Week Avg Index</div>
            <div className={`pdf-metric-value ${(asset.funds_index_3w_avg ?? 50) >= 65 ? "c-green" : (asset.funds_index_3w_avg ?? 50) <= 35 ? "c-red" : "c-neutral"}`}>
              {asset.funds_index_3w_avg != null ? asset.funds_index_3w_avg.toFixed(1) : "n/a"}
            </div>
          </div>
          <div className="pdf-metric">
            <div className="pdf-metric-label">8-Week Avg Index</div>
            <div className={`pdf-metric-value ${(asset.funds_index_8w_avg ?? 50) >= 65 ? "c-green" : (asset.funds_index_8w_avg ?? 50) <= 35 ? "c-red" : "c-neutral"}`}>
              {asset.funds_index_8w_avg != null ? asset.funds_index_8w_avg.toFixed(1) : "n/a"}
            </div>
          </div>
          <div className="pdf-metric">
            <div className="pdf-metric-label">vs Trend (Momentum)</div>
            <div className={`pdf-metric-value ${(asset.funds_index_momentum ?? 0) > 0 ? "c-green" : (asset.funds_index_momentum ?? 0) < 0 ? "c-red" : "c-neutral"}`}>
              {asset.funds_index_momentum != null ? `${asset.funds_index_momentum > 0 ? "+" : ""}${asset.funds_index_momentum.toFixed(1)}` : "n/a"}
            </div>
          </div>
        </div>
      </div>
 
      {/* Positioning Detail */}
      <div className="pdf-section">
        <div className="pdf-section-title">{t('ui.positioningDetail')}</div>
        <table className="pdf-table">
          <thead>
            <tr>
              <th>{t('ui.group')}</th>
              <th style={{ textAlign: "right" }}>{t('ui.long')}</th>
              <th style={{ textAlign: "right" }}>{t('ui.short')}</th>
              <th style={{ textAlign: "right" }}>{t('ui.net')}</th>
              <th style={{ textAlign: "right" }}>% {t('ui.long')}</th>
              <th style={{ textAlign: "right" }}>% {t('ui.short')}</th>
              <th style={{ textAlign: "right" }}>{t('ui.index')}</th>
            </tr>
          </thead>
          <tbody>
            {asset.source_type === "TFF" ? (
              <>
                <tr>
                  <td className="highlight">{t('ui.leveragedFunds')}</td>
                  <td style={{ textAlign: "right" }}>{fmtN(asset.funds_long)}</td>
                  <td style={{ textAlign: "right" }}>{fmtN(asset.funds_short)}</td>
                  <td style={{ textAlign: "right" }} className={Number(asset.funds_net) > 0 ? "c-green" : "c-red"}>
                    {fmtN(asset.funds_net)}
                  </td>
                  <td style={{ textAlign: "right" }}>{asset.funds_pct_oi != null ? `${asset.funds_pct_oi.toFixed(1)}%` : "n/a"}</td>
                  <td style={{ textAlign: "right" }}>—</td>
                  <td style={{ textAlign: "right" }} className={idx >= 65 ? "c-green" : idx <= 35 ? "c-red" : "c-neutral"}>
                    {fmtIdx(idx)}
                  </td>
                </tr>
                <tr>
                  <td className="highlight">{t('ui.dealerBanks')}</td>
                  <td style={{ textAlign: "right" }}>{fmtN(asset.dealer_long)}</td>
                  <td style={{ textAlign: "right" }}>{fmtN(asset.dealer_short)}</td>
                  <td style={{ textAlign: "right" }} className={Number(asset.dealer_net) > 0 ? "c-green" : "c-red"}>
                    {fmtN(asset.dealer_net)}
                  </td>
                  <td style={{ textAlign: "right" }}>{asset.dealer_pct_oi != null ? `${asset.dealer_pct_oi.toFixed(1)}%` : "n/a"}</td>
                  <td style={{ textAlign: "right" }}>—</td>
                  <td style={{ textAlign: "right" }} className={(asset.dealer_percentile_3y ?? 50) >= 65 ? "c-green" : (asset.dealer_percentile_3y ?? 50) <= 35 ? "c-red" : "c-neutral"}>
                    {fmtIdx(asset.dealer_percentile_3y)}
                  </td>
                </tr>
                <tr>
                  <td className="highlight">{t('ui.assetManager')}</td>
                  <td style={{ textAlign: "right" }}>{fmtN(asset.asset_manager_long)}</td>
                  <td style={{ textAlign: "right" }}>{fmtN(asset.asset_manager_short)}</td>
                  <td style={{ textAlign: "right" }} className={Number(asset.asset_manager_net) > 0 ? "c-green" : "c-red"}>
                    {fmtN(asset.asset_manager_net)}
                  </td>
                  <td style={{ textAlign: "right" }}>{asset.asset_manager_pct_oi != null ? `${asset.asset_manager_pct_oi.toFixed(1)}%` : "n/a"}</td>
                  <td style={{ textAlign: "right" }}>—</td>
                  <td style={{ textAlign: "right" }} className={(asset.asset_manager_percentile_3y ?? 50) >= 65 ? "c-green" : (asset.asset_manager_percentile_3y ?? 50) <= 35 ? "c-red" : "c-neutral"}>
                    {fmtIdx(asset.asset_manager_percentile_3y)}
                  </td>
                </tr>
              </>
            ) : (
              <>
                <tr>
                  <td className="highlight">{t('ui.managedMoney')}</td>
                  <td style={{ textAlign: "right" }}>{fmtN(asset.funds_long)}</td>
                  <td style={{ textAlign: "right" }}>{fmtN(asset.funds_short)}</td>
                  <td style={{ textAlign: "right" }} className={Number(asset.funds_net) > 0 ? "c-green" : "c-red"}>
                    {fmtN(asset.funds_net)}
                  </td>
                  <td style={{ textAlign: "right" }}>—</td>
                  <td style={{ textAlign: "right" }}>—</td>
                  <td style={{ textAlign: "right" }} className={idx >= 65 ? "c-green" : idx <= 35 ? "c-red" : "c-neutral"}>
                    {fmtIdx(idx)}
                  </td>
                </tr>
                <tr>
                  <td className="highlight">{t('ui.producerMerchant')}</td>
                  <td style={{ textAlign: "right" }}>{fmtN(asset.producer_long)}</td>
                  <td style={{ textAlign: "right" }}>{fmtN(asset.producer_short)}</td>
                  <td style={{ textAlign: "right" }} className={Number(asset.producer_net) > 0 ? "c-green" : "c-red"}>
                    {fmtN(asset.producer_net)}
                  </td>
                  <td style={{ textAlign: "right" }}>—</td>
                  <td style={{ textAlign: "right" }}>—</td>
                  <td style={{ textAlign: "right" }}>—</td>
                </tr>
                <tr>
                  <td className="highlight">{t('ui.swapDealers')}</td>
                  <td style={{ textAlign: "right" }}>{fmtN(asset.dealer_long)}</td>
                  <td style={{ textAlign: "right" }}>{fmtN(asset.dealer_short)}</td>
                  <td style={{ textAlign: "right" }} className={Number(asset.dealer_net) > 0 ? "c-green" : "c-red"}>
                    {fmtN(asset.dealer_net)}
                  </td>
                  <td style={{ textAlign: "right" }}>—</td>
                  <td style={{ textAlign: "right" }}>—</td>
                  <td style={{ textAlign: "right" }}>—</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
 
      {/* Setup Analysis */}
      <div className="pdf-section">
        <div className="pdf-section-title">{t('ui.setupAnalysis')}</div>
        <div style={{ border: "1px solid #27272a", padding: "12px", background: "#0a0a0a", fontSize: "11px", color: "#a1a1aa", lineHeight: "1.7" }}>
          <div style={{ color: "#f4f4f5", fontWeight: "600", marginBottom: "6px" }}>{profile.setupBias}</div>
          <div className="text-sm leading-6 text-zinc-300">{profile.setupSummary}</div>
          <div style={{ marginTop: "8px", color: "#71717a" }}>{profile.contextualInterpretation}</div>
        </div>
      </div>
 
      {/* Seasonality */}
      {sparkProfile.length === 12 && (
        <div className="pdf-section">
          <div className="pdf-section-title">{t('ui.seasonalPattern')}</div>
          <div className="pdf-season">
            {MONTHS.map((m, i) => {
              const v = sparkProfile[i]
              const bg = v >= 65 ? "#14532d" : v <= 35 ? "#450a0a" : "#18181b"
              const color = v >= 65 ? "#4ade80" : v <= 35 ? "#f87171" : "#71717a"
              const isCurrent = i === currentMonth
              return (
                <div key={tMonth(m)} className="pdf-season-cell" style={{
                  background: bg,
                  color,
                  border: isCurrent ? "1px solid #f59e0b" : "1px solid #1a1a1a",
                  fontWeight: isCurrent ? "700" : "400",
                }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "8px", color: "#52525b" }}>{tMonth(m)}</div>
                    <div>{v != null ? v.toFixed(0) : "—"}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
 
      {/* Footer */}
      <div className="pdf-footer">
        <span>panchenko trading · COT Analytical Dashboard</span>
        <span>Data source: CFTC · Generated {new Date().toLocaleDateString("en-GB")}</span>
      </div>
    </div>
  )
}

function ExplorerTabs({ assets, selected, setSelected }) {
  const sortedAssets = [...assets].sort((a, b) => {
    const sectorA = normalizeSector(a.sector || "");
    const sectorB = normalizeSector(b.sector || "");
    if (sectorA !== sectorB) return sectorA.localeCompare(sectorB);
    return (a.symbol || "").localeCompare(b.symbol || "");
  });

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2">
        {sortedAssets.map((a) => (
          <button
            key={a.symbol}
            onClick={() => setSelected(a.symbol)}
            className={cls( 
              "min-w-[72px] border px-3 py-2 text-xs uppercase tracking-[0.18em] transition",
              selected === a.symbol
                ? "border-amber-400 bg-zinc-950 text-zinc-100"
                : "border-zinc-900 small-panel-color text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
            )}
          >
            {a.symbol}
          </button>
        ))}
      </div>
    </div>
  );
}

export function BiasBar({ value = 50 }) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0))
  const color = safe >= 65 ? '#34d399' : safe <= 35 ? '#fb7185' : '#f59e0b'
  const glow = safe >= 65
    ? '0 0 8px rgba(52,211,153,0.8)'
    : safe <= 35
    ? '0 0 8px rgba(251,113,133,0.8)'
    : '0 0 8px rgba(245,158,11,0.8)'
  return (
    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: '9999px'}}>
      <div style={{
        width: `${Math.max(6, safe)}%`,
        height: '12px',
        background: color,
        borderRadius: '9999px',
        boxShadow: glow,
      }} />
    </div>
  )
}

export function GaugeArc({ value = 50 }) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  const radius = 48;
  const circumference = Math.PI * radius;
  const progress = (safe / 100) * circumference;
  const tone = safe >= 65 ? "#34d399" : safe <= 35 ? "#fb7185" : "#f59e0b";
  const glowId = `glow-${Math.round(safe)}`;

  return (
    <div className="mx-auto flex w-full max-w-[220px] justify-center" style={{ overflow: 'visible' }}>
      <svg viewBox="0 0 120 70" className="h-24 w-[120px]" aria-hidden="true" style={{ overflow: 'visible' }}>
        <defs>
          <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
          </filter>
        </defs>
        <g transform="translate(60 60)">
          {/* 1. Background arc */}
          <circle r={radius} cx="0" cy="0" fill="none"
            stroke="#27272a" strokeWidth="12" strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference * 2}`}
            strokeDashoffset="0" transform="rotate(180)"
          />
          {/* 2. Glow layer — blurred, rendered before crisp arc */}
          <circle r={radius} cx="0" cy="0" fill="none"
            stroke={tone} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${progress} ${circumference * 2}`}
            strokeDashoffset="0" transform="rotate(180)"
            filter={`url(#${glowId})`}
            
          />
          {/* 3. Crisp colored arc on top */}
          <circle r={radius} cx="0" cy="0" fill="none"
            stroke={tone} strokeWidth="12" strokeLinecap="round"
            strokeDasharray={`${progress} ${circumference * 2}`}
            strokeDashoffset="0" transform="rotate(180)"
          />
          <text x="0" y="8" textAnchor="middle" fill="#f4f4f5" fontSize="18" fontWeight="600">
            {formatPercentile(safe)}
          </text>
        </g>
      </svg>
    </div>
  );
}

function Sidebar({ active, setActive, collapsed, setCollapsed }) {
  const { t } = useTranslation()
 
  return (
    <>
    {/* Mobile overlay — tap to close the sidebar (only when open on phone) */}
    {!collapsed && (
      <div
        onClick={() => setCollapsed(true)}
        className="mobile-overlay"
      />
    )}
    <aside className={cls(
      'fixed left-0 top-0 z-30 flex h-screen flex-col border-r bg-[#0a0e1a]','border-[#1e2d4a]',
      'transition-[width] duration-300 ease-in-out overflow-hidden',
      collapsed ? 'w-0' : 'w-60'
    )}>
 
       {/* Mobile close button — visible only on phones */}
      {!collapsed && (
        <button
          onClick={() => setCollapsed(true)}
          className="sidebar-close-btn"
          aria-label="Закрити меню"
        >
          ✕
        </button>
      )}

       {/* Logo — fixed at bottom */}
      <div className={cls(
        'shrink-0 border-b logo transition-all duration-300',
        collapsed ? 'px-0 py-1 flex justify-center' : 'px-4 py-4'
      )}>
        {collapsed ? (
          /* Collapsed: monogram only */
          <div className="flex h-8 w-8 items-center justify-center">
            <div className="flex h-8 w-8 items-center justify-center bg-white">
              <div className="flex h-8 w-8 items-center justify-center">
                <img src="/logo.svg" alt="KP" style={{ width: '35px', height: '35px', objectFit: 'contain' }} />
              </div>
            </div>
          </div>
        ) : (
          /* Expanded: full logo */
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-white p-1.5">
              <div className="flex h-8 w-8 items-center justify-center">
                <img src="/logo.svg" alt="KP" style={{ width: '55px', height: '55px', objectFit: 'contain' }} />
              </div>
            </div>
            <div className="overflow-hidden">
              <div className={cls(
                'text-[11px] font-bold uppercase tracking-[0.35em] text-zinc-100 transition-all duration-200',
                collapsed ? 'opacity-0' : 'opacity-100'
              )}>
                panchenko
              </div>
              <div className={cls(
                'text-[11px] font-bold uppercase tracking-[0.45em] text-zinc-100 transition-all duration-200',
                collapsed ? 'opacity-0' : 'opacity-100'
              )}>
                trading
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Nav items — scrollable middle section */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 pt-4 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = active === item.key
          return (
            <button
              key={item.key}
              onClick={() => {
                setActive(item.key)
                if (window.innerWidth <= 768) setCollapsed(true)
              }}
              title={collapsed ? t(item.labelKey) : undefined}
              className={cls(
                'flex w-full items-center border-l text-left text-xs uppercase tracking-[0.22em] transition-all duration-150',
                collapsed ? 'justify-center px-0 py-3' : 'gap-3 px-3 py-3',
                isActive
                ? 'border-blue-500 bg-blue-500/10 text-blue-50'
                : 'border-transparent hover:bg-blue-500/15 hover:text-slate-200'
              )}
            >
              <Icon size={16} className="shrink-0" />
              <span className={cls(
                'whitespace-nowrap transition-all duration-200',
                collapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'
              )}>
                {t(item.labelKey)}
              </span>
            </button>
          )
        })}
      </nav>
    </aside>
    </>
  )
}

function AlertBell({ onOpen }) {
  const { t } = useTranslation()
  const [unreadCount, setUnreadCount] = useState(0)
 
  React.useEffect(() => {
    const fetchCount = () => {
      fetch("/api/alerts/unread?limit=1")
        .then((r) => r.ok ? r.json() : { unread_count: 0 })
        .then((json) => setUnreadCount(json.unread_count || 0))
        .catch(() => {})
    }
    fetchCount()
    const timer = setInterval(fetchCount, 60_000) // check every minute
    return () => clearInterval(timer)
  }, [])
 
  return (
    <button
      onClick={onOpen}
      className="relative grid h-8 w-8 place-items-center default-bg text-slate-200 transition hover:text-zinc-300"
      title={t('ui.alerts')}
    >
      <Bell size={15} />
      {unreadCount > 0 && (
        <span style={{
          position: 'absolute',
          top: '-6px',
          right: '-6px',
          minWidth: '18px',
          height: '18px',
          padding: '0 4px',
          background: '#ef4444',
          borderRadius: '4px',
          fontSize: '9px',
          fontWeight: '700',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          lineHeight: 1,
          letterSpacing: '0.02em',
        }}>
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  )
}

function AlertDrawer({ open, onClose }) {
  const { t } = useTranslation()
  const [alerts, setAlerts]   = useState([])
  const [loading, setLoading] = useState(false)
 
  const load = React.useCallback(() => {
    if (!open) return
    setLoading(true)
    fetch("/api/alerts/unread?limit=50")
      .then((r) => r.ok ? r.json() : { items: [] })
      .then((json) => setAlerts(json.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open])
 
  React.useEffect(() => { load() }, [load])
 
  const markAllRead = () => {
    fetch("/api/alerts/mark-read", { method: "POST" })
      .then(() => setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true }))))
  }
 
  const severityTone = (s) =>
    s === "high"   ? "text-rose-400 border-rose-900/50 bg-rose-950/20" :
    s === "medium" ? "text-blue-400 border-amber-900/50 bg-amber-950/20" :
                     "text-zinc-400 border-zinc-800 bg-zinc-950"
 
  const severityDot = (s) =>
    s === "high"   ? "bg-rose-400" :
    s === "medium" ? "bg-amber-400" : "bg-zinc-600"
 
  if (!open) return null
 
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />
 
      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 flex h-screen w-[400px] flex-col default-bg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3" style={{borderColor: 'var(--panels-border)'}}>
          <span className="text-[11px] uppercase tracking-[0.25em]">
            {t('ui.cotAlerts')}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllRead}
              className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 hover:text-zinc-400 transition"
            >
              {t('ui.markAllRead')}
            </button>
            <button
              onClick={onClose}
              className="grid h-7 w-7 place-items-center border border-zinc-800 text-slate-200 hover:text-zinc-300 transition"
            >
              ✕
            </button>
          </div>
        </div>
 
        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="p-4 space-y-2">
              {[100, 85, 70].map((w, i) => (
                <div key={i} className="h-3 animate-pulse rounded bg-zinc-800" style={{ width: `${w}%` }} />
              ))}
            </div>
          )}
 
          {!loading && alerts.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
              <Bell size={28} className="text-zinc-700" />
              <div className="text-sm text-zinc-600">{t('ui.noAlertsYet')}</div>
              <div className="text-xs text-zinc-700">
                {t('ui.alertsFireNote')}
              </div>
            </div>
          )}
 
          {!loading && alerts.length > 0 && (
            <div className="divide-y divide-zinc-900">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cls(
                    "border-l-2 px-4 py-3 transition",
                    !alert.is_read ? severityTone(alert.severity) : " text-zinc-600"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <div className={cls("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", !alert.is_read ? severityDot(alert.severity) : "rounded-full-dot")} />
                      <div className={cls("text-sm font-medium leading-5", !alert.is_read ? "text-zinc-100" : "text-slate-200")}>
                        {alert.title}
                      </div>
                    </div>
                  </div>
                  <div className="mt-1.5 pl-3.5 text-xs leading-5 text-slate-200">
                    {alert.body}
                  </div>
                  <div className="mt-1.5 pl-3.5 flex items-center gap-3 text-[10px] uppercase tracking-[0.16em] text-zinc-700">
                    <span>{alert.symbol}</span>
                    <span>·</span>
                    <span>{alert.report_date}</span>
                    {alert.severity === "high" && !alert.is_read && (
                      <span className="text-rose-600">{t('ui.highPriority')}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
 
        {/* Footer — run check */}
        <div className="border-t border-zinc-900 px-4 py-3">
          <button
            onClick={() => {
              fetch("/api/alerts/regenerate", { method: "POST" })
                .then(() => load())
            }}
            className="w-full border border-zinc-800 py-2 text-[11px] uppercase tracking-[0.22em] text-slate-200 hover:border-zinc-700 hover:text-zinc-300 transition"
          >
            {t('ui.runAlertCheck')}
          </button>
        </div>
      </div>
    </>
  )
}

function TopBar({ active, status, sidebarCollapsed, setSidebarCollapsed, onAlertOpen }) {
  const { t } = useTranslation()
 
  return (
    <div className="sticky top-0 z-20 flex items-center justify-between border-b px-4 py-3 text-xs uppercase tracking-[0.24em]" style={{ background: 'var(--bg-surface)', borderColor: 'var(--panels-border)' }}>
 
      {/* Left: burger + page title */}
      <div className="flex items-center gap-3">
        {/* Burger button */}
        <button
          onClick={() => setSidebarCollapsed((v) => !v)}
          className="grid h-8 w-8 shrink-0 place-items-center default-bg text-slate-200 transition hover:text-zinc-300"
          aria-label={t('ui.toggleSidebar')}
        >
          {/* Animated burger → X lines */}
          <div className="flex flex-col items-center justify-center gap-[4px]">
            <span className={cls(
              'block h-px w-4 bg-current transition-all duration-300 origin-center',
              !sidebarCollapsed && 'translate-y-[5px] rotate-45'
            )} />
            <span className={cls(
              'block h-px w-4 bg-current transition-all duration-200',
              !sidebarCollapsed && 'opacity-0 scale-x-0'
            )} />
            <span className={cls(
              'block h-px w-4 bg-current transition-all duration-300 origin-center',
              !sidebarCollapsed && '-translate-y-[5px] -rotate-45'
            )} />
          </div>
        </button>
 
        {/* Page title */}
        <span className="text-blue-100">
          {t(NAV_ITEMS.find((n) => n.key === active)?.labelKey || 'nav.workspace')}
        </span>
      </div>
 
      {/* Right: stats */}
      {/* Right: stats + alert bell */}
      <div className="flex items-center gap-4">
        <div className="flex gap-6 text-xs uppercase tracking-[0.24em] text-slate-200 topbar-stats">
          <span>{t('topbar.assets')} {status?.asset_count ?? '...'}</span>
          <span>{t('topbar.rows')} {status?.total_rows ?? '...'}</span>
          <span>{status?.latest_report_date ?? t('topbar.noData')}</span>
        </div>
        <AlertBell onOpen={onAlertOpen} />
      </div>
    </div>
  )
}

export function Panel({ title, children, right }) {
  return (
    <section className="default-bg">
      <div className="flex items-center justify-between border-b px-4 py-3 text-[11px] uppercase tracking-[0.25em]" style={{ borderColor: 'var(--panels-border)' }}>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full rounded-full-dot bg-blue-400"></div>
          <span>{title}</span>
        </div>
        {right ? <div>{right}</div> : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

export function Metric({ label, value }) {
  return (
    <div className="p-2 border" style={{ background: 'var(--panel-color-light)', borderColor: 'var(--accent-border)', borderRadius: '8px' }}>
      <div className="text-[10px] uppercase tracking-[0.22em] text-slate-200">{label}</div>
      <div className="mt-1 text-zinc-100">{value}</div>
    </div>
  )
}

export function ImpactBadge({ impact }) {
  const { t } = useTranslation();
  const tone = impact === 'High' ? 'text-rose-400' : impact === 'Med' ? 'text-blue-400' : 'text-zinc-400'
  return <span className={cls('text-xs uppercase tracking-[0.2em]', tone)}>{impact}</span>
}

// ─────────────────────────────────────────────────────────────────────────────
// ДВОМОВНИЙ MacroContextPanel
// Показує VIX, Yield Curve, DXY як macro backdrop для COT аналізу
// Будує interpretation/regime з ключів через t(), ігноруючи backend-текст.
// ════════════════════════════════════════════════════════════════════════════

export function MacroContextPanel({ aiLanguage = "en" }) {
  const { t } = useTranslation()
  const uk = t('__lang__') === 'uk'
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")
  const [lastFetch, setLastFetch] = useState(null)

  const load = React.useCallback(() => {
    setLoading(true)
    setError("")
    fetch("/api/macro-context")
      .then((r) => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then((json) => { setData(json); setLastFetch(new Date()) })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => { load() }, [load])

  const regimeTone = (regime) => {
    if (!regime) return "text-slate-200"
    const r = regime.toLowerCase()
    if (r.includes("risk-off") || r.includes("stress") || r.includes("contraction")) return "text-rose-400"
    if (r.includes("risk-on") || r.includes("expansion") || r.includes("benign")) return "text-emerald-400"
    if (r.includes("warning") || r.includes("inversion") || r.includes("pressure")) return "text-blue-400"
    return "text-sky-400"
  }

  const itemTone = (item) => {
    if (!item?.regime) return "text-zinc-300"
    const r = item.regime
    if (r === "extreme_fear" || r === "fear") return "text-rose-300"
    if (r === "complacent")                   return "text-blue-300"
    if (r === "calm")                         return "text-emerald-400"
    if (r === "elevated")                     return "text-blue-400"
    if (r === "inverted") return "text-rose-400"
    if (r === "flat")     return "text-blue-400"
    if (r === "steep")    return "text-emerald-400"
    if (r === "strengthening") return "text-blue-400"
    if (r === "weakening")     return "text-emerald-400"
    return "text-zinc-300"
  }

  const itemBg = (item) => {
    if (!item?.alert) return "small-panel-color "
    const r = item?.regime
    if (r === "inverted" || r === "fear" || r === "extreme_fear") return "border-rose-900/40 bg-rose-950/15"
    if (r === "flat" || r === "complacent" || r === "strengthening") return "border-amber-900/40 bg-rose-500/10"
    return "border-emerald-900/40 bg-emerald-950/15"
  }

  // ── Переклад macro regime label ──
  const translateRegime = (regime) => {
    if (!regime) return ""
    const map = {
      "Risk-Off / Stress":          uk ? "Risk-Off / Стрес" : "Risk-Off / Stress",
      "Risk-On Expansion":          uk ? "Risk-On Експансія" : "Risk-On Expansion",
      "Late Cycle / Contraction":   uk ? "Пізній цикл / Стиснення" : "Late Cycle / Contraction",
      "Inversion Warning":          uk ? "Попередження про інверсію" : "Inversion Warning",
      "Dollar Stress / EM Pressure": uk ? "Стрес долара / Тиск на EM ринки" : "Dollar Stress / EM Pressure",
      "Benign / Constructive":      uk ? "Сприятливий / Конструктивний" : "Benign / Constructive",
      "Mixed / Transition":         uk ? "Змішаний / Перехідний" : "Mixed / Transition",
    }
    return map[regime] || regime
  }

  // ── Переклад regime badge (всередині картки) ──
  const translateItemRegime = (regime) => {
    if (!regime) return ""
    const map = {
      complacent: uk ? "самозаспокоєння" : "complacent",
      calm: uk ? "спокій" : "calm",
      elevated: uk ? "підвищений" : "elevated",
      fear: uk ? "страх" : "fear",
      extreme_fear: uk ? "екстремальний страх" : "extreme fear",
      steep: uk ? "крута" : "steep",
      normal: uk ? "нормальна" : "normal",
      flat: uk ? "плоска" : "flat",
      inverted: uk ? "інвертована" : "inverted",
      strengthening: uk ? "зміцнюється" : "strengthening",
      weakening: uk ? "слабшає" : "weakening",
      neutral: uk ? "нейтральний" : "neutral",
    }
    return map[regime] || regime.replace(/_/g, " ")
  }

  // ── Будуємо interpretation з ключів (двомовно) ──
  const buildInterpretation = (item) => {
    const v = item.value
    if (item.key === "vix") {
      const m = {
        complacent: uk ? `VIX ${v?.toFixed(1)} — ринок самозаспокоєний. Низький страх часто передує різким розворотам.` : `VIX at ${v?.toFixed(1)} — markets are complacent. Low fear often precedes sharp reversals.`,
        calm: uk ? `VIX ${v?.toFixed(1)} — спокійне середовище ризику. Нормальні умови для трендової торгівлі.` : `VIX at ${v?.toFixed(1)} — calm risk environment. Normal conditions for trend-following.`,
        elevated: uk ? `VIX ${v?.toFixed(1)} — підвищена невизначеність. Зменшіть розмір, стежте за стрибками волатильності.` : `VIX at ${v?.toFixed(1)} — elevated uncertainty. Reduce size, watch for volatility spikes.`,
        fear: uk ? `VIX ${v?.toFixed(1)} — режим страху. Перевага risk-off позиціонуванню.` : `VIX at ${v?.toFixed(1)} — fear mode. Risk-off positioning favoured.`,
        extreme_fear: uk ? `VIX ${v?.toFixed(1)} — екстремальний страх / криза. Можуть з'явитися контраріанські лонг-можливості.` : `VIX at ${v?.toFixed(1)} — extreme fear / crisis. Contrarian long opportunities may emerge.`,
      }
      return m[item.regime] || ""
    }
    if (item.key === "yield_curve") {
      const s = v != null ? `${v >= 0 ? "+" : ""}${v.toFixed(2)}%` : ""
      const m = {
        steep: uk ? `Крива дохідності крута (${s}). Оптимізм зростання, рання фаза експансії.` : `Yield curve steep (${s}). Growth optimism, early expansion cycle.`,
        normal: uk ? `Крива дохідності нормальна (${s}). Здоровий макро-фон.` : `Yield curve normal (${s}). Healthy macro backdrop.`,
        flat: uk ? `Крива дохідності плоска (${s}). Сигнал пізнього циклу — стежте за інверсією.` : `Yield curve flat (${s}). Late cycle signal — watch for inversion.`,
        inverted: uk ? `Крива дохідності інвертована (${s}). Попередження про рецесію — історично надійний сигнал.` : `Yield curve inverted (${s}). Recession warning — historically reliable signal.`,
      }
      return m[item.regime] || ""
    }
    if (item.key === "dxy") {
      const chg = item.change_pct != null ? `${item.change_pct >= 0 ? "+" : ""}${item.change_pct.toFixed(2)}%` : ""
      const m = {
        strengthening: uk ? `DXY ${v?.toFixed(1)} (${chg}) — долар зміцнюється. Ведмеже для сировини та EM-активів.` : `DXY ${v?.toFixed(1)} (${chg}) — Dollar strengthening. Bearish for commodities and EM assets.`,
        weakening: uk ? `DXY ${v?.toFixed(1)} (${chg}) — долар слабшає. Підтримує золото, сировину, EM.` : `DXY ${v?.toFixed(1)} (${chg}) — Dollar weakening. Supportive for gold, commodities, EM.`,
        neutral: uk ? `DXY ${v?.toFixed(1)} (${chg}) — долар нейтральний. Немає сильного напрямкового сигналу.` : `DXY ${v?.toFixed(1)} (${chg}) — Dollar neutral. No strong directional signal.`,
      }
      return m[item.regime] || ""
    }
    if (item.key === "spx") {
      return uk ? `S&P 500 на рівні ${v?.toLocaleString()}.` : `S&P 500 at ${v?.toLocaleString()}.`
    }
    return item.interpretation || ""
  }

  const translateLabel = (item) => {
    if (item.key === "yield_curve") return uk ? "Крива дохідності (10Y−2Y)" : "Yield Curve (10Y−2Y)"
    return item.label
  }

  const fmtValue = (item) => {
    if (item.value == null) return uk ? "н/д" : "n/a"
    if (item.key === "yield_curve") { const sign = item.value >= 0 ? "+" : ""; return `${sign}${item.value.toFixed(2)}%` }
    if (item.key === "vix") return item.value.toFixed(2)
    if (item.key === "spx") return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(item.value)
    return item.value.toFixed(2)
  }

  const fmtChange = (item) => {
    if (item.change_pct == null) return null
    const sign = item.change_pct >= 0 ? "+" : ""
    return `${sign}${item.change_pct.toFixed(2)}%`
  }

  return (
    <section className="default-bg title-border">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full rounded-full-dot bg-sky-400" />
          <span className="text-[11px] uppercase tracking-[0.25em] text-slate-200">
            {uk ? "Макро контекст" : "Macro Context"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {data?.macro_regime && (
            <span className={cls("text-[11px] uppercase tracking-[0.22em]", regimeTone(data.macro_regime))}>
              {translateRegime(data.macro_regime)}
            </span>
          )}
          <button onClick={load} disabled={loading}
            className={cls("border px-2 py-1 text-[10px] uppercase tracking-[0.2em] transition",
              loading ? "cursor-not-allowed border-zinc-800 text-zinc-600"
                      : "border-zinc-800 text-slate-200 hover:border-zinc-700 hover:text-zinc-300")}>
            {loading ? "..." : uk ? "Оновити" : "Refresh"}
          </button>
        </div>
      </div>

      {loading && !data && (
        <div className="p-4 space-y-2">
          {[100, 80, 60].map((w, i) => (
            <div key={i} className="h-3 animate-pulse rounded bg-zinc-800" style={{ width: `${w}%` }} />
          ))}
        </div>
      )}

      {error && (
        <div className="px-4 py-3 text-xs text-rose-400">
          {uk ? "Помилка: " : "Error: "}{error}
        </div>
      )}

      {data?.items?.length > 0 && (
        <div className="p-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-2">
            {data.items.map((item) => (
              <div key={item.key} className={cls("border p-3 space-y-2", itemBg(item))}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-slate-200">
                    {translateLabel(item)}
                  </span>
                  {item.regime && (
                    <span className={cls("text-[9px] uppercase tracking-[0.16em]", itemTone(item))}>
                      {translateItemRegime(item.regime)}
                    </span>
                  )}
                </div>
                <div className="flex items-end justify-between gap-2">
                  <span className={cls("text-xl font-semibold tabular-nums", itemTone(item))}>
                    {fmtValue(item)}
                  </span>
                  {fmtChange(item) && (
                    <span className={cls("text-xs tabular-nums mb-0.5",
                      item.change_pct >= 0 ? "text-emerald-400" : "text-rose-400")}>
                      {fmtChange(item)}
                    </span>
                  )}
                </div>
                {item.key === "yield_curve" && item.t10y && item.t2y && (
                  <div className="text-[10px] text-zinc-600">
                    10Y: {item.t10y.toFixed(2)}% · 2Y: {item.t2y.toFixed(2)}%
                  </div>
                )}
                <div className="text-[11px] leading-5 text-slate-200">
                  {buildInterpretation(item)}
                </div>
                {item.alert && (
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-amber-400">
                    <div className="h-1.5 w-1.5 rounded-full rounded-full-dotbg-amber-400 animate-pulse" />
                    {uk ? "Увага" : "Watch"}
                  </div>
                )}
              </div>
            ))}
          </div>
          {lastFetch && (
            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">
              {uk ? "Оновлено: " : "Updated: "}{lastFetch.toLocaleTimeString()}
            </div>
          )}
        </div>
      )}

      {!loading && !error && (!data?.items || data.items.length === 0) && (
        <div className="px-4 py-4 text-sm text-zinc-600">
          {uk ? "Дані недоступні. Встанови yfinance: pip install yfinance"
              : "No data available. Install yfinance: pip install yfinance"}
        </div>
      )}
    </section>
  )
}

export const TIMEZONES = [
  { value: "Europe/Copenhagen", label: "Denmark (CET/CEST)" },
  { value: "Europe/Kyiv",       label: "Ukraine (EET/EEST)" },
  { value: "Europe/London",     label: "UK (GMT/BST)" },
  { value: "Europe/Berlin",     label: "Germany (CET/CEST)" },
  { value: "Europe/Paris",      label: "France (CET/CEST)" },
  { value: "America/New_York",  label: "New York (EST/EDT)" },
  { value: "America/Chicago",   label: "Chicago (CST/CDT)" },
  { value: "America/Los_Angeles","label": "Los Angeles (PST/PDT)" },
  { value: "Asia/Dubai",        label: "Dubai (GST)" },
  { value: "Asia/Singapore",    label: "Singapore (SGT)" },
  { value: "UTC",               label: "UTC" },
]

export default function App() {
  const [active, setActive] = useState('workspace')
  const [selected, setSelected] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(typeof window !== 'undefined' && window.innerWidth <= 768)
  const [status, setStatus] = useState(null)
  const [assets, setAssets] = useState([])
  const [signals, setSignals] = useState([])
  const [seasonalityData, setSeasonalityData] = useState([])
  const [workspaceData, setWorkspaceData] = useState({ macro_regime: null, releases: [], calendar: [], news: [] })
  const [updateState, setUpdateState] = useState({ status: 'idle', started_at: null, finished_at: null, return_code: null, log: '', error: '' })
  const [updateBusy, setUpdateBusy] = useState(false)
  const [schedulerState, setSchedulerState] = useState(null)
  const [alertDrawerOpen, setAlertDrawerOpen] = useState(false)
  const [guideSection, setGuideSection] = useState(null)
  const openGuide = (sectionKey = null) => {
    setGuideSection(sectionKey)
    setActive("guide")
  }
  const [watchlist, setWatchlist] = useState(() => {
  try {
    const saved = localStorage.getItem("ktaliman-watchlist")
    return saved ? JSON.parse(saved) : []
  } catch { return [] }
})

useEffect(() => {
  try { localStorage.setItem("ktaliman-watchlist", JSON.stringify(watchlist)) }
  catch {}
}, [watchlist])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [economicCalendar, setEconomicCalendar] = useState([]);
  const [marketNews, setMarketNews] = useState([]);
  const [macroFeedLoading, setMacroFeedLoading] = useState(false);
  const { t, i18n } = useTranslation();
  const [appSettings, setAppSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("ktaliman-app-settings");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.error("Failed to read app settings from localStorage", err);
    }

    return {
      aiLanguage: "en",
      syncAiWithUi: true,
      timezone: "Europe/Copenhagen",
    };
  });

  const uiLanguage = i18n.language || "en";

  useEffect(() => {
    try {
      localStorage.setItem("ktaliman-app-settings", JSON.stringify(appSettings));
    } catch (err) {
      console.error("Failed to persist app settings", err);
    }
  }, [appSettings]);

  const handleUiLanguageChange = async (code) => {
    await i18n.changeLanguage(code);
    setAppSettings((prev) => ({
      ...prev,
      uiLanguage: code,
      aiLanguage: prev.syncAiWithUi ? code : prev.aiLanguage,
    }));
  };

  const handleAiLanguageChange = (code) => {
    setAppSettings((prev) => ({
      ...prev,
      aiLanguage: code,
    }));
  };

  const handleSyncAiWithUiChange = (value) => {
    setAppSettings((prev) => ({
      ...prev,
      syncAiWithUi: value,
      aiLanguage: value ? (i18n.language || "en") : prev.aiLanguage,
    }));
  };
 
  const handleTimezoneChange = (tz) => {
    setAppSettings((prev) => ({ ...prev, timezone: tz }));
  };

  async function fetchUpdateStatus() {
    try {
      const res = await fetch('/api/update/status')
      if (!res.ok) throw new Error('Failed to fetch update status')
      const json = await res.json()
      setUpdateState(json)
    } catch (err) {
      console.error(err)
    }
  }
 
  async function fetchSchedulerStatus() {
    try {
      const res = await fetch('/api/scheduler/status')
      if (!res.ok) return
      const json = await res.json()
      setSchedulerState(json)
    } catch (err) {
      // scheduler might not be available, fail silently
    }
  }

  async function runUpdate() {
    try {
      setUpdateBusy(true)
      const res = await fetch('/api/update/run', { method: 'POST' })
      if (!res.ok) { const errJson = await res.json().catch(() => ({})); throw new Error(errJson.detail || 'Failed to start worker') }
      await fetchUpdateStatus(); await loadAll()
    } catch (err) { alert(err.message || 'Failed to start worker') } finally { setUpdateBusy(false) }
  }

  async function loadAll() {
  try {
    setLoading(true)
    setError('')

   const [statusRes, assetsRes, workspaceRes, seasonalityRes, calendarRes, newsRes] = await Promise.all([
    fetch('/api/system/status'),
    fetch('/api/assets'),
    fetch('/api/workspace'),
    fetch('/api/seasonality'),
   ])

    if (!statusRes.ok || !assetsRes.ok || !workspaceRes.ok) {
      throw new Error('Failed to load API data')
}

const statusJson      = await statusRes.json()
const assetsJson      = await assetsRes.json()
const workspaceJson   = await workspaceRes.json()
const seasonalityJson = seasonalityRes.ok ? await seasonalityRes.json() : { items: [] }

setStatus(statusJson)
setAssets(assetsJson.items || [])
setSeasonalityData(seasonalityJson.items || [])
setWorkspaceData({
     macro_regime: workspaceJson.macro_regime || null,
     releases: workspaceJson.releases || [],
     calendar: workspaceJson.calendar || [],
     news: workspaceJson.news || [],
   })

    if ((assetsJson.items || []).length > 0) {
      setSelected((prev) => prev || assetsJson.items[0].symbol)
    }
  } catch (err) {
    setError(err.message || 'Unknown error')
  } finally {
    setLoading(false)
  }
}

  useEffect(() => { localStorage.setItem("ktaliman-app-settings", JSON.stringify(appSettings));}, [appSettings]);
  useEffect(() => { loadAll() }, [])
  useEffect(() => {
    if (active !== 'update') return
    fetchUpdateStatus()
    fetchSchedulerStatus()
    const timer = setInterval(() => { fetchUpdateStatus(); fetchSchedulerStatus() }, 5000)
    return () => clearInterval(timer)
  }, [active])  
  useEffect(() => {
  let ignore = false;

  async function loadMacroFeeds() {
    try {
      setMacroFeedLoading(true);

      const [calendarRes, newsRes] = await Promise.all([
        fetch("/api/calendar?limit=50"),
        fetch("/api/news?limit=200"),
	  ]);

      const calendarJson = await calendarRes.json();
      const newsJson = await newsRes.json();

      if (!ignore) {
        setEconomicCalendar(Array.isArray(calendarJson?.data) ? calendarJson.data : []);
        setMarketNews(Array.isArray(newsJson?.data) ? newsJson.data : []);
      }
    } catch (err) {
      if (!ignore) {
        setEconomicCalendar([]);
        setMarketNews([]);
      }
    } finally {
      if (!ignore) {
        setMacroFeedLoading(false);
      }
    }
  }

  loadMacroFeeds();
  const id = setInterval(loadMacroFeeds, 5 * 60 * 1000);

  return () => {
    ignore = true;
    clearInterval(id);
  };
}, []);

  const view = { 
  workspace: <Workspace workspaceData={workspaceData} setActive={setActive} setSelected={setSelected} assets={assets} aiLanguage={appSettings.aiLanguage} openGuide={openGuide} timezone={appSettings.timezone || "Europe/Copenhagen"}/>, 
  macro: <MacroView assets={assets} aiLanguage={appSettings.aiLanguage} openGuide={openGuide}/>, 
  summary: <Summary assets={assets} setActive={setActive} setSelected={setSelected} openGuide={openGuide}/>,
  watchlist: <WatchlistView assets={assets} setActive={setActive} setSelected={setSelected} aiLanguage={appSettings.aiLanguage} watchlist={watchlist} setWatchlist={setWatchlist} />,
  history: <HistoricalDataView assets={assets} />, 
	explorer: <Explorer assets={assets} selected={selected} setSelected={setSelected} aiLanguage={appSettings.aiLanguage} seasonalityData={seasonalityData} openGuide={openGuide}/>,
  correlation: <CorrelationView assets={assets} openGuide={openGuide} aiLanguage={appSettings.aiLanguage}/>,
  seasonality: <SeasonalityView assets={assets} seasonalityData={seasonalityData} openGuide={openGuide} aiLanguage={appSettings.aiLanguage} uiLanguage={appSettings.uiLanguage}/>,
	signals: <SignalsView signals={signals} assets={assets} setActive={setActive} setSelected={setSelected} aiLanguage={appSettings.aiLanguage} seasonalityData={seasonalityData} openGuide={openGuide}/>, 
	guide: <GuideView setActive={setActive} initialSection={guideSection} uiLanguage={uiLanguage} />,
  research: <ResearchNotesView aiLanguage={appSettings.aiLanguage} />,
  update: <UpdateDataView updateState={updateState} updateBusy={updateBusy} onRun={runUpdate} schedulerState={schedulerState} timezone={appSettings.timezone || "Europe/Copenhagen"} />, 
	settings: (
  <SettingsView
      uiLanguage={uiLanguage}
      aiLanguage={appSettings.aiLanguage}
      syncAiWithUi={appSettings.syncAiWithUi}
      timezone={appSettings.timezone || "Europe/Copenhagen"}
      onChangeUiLanguage={handleUiLanguageChange}
      onChangeAiLanguage={handleAiLanguageChange}
      onToggleSyncAiWithUi={handleSyncAiWithUiChange}
      onChangeTimezone={handleTimezoneChange}
    />
), }[active]

 return (
    <div className="flex min-h-screen text-slate-200" style={{ background: 'var(--bg-base)' }}>
      <Sidebar
        active={active}
        setActive={setActive}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
 
      {/* Main content — offset by sidebar width with smooth transition */}
      <main className={cls(
        'flex min-h-screen flex-1 flex-col transition-[margin-left] duration-300 ease-in-out',
        sidebarCollapsed ? 'ml-0' : 'ml-60'
      )}>
        <TopBar
          active={active}
          status={status}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          onAlertOpen={() => setAlertDrawerOpen(true)}
        />
        <AlertDrawer
          open={alertDrawerOpen}
          onClose={() => setAlertDrawerOpen(false)}
        />
        <div className="flex-1 p-4 md:p-5">
          {loading
            ? <Panel title={t('common.loading')}><div className="text-sm text-zinc-400">{t('ui.loadingDashboard')}</div></Panel>
            : error
            ? <Panel title={t("panels.errors")}><div className="text-sm text-rose-400">{error}</div></Panel>
            : <Suspense fallback={<div className="p-6 text-sm text-zinc-500">…</div>}>{view}</Suspense>}
        </div>
      </main>
    </div>
  )
}