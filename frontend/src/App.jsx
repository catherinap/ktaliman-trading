import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart2,
  Bell,
  Calendar,
  Download,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Database,
  Globe,
  Layout,
  LineChart,
  Settings,
  BookMarked,
  Star,
  Zap,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSettings from "./components/LanguageSettings";
import AIAnalysisPanel from "./components/AIAnalysisPanel";
import CustomSelect from "./components/CustomSelect"
import GuideButton from "./components/GuideButton"
import SentimentPanel from "./components/SentimentPanel"
import { GUIDE_SECTIONS } from "./data/guideSections"



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

function cls(...v) {
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

function translateFlowState(flowState, t) {
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

function flowColor(percentile) {
  if (percentile == null) return "text-slate-200";
  if (percentile >= 65) return "text-emerald-400";
  if (percentile <= 35) return "text-rose-400";
  return "text-zinc-300";
}
 
function MomentumBadge({ asset, size = "md" }) {
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

function formatPercentile(value) {
  if (value == null || Number.isNaN(value)) return 'n/a'
  return `${Number(value).toFixed(1)}`
}

function formatNumber(value) {
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

function formatEventDateTime(isoString, tz = "Europe/Copenhagen") {
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

function importanceTone(level) {
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

function actualColor(title, actual, forecast) {
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

function categoryTone(category) {
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

function signalLabel(percentile, t) {
  if (percentile == null) return t ? t('signalsText.noSignal') : 'No Signal'
  if (percentile >= 90) return t ? t('signalsText.strongLongBias') : 'Strong Long Bias'
  if (percentile >= 65) return t ? t('signalsText.longBias') : 'Long Bias'
  if (percentile <= 10) return t ? t('signalsText.strongShortBias') : 'Strong Short Bias'
  if (percentile <= 35) return t ? t('signalsText.shortBias') : 'Short Bias'
  return t ? t('signalsText.neutral') : 'Neutral'
}

function regimeLabel(percentile, t) {
  if (percentile == null) return t ? t('regimes.insufficientHistory') : 'Insufficient History'
  if (percentile >= 90) return t ? t('regimes.crowdedLong') : 'Crowded Long'
  if (percentile >= 65) return t ? t('regimes.trendBuild') : 'Trend Build'
  if (percentile <= 10) return t ? t('regimes.crowdedShort') : 'Crowded Short'
  if (percentile <= 35) return t ? t('regimes.shortBuild') : 'Short Build'
  return t ? t('regimes.range') : 'Range'
}

function normalizeSector(sector) {
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

function findAssetsExact(assets, aliases) {
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

function inferSignalAgeWeeks(asset) {
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

function stateTone(state) {
  if (state === 'active') return 'active-status'
  if (state === 'aging') return 'aging-status'
  if (state === 'stale') return 'text-zinc-400 border-zinc-700/40 bg-zinc-500/5'
  if (state === 'invalidated') return 'text-rose-300 border-rose-700/40 bg-rose-500/5'
  return 'text-sky-300 border-sky-700/40 bg-sky-500/5'
}

function stateLabel(state, t) {
  if (state === 'active') return t ? t('stateLabels.active') : 'Active'
  if (state === 'aging') return t ? t('stateLabels.aging') : 'Aging'
  if (state === 'stale') return t ? t('stateLabels.stale') : 'Stale'
  if (state === 'invalidated') return t ? t('stateLabels.invalidated') : 'Invalidated'
  return t ? t('stateLabels.candidate') : 'Candidate'
}

function directionTone(direction) {
  if (direction === 'long') return 'long-dir'
  if (direction === 'short') return 'short-dir'
  return 'text-zinc-400'
}

function directionLabel(direction, t) {
  if (direction === 'long') return t ? t('directionLabels.long') : 'Long'
  if (direction === 'short') return t ? t('directionLabels.short') : 'Short'
  return t ? t('directionLabels.neutral') : 'Neutral'
}

function entryQualityBucket(score, t) {
  if (score >= 85) return t ? t('signalsText.highConviction') : 'High Conviction'
  if (score >= 70) return t ? t('signalsText.strong') : 'Strong'
  if (score >= 55) return t ? t('signalsText.moderate') : 'Moderate'
  if (score >= 40) return t ? t('signalsText.developing') : 'Developing'
  return t ? t('signalsText.weak') : 'Weak'
}

function alertImpactTone(impact) {
  if (impact === 'high') return 'text-rose-300 border-rose-700/40 bg-rose-500/5'
  if (impact === 'medium') return 'text-amber-300 border-amber-700/40 bg-amber-500/5'
  return 'text-sky-300 border-sky-700/40 bg-sky-500/5'
}

function buildSignalAlerts(signal, t) {
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

function rankSignals(signals) {
  return [...signals].sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore
    if (b.entryQualityScore !== a.entryQualityScore) return b.entryQualityScore - a.entryQualityScore
    if (a.ageWeeks !== b.ageWeeks) return a.ageWeeks - b.ageWeeks
    return a.asset.localeCompare(b.asset)
  })
}

function buildSignalEngine(assets, seasonalityRows = [], macroComposite = null, t = null) {
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

const MACRO_SLEEVES = {
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

const CORRELATION_UNIVERSE = ['S&P 500','Nasdaq','Dow Jones','Russell 2000','Gold','Silver','Copper','Platinum','WTI Crude','Natural Gas','USD','EUR','JPY','GBP','CHF','Australian Dollar','Canadian Dollar','Mexican Peso','Corn','Soybeans','Wheat']
const SEASONAL_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function buildPositioningPairs(assets) {
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

function relationshipTone(distance) {
  if (distance <= 12) return 'text-emerald-400'
  if (distance <= 25) return 'text-emerald-300'
  if (distance >= 70) return 'text-rose-400'
  if (distance >= 50) return 'text-rose-300'
  return 'text-zinc-300'
}

function sectorBadgeTone(isSameSector) {
  return isSameSector ? 'text-amber-300 border-amber-700/40 bg-amber-500/5' : 'text-cyan-300 border-cyan-700/40 bg-cyan-500/5'
}

function dispersionLabel(value, t) {
  if (value == null) return t ? t('labels.unavailable') : 'Unavailable'
  if (value >= 60) return t ? t('correlationText.highlyDispersed') : 'Highly Dispersed'
  if (value >= 40) return t ? t('correlationText.dispersed') : 'Dispersed'
  if (value >= 25) return t ? t('correlationText.moderatelyClustered') : 'Moderately Clustered'
  return t ? t('correlationText.tightlyClustered') : 'Tightly Clustered'
}

function safeName(pair, side = 'left') {
  if (!pair) return 'n/a'
  return side === 'left' ? pair.left?.name || 'n/a' : pair.right?.name || 'n/a'
}

function buildCorrelationNarrative(
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

function averagePercentile(items) {
  const values = items.map((x) => x.funds_percentile_3y).filter((x) => x != null && !Number.isNaN(x))
  if (!values.length) return null
  return values.reduce((sum, x) => sum + x, 0) / values.length
}

function macroTone(score) {
  if (score == null) return 'text-zinc-400'
  if (score >= 65) return 'text-emerald-400'
  if (score <= 35) return 'text-rose-400'
  return 'text-amber-300'
}

function macroLabel(score, t) {
  if (score == null) return t ? t('labels.insufficientData') : 'Insufficient Data'
  if (score >= 80) return t ? t('macroText.strongRiskOn') : 'Strong Risk-On'
  if (score >= 65) return t ? t('macroText.riskOnBias') : 'Risk-On Bias'
  if (score <= 20) return t ? t('macroText.strongDefensive') : 'Strong Defensive'
  if (score <= 35) return t ? t('macroText.defensiveBias') : 'Defensive Bias'
  return t ? t('macroText.balanced') : 'Balanced'
}

function macroVerdict(growth, inflation, policy, t) {
  const values = [growth, inflation, policy].filter((x) => x != null && !Number.isNaN(x))
  if (!values.length) return t ? t('macroText.macroCompositeUnavailable') : 'Macro composite unavailable.'
  const avg = values.reduce((sum, x) => sum + x, 0) / values.length
  if (avg >= 70) return t ? t('macroText.broadCotSupportive') : 'Broad COT backdrop is supportive of cyclical and pro-risk positioning.'
  if (avg <= 30) return t ? t('macroText.broadCotDefensive') : 'Broad COT backdrop is defensive, with risk appetite under pressure.'
  return t ? t('macroText.currentCotBalanced') : 'Current COT backdrop is balanced across major sleeves.'
}

function macroPhase(score, t) {
  if (score == null) return t ? t('labels.unavailable') : 'Unavailable'
  if (score >= 80) return t ? t('macroText.extremeLong') : 'Extreme Long'
  if (score >= 65) return t ? t('macroText.constructive') : 'Constructive'
  if (score <= 20) return t ? t('macroText.extremeDefensive') : 'Extreme Defensive'
  if (score <= 35) return t ? t('macroText.defensive') : 'Defensive'
  return t ? t('macroText.balanced') : 'Balanced'
}

function macroDispersionLabel(value, t) {
  if (value == null) return t ? t('labels.unavailable') : 'Unavailable'
  if (value >= 35) return t ? t('macroText.highInternalDivergence') : 'High Internal Divergence'
  if (value >= 20) return t ? t('macroText.moderateInternalDivergence') : 'Moderate Internal Divergence'
  if (value >= 10) return t ? t('macroText.mildInternalDivergence') : 'Mild Internal Divergence'
  return t ? t('macroText.tightlyAligned') : 'Tightly Aligned'
}

function buildMacroNarrative({ growth, inflation, policy }, t) {
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

function seasonalCellTone(value) {
  if (value == null || Number.isNaN(value)) return 'bg-zinc-950 text-zinc-600'
  if (value >= 70) return 'bg-emerald-500/20 text-emerald-300'
  if (value >= 55) return 'bg-emerald-500/10 text-emerald-200'
  if (value <= 30) return 'bg-rose-500/20 text-rose-300'
  if (value <= 45) return 'bg-rose-500/10 text-rose-200'
  return 'bg-zinc-900 text-zinc-300'
}

function seasonalBiasLabel(value, t) {
  if (value == null || Number.isNaN(value)) return t ? t('labels.unavailable') : 'Unavailable'
  if (value >= 70) return t ? t('seasonalityText.strongTailwind') : 'Strong Tailwind'
  if (value >= 55) return t ? t('seasonalityText.tailwind') : 'Tailwind'
  if (value <= 30) return t ? t('seasonalityText.strongHeadwind') : 'Strong Headwind'
  if (value <= 45) return t ? t('seasonalityText.headwind') : 'Headwind'
  return t ? t('seasonalityText.mixed') : 'Mixed'
}

function seasonalBiasTone(value) {
  if (value == null || Number.isNaN(value)) return 'text-slate-200'
  if (value >= 55) return 'text-emerald-300'
  if (value <= 45) return 'text-rose-300'
  return 'text-amber-300'
}

function buildSeasonalityNarrative(rows, t) {
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

function MiniSparkline({ values = [], positive = true }) {
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

function PairDistanceBar({ distance = 0 }) {
  const width = Math.max(4, Math.min(100, distance))
  const tone = distance <= 25 ? 'bg-emerald-400' : distance >= 50 ? 'bg-rose-400' : 'bg-amber-300'
  return (
    <div className="h-2 overflow-hidden bg-zinc-900">
      <div className={cls('h-full', tone)} style={{ width: `${width}%` }} />
    </div>
  )
}

function PairAlignmentSpark({ left = 0, right = 0 }) {
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

function AssetPDFReport({ asset, profile, sparkProfile, seasonalityData }) {
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

function BiasBar({ value = 50 }) {
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

function GaugeArc({ value = 50 }) {
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

function Panel({ title, children, right }) {
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

function Metric({ label, value }) {
  return (
    <div className="p-2 border" style={{ background: 'var(--panel-color-light)', borderColor: 'var(--accent-border)', borderRadius: '8px' }}>
      <div className="text-[10px] uppercase tracking-[0.22em] text-slate-200">{label}</div>
      <div className="mt-1 text-zinc-100">{value}</div>
    </div>
  )
}

function ImpactBadge({ impact }) {
  const { t } = useTranslation();
  const tone = impact === 'High' ? 'text-rose-400' : impact === 'Med' ? 'text-blue-400' : 'text-zinc-400'
  return <span className={cls('text-xs uppercase tracking-[0.2em]', tone)}>{impact}</span>
}

// ─────────────────────────────────────────────────────────────────────────────

function Workspace({workspaceData, setActive, setSelected, assets = [], aiLanguage = "en", openGuide, timezone = "Europe/Copenhagen" }) {
  const { t } = useTranslation()
  const [calImpact, setCalImpact] = React.useState("all")
  const [calCountry, setCalCountry] = React.useState("all")
  const [newsCategory,  setNewsCategory]  = React.useState("all")
  const [newsSource, setNewsSource] = React.useState("all")
  const [newsDate,      setNewsDate]      = React.useState("all")
  const [newsImportance, setNewsImportance] = React.useState("all")
  const macro    = workspaceData?.macro_regime
  const calendar = workspaceData?.calendar || []
  const news     = workspaceData?.news     || []
  const [calDate, setCalDate] = React.useState("all")
  const availableDates = React.useMemo(() => {
  const today = new Date().toISOString().slice(0, 10)
  const dates = [...new Set(
    calendar.map(e => e.datetime?.slice(0, 10)).filter(Boolean)
  )].sort()
  return dates.map(d => ({
    value: d,
    label: d === today
      ? 'Today'
      : new Date(d + 'T12:00:00').toLocaleDateString('en-GB', {
          weekday: 'short', day: '2-digit', month: 'short'
        }),
  }))
  }, [calendar])

 const engine = useMemo(
  () => (assets.length ? buildSignalEngine(assets, [], null, t) : null),
  [assets, t]
  )
  const topSignals = useMemo(
    () => engine ? engine.signals.filter(s => s.state === "active").slice(0, 6) : [],
    [engine]
  )
  const alertFeed = useMemo(
    () => engine ? engine.alerts.slice(0, 5) : [],
    [engine]
  )

  const sleeveScores = useMemo(() => {
    const result = {}
    Object.entries(MACRO_SLEEVES).forEach(([key, config]) => {
      const members = findAssetsExact(assets, config.members)
      result[key] = averagePercentile(members)
    })
    return result
  }, [assets, t])

  const macroComposite = averagePercentile([
    { funds_percentile_3y: sleeveScores.growth },
    { funds_percentile_3y: sleeveScores.inflation },
    { funds_percentile_3y: sleeveScores.policy },
  ])

  const localDateKey = (iso) => {
    if (!iso) return ""
    const d = new Date(iso)
    if (isNaN(d)) return ""
    // YYYY-MM-DD у локальному поясі браузера
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

 const availableNewsDates = React.useMemo(() => {
    const today = localDateKey(new Date().toISOString())
    const dates = [...new Set(
      news.map(item => localDateKey(item.published_at)).filter(Boolean)
    )].sort().reverse()
    return dates.map(d => ({
      value: d,
      label: d === today
        ? t('ui.today')
        : new Date(d + 'T12:00:00').toLocaleDateString('en-GB', {
            weekday: 'short', day: '2-digit', month: 'short'
          }),
    }))
  }, [news, t])

  // ── Large circular signal card ─────────────────────────────────────────────
  const SignalCircleCard = ({ signal }) => {
    const score  = signal.priorityScore ?? 0
    const pct    = Math.max(0, Math.min(100, score)) / 100
    const isLong = signal.direction === "long"
    const isShort= signal.direction === "short"
    const color  = isLong ? "#4ade80" : isShort ? "#f87171" : "#94a3b8"
    const bgColor= isLong ? "rgba(74,222,128,0.2)" : isShort ? "rgba(248,113,113,0.2)" : "rgba(255,255,255,0.03)"
    const borderC= isLong ? "rgb(74, 222, 128)" : isShort ? "rgb(248, 113, 113)" : "rgba(255,255,255,0.07)"
    const size = 100, r = 38, cx = 50, cy = 50
    const circ = 2 * Math.PI * r
    const dash = circ * pct

    return (
      <button onClick={() => { setSelected(signal.symbol); setActive("explorer") }}
        style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          padding: "14px 10px 12px",
          background: bgColor, border: `1px solid ${borderC}`,
          borderRadius: "14px", cursor: "pointer",
          transition: "filter 0.15s, border-color 0.15s", width: "100%",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.15)"; e.currentTarget.style.borderColor = color + "40" }}
        onMouseLeave={(e) => { e.currentTarget.style.filter = "brightness(1)"; e.currentTarget.style.borderColor = borderC }}
      >
        <div style={{ position: "relative", width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="12" />
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
              strokeDasharray={`${dash} ${circ - dash}`}
              style={{ filter: `drop-shadow(0 0 5px ${color}60)`, transition: "stroke-dasharray 0.6s ease" }}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "16px", color, lineHeight: 1, marginBottom: "1px" }}>
              {isLong ? "↑" : isShort ? "↓" : "→"}
            </span>
            <span style={{ fontSize: "20px", fontWeight: "700", color, lineHeight: 1 }}>
              {Math.round(score)}
            </span>
          </div>
        </div>
        <div style={{ marginTop: "8px", textAlign: "center" }}>
          <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--dots-color)", lineHeight: 1.2 }}>
            {signal.asset}
          </div>
          <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.14em",
            color: "#f1f5f9", marginTop: "3px" }}>
            {signal.symbol} · {signal.sector}
          </div>
        </div>
        <div style={{ marginTop: "6px", textAlign: "center" }}>
          <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.1em",
            fontWeight: "600", color }}>
            {isLong ? "Long" : isShort ? "Short" : "Neutral"}
          </div>
          <div style={{ fontSize: "10px", color: "rgba(173, 193, 221, 0.88)", marginTop: "2px" }}>
            COT {formatPercentile(signal.percentile)}
          </div>
        </div>
      </button>
    )
  }

  const HeatmapCard = ({ a }) => {
  const pct = a.funds_percentile_3y
  const wow = a.funds_index_wow_change
  const dir = a.funds_index_direction
  const color  = pct >= 65 ? "#4ade80" : pct <= 35 ? "#f87171" : "#94a3b8"
  const wowClr = wow > 0 ? "#4ade80" : wow < 0 ? "#f87171" : "#64748b"
  const bg = pct >= 90 ? "rgba(248, 113, 113, 0.3)" : pct >= 65 ? "rgba(74,222,128,0.3)"
           : pct <= 10 ? "rgba(74,222,128,0.3)"  : pct <= 35 ? "rgba(248,113,113,0.3)"
           : "rgba(255,255,255,0.1)"
  const border = pct >= 90 ? "rgb(248, 113, 113)" : pct >= 65 ? "rgb(74, 222, 128)"
               : pct <= 10 ? "rgb(74, 222, 128)"  : pct <= 35 ? "rgb(248, 113, 113)"
               : "rgba(255, 255, 255, 0.2)"
  const arrow = dir === "rising" ? "↑" : dir === "falling" ? "↓" : "→"

  return (
    <button onClick={() => { setSelected(a.symbol); setActive("explorer") }}
      title={a.name}
      style={{
        display: "flex", flexDirection: "column", alignItems: "flex-start",
        padding: "4px 5px", borderRadius: "8px",
        background: bg, border: `1px solid ${border}`,
        cursor: "pointer", transition: "filter 0.15s", width: "100%",
      }}
      onMouseEnter={(e) => e.currentTarget.style.filter = "brightness(1.15)"}
      onMouseLeave={(e) => e.currentTarget.style.filter = "brightness(1)"}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-center", gap:"5px"}}>
        <span style={{ fontSize: "8px", color: "var(--dots-color)", textTransform: "uppercase",
          letterSpacing: "0.12em", lineHeight: 1 }}>{a.symbol}</span>
        {wow != null && (
          <span style={{ fontSize: "8px", color: wowClr, lineHeight: 1, fontWeight: 400 }}>
            {arrow}{Math.abs(wow).toFixed(1)}
          </span>
        )}
      </div>
      <span style={{ fontSize: "10px", fontWeight: "700", color, lineHeight: 1.1, marginTop: "4px" }}>
        {pct != null ? pct.toFixed(0) : "—"}
      </span>
      <span style={{ fontSize: "8px", color: "rgba(185, 206, 235, 0.8)", marginTop: "4px",
        textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {translateFlowState(a.flow_state, t) || t('flowStates.neutral')}
      </span>
    </button>
  )
}

  // ── News importance highlight ──────────────────────────────────────────────
  const newsItemStyle = (item) => {
  const imp = (item.importance || item.category || "").toLowerCase()
  if (imp === "high" || imp === "critical") return {
    borderLeft: "4px solid #f87171",
    background: "linear-gradient(90deg, rgba(248,113,113,0.15) 0%, transparent 60%)",
  }
  if (imp === "medium") return {
    borderLeft: "4px solid #fbbf24",
    background: "linear-gradient(90deg, rgba(251,191,36,0.10) 0%, transparent 60%)",
  }
  return {}
}

  return (
    <><div className="flex justify-end">
      <GuideButton sectionKey="workspace" openGuide={openGuide} />
    </div>
      <div className="space-y-4">

        {/* ══ ROW 1: 2 equal cols ══════════════════════════════════════════════ */}
        <div className="grid gap-3 mt-3" style={{ gridTemplateColumns: "1fr 0.8fr 1.1fr", alignItems: "stretch "}}>

          {/* LEFT col: Macro Context + Macro Regime stacked */}
          <MacroContextPanel aiLanguage={aiLanguage}/>

          <section className="flex flex-col title-border">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="h-1.5 w-1.5 rounded-full rounded-full-dot bg-blue-400"></div>
                <span className="text-[11px] uppercase tracking-[0.25em] text-slate-200">
                {t("panels.macroRegime")}
                </span>
              </div>
              
              <span className={cls("text-xs uppercase tracking-[0.22em]", macroTone(macroComposite))}>
                {macroLabel(macroComposite, t)}
              </span>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                 { key: "growth",    label: t('ui.sleeveGrowth'),    color: "text-emerald-400" },
                 { key: "inflation", label: t('ui.sleeveInflation'), color: "text-blue-400" },
                 { key: "grains",    label: t('ui.sleeveGrains'),    color: "text-lime-400" },
                 { key: "policy",    label: t('ui.sleevePolicy'),    color: "text-sky-400" },
                ].map(({ key, label, color }) => {
                  const score = sleeveScores[key];
                  return (
                    <div key={key} className="small-panel-color p-3" style={{ borderRadius: "10px" }}>
                      <div className={cls("text-[10px] uppercase tracking-[0.22em]", color)}>{label}</div>
                      <div className={cls("mt-1.5 text-xl font-semibold tabular-nums", macroTone(score))}>
                        {score != null ? score.toFixed(1) : "n/a"}
                      </div>
                      <div className="mt-1 text-[10px] text-zinc-600">{macroLabel(score, t)}</div>
                      <div className="mt-2 h-1 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <div className={cls("h-full rounded-full", macroTone(score).replace("text-", "bg-"))}
                          style={{ width: `${Math.max(2, score ?? 0)}%`, transition: "width 0.6s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 small-panel-color p-3" style={{ borderRadius: "10px" }}>
                <div className="flex items-center justify-between text-xs">
                  <span className="uppercase tracking-[0.2em]">{t('ui.composite')}</span>
                  <span className={cls("font-semibold tabular-nums", macroTone(macroComposite))}>
                    {macroComposite != null ? macroComposite.toFixed(1) : "n/a"}
                  </span>
                </div>
                <div className="mt-1.5 text-xs leading-5 text-slate-200">
                  {macroVerdict(sleeveScores.growth, sleeveScores.inflation, sleeveScores.policy, t)}
                </div>
              </div>
            </div>
          </section>
            
          <div className="flex gap-3 flex-col">
          {/* AI Briefing fills remaining space + expands with content */}
          <AIAnalysisPanel
            type="macro"
            data={{
              growth_score:    sleeveScores.growth,
              inflation_score: sleeveScores.inflation,
              grains_score:    sleeveScores.grains,
              policy_score:    sleeveScores.policy,
              composite:       macroComposite,
              growth_assets:    findAssetsExact(assets, MACRO_SLEEVES.growth.members),
              inflation_assets: findAssetsExact(assets, MACRO_SLEEVES.inflation.members),
              grains_assets:    findAssetsExact(assets, MACRO_SLEEVES.grains.members),
              policy_assets:    findAssetsExact(assets, MACRO_SLEEVES.policy.members),
              crypto_assets:    assets.filter(a => a.sector === 'CRYPTO'),
            }}
            aiLanguage={aiLanguage}
            title={t('ui.weekly_briefing')}
              fillHeight={true} />  
            
           <section className="title-border" style={{ flexShrink: 0 }}>
            <div className="px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full rounded-full-dot bg-blue-400"></div> 
                  <span className="text-[11px] uppercase tracking-[0.25em] text-slate-200">{t('ui.alertFeed')}</span>
              </div>
            </div>
            <div className="divide-y divide-zinc-900 overflow-y-auto" style={{ maxHeight: '210px' }}>
              {alertFeed.length === 0 ? (
                <div className="px-4 py-4 text-sm text-zinc-600">{t('ui.noAlertsRight')}</div>
              ) : alertFeed.map((alert) => (
                <div key={alert.id} className="px-4 py-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm text-zinc-200 leading-5">{alert.title}</div>
                    <span className={cls("shrink-0 border rounded-[3px] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.2em]",
                      alertImpactTone(alert.impact))}>
                      {alert.impact}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs leading-4 text-zinc-400">{alert.text}</div>
                </div>
              ))}
            </div>
          </section>   
          </div>        
        </div>

        {/* ══ ROW 2: 2 equal cols*/}
        <div className="grid gap-3" style={{ gridTemplateColumns: "0.9fr 1.1fr", alignItems: "start" }}>  
          {/* Top Active Signals — 3×2 circles */}
          <section className="min-h-full title-border">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full rounded-full-dot bg-blue-400"></div> 
                <span className="text-[11px] uppercase tracking-[0.25em] text-slate-200">
                {t('ui.topActiveSignals')}
                </span>
              </div>
              <button onClick={() => setActive("signals")}
                className="text-[11px] uppercase tracking-[0.22em] text-slate-200 hover:text-zinc-300 transition">
                All →
              </button>
            </div>
            <div className="p-4">
              {topSignals.length === 0 ? (
                <div className="py-8 text-center text-sm text-zinc-600">{t('ui.noActiveSignals')}</div>
              ) : (
                <div className="top-signals-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", maxHeight: "100%" }}>
                  {topSignals.map((signal) => <SignalCircleCard key={signal.id} signal={signal} />)}
                </div>
              )}
            </div>
          </section>
            
          {/* COT Heatmap compact */}
          <section className="title-border">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full rounded-full-dot bg-blue-400"></div> 
                  <span className="text-[11px] uppercase tracking-[0.25em] text-slate-200">
                    {t("panels.cotFlowHeatmap")}
                  </span>
                </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-zinc-200">0</span>
                <div style={{
                  width: "60px", height: "3px", borderRadius: "2px",
                  background: "linear-gradient(90deg, #f87171, rgba(148,163,184,0.3) 50%, #4ade80)"
                }} />
                <span className="text-[9px] text-zinc200">100</span>
              </div>
            </div>
            <div className="px-4 py-3 space-y-3">
              {Object.entries(
                assets.reduce((acc, a) => {
                  const s = a.sector || 'OTHER'
                  if (!acc[s]) acc[s] = []
                  acc[s].push(a)
                  return acc
                }, {})
              ).map(([sector, items]) => (
                <div key={sector}>
                  <div className="mb-1.5 text-[9px] uppercase tracking-[0.25em]"
                    style={{ color: "white" }}>{sector}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: "10px" }}>
                    {items.map((a) => <HeatmapCard key={a.symbol} a={a} />)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ══ ROW 3: 2 equal cols — Calendar | News */}
        <div className="grid gap-3" style={{ gridTemplateColumns: "0.9fr 1.1fr", alignItems: "start" }}>

          {/* Economic Calendar */}
          <section className="title-border">
            <div className="px-3 py-4 shrink-0">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full rounded-full-dot bg-blue-400"></div> 
                <span className="text-[11px] uppercase tracking-[0.35em] text-slate-200">
                  {t("panels.economicCalendar")}
                </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CustomSelect
                  value={calImpact}
                  onChange={setCalImpact}
                  minWidth="0"
                  placeholder={t('ui.allImpact')}
                  options={[
                    {value:"all",    label:t('ui.allImpact')},
                    {value:"high",   label:t('ui.high')},
                    {value:"medium", label:t('ui.medium')},
                    {value:"low",    label:t('ui.low')},
                  ]}
                />
                <CustomSelect
                  value={calCountry}
                  onChange={setCalCountry}
                  minWidth="0"
                  placeholder={t('ui.allCountries')}
                  options={[
                    {value:"all", label:t('ui.allCountries')},
                    {value:"US",  label:"US"},
                    {value:"EU",  label:"EU"},
                    {value:"GB",  label:"GB"},
                    {value:"JP",  label:"JP"},
                    {value:"CN",  label:"CN"},
                    {value:"CA",  label:"CA"},
                    {value:"AU",  label:"AU"},
                  ]}
                />
                <CustomSelect
                  value={calDate}
                  onChange={setCalDate}
                  minWidth="0"
                  placeholder={t('ui.allDates')}  
                  options={[
                    { value: "all", label: t('ui.allDates') },
                    ...availableDates.map(d => ({ value: d.value, label: d.label }))
                  ]}
                />
              </div>
            </div>
            <div className="divide-y divide-zinc-900 pr-2" style={{ maxHeight: '420px', overflowY: 'auto' }}>
              {calendar.length === 0 ? (
                <div className="px-4 py-4 text-sm text-slate-200">{t('ui.noCalendarEvents')}</div>
              ) : [...calendar]
                  .sort((a, b) => (a.datetime || "").localeCompare(b.datetime || ""))
                  .reverse()
                  .filter(e => calImpact === "all" || e.importance === calImpact)
                  .filter(e => calCountry === "all" || (e.country || "").toUpperCase() === calCountry.toUpperCase()).filter(e => calDate === "all" || (e.datetime || "").slice(0, 10) === calDate)
                  .map((event, idx) => {
                  const imp = (event.importance || "").toLowerCase();
                  const isHigh = imp === "high";
                  const isMed  = imp === "medium";
                  const hasData = event.actual != null || event.forecast != null || event.previous != null;
                  const actColor = actualColor(event.title, event.actual, event.forecast);
                  const isPast = event.datetime ? new Date(event.datetime) < new Date() : false;
                  return (
                    <div key={`${event.id}-${idx}`}
                      className={`px-4 py-2 ${isHigh ? 'cal-item-high' : isMed ? 'cal-item-medium' : ''}`}>
                      {/* Row 1: time + currency + title + importance */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="calendar-row flex items-center gap-2 min-w-0 flex-1">
                          {(() => {
                            const { time, date, day } = formatEventDateTime(event.datetime, timezone);
                            return (
                              <div className="flex flex-col items-end shrink-0 gap-0.5" style={{ minWidth: '72px' }}>
                                <span style={{ fontSize: '10px', color: isPast ? '#2d4060' : '#94a3b8', letterSpacing: '0.08em' }}>
                                  {day} {date}
                                </span>
                                <span className="text-[11px] tabular-nums font-mono" style={{ color: '#60a5fa' }}>
                                  {time}
                                </span>
                              </div>
                            );
                          })()}
                          <span className="text-blue-400 ml-8 mr-8" style={{
                            fontSize: '14px', fontWeight: 400,
                            letterSpacing: '0.12em', textTransform: 'uppercase', flexShrink: 0
                          }}>
                            {event.currency || event.country || ""}
                          </span>
                          <span className="text-sm leading-5" style={{color: isPast ? '#4a6080' : '#e2e8f0' }}>{event.title || "TBD"}</span>
                        </div>
                        <span style={{
                          fontSize: '12px', fontWeight: 700, letterSpacing: '0.18em',
                          textTransform: 'uppercase', flexShrink: 0, paddingTop: '2px',
                          color: isHigh ? '#f87171' : isMed ? '#fbbf24' : '#52525b'
                        }}>
                          {event.importance || ""}
                        </span>
                      </div>

                      {/* Row 2: actual / forecast / previous */}
                      {hasData && (
                        <div className="flex items-center gap-3 mt-1.5 pl-0 justify-center">
                          {event.actual != null && (
                            <div className="flex items-center gap-1">
                              <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#2563eb' }}>Act</span>
                              <span style={{ fontSize: '14px', fontWeight: 700, color: actColor, fontVariantNumeric: 'tabular-nums' }}>{event.actual}</span>
                            </div>
                          )}
                          {event.forecast != null && (
                            <div className="flex items-center gap-1">
                              <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#2563eb' }}>Fc</span>
                              <span style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0', fontVariantNumeric: 'tabular-nums' }}>{event.forecast}</span>
                            </div>
                          )}
                          {event.previous != null && (
                            <div className="flex items-center gap-1">
                              <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#2563eb' }}>Prv</span>
                              <span style={{ fontSize: '14px', fontWeight: 400, color: '#e2e8f0', fontVariantNumeric: 'tabular-nums' }}>{event.previous}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </section>

          {/* Market News */}
          <section className="title-border">
            <div className="px-3 py-4">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full rounded-full-dot bg-blue-400"></div> 
                    <span className="text-[11px] uppercase tracking-[0.35em] text-slate-200">
                      {t("panels.marketNews")}
                    </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <CustomSelect
                  value={newsCategory}
                  onChange={setNewsCategory}
                  minWidth="0"
                  placeholder={t('ui.allCategories')}
                  options={[
                    {value:"all",          label: t('ui.allCategories')},
                    {value:"POLICY",       label: t('ui.policy')},
                    {value:"MACRO",        label: t('ui.macro')},
                    {value:"MARKETS",      label: t('ui.markets')},
                    {value:"FOREX",        label: t('ui.forex')},
                    {value:"FINANCE",      label: t('ui.finance')},
                    {value:"COT",          label:"COT"},
                    {value:"CRYPTO",       label: t('ui.crypto')},
                  ]}
                />
                <CustomSelect
                  value={newsSource}
                  onChange={setNewsSource}
                  minWidth="0"
                  placeholder={t('ui.allSources')}
                  options={[
                    {value:"all",              label: t('ui.allSources')},
                    {value:"Federal Reserve",  label:"Federal Reserve"},
                    {value:"ECB",              label:"ECB"},
                    {value:"CFTC",             label:"CFTC"},
                    {value:"BLS",              label:"BLS"},
                    {value:"ForexLive",        label:"ForexLive"},
                    {value:"MarketWatch",      label:"MarketWatch"},
                    {value:"Investing.com",    label:"Investing.com"},
                    {value:"Yahoo Finance",    label:"Yahoo Finance"},
                  ]}
                />
                <CustomSelect
                  value={newsImportance}
                  onChange={setNewsImportance}
                  minWidth="0"
                  placeholder={t('ui.allPriority')}
                  options={[
                    {value:"all",    label: t('ui.allPriority')},
                    {value:"high",   label: t('ui.high')},
                    {value:"medium", label: t('ui.medium')},
                    {value:"low",    label: t('ui.low')},
                  ]}
                />
                <CustomSelect
                  value={newsDate}
                  onChange={setNewsDate}
                  minWidth="0"
                  placeholder={t('ui.newsDateAll')}
                  options={[
                    { value: "all", label: t('ui.newsDateAll') },
                    ...availableNewsDates.map(d => ({ value: d.value, label: d.label }))
                  ]}
                />
              </div>
            </div>
            <div className="divide-y divide-zinc-900" style={{ maxHeight: '420px', overflowY: 'auto' }}>
              {news.length === 0 ? (
                <div className="px-4 py-4 text-sm" style={{ color: '#60a5fa' }}>{t('ui.noMarketNews')}</div>
              ) : [...news]
                  .filter(item => newsCategory === "all" || item.category === newsCategory)
                  .filter(item => newsSource === "all" || item.source === newsSource)
                  .filter(item => newsImportance === "all" || item.importance === newsImportance).filter(item => newsDate === "all" || localDateKey(item.published_at) === newsDate)
                  .sort((a, b) => (b.published_at || "").localeCompare(a.published_at || ""))
                  .map((item) => {
                    const url = item.url && item.url !== "#" ? item.url : null
                    const isHigh = item.importance === "high"
                    const isMed  = item.importance === "medium"
                    const pubDate = item.published_at ? new Date(item.published_at) : null
                    const dateStr = pubDate ? pubDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : ""
                    const timeStr = pubDate ? pubDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : ""
                    return (
                      <a key={item.id} href={url || undefined} target="_blank" rel="noopener noreferrer"
                        className={`block px-3 py-2.5 transition ${isHigh ? 'news-item-high' : isMed ? 'news-item-medium' : ''}`}
                        style={{ textDecoration: "none" }}
                        onClick={e => { if (!url) e.preventDefault() }}
                      >
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={cls("text-[9px] uppercase tracking-[0.18em] shrink-0 font-semibold", categoryTone(item.category))}>
                              {item.category}
                            </span>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#93c5fd', letterSpacing: '0.04em', flexShrink: 0 }}>
                              {item.source}
                            </span>
                          </div>
                          {dateStr && (
                            <span style={{ fontSize: '10px', color: '#60a5fa', whiteSpace: 'nowrap', flexShrink: 0, opacity: 0.7 }}>
                              {dateStr} {timeStr}
                            </span>
                          )}
                        </div>
                        <div className="text-sm leading-5" style={{ color: '#e2e8f0', fontWeight: 400 }}>
                          {item.title || "Untitled"}
                        </div>
                        {item.summary && item.summary !== item.title && (
                          <div className="text-xs leading-4 mt-0.5" style={{ color: '#7191bd' }}>
                            {item.summary.slice(0, 120)}{item.summary.length > 120 ? '…' : ''}
                          </div>
                        )}
                      </a>
                    )
                  })}
            </div>
          </section>
        </div>
      </div></>
  )
}
function HistoricalDataView({ assets }) {
  const { t } = useTranslation()

  const [selectedSymbol, setSelectedSymbol] = useState(assets[0]?.symbol || "")
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState("")
  const [yearFilter, setYearFilter]   = useState("all")
  const [cotWindow, setCotWindow] = useState("3y") // 3y | 5y | 10y

  // ── Import recharts dynamically ────────────────────────────────────────────
  const [recharts, setRecharts] = useState(null)
  React.useEffect(() => {
    import("recharts").then(setRecharts).catch(() => setRecharts(null))
  }, [])

  // ── Fetch ──────────────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!selectedSymbol) return
    setLoading(true)
    setError("")
    setData(null)
    fetch(`/api/history/${selectedSymbol}?window=${cotWindow}`)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [selectedSymbol, cotWindow])

  // ── Sorted assets ──────────────────────────────────────────────────────────
  const sortedAssets = useMemo(() =>
    [...assets].sort((a, b) => {
      const sa = normalizeSector(a.sector || "")
      const sb = normalizeSector(b.sector || "")
      if (sa !== sb) return sa.localeCompare(sb)
      return (a.symbol || "").localeCompare(b.symbol || "")
    }), [assets])

  // ── Year options for table filter ──────────────────────────────────────────
  const availableYears = useMemo(() => {
    if (!data?.items) return []
    return [...new Set(data.items.map((r) => r.date.slice(0, 4)))].sort().reverse()
  }, [data])

  // ── Chart data — sorted ASC, filtered by range ────────────────────────────
  const chartData = useMemo(() => {
    if (!data?.items) return []
    const sorted = [...data.items].sort((a, b) => a.date.localeCompare(b.date))

    const now = new Date()
    const cutoff = new Date(now)
    if
      (cotWindow === "3y") cutoff.setFullYear(now.getFullYear() - 3)
    else if
      (cotWindow === "5y") cutoff.setFullYear(now.getFullYear() - 5)
    else if
      (cotWindow === "10y") cutoff.setFullYear(now.getFullYear() - 10)
    else
       cutoff.setFullYear(2000)

    return sorted
      .filter((r) => new Date(r.date) >= cutoff)
      .map((r) => ({
        date:        r.date,
        // Net positions (in contracts, thousands for readability)
        fundsNet:    r.funds_net   != null ? Math.round(r.funds_net   / 1000) : null,
        amNet:       r.am_net      != null ? Math.round(r.am_net      / 1000) : null,
        dealerNet:   r.dealer_net  != null ? Math.round(r.dealer_net  / 1000) : null,
        // COT Index 0-100
        fundsIdx:    r.funds_index  != null ? Number(r.funds_index.toFixed(1))  : null,
        amIdx:       r.am_index     != null ? Number(r.am_index.toFixed(1))     : null,
        dealerIdx:   r.dealer_index != null ? Number(r.dealer_index.toFixed(1)) : null,
        // Open Interest (thousands)
        oi:          r.open_interest != null ? Math.round(r.open_interest / 1000) : null,
      }))
  }, [data, cotWindow])

  // ── Table rows — sorted DESC, filtered by year ────────────────────────────
  const filteredRows = useMemo(() => {
    if (!data?.items) return []
    if (yearFilter === "all") return data.items
    return data.items.filter((r) => r.date.startsWith(yearFilter))
  }, [data, yearFilter])

  // ── Sharp move detection (for table highlighting) ─────────────────────────
  const sharpMap = useMemo(() => {
    if (!data?.items) return {}
    const all = data.items
    const map = {}
    all.forEach((row, i) => {
      const w8 = (col) => {
        const vals = all.slice(i, i + 8).map((r) => Math.abs(r[col] || 0)).filter(Boolean)
        return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0
      }
      const prev = all[i + 1] || null
      const avg  = w8("funds_net_change")
      const avgA = w8("am_net_change")
      const avgD = w8("dealer_net_change")
      map[row.date] = {
        sharpFunds:   avg  > 0 && Math.abs(row.funds_net_change  || 0) > avg  * 2 && Math.abs(row.funds_net_change  || 0) > 1000,
        sharpAm:      avgA > 0 && Math.abs(row.am_net_change     || 0) > avgA * 2 && Math.abs(row.am_net_change     || 0) > 1000,
        sharpDealer:  avgD > 0 && Math.abs(row.dealer_net_change || 0) > avgD * 2 && Math.abs(row.dealer_net_change || 0) > 1000,
        fundsFlip:    prev && row.funds_net  != null && prev.funds_net  != null && row.funds_net  !== 0 && prev.funds_net  !== 0 && Math.sign(row.funds_net)  !== Math.sign(prev.funds_net)  && Math.abs(row.funds_net)  > 500,
        amFlip:       prev && row.am_net     != null && prev.am_net     != null && row.am_net     !== 0 && prev.am_net     !== 0 && Math.sign(row.am_net)     !== Math.sign(prev.am_net)     && Math.abs(row.am_net)     > 500,
        dealerFlip:   prev && row.dealer_net != null && prev.dealer_net != null && row.dealer_net !== 0 && prev.dealer_net !== 0 && Math.sign(row.dealer_net) !== Math.sign(prev.dealer_net) && Math.abs(row.dealer_net) > 500,
        oiSpike:      row.open_interest > 0 && Math.abs(row.oi_change || 0) / row.open_interest * 100 > 3,
        divergence:   row.funds_net != null && row.am_net != null && row.funds_net !== 0 && row.am_net !== 0 && Math.sign(row.funds_net) !== Math.sign(row.am_net) && Math.abs(row.funds_net) > 1000 && Math.abs(row.am_net) > 1000,
      }
    })
    return map
  }, [data])

  // ── Format helpers ─────────────────────────────────────────────────────────
  const fmtDate = (iso) => {
    if (!iso) return "—"
    const [y, m, d] = iso.split("-")
    return `${d}-${m}-${y}`
  }
  const fmtN = (v) => {
    if (v == null) return <span className="text-zinc-700">—</span>
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v)
  }
  const fmtPct = (v) => {
    if (v == null) return <span className="text-zinc-700">—</span>
    return `${Number(v).toFixed(1)}%`
  }
  const fmtNet = (v) => {
    if (v == null) return <span className="text-zinc-700">—</span>
    const tone = Number(v) > 0 ? "text-emerald-400" : Number(v) < 0 ? "text-rose-400" : "text-slate-200"
    return <span className={cls("font-medium", tone)}>{new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v)}</span>
  }
  const fmtNetChange = (v, isSharp, isFlip) => {
    if (v == null) return <span className="text-zinc-700">—</span>
    const n = Number(v)
    let tone = n > 0 ? "text-emerald-400" : n < 0 ? "text-rose-400" : "text-slate-200"
    if (isFlip)  tone = "text-violet-300 font-bold"
    if (isSharp) tone = "text-amber-300 font-bold"
    return <span className={tone}>{n > 0 ? "+" : ""}{new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n)}</span>
  }
  const fmtOiChange = (v, isSpike) => {
    if (v == null) return <span className="text-zinc-700">—</span>
    const n = Number(v)
    let tone = n > 0 ? "text-emerald-400" : n < 0 ? "text-rose-400" : "text-slate-200"
    if (isSpike) tone = "text-sky-300 font-bold"
    return <span className={tone}>{n > 0 ? "+" : ""}{new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n)}</span>
  }
  const idxCell = (v) => {
    if (v == null) return { bg: "", el: <span className="text-zinc-700">n/a</span> }
    const n = Number(v)
    let bg = "", textCls = "text-zinc-400"
    if      (n >= 90) { bg = "bg-rose-900/50";    textCls = "text-rose-200 font-bold" }
    else if (n <= 10) { bg = "bg-emerald-900/50"; textCls = "text-emerald-200 font-bold" }
    else if (n >= 65) { bg = "bg-emerald-950/40"; textCls = "text-emerald-400" }
    else if (n <= 35) { bg = "bg-rose-950/40";    textCls = "text-rose-400" }
    return { bg, el: <span className={textCls}>{n.toFixed(1)}</span> }
  }
  const changeBg = (isSharp, isFlip) => isFlip ? "bg-violet-900/35" : isSharp ? "bg-amber-900/30" : ""
  const oiBg     = (isSpike) => isSpike ? "bg-sky-900/30" : ""

  const amLabel = data?.source_type === "DISAGG" ? "Producer / Merchant" : "Asset Manager"

  // ── Chart tooltip formatter ────────────────────────────────────────────────
  const ChartTooltip = ({ active, payload, label, unit = "" }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs">
        <div className="mb-1 text-slate-200">{label}</div>
        {payload.map((p) => p.value != null && (
          <div key={p.dataKey} className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            <span className="text-zinc-400">{p.name}:</span>
            <span className="text-zinc-100 font-medium">{p.value}{unit}</span>
          </div>
        ))}
      </div>
    )
  }

  // ── Render charts (only if recharts loaded + data available) ──────────────
  const renderCharts = () => {
    if (!recharts || !chartData.length) return null
    const {
      ResponsiveContainer, LineChart, BarChart, Bar,
      Line, XAxis, YAxis, CartesianGrid, Tooltip,
      ReferenceLine, Legend,
    } = recharts

    // Show every Nth label to avoid crowding
    const step = chartData.length > 100 ? 12 : chartData.length > 50 ? 6 : 3
    const xTickFormatter = (val, idx) => {
      if (idx % step !== 0) return ""
      const d = new Date(val)
      return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getFullYear()).slice(2)}`
    }

    return (
      <div className="space-y-4">

        {/* Range selector */}
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-[11px] uppercase tracking-[0.25em] text-slate-200">{t('ui.chartRange')}</span>
        </div>

        {/* ── Chart 1: Net Position ────────────────────────────────────── */}
        <div className="px-4 pb-2">
          <div className="mb-3 text-[11px] uppercase tracking-[0.22em] text-slate-200">
            {t('ui.netPositionThousands')}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis
                dataKey="date"
                tickFormatter={xTickFormatter}
                tick={{ fill: "#cdcdf0", fontSize: 10 }}
                axisLine={{ stroke: "#27272a" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#cdcdf0", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}k`}
                width={40}
              />
              <ReferenceLine y={0} stroke="#3f3f46" strokeDasharray="4 2" />
              <Tooltip content={<ChartTooltip unit="k" />} />
              <Legend
                wrapperStyle={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#71717a" }}
              />
              <Line type="monotone" dataKey="fundsNet"  name={t('ui.funds')}  stroke="#34d399" strokeWidth={1.5} dot={false} connectNulls />
              <Line type="monotone" dataKey="amNet"     name={amLabel === "Asset Manager" ? t('ui.am') : t('ui.producer')} stroke="#fbbf24" strokeWidth={1.5} dot={false} connectNulls />
              <Line type="monotone" dataKey="dealerNet" name={t('ui.dealer')} stroke="#38bdf8" strokeWidth={1.5} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* ── Chart 2: COT Index ───────────────────────────────────────── */}
        <div className="px-4 pb-2 pt-4">
          <div className="mb-3 text-[11px] uppercase tracking-[0.22em] text-slate-200">
            {t('ui.cotIndexMinMax')}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis
                dataKey="date"
                tickFormatter={xTickFormatter}
                tick={{ fill: "#cdcdf0", fontSize: 10 }}
                axisLine={{ stroke: "#27272a" }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "#cdcdf0", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              {/* Threshold lines */}
              <ReferenceLine y={90} stroke="#fb7185" strokeDasharray="4 2" strokeOpacity={0.6}
                label={{ value: "90", fill: "#fb7185", fontSize: 9, position: "right" }} />
              <ReferenceLine y={65} stroke="#34d399" strokeDasharray="3 3" strokeOpacity={0.4}
                label={{ value: "65", fill: "#34d399", fontSize: 9, position: "right" }} />
              <ReferenceLine y={35} stroke="#fb7185" strokeDasharray="3 3" strokeOpacity={0.4}
                label={{ value: "35", fill: "#fb7185", fontSize: 9, position: "right" }} />
              <ReferenceLine y={10} stroke="#34d399" strokeDasharray="4 2" strokeOpacity={0.6}
                label={{ value: "10", fill: "#34d399", fontSize: 9, position: "right" }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.15em", color: "#71717a" }}
              />
              <Line type="monotone" dataKey="fundsIdx" name={t('ui.fundsIndex')}  stroke="#34d399" strokeWidth={2} dot={false} connectNulls />
              <Line type="monotone" dataKey="amIdx"     name={amLabel === "Asset Manager" ? t('ui.amIndex') : t('ui.producerIndex')} stroke="#fbbf24" strokeWidth={1.5} dot={false} connectNulls />
              <Line type="monotone" dataKey="dealerIdx" name={t('ui.dealerIndex')} stroke="#38bdf8" strokeWidth={1.5} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* ── Chart 3: Open Interest ───────────────────────────────────── */}
        <div className="px-4 pb-4 pt-4">
          <div className="mb-3 text-[11px] uppercase tracking-[0.22em] text-slate-200">
            {t('ui.openInterestThousands')}
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={xTickFormatter}
                tick={{ fill: "#cdcdf0", fontSize: 10 }}
                axisLine={{ stroke: "#616165" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#cdcdf0", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}k`}
                width={40}
              />
              <Tooltip content={<ChartTooltip unit="k" />} />
              <Bar dataKey="oi" name={t('ui.openInterest')} fill="var(--accent-color)" radius={[1, 1, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  
  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* ── Controls ──────────────────────────────────────────────────────── */}
      <section className="title-border">
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3">
          <span className="text-[11px] uppercase tracking-[0.25em] text-slate-200">
            {t('ui.historicalCotData')}
          </span>
          {data && (
            <span className="text-[11px] uppercase tracking-[0.22em] text-zinc-300">
              {t('ui.weeksAssetSector', { weeks: data.total_rows, name: data.name, sector: normalizeSector(data.sector) })}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-4 p-4">
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-zinc-600">{t('ui.asset')}</div>
            <CustomSelect
                value={selectedSymbol}
                onChange={(v) => { setSelectedSymbol(v); setYearFilter("all") }}
                options={sortedAssets.map((a) => ({ value: a.symbol, label: `${a.name} (${a.symbol})` }))}
                minWidth="200px"
              />
          </div>

          <div>
            <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-zinc-600">{t('ui.yearTable')}</div>
            <CustomSelect
              value={yearFilter}
              onChange={setYearFilter}
              options={[{ value: "all", label: t('ui.allYears') }, ...availableYears.map((y) => ({ value: String(y), label: String(y) }))]}
              minWidth="120px"
            />
          </div>
          <div>
      <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-zinc-600">{t('ui.cotIndexWindow')}</div>
      <div className="flex gap-1">
        {[
          { value: "3y",  label: "3Y"  },
          { value: "5y",  label: "5Y"  },
          { value: "10y", label: "10Y" },
        ].map((opt) => (
          <button
            key={opt.value}
            onClick={() => setCotWindow(opt.value)}
            style={{
              padding: "7px 14px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              border: cotWindow === opt.value
                ? "1px solid rgba(59,130,246,0.5)"
                : "1px solid rgba(255,255,255,0.1)",
              background: cotWindow === opt.value
                ? "rgba(59,130,246,0.2)"
                : "rgba(10,16,40,0.6)",
              color: cotWindow === opt.value ? "#93c5fd" : "rgba(148,163,184,0.7)",
              transition: "all 0.15s",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>

          <div className="ml-auto text-[11px] uppercase tracking-[0.2em] text-zinc-300">
            {t('ui.rowsCount', { n: filteredRows.length })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 border-t border-zinc-900 px-4 py-2.5 text-[10px] uppercase tracking-[0.16em] text-zinc-600">
          <span><span className="inline-block w-2.5 h-2.5 mr-1 bg-rose-900/60" />{t('ui.indexExtremeLong')}</span>
          <span><span className="inline-block w-2.5 h-2.5 mr-1 bg-emerald-900/60" />{t('ui.indexExtremeShort')}</span>
          <span><span className="inline-block w-2.5 h-2.5 mr-1 bg-amber-900/40" />{t('ui.sharpNetChange')}</span>
          <span><span className="inline-block w-2.5 h-2.5 mr-1 bg-violet-900/50" />{t('ui.netFlip')}</span>
          <span><span className="inline-block w-2.5 h-2.5 mr-1 bg-sky-900/40" />{t('ui.oiSpike')}</span>
          <span className="text-sky-800">{t('ui.rowTintDivergence')}</span>
        </div>
      </section>

      {loading && (
        <section className="p-6 title-border">
          <div className="space-y-2">
            {[100, 88, 75, 60].map((w, i) => (
              <div key={i} className="h-3 animate-pulse rounded bg-zinc-800" style={{ width: `${w}%` }} />
            ))}
          </div>
        </section>
      )}

      {error && (
        <section className="border border-rose-900/50 bg-rose-950/20 p-4 text-sm text-rose-400">
          Error: {error}
        </section>
      )}

      {/* ── Charts ────────────────────────────────────────────────────────── */}
      {!loading && !error && chartData.length > 0 && (
        <section className="title-border">
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-[12px] uppercase tracking-[0.25em] text-zinc-200">
              {t('ui.chartsOf', { name: data?.name })}
            </span>
            <span className="text-[11px] uppercase tracking-[0.2em] text-zinc-300">
              {t('ui.weeksShown', { n: chartData.length })}
            </span>
          </div>
          {recharts ? renderCharts() : (
            <div className="p-6 text-sm text-zinc-600">
              Loading charts... If this persists, run <code className="text-zinc-400">npm install recharts</code> in the frontend folder.
            </div>
          )}
        </section>
      )}

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      {!loading && !error && filteredRows.length > 0 && (
        <section className="title-border">
          <div className="px-4 py-3">
            <span className="text-[11px] uppercase tracking-[0.25em] text-slate-200">
              {t('ui.dataTable')}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[1600px] w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10 ">
                <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-[0.22em]">
                  <th rowSpan={2} className="sticky left-0 z-20  px-3 py-3 text-left font-medium text-slate-200 min-w-[105px]">
                    {t('ui.date')}
                  </th>
                  <th colSpan={2} className="px-3 py-2 text-center font-medium text-slate-200 border-l border-zinc-800">{t('ui.openInterest')}</th>
                  <th colSpan={1} className="px-3 py-2 text-center font-medium text-violet-700 border-l border-zinc-800">{t('ui.momentum')}</th>
                  <th colSpan={7} className="px-3 py-2 text-center font-medium text-emerald-700 border-l border-zinc-800">{t('ui.fundsNonComm')}</th>
                  <th colSpan={7} className="px-3 py-2 text-center font-medium text-amber-700 border-l border-zinc-800">{t('ui.assetManager')}</th>
                  <th colSpan={7} className="px-3 py-2 text-center font-medium text-sky-700 border-l border-zinc-800">{t('ui.dealerBanks')}</th>
                </tr>
                <tr className="border-b border-zinc-900 text-[10px] uppercase tracking-[0.18em] text-zinc-600">
                  <th className="px-3 py-2 text-right border-l border-zinc-800">{t('ui.oi')}</th>
                  <th className="px-3 py-2 text-right">{t('ui.chg')}</th>
                  <th className="px-3 py-2 text-left border-l border-zinc-800 text-violet-900">{t('ui.direction')}</th>
                  {["Long","Short","% L","% S","Net","Net Chg","Index"].map((h) => (
                    <th key={`f-${h}`} className={cls("px-3 py-2 text-right font-medium text-emerald-900", h==="Long" && "border-l border-zinc-800")}>{h}</th>
                  ))}
                  {["Long","Short","% L","% S","Net","Net Chg","Index"].map((h) => (
                    <th key={`a-${h}`} className={cls("px-3 py-2 text-right font-medium text-amber-900", h==="Long" && "border-l border-zinc-800")}>{h}</th>
                  ))}
                  {["Long","Short","% L","% S","Net","Net Chg","Index"].map((h) => (
                    <th key={`d-${h}`} className={cls("px-3 py-2 text-right font-medium text-sky-900", h==="Long" && "border-l border-zinc-800")}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, idx) => {
                  const sig  = sharpMap[row.date] || {}
                  const fIdx = idxCell(row.funds_index)
                  const aIdx = idxCell(row.am_index)
                  const dIdx = idxCell(row.dealer_index)
                  return (
                    <tr key={row.date} className={cls(
                      "border-b border-zinc-900/60 hover:brightness-110 transition",
                      sig.divergence ? "bg-sky-950/15" : idx === 0 ? "bg-zinc-900/20" : ""
                    )}>
                      <td className={cls("sticky left-0 z-10 bg-inherit px-3 py-2 tabular-nums whitespace-nowrap font-mono text-xs",
                        idx === 0 ? "text-amber-300 font-semibold" : "text-zinc-400"
                      )}>{fmtDate(row.date)}</td>
                      {/* OI */}
                      <td className="px-3 py-2 text-right tabular-nums text-zinc-300 border-l border-zinc-900">
                        {fmtN(row.open_interest)}
                      </td>
                      <td className={cls("px-3 py-2 text-right tabular-nums", oiBg(sig.oiSpike))}>
                        {fmtOiChange(row.oi_change, sig.oiSpike)}
                      </td>

                      {/* Momentum */}
                      <td className="px-3 py-2 border-l border-zinc-900">
                        <MomentumBadge asset={{
                          funds_index_direction:    row.funds_index_direction,
                          funds_index_momentum:     row.funds_index_momentum,
                          funds_index_wow_change:   row.funds_index_wow_change,
                          funds_index_3w_avg:       row.funds_index_3w_avg,
                          funds_index_8w_avg:       row.funds_index_8w_avg,
                          funds_index_acceleration: row.funds_index_acceleration,
                        }} size="sm" />
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-zinc-300 border-l border-zinc-900">{fmtN(row.funds_long)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-zinc-300">{fmtN(row.funds_short)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-200">{fmtPct(row.funds_pct_long)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-200">{fmtPct(row.funds_pct_short)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmtNet(row.funds_net)}</td>
                      <td className={cls("px-3 py-2 text-right tabular-nums", changeBg(sig.sharpFunds, sig.fundsFlip))}>{fmtNetChange(row.funds_net_change, sig.sharpFunds, sig.fundsFlip)}</td>
                      <td className={cls("px-3 py-2 text-right tabular-nums", fIdx.bg)}>{fIdx.el}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-zinc-300 border-l border-zinc-900">{fmtN(row.am_long)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-zinc-300">{fmtN(row.am_short)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-200">{fmtPct(row.am_pct_long)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-200">{fmtPct(row.am_pct_short)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmtNet(row.am_net)}</td>
                      <td className={cls("px-3 py-2 text-right tabular-nums", changeBg(sig.sharpAm, sig.amFlip))}>{fmtNetChange(row.am_net_change, sig.sharpAm, sig.amFlip)}</td>
                      <td className={cls("px-3 py-2 text-right tabular-nums", aIdx.bg)}>{aIdx.el}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-zinc-300 border-l border-zinc-900">{fmtN(row.dealer_long)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-zinc-300">{fmtN(row.dealer_short)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-200">{fmtPct(row.dealer_pct_long)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-slate-200">{fmtPct(row.dealer_pct_short)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmtNet(row.dealer_net)}</td>
                      <td className={cls("px-3 py-2 text-right tabular-nums", changeBg(sig.sharpDealer, sig.dealerFlip))}>{fmtNetChange(row.dealer_net_change, sig.sharpDealer, sig.dealerFlip)}</td>
                      <td className={cls("px-3 py-2 text-right tabular-nums", dIdx.bg)}>{dIdx.el}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {!loading && !error && filteredRows.length === 0 && selectedSymbol && (
        <section className="border border-zinc-900  p-6 text-sm text-zinc-600">
          No historical data available for {selectedSymbol}.
        </section>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ДВОМОВНИЙ MacroContextPanel
// Показує VIX, Yield Curve, DXY як macro backdrop для COT аналізу
// Будує interpretation/regime з ключів через t(), ігноруючи backend-текст.
// ════════════════════════════════════════════════════════════════════════════

function MacroContextPanel({ aiLanguage = "en" }) {
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

function MacroView({ assets, aiLanguage, openGuide }) {
  const { t } = useTranslation();
  const tSleeve = (key) =>
  key === 'growth'    ? t('ui.sleeveGrowth') :
  key === 'inflation' ? t('ui.sleeveInflation') :
  key === 'grains'    ? t('ui.sleeveGrains') :
  key === 'policy'    ? t('ui.sleevePolicy') : key

  const sleeveData = useMemo(() => Object.entries(MACRO_SLEEVES).map(([key, config]) => {
    const members = findAssetsExact(assets, config.members)
    const score = averagePercentile(members)
    return {
      key,
      title: config.title,
      members,
      expectedCount: config.members.length,
      memberCount: members.length,
      score,
      description: config.description,
      text: score == null
        ? `No ${config.title.toLowerCase()} sleeve data available.`
        : `${config.title} positioning is ${macroLabel(score, t).toLowerCase()} across ${members.length}/${config.members.length} sleeve members. Composite percentile: ${formatPercentile(score)}.`
    }
  }), [assets, t])

  const growth    = sleeveData.find((x) => x.key === 'growth')
  const inflation = sleeveData.find((x) => x.key === 'inflation')
  const policy    = sleeveData.find((x) => x.key === 'policy')
  const growthScore    = growth?.score ?? null
  const inflationScore = inflation?.score ?? null
  const policyScore    = policy?.score ?? null

  const macroNarrative = useMemo(
    () => buildMacroNarrative({ growth: growthScore, inflation: inflationScore, policy: policyScore }, t),
    [growthScore, inflationScore, policyScore, t]
  )

const macroComposite = averagePercentile([
  { funds_percentile_3y: growthScore },
  { funds_percentile_3y: inflationScore },
  { funds_percentile_3y: sleeveData.find(x => x.key === 'grains')?.score ?? null },
  { funds_percentile_3y: policyScore },
])

  // Sleeve label color
  const sleeveColor = (key) => {
    if (key === 'growth')    return 'text-emerald-400'
    if (key === 'inflation') return 'text-amber-400'
    if (key === 'grains')    return 'text-lime-400'
    return 'text-sky-400'
  }

  return (
    <div className="grid gap-3 xl:grid-cols-[1.3fr_0.7fr]">
      {/* ── LEFT COLUMN ── */}
      <div className="space-y-4">

        {/* 1. MACRO COMPOSITE — sleeve overview + verdict */}
        
        <Panel title={t("panels.macroComposite")} right={<GuideButton sectionKey="macro" openGuide={openGuide} />}>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 mb-1.5">
            {sleeveData.map((sleeve) => (
              <div key={sleeve.key} className="small-panel-color p-3 small-panel-color ">
                <div className={cls('text-[10px] uppercase tracking-[0.24em] mb-1', sleeveColor(sleeve.key))}>
                  {tSleeve(sleeve.key)}
                </div>
                <div className={cls('text-2xl font-semibold', macroTone(sleeve.score))}>
                  {formatPercentile(sleeve.score)}
                </div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-300 mt-1">
                  {macroLabel(sleeve.score, t)}
                </div>
                <div className="text-[10px] text-zinc-500 mt-1">
                  {sleeve.memberCount}/{sleeve.expectedCount} assets
                </div>
              </div>
            ))}
          </div>
          <div className="text-sm leading-7 text-blue-300 pt-3">
            <span className="text-rose-400 tracking-[0.18em] text-[14px] mr-2">{t('ui.verdict')}</span>
            {macroVerdict(growthScore, inflationScore, policyScore, t)}
          </div>
        </Panel>

        {/* 3. SLEEVE DETAIL — the most important breakdown */}
        <Panel title={t("panels.sleeveDetail")}>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {sleeveData.map((sleeve) => (
              <div key={sleeve.key} className="small-panel-color p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className={cls('text-[10px] uppercase tracking-[0.2em]', sleeveColor(sleeve.key))}>
                    {tSleeve(sleeve.key)}
                  </div>
                  <div className={cls('text-sm font-semibold', macroTone(sleeve.score))}>
                    {formatPercentile(sleeve.score)}
                  </div>
                </div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-300 mb-3">
                  {macroLabel(sleeve.score, t)} · {sleeve.memberCount}/{sleeve.expectedCount}
                </div>
                <div className="space-y-2">
                  {sleeve.members.length ? sleeve.members.map((a) => (
                    <div key={a.symbol} className="flex items-center justify-between pt-2 first:border-t-0 first:pt-0">
                      <div>
                        <div className="text-xs text-zinc-100">{a.name}</div>
                        <div className="text-[10px] uppercase tracking-[0.15em] text-slate-400 mt-0.5">
                          {translateFlowState(a.flow_state, t) || t('flowStates.neutral')}
                        </div>
                      </div>
                      <div className={cls('text-sm font-medium', flowColor(a.funds_percentile_3y))}>
                        {formatPercentile(a.funds_percentile_3y)}
                      </div>
                    </div>
                  )) : <div className="text-xs text-slate-400">{t('ui.noDataAvailable')}</div>}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* 2. MACRO CONTEXT — VIX / Yield Curve / DXY / S&P 500 */}
        <SentimentPanel />
        <MacroContextPanel aiLanguage={aiLanguage} />
      </div>

      {/* ── RIGHT COLUMN ── */}
      <div className="space-y-4">

        {/* 1. AI ANALYSIS */}
        <AIAnalysisPanel
          type="macro"
          data={{
            growth_score:     growthScore,
            inflation_score:  inflationScore,
            grains_score: sleeveData.find((x) => x.key === "grains")?.score ?? null,
            policy_score: policyScore,
            composite:        macroComposite,
            growth_assets:    sleeveData.find((x) => x.key === "growth")?.members || [],
            inflation_assets: findAssetsExact(assets, MACRO_SLEEVES.inflation.members),
            grains_assets:    sleeveData.find((x) => x.key === "grains")?.members || [],
            policy_assets:    findAssetsExact(assets, MACRO_SLEEVES.policy.members),
            crypto_assets:    assets.filter(a => a.sector === 'CRYPTO'),
          }}
          aiLanguage={aiLanguage}
          title={t('ui.aiMacroAnalysis')}
        />

        {/* 2. COMPOSITE SCORES + DISPERSION + PHASE */}
        <div className="grid grid-cols-2 gap-3">
            <div className="small-panel-color p-3">
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-300 mb-1">{t('ui.sleeveDispersion')}</div>
              <div className="text-xl font-semibold text-zinc-100">{formatPercentile(macroNarrative.dispersion)}</div>
              <div className="text-[10px] text-zinc-500 mt-1">{macroDispersionLabel(macroNarrative.dispersion, t)}</div>
            </div>
            <div className="small-panel-color p-3">
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-300 mb-1">{t('panels.macroPhase')}</div>
              <div className="text-xl font-semibold text-zinc-100">{macroPhase(macroComposite, t)}</div>
              <div className="text-[10px] text-zinc-500 mt-1">{t('ui.compositeRegimeState')}</div>
            </div>
          </div>
          {/* 3. NARRATIVE SUMMARY */}
        <div className="default-bg p-4">
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200 mb-3">{t('panels.narrativeSummary')}</div>
          <div className="text-sm leading-7 text-zinc-200">{macroNarrative.summary}</div>
        </div>

        {/* 4. WHAT TO WATCH */}
        <div className="default-bg p-4">
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200 mb-3">{t('panels.whatToWatch')}</div>
          <div className="text-sm leading-7 text-zinc-200">{macroNarrative.whatToWatch}</div>
        </div>
        {/* 4. INTERPRETATION + TRADING RELEVANCE */}
        <div className="p-4 default-bg">
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200 mb-3">{t('panels.interpretation')}</div>
            <div className="text-sm leading-7 text-zinc-200">{macroNarrative.interpretation}</div>
          </div>
        <div className="p-4 default-bg">
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200 mb-3">{t('panels.tradingRelevance')}</div>
            <div className="text-sm leading-7 text-zinc-200">{macroNarrative.tradingRelevance}</div>
          </div>
      </div>
    </div>
  )
}

function CorrelationView({ assets, openGuide, aiLanguage = "en" }) {
  const { t } = useTranslation();
  const universeAssets = useMemo(() => findAssetsExact(assets, CORRELATION_UNIVERSE), [assets])
  const pairs = useMemo(() => buildPositioningPairs(universeAssets), [universeAssets])
  const alignedPairs = useMemo(() => [...pairs].sort((a, b) => a.distance - b.distance).slice(0, 6), [pairs])
  const opposedPairs = useMemo(() => [...pairs].sort((a, b) => b.distance - a.distance).slice(0, 6), [pairs])
  const avgAlignment  = useMemo(() => !pairs.length ? null : pairs.reduce((s, p) => s + p.alignment, 0) / pairs.length, [pairs])
  const avgDistance   = useMemo(() => !pairs.length ? null : pairs.reduce((s, p) => s + p.distance,  0) / pairs.length, [pairs])
  const sameSectorPairs  = useMemo(() => pairs.filter((p) => p.sameSector).length,  [pairs])
  const crossSectorPairs = useMemo(() => pairs.filter((p) => !p.sameSector).length, [pairs])

  const narrative = useMemo(
    () => buildCorrelationNarrative({ avgDistance, avgAlignment, alignedPairs, opposedPairs, sameSectorPairs, crossSectorPairs }, t),
    [avgDistance, avgAlignment, alignedPairs, opposedPairs, sameSectorPairs, crossSectorPairs, t]
  )

  const alignmentLabel = avgDistance == null ? '—'
    : avgDistance >= 60 ? t('ui.alignFragmented')
    : avgDistance >= 40 ? t('ui.alignMixed')
    : avgDistance >= 20 ? t('ui.alignAligned')
    : t('ui.alignHighlySync')

  const alignmentColor = avgDistance == null ? '#94a3b8'
    : avgDistance >= 60 ? '#f87171'
    : avgDistance >= 40 ? '#fbbf24'
    : '#4ade80'

  // ── Heatmap cell color ────────────────────────────────────────────────────
  const cellColor = (distance) => {
    if (distance == null) return { bg: 'transparent', text: '#52525b' }
    if (distance <= 12)  return { bg: 'rgba(74,222,128,0.25)',  text: '#4ade80' }
    if (distance <= 25)  return { bg: 'rgba(74,222,128,0.10)',  text: '#86efac' }
    if (distance <= 40)  return { bg: 'rgba(148,163,184,0.06)', text: '#64748b' }
    if (distance <= 60)  return { bg: 'rgba(251,191,36,0.10)',  text: '#fbbf24' }
    if (distance <= 75)  return { bg: 'rgba(248,113,113,0.15)', text: '#f87171' }
    return                      { bg: 'rgba(248,113,113,0.25)', text: '#ef4444' }
  }

  // Compact names for heatmap axis labels
  const shortName = (name) => {
    const map = {
      'Gold': 'XAU', 'Silver': 'XAG', 'Copper': 'HG', 'Platinum': 'PL',
      'WTI Crude': 'WTI', 'Natural Gas': 'GAS',
      'S&P 500': 'SPX', 'Nasdaq': 'NDX', 'Dow Jones': 'DJI', 'Russell 2000': 'RTY',
      'Euro': 'EUR', 'Japanese Yen': 'JPY', 'British Pound': 'GBP',
      'Swiss Franc': 'CHF', 'Australian Dollar': 'AUD', 'Canadian Dollar': 'CAD',
      'Mexican Peso': 'MXN', 'US Dollar Index': 'DXY',
      'Corn': 'ZC', 'Soybeans': 'ZS', 'Wheat': 'ZW',
    }
    return map[name] || name.split(' ')[0].slice(0, 4).toUpperCase()
  }

  // Build distance lookup map: "NameA|NameB" → distance
  const distanceMap = useMemo(() => {
    const m = {}
    for (const p of pairs) {
      m[`${p.left.name}|${p.right.name}`] = p.distance
      m[`${p.right.name}|${p.left.name}`] = p.distance
    }
    return m
  }, [pairs])
    const [hoveredRow, setHoveredRow] = React.useState(null)
    const [hoveredCol, setHoveredCol] = React.useState(null)

  return (
    <div className="space-y-4">

      {/* ── HEADER ── */}
      <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title={t("panels.correlation")} right={<GuideButton sectionKey="correlation" openGuide={openGuide} />}>
        <div className="grid gap-3 md:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-3 md:grid-cols-2">
            <Metric label={t('ui.universe')}      value={universeAssets.length} />
            <Metric label={t('ui.pairs')}         value={pairs.length} />
            <Metric label={t('ui.avgAlignment')} value={formatPercentile(avgAlignment)} />
            <Metric label={t('ui.avgDistance')}  value={formatPercentile(avgDistance)} />
          </div>
          <div className="flex flex-col gap-7 small-panel-color py-4 px-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] mb-1">{t('ui.marketAlignment')}</div>
              <div className="text-[20px] font-semibold" style={{ color: alignmentColor }}>{alignmentLabel}</div>
              <div className="text-[10px] text-zinc-400 mt-0.5">{t('ui.sameCrossSector', { same: sameSectorPairs, cross: crossSectorPairs })}</div>
            </div>
            <div className="flex-1">
              <div className="h-3 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div style={{
                  width: `${Math.max(4, 100 - (avgDistance ?? 50))}%`,
                  height: '100%', borderRadius: '9999px',
                  background: alignmentColor,
                  boxShadow: `0 0 8px ${alignmentColor}80`,
                }} />
              </div>
              <div className="flex justify-between text-[9px] uppercase tracking-[0.12em] text-zinc-200 mt-1.5">
                <span>{t('ui.fragmented')}</span><span>{t('ui.synchronized')}</span>
              </div>
            </div>
          </div>
        </div>
        </Panel>

        <AIAnalysisPanel
          type="correlation"
          data={{
            avg_alignment:      avgAlignment,
            avg_distance:       avgDistance,
            same_sector_pairs:  sameSectorPairs,
            cross_sector_pairs: crossSectorPairs,
            aligned_pairs: alignedPairs.slice(0, 5).map(p => ({
              left: p.left?.name, right: p.right?.name,
              leftPct: p.leftPct, rightPct: p.rightPct,
              distance: p.distance, relationship: p.relationship
            })),
            opposed_pairs: opposedPairs.slice(0, 5).map(p => ({
              left: p.left?.name, right: p.right?.name,
              leftPct: p.leftPct, rightPct: p.rightPct,
              distance: p.distance, relationship: p.relationship
            })),
          }}
          aiLanguage={aiLanguage}
          title={t('ui.aiCrossAsset')}
        />
      </div>


      {/* ── MAIN GRID ── */}
      <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">

        {/* ── LEFT ── */}
        <div className="space-y-4">

          {/* CORRELATION HEATMAP */}
          <Panel title={t('ui.correlationMatrix')}>
            <div className="overflow-x-auto">
              <table style={{ borderCollapse: 'collapse', fontSize: '11px', tableLayout: 'fixed', width: '100%' }}>
                <thead>
                  <tr>
                    {/* Empty corner — no minWidth */}
                    <th style={{ padding: '2px 4px 4px 0', width: '38px', minWidth: '38px' }} />
                    {universeAssets.map(a => (
                      <th key={a.symbol} style={{
                        padding: '2px 2px 6px', textAlign: 'center',
                        color: '#64748b', fontWeight: 600, fontSize: '9px',
                        letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                        width: `${100 / (universeAssets.length + 1)}%`,
                      }}>
                        {shortName(a.name)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody onMouseLeave={() => { setHoveredRow(null); setHoveredCol(null) }}>
                  {universeAssets.map((rowAsset) => (
                    <tr key={rowAsset.symbol}>
                      {/* Row label — tight padding */}
                      <td style={{
                        padding: '2px 6px',
                        color: '#94a3b8', fontWeight: 600,
                        fontSize: '9px', whiteSpace: 'nowrap',
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                        background: hoveredCol?.row === rowAsset.symbol ? 'rgba(96,165,250,0.04)' : 'transparent',
                      }}>
                        {shortName(rowAsset.name)}
                      </td>
                      {universeAssets.map((colAsset) => {
                        if (rowAsset.symbol === colAsset.symbol) {
                          return (
                            <td key={colAsset.symbol}
                              onMouseEnter={() => { setHoveredRow(rowAsset.symbol); setHoveredCol(colAsset.symbol) }}
                              style={{
                                padding: '4px 2px', textAlign: 'center',
                                height: '28px',
                                background:  hoveredRow === rowAsset.symbol || hoveredCol === colAsset.symbol
                                  ? 'rgba(5, 16, 32, 0.93)'
                                  : 'rgba(1, 7, 24, 0.06)',
                                color: '#444e5f',
                                cursor: 'crosshair',
                              }}
                            >
                              ×
                            </td>
                          )
                        }
                        const dist = distanceMap[`${rowAsset.name}|${colAsset.name}`]
                        const { bg, text } = cellColor(dist)
                        return (
                          <td key={colAsset.symbol}
                            title={`${rowAsset.name} ↔ ${colAsset.name}: gap ${dist != null ? Math.round(dist) : '—'}`}
                            onMouseEnter={() => { setHoveredRow(rowAsset.symbol); setHoveredCol(colAsset.symbol) }}
                            style={{
                              padding: '4px 2px', textAlign: 'center',
                              height: '28px',
                              background:hoveredRow === rowAsset.symbol && hoveredCol === colAsset.symbol
                                ? 'transparent'  // виділяємо тільки через border, без зміни фону
                                : hoveredRow === rowAsset.symbol || hoveredCol === colAsset.symbol
                                ? 'rgba(96,165,250,0.12)'
                                : bg,
                              color: hoveredCol?.row === rowAsset.symbol && hoveredCol?.col === colAsset.symbol
                                ? '#0f172a'  // темний текст на яскравому фоні
                                : text,
                              fontWeight: 600, borderRadius: '3px', cursor: 'crosshair',
                              outline: hoveredCol?.row === rowAsset.symbol && hoveredCol?.col === colAsset.symbol
                                ? '2px solid text-blue-500' : 'none',  // підсвічування при наведенні на клітинку,
                              transition: 'background 0.1s',
                            }}
                          >
                            {dist != null ? Math.round(dist) : '—'}
</td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-3 mt-3 pt-3 flex-wrap justify-center">
              <span className="text-[9px] uppercase tracking-[0.15em] text-zinc-600">{t('ui.gap')}</span>
              {[
                { label: t('ui.legendAligned'), bg: 'rgba(74,222,128,0.25)',  text: '#4ade80' },
                { label: t('ui.legend1325'),    bg: 'rgba(74,222,128,0.10)',  text: '#86efac' },
                { label: t('ui.legendNeutral'), bg: 'rgba(148,163,184,0.06)', text: '#64748b' },
                { label: t('ui.legend6175'),    bg: 'rgba(248,113,113,0.15)', text: '#f87171' },
                { label: t('ui.legendOpposed'), bg: 'rgba(248,113,113,0.25)', text: '#ef4444' },
              ].map(({ label, bg, text }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: bg, border: `1px solid ${text}40` }} />
                  <span style={{ fontSize: '9px', color: '#52525b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* ── RIGHT ── */}
        <div className="space-y-4">
          {/* COMPACT TOP PAIRS — side by side */}
          <div className="grid gap-4 md:grid-cols-2">

            {/* Aligned */}
            <div className="small-panel-color p-3">
              <div className="text-[12px] uppercase tracking-[0.25em] text-emerald-400 mb-3">
                ● {t('ui.topAligned')}
              </div>
              <div className="space-y-1.5">
                {alignedPairs.map((pair) => (
                  <div key={pair.key} className="flex items-center justify-between gap-1 py-1.5 last:border-b-0">
                    <div className="min-w-0">
                      <div className="text-[14px] truncate" style={{color:"#4ade80", fontWeight: 700}}>
                        {shortName(pair.left.name)} - {shortName(pair.right.name)}
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.12em] text-zinc-200">
                        {formatPercentile(pair.leftPct)} / {formatPercentile(pair.rightPct)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Distance bar */}
                      <div style={{ width: 60, height: 5, borderRadius: 9999, background: 'rgba(15, 15, 15, 0.90)', overflow: 'hidden' }}>
                        <div style={{
                          width: `${100 - pair.distance}%`, height: '100%',
                          borderRadius: 9999, background: '#4ade80',
                          boxShadow: '0 0 4px rgba(74,222,128,0.6)',
                        }} />
                      </div>
                      <span style={{ fontSize: '11px', color: '#4ade80', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                        {Math.round(pair.distance)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Opposed */}
            <div className="small-panel-color p-3">
              <div className="text-[12px] uppercase tracking-[0.25em] text-rose-400 mb-3">
                ● {t('ui.topOpposed')}
              </div>
              <div className="space-y-1.5">
                {opposedPairs.map((pair) => (
                  <div key={pair.key} className="flex items-center justify-between gap-1 py-1.5 last:border-b-0">
                    <div className="min-w-0">
                      <div className="text-[14px] text-zinc-200 truncate" style={{color:"#f87171", fontWeight: 700}}>
                        {shortName(pair.left.name)} - {shortName(pair.right.name)}
                      </div>
                      <div className="text-[10px] uppercase tracking-[0.12em] text-zinc-200">
                        {formatPercentile(pair.leftPct)} / {formatPercentile(pair.rightPct)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Distance bar */}
                      <div style={{ width: 60, height: 5, borderRadius: 9999, background: 'rgba(15, 15, 15, 0.90)', overflow: 'hidden' }}>
                        <div style={{
                          width: `${pair.distance}%`, height: '100%',
                          borderRadius: 9999, background: '#f87171',
                          boxShadow: '0 0 4px rgba(248,113,113,0.6)',
                        }} />
                      </div>
                      <span style={{ fontSize: '11px', color: '#f87171', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                        {Math.round(pair.distance)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        <div className="default-bg p-4">
          <div className="text-[10px] uppercase tracking-[0.22em] text-slate-200 mb-2">{t('panels.narrativeSummary')}</div>
          <div className="text-sm leading-7 text-zinc-200">{narrative.summary}</div>
        </div>

        <div className="default-bg p-4">
          <div className="text-[10px] uppercase tracking-[0.22em] text-slate-200 mb-2">{t('panels.tradingRelevance')}</div>
          <div className="text-sm leading-7 text-zinc-200">{narrative.tradingRelevance}</div>
        </div>

        <div className="default-bg p-4">
          <div className="text-[10px] uppercase tracking-[0.22em] text-slate-200 mb-2">{t('panels.whatToWatch')}</div>
          <div className="text-sm leading-7 text-zinc-200">{narrative.whatToWatch}</div>
        </div>

      </div>
    </div>
  </div>
  )
}


function SeasonalityView({ assets, openGuide, seasonalityData = [], aiLanguage = "en", uiLanguage = "en" }) {
  const { t } = useTranslation();
  const tMonth = (m) => t(`months.${m}`)
  const rows = useMemo(() => {
    if (!seasonalityData || seasonalityData.length === 0) return []
    return [...seasonalityData].sort((a, b) => b.current - a.current)
  }, [seasonalityData, t])
 
  const hasData = rows.length > 0

  const monthIndex = new Date().getMonth()
  const currentMonth = SEASONAL_MONTHS[monthIndex]
  const narrative = useMemo(() => buildSeasonalityNarrative(rows, t), [rows, t])
  const supportiveCount = rows.filter((x) => x.current >= 55).length
  const headwindCount = rows.filter((x) => x.current <= 45).length
  const strongest = narrative.strongest
  const weakest = narrative.weakest
  const topRanked = rows.slice(0, 8)
  const chartRows = rows.slice(0, 3)
  const breadthScore = rows.length
    ? Math.round(((supportiveCount - headwindCount) / rows.length) * 100)
    : null
  const breadthColor = breadthScore == null ? '#94a3b8'
    : breadthScore >= 30  ? '#4ade80'
    : breadthScore <= -30 ? '#f87171'
    : '#fbbf24'
  const breadthLabel = breadthScore == null ? '—'
    : breadthScore >= 50  ? t('ui.strongTailwind')
    : breadthScore >= 20  ? t('ui.mildTailwind')
    : breadthScore <= -50 ? t('ui.strongHeadwind')
    : breadthScore <= -20 ? t('ui.mildHeadwind')
    : t('ui.mixedSeasonal')
    

  const tripleConfirm = useMemo(() => {
    return rows.filter(row => {
      const seasonal = row.current >= 60
      const asset = assets.find(a => a.symbol === row.symbol)
      if (!asset) return false
      const pct = Number(asset.funds_percentile_3y)
      const cotAligned = pct >= 65 || pct <= 35
      const flowDirectional = asset.flow_state && asset.flow_state !== 'Neutral'
      return seasonal && cotAligned && flowDirectional
    }).map(row => {
      const asset = assets.find(a => a.symbol === row.symbol)
      return { ...row, asset }
    }).slice(0, 6)
  }, [rows, assets])
  // COT-Seasonal alignment: assets where seasonal AND COT point same direction
  const cotSeasonalAlignment = useMemo(() => {
    const aligned = rows.filter(row => {
      const asset = assets.find(a => a.symbol === row.symbol)
      if (!asset) return false
      const pct = Number(asset.funds_percentile_3y)
      const seasonal = row.current
      return (seasonal >= 55 && pct >= 55) || (seasonal <= 45 && pct <= 45)
    })
    return rows.length ? Math.round((aligned.length / rows.length) * 100) : 0
  }, [rows, assets])

const simpleGuide = useMemo(() => {
    const uk = t('__lang__') === 'uk'
    if (narrative.breadth == null) {
      return {
        title: uk ? 'Як це читати' : 'How to read this',
        summary: uk
          ? 'Сезонність показує, наскільки сприятливим або несприятливим історично був календар для активу в різні місяці.'
          : 'Seasonality shows how friendly or unfriendly the calendar has historically been for an asset during different months.',
        takeaway: uk
          ? 'Зелені клітинки означають, що місяць частіше підтримує цей актив. Червоні — місяць історично слабший або менш сприятливий.'
          : 'Green cells mean the month tends to support that asset more often. Red cells mean the month tends to be weaker or less supportive.',
      }
    }
 
    if (narrative.breadth >= 20) {
      return {
        title: uk ? 'Простими словами' : 'Plain-English read',
        summary: uk
          ? `Календар зараз допомагає більшій кількості активів, ніж шкодить. ${supportiveCount} активів у сприятливих сезонних вікнах, тоді як ${headwindCount} — у слабких.`
          : `The calendar is currently helping more assets than it is hurting. ${supportiveCount} assets are in supportive seasonal windows, while ${headwindCount} are in weak windows.`,
        takeaway: uk
          ? 'Це не означає купувати все. Це означає, що сезонність може підтримати лонг-ідеї, коли COT позиціонування і структура графіка узгоджені.'
          : 'This does not mean buy everything. It means seasonality can support long ideas when COT positioning and chart structure agree.',
      }
    }
 
    if (narrative.breadth <= -20) {
      return {
        title: uk ? 'Простими словами' : 'Plain-English read',
        summary: uk
          ? `Поточний місяць — складніший сезонний фон. Лише менша частина універсуму має сприятливий календарний попутний вітер, тоді як ${headwindCount} активів стикаються із сезонним тиском.`
          : `The current month is a tougher seasonal backdrop. Only a smaller part of the universe has a helpful calendar tailwind, while ${headwindCount} assets are facing seasonal pressure.`,
        takeaway: uk
          ? 'У такому фоні сезонність корисніша як фільтр-попередження, ніж як тригер для входу в угоди.'
          : 'In this kind of backdrop, seasonality is more useful as a warning filter than as a trigger to enter trades.',
      }
    }
 
    return {
      title: uk ? 'Простими словами' : 'Plain-English read',
      summary: uk
        ? 'Календарний фон зараз змішаний. Деякі активи мають сприятливий місяць, але весь універсум не рухається з одним чітким сезонним нахилом.'
        : 'The calendar backdrop is mixed right now. Some assets have a supportive month, but the whole universe is not moving with one clear seasonal bias.',
      takeaway: uk
        ? 'Тут сезонність варто використовувати як вторинний шар. Вона більше допомагає з ранжуванням активів, ніж з широкими ринковими прогнозами.'
        : 'Here seasonality should be used as a secondary layer. It helps more with ranking assets than with making broad market calls.',
    }
  }, [narrative.breadth, supportiveCount, headwindCount, t])

  const chartExplanation = useMemo(() => {
    if (!strongest || !weakest) {
      return 'The mini charts show the 12-month seasonal path for selected assets. Higher curves mean a friendlier historical calendar window.'
    }
    return `${strongest.asset} currently has the strongest seasonal tailwind, while ${weakest.asset} is in the weakest current calendar window. Read the sparkline as a simple month-to-month shape: rising sections mean the seasonal backdrop is improving, and falling sections mean it is cooling.`
  }, [strongest, weakest])

  if (!hasData) {
    return (
      <Panel title={t("panels.seasonality")}>
        <div className="space-y-3 text-sm text-slate-200">
          <div>
            {t("seasonality.noData", "Seasonality data is not available yet.")}
          </div>
          <div className="border border-zinc-900 bg-zinc-950 p-3 text-zinc-600">
            {t("seasonality.noDataHint", "Run the worker to populate historical COT data. Seasonality requires at least 3 months of history per asset.")}
          </div>
        </div>
      </Panel>
    )
  }

// ════════════════════════════════════════════════════════════════════════════
// ДВОМОВНИЙ tripleConfirmInsight — заміни функцію (рядки ~3922-3937)
// tMonth, t вже доступні в SeasonalityView
// ════════════════════════════════════════════════════════════════════════════

  const tripleConfirmInsight = (row, asset) => {
    const uk = t('__lang__') === 'uk'
    const pct = Number(asset?.funds_percentile_3y)
    const cotDir = pct >= 65 ? (uk ? 'лонг' : 'long') : (uk ? 'шорт' : 'short')
    const score = row.current
    const month = tMonth(currentMonth)
    const flowRaw = asset?.flow_state || ''
    const flow = translateFlowState(flowRaw, t).toLowerCase()

    if (score >= 80 && (pct >= 75 || pct <= 25)) {
      return uk
        ? `${month} — один з historically найсильніших місяців для ${row.name}. COT фонди впевнено позиціоновані в ${cotDir} — сезонний та інституційний тиск вказують в один бік. Сетап високої впевненості.`
        : `${month} is one of the historically strongest months for ${row.name}. COT funds are firmly positioned ${cotDir} — seasonal and institutional pressure point in the same direction. High-conviction setup.`
    }
    if (score >= 65) {
      return uk
        ? `${month} зазвичай сприятливий період для ${row.name}. Фонди з нахилом у ${cotDir} та потоком «${flow}» — календар додає відчутний попутний вітер до наявного COT сетапу.`
        : `${month} tends to be a favorable period for ${row.name}. With funds ${cotDir}-biased and ${flow} flow, the calendar adds a meaningful tailwind to the existing COT setup.`
    }
    return uk
      ? `${month} дає помірну сезонну підтримку для ${row.name}. Фонди позиціоновані в ${cotDir} — сезонна перевага помірна, але напрямок підтверджено. Варто стежити за тригером входу.`
      : `${month} provides mild seasonal support for ${row.name}. Funds are positioned ${cotDir} — the seasonal edge is moderate but directionally confirmed. Worth watching for an entry trigger.`
  }
 
  return (
    <div className="space-y-4">
      {/* ── TOP ROW: Header + AI ── */}
      <div className="grid gap-3 xl:grid-cols-[1.2fr_1fr]">
        <div className="default-bg">
          <div>
            <div className="flex items-center justify-between border-b px-4 py-3 text-[11px] uppercase tracking-[0.25em]" style={{borderColor: 'var(--panels-border)'}}>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full rounded-full-dot bg-blue-400"></div>
                <div className="text-[11px] uppercase tracking-[0.25em] text-slate-200">{t("panels.seasonality")}</div>
              </div>
              <GuideButton sectionKey="seasonality" openGuide={openGuide} />
            </div>
            <div className="text-xs text-zinc-500 mt-1 px-5">
                <div className="flex items-baseline gap-3">
                <div className="text-2xl font-bold" style={{ color: breadthColor }}>{breadthLabel}</div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-400">{tMonth(currentMonth)}</div>
              </div>
                {t('ui.supportiveHeadwindsNeutral', { sup: supportiveCount, head: headwindCount, neu: rows.length - supportiveCount - headwindCount })}
              </div>
            
          </div>
          {/* Breadth bar */}
          <div className="mb-2 px-5">
            <div className="flex justify-between text-[11px] uppercase tracking-[0.15em] mb-1.5">
              <span className="text-rose-400">◄ {t('ui.headwinds')}</span>
              <span className="text-slate-200">{t('ui.seasonalBreadth')}</span>
              <span className="text-emerald-400">{t('ui.tailwinds')}</span>
            </div>
            <div style={{ position: 'relative', height: '14px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>
              <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.12)' }} />
              {breadthScore != null && (
                <div style={{
                  position: 'absolute', top: '1px', bottom: '1px',
                  left: breadthScore >= 0 ? '50%' : `${50 + breadthScore / 2}%`,
                  width: `${Math.abs(breadthScore) / 2}%`,
                  borderRadius: '3px', background: breadthColor,
                  boxShadow: `0 0 10px ${breadthColor}90`,
                  transition: 'width 0.4s, left 0.4s',
                }} />
              )}
              {breadthScore != null && (
                <div style={{
                  position: 'absolute', top: '50%', left: `${50 + breadthScore / 2}%`,
                  transform: 'translate(-50%, -50%)',
                  width: '13px', height: '14px', borderRadius: '50%',
                  background: breadthColor, border: '2px solid rgba(0,0,0,0.5)',
                  boxShadow: `0 0 10px ${breadthColor}`,
                }} />
              )}
            </div>
            <div className="flex justify-between mt-1">
              <span style={{ fontSize: '10px', color: '#f87171' }}>-100</span>
              <span style={{ color: breadthColor, fontWeight: 700, fontSize: '12px' }}>
                {breadthScore != null ? (breadthScore >= 0 ? `+${breadthScore}` : breadthScore) : '—'}
              </span>
              <span style={{ fontSize: '10px', color: '#4ade80' }}>+100</span>
            </div>
          </div>
          {/* Metrics */}
          <div className="grid grid-cols-5 gap-2 px-5 pb-3 metric-card">
            {[
              { label: t('ui.universe'),   value: rows.length,                                   color: '#93c5fd' },
              { label: t('ui.supportive'), value: supportiveCount,                               color: '#4ade80' },
              { label: t('ui.headwinds'),  value: headwindCount,                                 color: '#f87171' },
              { label: t('ui.tripleConfirm'), value: tripleConfirm.length, color: '#a78bfa' },
              { label: t('ui.cotSeasAlign'), value: `${cotSeasonalAlignment}%`, color: cotSeasonalAlignment >= 60 ? '#4ade80' : cotSeasonalAlignment <= 30 ? '#f87171' : '#fbbf24' },
            ].map(({ label, value, color }) => (
              <div key={label} className="small-panel-color p-2 text-center">
                <div style={{ fontSize: '16px', fontWeight: 700, color }}>{value}</div>
                <div style={{ fontSize: '10px', color: '#f2f7ff', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: '2px' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
        <AIAnalysisPanel
          type="seasonality"
          data={{
            current_month: currentMonth,
            supportive_count: supportiveCount,
            headwind_count: headwindCount,
            total_assets: rows.length,
            top_assets: rows.slice(0, 6).map(r => ({ name: r.name, symbol: r.symbol, current: r.current, cot_index: r.cot_index ?? null })),
            bottom_assets: [...rows].reverse().slice(0, 4).map(r => ({ name: r.name, symbol: r.symbol, current: r.current, cot_index: r.cot_index ?? null })),
          }}
          aiLanguage={aiLanguage}
          title={t('ui.aiSeasonal')}
        />
      </div>

      {/* Triple-Confirm Setups */}
      <div className="default-bg p-4">
        <div className="flex items-center gap-2 mb-4 pb-3">
          <div className="h-1.5 w-1.5 rounded-full rounded-full-dot bg-blue-400"></div>
          <span style={{ fontSize: '11px', letterSpacing: '0.28em', textTransform: 'uppercase' }}>
            {t('ui.tripleConfirmSetups')}
          </span>
        </div>

        {tripleConfirm.length === 0 ? (
          /* Empty state — two columns with info cards instead of blank space */
          <div>
            <div className="text-center py-4 mb-4">
              <div style={{ fontSize: '28px', opacity: 0.2, marginBottom: '8px' }}>◎</div>
              <div style={{ fontSize: '11px', color: '#475569', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                {t('ui.noTripleConfirm', { month: tMonth(currentMonth) })}
              </div>
              <div style={{ fontSize: '10px', color: '#374151', marginTop: '4px' }}>
                Seasonal alone is not enough — wait for COT + flow alignment
              </div>
            </div>
            {/* Show what would qualify — top seasonal candidates */}
            <div style={{ fontSize: '10px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '8px' }}>
              Closest candidates (seasonal only)
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {rows.slice(0, 4).map(row => {
                const asset = assets.find(a => a.symbol === row.symbol)
                const pct = asset ? Number(asset.funds_percentile_3y) : null
                const cotOk = pct != null && (pct >= 65 || pct <= 35)
                const flowOk = asset?.flow_state && asset.flow_state !== 'Neutral'
                return (
                  <div key={row.symbol} className="border border-zinc-900 p-3 small-panel-color">
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#f1f5f9', marginBottom: '6px' }}>
                      {row.name}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span style={{
                        fontSize: '9px', padding: '1px 5px', borderRadius: '3px',
                        letterSpacing: '0.08em', textTransform: 'uppercase',
                        background: row.current >= 55 ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                        color: row.current >= 55 ? '#4ade80' : '#f87171',
                        border: `1px solid ${row.current >= 55 ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)'}`,
                      }}>
                        ✓ Seasonal {formatPercentile(row.current)}
                      </span>
                      <span style={{
                        fontSize: '9px', padding: '1px 5px', borderRadius: '3px',
                        letterSpacing: '0.08em', textTransform: 'uppercase',
                        background: cotOk ? 'rgba(96,165,250,0.1)' : 'rgba(255,255,255,0.04)',
                        color: cotOk ? '#60a5fa' : '#374151',
                        border: `1px solid ${cotOk ? 'rgba(96,165,250,0.25)' : 'rgba(255,255,255,0.06)'}`,
                      }}>
                        {cotOk ? '✓' : '✗'} COT {pct != null ? formatPercentile(pct) : '—'}
                      </span>
                      <span style={{
                        fontSize: '9px', padding: '1px 5px', borderRadius: '3px',
                        letterSpacing: '0.08em', textTransform: 'uppercase',
                        background: flowOk ? 'rgba(167,139,250,0.1)' : 'rgba(255,255,255,0.04)',
                        color: flowOk ? '#a78bfa' : '#374151',
                        border: `1px solid ${flowOk ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.06)'}`,
                      }}>
                        {flowOk ? '✓' : '✗'} {asset?.flow_state ? translateFlowState(asset.flow_state, t) : t('flowStates.neutral')}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          /* Has triple-confirm setups — show them in two columns */
        <div className="grid gap-3 md:grid-cols-3">
            {tripleConfirm.map(({ name, symbol, current, values, asset }) => {
              const pct = Number(asset?.funds_percentile_3y)
              const cotColor = pct >= 65 ? '#4ade80' : '#f87171'
              const cotDir   = pct >= 65 ? 'Long' : 'Short'
              return (
                <div key={symbol} className="p-3 default-bg">
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#f1f5f9', marginBottom: '6px' }}>{name}</div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    <span style={{ fontSize: '9px', color: '#4ade80', background: 'rgba(74,222,128,0.08)',  
                      border: '1px solid rgba(74,222,128,0.2)', padding: '1px 5px', borderRadius: '3px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      S {formatPercentile(current)}
                    </span>
                    <span style={{ fontSize: '9px', color: cotColor, background: `${cotColor}18`,
                      border: `1px solid ${cotColor}30`, padding: '1px 5px', borderRadius: '3px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      C {cotDir} {formatPercentile(pct)}
                    </span>
                    <span style={{ fontSize: '9px', color: '#99b1ff', background: '#1638e049',
                      border: '1px solid rgba(167,139,250,0.2)', padding: '1px 5px', borderRadius: '3px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {asset?.flow_state ? translateFlowState(asset.flow_state, t).split(' ')[0] : t('ui.flow')}
                    </span>
                  </div>
                  {values && values.length === 12 && (
                    <div style={{ position: 'relative' }}>
                      <MiniSparkline values={values} positive={current >= 55} />
                      <div style={{
                        position: 'absolute', top: 0, bottom: 0,
                        left: `${(monthIndex / 12) * 100}%`,
                        width: `${100 / 12}%`,
                        background: 'var(--accent-alpha)',
                        borderLeft: '1px solid rgba(251,191,36,0.5)',
                        pointerEvents: 'none',
                      }} />
                    </div>
                  )}
                  <div className="flex justify-between mt-1">
                    <span style={{ fontSize: '8px', color: '#668fd0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{tMonth('Jan')}</span>
                    <span style={{ fontSize: '8px', color: '#fbbf24', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{tMonth(currentMonth)}</span>
                    <span style={{ fontSize: '8px', color: '#668fd0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{tMonth('Dec')}</span>
                  </div>
                  {/* Insight */}
                  <div style={{
                    marginTop: '8px',
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    fontSize: '13px',
                    lineHeight: '1.65',
                    color: '#c5d2e6',
                  }}>
                    {tripleConfirmInsight({ name: symbol, current }, asset)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>  

      <div className="grid gap-3 xl:grid-cols-[1.45fr_0.55fr]">
        <Panel title={t("panels.seasonalityHeatmap")} right={<span className="text-xs uppercase tracking-[0.22em] text-slate-200">{t('ui.monthMap12')}</span>}>
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <div className="small-panel-color p-3 text-sm text-zinc-300">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200">{t('ui.howToReadGreen')}</div>
              <div className="mt-2">{t('ui.howToReadGreenText')}</div>
            </div>
            <div className="small-panel-color p-3 text-sm text-zinc-300">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200">{t('ui.howToReadRed')}</div>
              <div className="mt-2">{t('ui.howToReadRedText')}</div>
            </div>
            <div className="small-panel-color p-3 text-sm text-zinc-300">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200">{t('ui.amberOutline')}</div>
              <div className="mt-2">{t('ui.amberOutlineText')}</div>
            </div>
          </div>

          <div>
            <div className="min-w-[865px]">
              <div className="grid grid-cols-[128px_repeat(12,minmax(0,1fr))] gap-1 text-[11px] uppercase tracking-[0.18em] text-slate-200">
                <div>{t('ui.asset')}</div>
                {SEASONAL_MONTHS.map((m) => (
                  <div key={tMonth(m)} className="text-center">{tMonth(m)}</div>
                ))}
              </div>
              <div className="mt-3 space-y-2">  
                {rows.map((row) => (
                  <div key={row.symbol} className="grid grid-cols-[108px_repeat(12,minmax(0,1fr))] gap-1">
                    <div className="flex items-center default-bg px-2 py-1 heatmap-cells">
                      <div>
                        <div className="text-[10px] text-slate-200">{row.name}</div>
                        <div className="text-[10px] text-zinc-400">{normalizeSector(row.sector)}</div>
                      </div>
                    </div>
                    {row.values.map((value, idx) => (
                      <div
                        key={`${row.symbol}-${SEASONAL_MONTHS[idx]}`}
                        className={cls(
                          'flex h-[42px] items-center justify-center text-xs heatmap-cells',
                          seasonalCellTone(value),
                          idx === monthIndex && 'ring-1 ring-amber-400/60'
                        )}
                      >
                        {formatPercentile(value)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
           {/* Legend */}
          <div className="flex items-center gap-3 mt-3 pt-3 flex-wrap">
            <span style={{ fontSize: '9px', color: '#849ec3', textTransform: 'uppercase', letterSpacing: '0.15em' }}>{t('ui.score')}</span>
            {[
              { label: t('ui.strongAbove70'),   bg: 'rgba(74,222,128,0.3)',   text: '#4ade80' },
              { label: t('ui.mild5569'),   bg: 'rgba(74,222,128,0.12)',  text: '#86efac' },
              { label: t('ui.neutral4654'), bg: 'rgba(148,163,184,0.06)', text: '#64748b' },
              { label: t('ui.mild3145'),   bg: 'rgba(248,113,113,0.12)', text: '#f87171' },
              { label: t('ui.strongBelow30'),   bg: 'rgba(248,113,113,0.3)',  text: '#ef4444' },
            ].map(({ label, bg, text }) => (
              <div key={label} className="flex items-center gap-1">
                <div style={{ width: 9, height: 9, borderRadius: 2, background: bg, border: `1px solid ${text}40` }} />
                <span style={{ fontSize: '9px', color: '#849ec3', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
              </div>
            ))}
          </div>
        </Panel>

        <div className="space-y-4"> 
        {/* Current Month Ranking — compact */}
          <div className="default-bg">
            <div className="text-[11px] uppercase tracking-[0.28em] text-zinc-100 mb-3 py-3 px-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--panels-border)' }}>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full rounded-full-dot bg-blue-400"></div>
                <span>{tMonth(currentMonth)} {t('ui.ranking')}</span>
                <span style={{ fontSize: '10px', color: '#7b9dcc', fontWeight: 400 }}>{t('ui.assetsCount', { n: rows.length })}</span>
              </div>
            </div>
            <div className="px-2" style={{ maxHeight: '100%', overflowY: 'auto' }}>
              {rows.map((row, i) => (
                <div key={row.symbol} className="flex default-bg mb-2.5 items-center gap-3 py-1.5 pr-4 last:border-b-0">
                  {/* Rank */}
                  <div style={{ fontSize: '10px', color: '#374151', fontWeight: 700, width: '16px', flexShrink: 0, textAlign: 'right' }}>
                    {i + 1}
                  </div>
                  {/* Name + sector */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '15px', fontWeight: 400, color: '#ffffff', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {row.name}
                    </div>
                    <div style={{ fontSize: '10px', color: '#76aefc', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {row.symbol}
                    </div>
                  </div>
                  {/* Bar + score */}
                  <div style={{ width: '90px', flexShrink: 0 }}>
                    <div style={{ height: '6px', borderRadius: '2px', background: 'rgba(255,255,255,0.05)', marginBottom: '6px',marginTop: '6px' , overflow: 'visible' }}>
                      <div style={{
                        width: `${Math.max(4, row.current)}%`, height: '100%', borderRadius: '2px',
                        background: row.current >= 55 ? '#4ade80' : row.current <= 45 ? '#f87171' : '#fbbf24',
                        boxShadow: row.current >= 55
                          ? '0 0 6px rgba(74,222,128,0.7)'
                          : row.current <= 45 ? '0 0 6px rgba(248,113,113,0.7)'
                          : '0 0 6px rgba(251,191,36,0.5)',
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={cls('text-[10px] font-bold', seasonalBiasTone(row.current))}>
                        {formatPercentile(row.current)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div> 
               
      <Panel title={simpleGuide.title}>
        <div className="space-y-3 text-sm leading-7 text-zinc-300">
          <div>{simpleGuide.summary}</div>
          <div className="small-panel-color p-3 text-zinc-400">{simpleGuide.takeaway}</div>
            {/* Narrative blocks — column */}
            <div className="flex gap-3">
              <div className="default-bg p-4">
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.22em', color: '#e2e8f0', marginBottom: '8px' }}>
                  {t('panels.narrativeSummary')}
                </div>
                <div style={{ fontSize: '13px', lineHeight: '1.7', color: '#e2e8f0' }}>{narrative.summary}</div>
              </div>
              <div className="default-bg p-4">
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.22em', color: '#e2e8f0', marginBottom: '8px' }}>
                  {t('panels.tradingRelevance')}
                </div>
                <div style={{ fontSize: '13px', lineHeight: '1.7', color: '#e2e8f0' }}>{narrative.tradingRelevance}</div>
              </div>
              <div className="default-bg p-4">
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.22em', color: '#e2e8f0', marginBottom: '8px' }}>
                  {t('panels.whatToWatch')}
                </div>
                <div style={{ fontSize: '13px', lineHeight: '1.7', color: '#e2e8f0' }}>{narrative.whatToWatch}</div>
              </div>
            </div> 
        </div>
      </Panel>
  </div>
  )
}

function Summary({ assets, setActive, setSelected, openGuide }) {
  const { t } = useTranslation();
  const sectorGroups = useMemo(() => {
    return assets.reduce((acc, asset) => {
      const sector = normalizeSector(asset.sector);
      if (!acc[sector]) acc[sector] = [];
      acc[sector].push(asset);
      return acc;
    }, {});
  }, [assets]);



  const getGroupConfig = (asset) => {
    const sector = normalizeSector(asset.sector);
    const isCommodity =
      ["MET", "NRG", "SFT"].includes(asset.sector) ||
      ["Metals", "Energy", "Softs"].includes(sector) ||
      asset.source_type === "DISAGG";

	if (isCommodity) {
	  return [
		{
		  key: 'funds',
		  label: 'Managed Money',
		  long: asset.funds_long,
		  short: asset.funds_short,
		  net: asset.funds_net,
		  pct: asset.funds_percentile_3y,
		},
		{
		  key: 'producer', 
		  label: 'Producer', 
		  long: asset.producer_long || null,
		  short: asset.producer_short || null,
		  net: asset.producer_net || null,
		  pct: asset.producer_percentile_3y || null,
        }
	  ]
	}

      return [
      {
        key: "funds",
        label: "Funds",
        long: asset.funds_long,
        short: asset.funds_short,
        net: asset.funds_net,
        pct: asset.funds_percentile_3y,
      },
      {
        key: "am",
        label: "Asset Manager",
        long: asset.asset_manager_long,
        short: asset.asset_manager_short,
        net: asset.asset_manager_net,
        pct: asset.asset_manager_percentile_3y,
      },
      {
        key: "dealer",
        label: "Dealer",
        long: asset.dealer_long,
        short: asset.dealer_short,
        net: asset.dealer_net,
        pct: asset.dealer_percentile_3y,
      },
    ];
  };

  const Cell = ({ value, tone = false }) => (
    <td className={cls("px-3 py-2 text-right tabular-nums", tone ? flowColor(value) : "text-zinc-200")}>
      {formatNumber(value)}
    </td>
  );

  return (
  <div className="space-y-6">

    {Object.entries(sectorGroups).map(([sector, items]) => {
      const headerGroups = items.length ? getGroupConfig(items[0]) : []

      return (
        <Panel key={sector} title={sector} right={<div className="flex justify-end">
      <GuideButton sectionKey="cot" openGuide={openGuide} />
    </div>}>  
          <div className="overflow-x-auto">
            <table className="min-w-[1200px] w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-zinc-950">
                <tr className="border-b border-zinc-800 text-[11px] uppercase tracking-[0.22em] text-blue-50">
                  <th rowSpan={2} className="sticky left-0 z-20 bg-zinc-950 px-3 py-3 text-left font-medium">
                    {t('ui.symbol')}
                  </th>
                  <th rowSpan={2} className="px-3 py-3 text-right font-medium">
                    OI
                  </th>
                  <th rowSpan={2} className="px-3 py-3 text-left font-medium">
                    Momentum
                  </th>

                  {headerGroups.map((group) => (
                    <th
                      key={group.key}
                      colSpan={4}
                      className="px-3 py-3 text-center font-medium"
                    >
                      {group.label}
                    </th>
                  ))}
                </tr>

                <tr className="border-b border-zinc-900 text-[11px] uppercase tracking-[0.2em] text-slate-200">
                  {headerGroups.map((group) => (
                    <React.Fragment key={group.key}>
                      <th className="px-3 py-2 text-right">{t('ui.long')}</th>
                      <th className="px-3 py-2 text-right">{t('ui.short')}</th>
                      <th className="px-3 py-2 text-right">{t('ui.net')}</th>
                      <th className="px-3 py-2 text-right">{t('ui.index')}</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>

              <tbody>
                {items.map((asset) => {
                  const groups = getGroupConfig(asset)

                  return (
                    <tr
                      key={asset.symbol}
                      onClick={() => {
                        setSelected(asset.symbol)
                        setActive('explorer')
                      }}
                      className="cursor-pointer border-b border-zinc-900/70 hover:bg-zinc-950"
                    >
                      <td className="sticky left-0 z-10 bg-zinc-950 px-3 py-2">
                        <div className="text-sm font-medium text-blue-400">{asset.symbol}</div>
                        <div className="text-xs text-blue-50">{asset.name}</div>
                      </td>
 
                      <td className="px-3 py-2 text-right tabular-nums text-zinc-200">
                        {formatNumber(asset.open_interest)}
                      </td>
 
                      <td className="px-3 py-2">
                        <MomentumBadge asset={asset} size="sm" />
                      </td>

                      {groups.map((group) => (
                        <React.Fragment key={group.key}>
                          <Cell value={group.long} />
                          <Cell value={group.short} />
                          <Cell value={group.net} tone />
                          <td className={cls('px-3 py-2 text-right tabular-nums', flowColor(group.pct))}>
                            {formatPercentile(group.pct)}
                          </td>
                        </React.Fragment>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )
    })}
  </div>
 )
}

function renderNarrative(text) {
  if (!text) return null
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <div key={i} className="h-2" />
    const match = line.match(/^\*\*(.+?):\*\*\s*(.*)/)
    if (match) {
      return (
        <div key={i} className="mb-3">
          <div style={{ fontSize: '10px', letterSpacing: '0.2em', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>
            {match[1]}
          </div>
          {match[2] && (
            <div className="text-sm leading-6 text-zinc-300">{match[2]}</div>
          )}
        </div>
      )
    }
    const parts = line.split(/(\*\*[^*]+\*\*)/g)
    const hasBold = parts.some(p => p.startsWith('**') && p.endsWith('**'))
    if (hasBold) {
      return (
        <div key={i} className="text-sm leading-6 text-zinc-300 mb-1">
          {parts.map((part, j) =>
            part.startsWith('**') && part.endsWith('**')
              ? <strong key={j} style={{ color: '#e2e8f0', fontWeight: 600 }}>{part.slice(2, -2)}</strong>
              : <span key={j}>{part}</span>
          )}
        </div>
      )
    }
    return <div key={i} className="text-sm leading-6 text-zinc-300 mb-1">{line}</div>
  })
}

function Explorer({ assets, selected, setSelected, aiLanguage, openGuide, seasonalityData = [] }) {
  const { t } = useTranslation();
  const tAccel = (a) =>
    a === 'accelerating' ? t('ui.accelerating') :
    a === 'decelerating' ? t('ui.decelerating') :
    a === 'stable' ? t('ui.stable') : a
  const tCrowding = (c) =>
    c === 'Extreme' ? t('ui.crowdingExtreme') :
    c === 'Elevated' ? t('ui.crowdingElevated') :
        c === 'Moderate' ? t('ui.crowdingModerate') : c
  const tBias = (b) =>
  b === 'Long Extreme'    ? t('ui.biasLongExtreme') :
  b === 'Bullish Context' ? t('ui.biasBullishContext') :
  b === 'Short Extreme'   ? t('ui.biasShortExtreme') :
  b === 'Bearish Context' ? t('ui.biasBearishContext') :
  b === 'Balanced'        ? t('ui.biasBalanced') : b

  const asset = assets.find((a) => a.symbol === selected) || assets[0];

  const sectorItems = useMemo(() => {
    if (!asset) return [];
    return assets.filter(
      (a) => normalizeSector(a.sector) === normalizeSector(asset.sector)
    );
  }, [assets, asset]);

  const sectorPeers = useMemo(() => {
    if (!asset) return [];
    return sectorItems
      .filter((a) => a.symbol !== asset.symbol)
      .sort(
        (a, b) =>
          Math.abs((b.funds_percentile_3y ?? 50) - (asset.funds_percentile_3y ?? 50)) -
          Math.abs((a.funds_percentile_3y ?? 50) - (asset.funds_percentile_3y ?? 50))
      )
      .slice(0, 4);
  }, [sectorItems, asset]);

  // ── Asset narrative engine ────────────────────────────────────────────────
  const profile = useMemo(() => {
    if (!asset) return null;

    const pct   = Number(asset.funds_percentile_3y);
    const safe  = Number.isNaN(pct) ? 50 : pct;
    const wow   = asset.funds_index_wow_change;
    const dir   = asset.funds_index_direction;
    const mom   = asset.funds_index_momentum;
    const accel = asset.funds_index_acceleration;
    const avg3w = asset.funds_index_3w_avg;
    const avg8w = asset.funds_index_8w_avg;
    const flow  = asset.flow_state || "Neutral";
    const name  = asset.name;
    const sym = asset.symbol;
    const sector = asset?.sector || '';

    const conviction = Math.abs(safe - 50) * 2;

    const crowding =
      safe >= 90 || safe <= 10 ? "Extreme" :
      safe >= 75 || safe <= 25 ? "Elevated" : "Moderate";

    const uk = t && t('__lang__') === 'uk'
    // How confident is the contrarian signal for each sector (high / medium / low)
    // High = speculators tend to be WRONG at extremes here → fade them
    // Low  = speculators tend to be RIGHT → follow them
    const contrarianConfidence = (() => {
        if (['IDX'].includes(sector))                          return 'high'
        if (['FX'].includes(sector))                           return 'high'
        if (['METALS'].includes(sector) && ['XAU','XAG'].includes(sym)) return 'medium'
        if (['METALS'].includes(sector))                       return 'low'
        if (['COMMODITIES','GRAINS','SFT','SOFTS'].includes(sector))    return 'low'
        if (['CRYPTO'].includes(sector))                       return 'low'
        return 'low'
    })()
 
    const contrarianRead = (() => {
      if (contrarianConfidence === 'low') return null
      const C = {
        bull: '#4ade80', bear: '#f87171', watch: '#fbbf24',
        highConf:   uk ? 'Висока впевненість'  : 'High Confidence',
        medConf:    uk ? 'Середня впевненість' : 'Medium Confidence',
        sigBull:    uk ? 'КОНТРАРІАНСЬКИЙ БИЧАЧИЙ'  : 'CONTRARIAN BULLISH',
        sigBear:    uk ? 'КОНТРАРІАНСЬКИЙ ВЕДМЕЖИЙ' : 'CONTRARIAN BEARISH',
        sigWatch:   uk ? 'КОНТРАРІАНСЬКА УВАГА'      : 'CONTRARIAN WATCH',
      }
 
      // ── EQUITY INDICES ──
      if (sector === 'IDX') {
        if (safe <= 15) return {
          signal: C.sigBull, color: C.bull, confidence: C.highConf,
          label: uk ? 'Капітуляція — можливе дно' : 'Capitulation — possible bottom',
          simple: uk
            ? `Майже всі вже в шорті. Коли ринок настільки переповнений шортами, продавати майже нікому. Одна хороша новина — і всі ці шорти кинуться покривати одночасно, різко штовхаючи ціну вгору. Це не сигнал на купівлю, але це сигнал "припинити додавати шорти".`
            : `Almost everyone is already short. When a market is this crowded on the short side, there is almost nobody left to sell. One piece of good news and all those shorts need to cover at once, pushing prices up sharply. This is not a buy signal, but it IS a "stop adding shorts" signal.`,
          action: uk
            ? `Що робити: Якщо ви в шорті — зафіксуйте частину прибутку і підтягніть стоп. Якщо думали шортити — зачекайте. Ризик потрапити в сквіз високий.`
            : `What to do: If you are short, consider taking some profit and tightening your stop. If you were thinking of going short, wait. The risk of being caught in a squeeze is high here.`,
        }
        if (safe <= 35) return {
          signal: C.sigWatch, color: C.watch, confidence: C.medConf,
          label: uk ? 'Зона накопичення' : 'Accumulation zone',
          simple: uk
            ? `Фонди сильно в шорті по цьому індексу. "Легкий шорт" вже переповнений — багато хто його тримає. Контраріанська логіка каже: обережно з додаванням шортів, бо багато хто вийде одночасно, якщо щось піде не так для ведмедів.`
            : `Funds are heavily short on this index. The "easy short" trade is crowded. The contrarian logic says be careful adding more shorts here, because many people will need to exit at the same time if anything goes wrong for the bears.`,
          action: uk
            ? `Що робити: Наявні шорти прийнятні, але підтягніть стопи. Нові шорти тут мають погане співвідношення ризик/прибуток.`
            : `What to do: Existing shorts are fine but tighten stops. New short entries here have poor risk-reward.`,
        }
        if (safe >= 85) return {
          signal: C.sigBear, color: C.bear, confidence: C.highConf,
          label: uk ? 'Ейфорія — можлива вершина' : 'Euphoria — possible top',
          simple: uk
            ? `Майже всі вже в лонгу. Коли ринок настільки переповнений лонгами, потрібно все менше хороших новин щоб триматися — і будь-яке розчарування викликає різке падіння, коли всі намагаються вийти одночасно. Це не сигнал на продаж, але сигнал "припинити додавати лонги".`
            : `Almost everyone is already long. When a market is this crowded on the long side, it takes less good news to keep it going, and any disappointment causes a sharp drop as everyone tries to exit at once. This is not a sell signal, but it IS a "stop adding longs" signal.`,
          action: uk
            ? `Що робити: Якщо ви в лонгу — зафіксуйте частину прибутку і підтягніть стоп. Якщо думали купувати — зачекайте.`
            : `What to do: If you are long, take some profit and tighten your stop. If you were thinking of going long, wait.`,
        }
        if (safe >= 65) return {
          signal: C.sigWatch, color: C.watch, confidence: C.medConf,
          label: uk ? 'Зона розподілу' : 'Distribution zone',
          simple: uk
            ? `Фонди сильно в лонгу. Тренд вгору і прямий COT це підтверджує. Але контраріанська лінза каже: легкі гроші вже зроблено — угода стає переповненою. Нові лонги звідси несуть більше ризику.`
            : `Funds are heavily long. The trend is up and direct COT confirms it. But the contrarian lens says the easy money has been made — the trade is getting crowded.`,
          action: uk
            ? `Що робити: Прямий сигнал ще бичачий — але якщо ви вже в лонгу, не час агресивно додавати. Захищайте прибуток.`
            : `What to do: The direct signal is still bullish, but if you are already long, this is not the time to add aggressively. Protect profits.`,
        }
        return null
      }
 
      // ── FX ──
      if (sector === 'FX') {
        if (safe <= 15) return {
          signal: C.sigBull, color: C.bull, confidence: C.highConf,
          label: uk ? 'Екстремальний шорт — ризик сквізу' : 'Extreme short — squeeze risk',
          simple: uk
            ? `Валютні спекулянти відомі тим, що помиляються на екстремумах. Зараз вони екстремально в шорті по цій валюті — ведмежа угода на максимальній потужності. У FX такий рівень односторонності — один з найнадійніших сигналів розвороту в COT-аналізі.`
            : `Currency speculators are famous for getting it wrong at extremes. Right now they are extremely short this currency. In FX, this level of one-sided positioning is one of the most reliable reversal signals in COT analysis.`,
          action: uk
            ? `Що робити: Не додавайте нові шорти. Стежте за будь-яким каталізатором, що може спровокувати шорт-сквіз.`
            : `What to do: Do not add new short positions. Watch for any catalyst that could trigger a short squeeze.`,
        }
        if (safe <= 35) return {
          signal: C.sigWatch, color: C.watch, confidence: C.medConf,
          label: uk ? 'Ведмеже, але переповнюється' : 'Bearish but getting crowded',
          simple: uk
            ? `Спекулянти в шорті по цій валюті. У FX, коли шорт-сторона переповнюється, розвороти бувають швидкі й різкі. Ви ще не на екстремумі, але рухаєтесь туди.`
            : `Speculators are short this currency. In FX markets, when the short side gets crowded, reversals can be fast and sharp. You are not at an extreme yet but moving there.`,
          action: uk
            ? `Що робити: Шорти прийнятні, але керуйте ними активно. Будьте готові швидко вийти, якщо ціна почне відновлюватися.`
            : `What to do: Short positions are valid but manage them actively. Be ready to exit quickly if the price starts to recover.`,
        }
        if (safe >= 85) return {
          signal: C.sigBear, color: C.bear, confidence: C.highConf,
          label: uk ? 'Екстремальний лонг — ризик розвороту' : 'Extreme long — reversal risk',
          simple: uk
            ? `Валютні спекулянти екстремально в лонгу. В історії FX такий рівень односторонньої бичачості позначає одні з найкращих можливостей для розвороту. Усі, хто хотів бути в лонгу, вже там.`
            : `Currency speculators are extremely long. In FX history, this level of one-sided bullish positioning marks some of the best reversal opportunities. Everyone who wants to be long is already long.`,
          action: uk
            ? `Що робити: Не женіться за новими лонгами. Стежте за каталізатором фіксації прибутку. Це зона високого ризику для нових лонгів.`
            : `What to do: Do not chase new long positions. Watch for a catalyst that triggers profit-taking. This is a high-risk zone for new longs.`,
        }
        if (safe >= 65) return {
          signal: C.sigWatch, color: C.watch, confidence: C.medConf,
          label: uk ? 'Бичаче, але переповнюється' : 'Bullish but getting crowded',
          simple: uk
            ? `Спекулянти в лонгу по цій валюті. Тренд з вами — але FX-натовп схильний засиджуватися. Ви ще не на небезпечному екстремумі, але моментум-лонги починають накопичуватися.`
            : `Speculators are long this currency. The trend is with you, but FX crowds tend to overstay their welcome. You are not at a dangerous extreme yet.`,
          action: uk
            ? `Що робити: Лонги прийнятні. Стежте за ознаками виснаження — якщо ціна перестає реагувати на хороші новини, це попередження.`
            : `What to do: Long positions are valid. Watch for signs of exhaustion — if the price stops responding to good news, that is a warning.`,
        }
        return null
      }
 
      // ── PRECIOUS METALS ──
      if (sector === 'METALS' && ['XAU', 'XAG'].includes(sym)) {
        if (safe <= 15) return {
          signal: C.sigWatch, color: C.watch, confidence: C.medConf,
          label: uk ? 'Фонди незвично в шорті по золоту/сріблу' : 'Funds unusually short on Gold/Silver',
          simple: uk
            ? `Фонди рідко бувають настільки в шорті по золоту і сріблу. Коли так стається, зазвичай це означає, що ринок побитий і страх високий. Історично екстремальні шорт-позиції фондів у дорогоцінних металах передували значним відновленням.`
            : `Gold and Silver funds are rarely this short. When they are, it usually means the market has been beaten up and fear is high. Historically, extreme fund short positions in precious metals have preceded significant recoveries.`,
          action: uk
            ? `Що робити: Оцініть макро-картину — якщо є причина для попиту на захисні активи, це може бути хороша зона входу. Уникайте нових шортів.`
            : `What to do: Evaluate the macro picture. If there is any reason for safe-haven demand, this could be a good entry zone. Avoid adding new shorts.`,
        }
        if (safe >= 85) return {
          signal: C.sigWatch, color: C.watch, confidence: C.medConf,
          label: uk ? 'Фонди дуже в лонгу — переповнена угода' : 'Funds very long — crowded trade',
          simple: uk
            ? `Золото і срібло зараз сильно в руках фондів. Тренд був сильним, але коли дорогоцінні метали настільки переповнені лонгами, корекції бувають різкими — бо всі виходять одночасно при зміні настрою.`
            : `Gold and Silver are heavily owned by funds right now. The trend has been strong, but when precious metals are this crowded on the long side, corrections tend to be sharp.`,
          action: uk
            ? `Що робити: Якщо ви в лонгу — час зафіксувати частину прибутку і підтягнути стопи. Нові лонги несуть вищий ризик купівлі біля короткострокової вершини.`
            : `What to do: If you are long, this is a good time to take partial profit and tighten stops. New long entries here carry higher risk.`,
        }
        return null
      }
 
      return null
    })()
      
    const setupBias =
      safe >= 90 ? "Long Extreme" :
      safe >= 65 ? "Bullish Context" :
      safe <= 10 ? "Short Extreme" :
      safe <= 35 ? "Bearish Context" : "Balanced";

    const wowAbs = wow != null ? Math.abs(wow).toFixed(1) : null;
 
    let momentumLine = "";
    if (wow != null && wowAbs !== null) {
      if (uk) {
        const wowDir = wow > 0 ? "наростили" : "скоротили";
        const wowSize = Math.abs(wow) >= 10 ? "різко" : Math.abs(wow) >= 5 ? "помітно" : "помірно";
        momentumLine = `Цього тижня фонди ${wowDir} експозицію ${wowSize} (${wow > 0 ? "+" : ""}${wow.toFixed(1)} пунктів індексу).`;
      } else {
        const wowDir = wow > 0 ? "added" : "reduced";
        const wowSize = Math.abs(wow) >= 10 ? "sharply" : Math.abs(wow) >= 5 ? "meaningfully" : "modestly";
        momentumLine = `This week funds ${wowDir} exposure ${wowSize} (${wow > 0 ? "+" : ""}${wow.toFixed(1)} index points).`;
      }
    }
 
    const trendLine = accel === "accelerating"
      ? (uk ? "Рух прискорюється — інституційна впевненість зростає." : "The move is accelerating — institutional conviction is growing.")
      : accel === "decelerating"
      ? (uk ? "Рух уповільнюється — стежте за можливим застоєм або розворотом." : "The move is decelerating — watch for a potential stall or reversal.")
      : accel === "stable"
      ? (uk ? "Темп зміни позиціонування стабільний." : "The pace of positioning change is stable.")
      : "";
 
    const avgLine = avg3w != null && avg8w != null
      ? (uk
          ? `Короткострокове середнє (3т: ${avg3w.toFixed(1)}) ${avg3w > avg8w ? "вище" : "нижче"} середньострокового (8т: ${avg8w.toFixed(1)}) — ${avg3w > avg8w ? "тренд посилюється" : "моментум слабшає"}.`
          : `Short-term average (3w: ${avg3w.toFixed(1)}) is ${avg3w > avg8w ? "above" : "below"} the medium-term average (8w: ${avg8w.toFixed(1)}) — ${avg3w > avg8w ? "strengthening trend" : "weakening momentum"}.`)
      : "";
 
    let setupSummary = "";
    if (safe >= 90) {
      setupSummary = uk
        ? `${name} на 3-річному екстремумі позиціонування — фонди тримають найбільшу лонг-позицію циклу на рівні ${safe.toFixed(0)}.`
        : `${name} is at a 3-year positioning extreme — funds hold their largest long position of the cycle at ${safe.toFixed(0)}.`;
    } else if (safe >= 65) {
      setupSummary = uk
        ? `${name} впевнено в бичачій зоні позиціонування на рівні ${safe.toFixed(0)} за 3-річною шкалою.`
        : `${name} sits firmly in the bullish positioning zone at ${safe.toFixed(0)} on the 3-year scale.`;
    } else if (safe <= 10) {
      setupSummary = uk
        ? `${name} на 3-річному шорт-екстремумі (${safe.toFixed(0)}). Фонди настільки ведмежі, як не були роками.`
        : `${name} is at a 3-year short extreme (${safe.toFixed(0)}). Funds are as bearish as they have been in years.`;
    } else if (safe <= 35) {
      setupSummary = uk
        ? `${name} у ведмежій зоні позиціонування на рівні ${safe.toFixed(0)}. Фонди тримають чистий шорт-нахил.`
        : `${name} is in a bearish positioning zone at ${safe.toFixed(0)}. Funds hold a net short bias.`;
    } else {
      setupSummary = uk
        ? `${name} у нейтральній зоні на рівні ${safe.toFixed(0)} — ні переконливо лонг, ні шорт.`
        : `${name} sits in a neutral zone at ${safe.toFixed(0)} — neither convincingly long nor short.`;
    }
 
    let contextualInterpretation = "";
    if (safe >= 90) {
      contextualInterpretation += uk
        ? `**Переповнений лонг.** Фонди на максимумах циклу. Ризик асиметричний — потенціал зростання обмежений, тоді як ризик зниження від примусової ліквідації реальний. `
        : `**Crowded long.** Funds are at cycle highs. The risk here is asymmetric — upside is limited while downside from forced liquidation is real. `;
    } else if (safe >= 65) {
      contextualInterpretation += uk
        ? `**Конструктивне позиціонування.** Це оптимальна зона для трендових угод. Фонди явно в лонгу, але ще не досягли переповненого екстремуму. `
        : `**Constructive positioning.** This is the sweet spot for trend trades. Funds are clearly positioned long but haven't reached the crowded extreme. `;
    } else if (safe <= 10) {
      contextualInterpretation += uk
        ? `**Переповнений шорт.** Ринок сильно позиціонований на зниження. Ризик повернення до середнього підвищений — будь-який позитивний каталізатор може спричинити різкий сквіз. `
        : `**Crowded short.** The market is heavily positioned for downside. Mean-reversion risk is elevated — any positive catalyst could spark a sharp squeeze. `;
    } else if (safe <= 35) {
      contextualInterpretation += uk
        ? `**Ведмеже позиціонування.** Фонди в шорті нижче порогу 35.`
        : `**Bearish positioning.** Funds are positioned short below the 35 threshold.`;
    } else {
      contextualInterpretation += uk
        ? `**Нейтральна зона.** Саме лише позиціонування не дає напрямкової переваги. Перед дією потрібна впевненість з інших джерел. `
        : `**Neutral zone.** Positioning alone provides no directional edge. Conviction from other sources is needed before acting. `;
    }
    if (trendLine) contextualInterpretation += `${trendLine} `;
    if (momentumLine) contextualInterpretation += `${momentumLine} `;
    if (avgLine) contextualInterpretation += `\n\n${avgLine}`;
 
    let gptCommentary = "";
    if (safe >= 90) {
      gptCommentary = uk
        ? `**Перевага позиціонування:** Немає для нового лонгу — ризик зміщений вниз звідси.\n\n**Підхід до угоди:** Уникайте нових лонгів. Розгляньте скорочення наявних позицій або тісні стопи.\n\n**Ключовий рівень:** Падіння COT Index нижче 75 сигналізуватиме, що натовп починає виходити.`
        : `**Positioning edge:** None from a fresh long entry — risk is skewed to the downside from here.\n\n**Trade approach:** Avoid new longs. Consider lightening existing positions or using tight stops.\n\n**Key level to watch:** A COT Index drop below 75 would signal the crowd is starting to exit.`;
    } else if (safe >= 65) {
      gptCommentary = uk
        ? `**Перевага позиціонування:** Лонг-нахил підтверджено — використовуйте слабкість як можливість.\n\n**Підхід до угоди:** Купуйте просідання в межах тренду. Тримайте стопи нижче недавніх мінімумів.\n\n**Ключовий рівень:** Стежте, щоб COT Index тримався вище 65 — падіння нижче змінить нахил.`
        : `**Positioning edge:** Long bias is confirmed — use weakness as an opportunity.\n\n**Trade approach:** Buy dips within the trend. Keep stops below recent swing lows.\n\n**Key level to watch:** Watch for COT Index to sustain above 65 — a drop below would shift the bias.`;
    } else if (safe <= 10) {
      gptCommentary = uk
        ? `**Перевага позиціонування:** Потенціал сквізу високий — обережно з новими шортами.\n\n**Підхід до угоди:** Уникайте додавання шортів. Стежте за каталізатором, що може змусити покривати.\n\n**Ключовий рівень:** Перетин COT Index вище 15 буде раннім підтвердженням формування сквізу.`
        : `**Positioning edge:** Squeeze potential is high — be cautious on fresh shorts.\n\n**Trade approach:** Avoid adding shorts. Watch for any catalyst that could force covering.\n\n**Key level to watch:** A COT Index cross above 15 would be early confirmation of a squeeze forming.`;
    } else if (safe <= 35) {
      gptCommentary = uk
        ? `**Перевага позиціонування:** Ведмежий нахил підтримується — ралі є можливостями для продажу.\n\n**Підхід до угоди:** Фейдьте силу, а не женіться за пробоєм. Шортіть у відскоки.\n\n**Ключовий рівень:** Якщо COT повернеться вище 45, ведмежа теза суттєво слабшає.`
        : `**Positioning edge:** Bearish bias is supported — rallies are selling opportunities.\n\n**Trade approach:** Fade strength rather than chasing breakdown. Short into bounces.\n\n**Key level to watch:** If COT rises back above 45, the bearish thesis weakens considerably.`;
    } else {
      gptCommentary = uk
        ? `**Перевага позиціонування:** Немає — нейтральне позиціонування означає, що ні бики, ні ведмеді не мають інституційної підтримки.\n\n**Підхід до угоди:** Чекайте напрямкового пробою вище 65 або нижче 35 перед входом.\n\n**Ключовий рівень:** Стійкий рух до будь-якої екстремальної зони сформує новий сетап.`
        : `**Positioning edge:** None — neutral positioning means neither bulls nor bears have institutional backing.\n\n**Trade approach:** Wait for a directional break above 65 or below 35 before committing.\n\n**Key level to watch:** A sustained move to either extreme zone would establish a new setup.`;
    }
 
    const checklist = [
      { label: uk ? "COT режим узгоджений з нахилом" : "COT regime agrees with bias",  pass: safe >= 65 || safe <= 35 },
      { label: uk ? "Flow state напрямковий"         : "Flow state is directional",     pass: flow !== "Neutral" },
      { label: uk ? "Не в найпереповненішій зоні"    : "Not in the most crowded zone",  pass: safe < 90 && safe > 10 },
      { label: uk ? "Моментум підтверджує напрям"    : "Momentum confirms direction",   pass: accel === "accelerating" },
    ];

    return {
      pct: safe, conviction, crowding, setupBias,
      setupSummary, contextualInterpretation, gptCommentary, checklist, contrarianRead,  
    };
  }, [asset]);

  const sparkProfile = useMemo(() => {
    if (!asset) return []
    const real = seasonalityData.find((s) => s.symbol === asset.symbol)
    if (real && Array.isArray(real.values) && real.values.length === 12) {
      return real.values
    }
    return []
  }, [asset, seasonalityData, t])

  if (!asset || !profile) {
    return (
      <Panel title={t("panels.assetExplorer")}>
        <div className="text-sm text-zinc-400">{t('ui.noAssetData')}</div>
      </Panel>
    );
  }

  const handleExportPDF = () => {
    const existing = document.querySelectorAll("#asset-pdf-report")
    existing.forEach((el, i) => { if (i > 0) el.remove() })
    const el = document.getElementById("asset-pdf-report")
    if (el) el.style.display = "block"
    setTimeout(() => {
      window.print()
      setTimeout(() => { if (el) el.style.display = "none" }, 500)
    }, 100)
  }

  return (
    <div className="space-y-4">
      {/* Hidden PDF report */}
      <AssetPDFReport
        asset={asset}
        profile={profile}
        sparkProfile={sparkProfile}
        seasonalityData={seasonalityData}
      />

      {/* ── HEADER PANEL — compact tab bar + asset title ── */}
      <Panel
        title={t("panels.assetExplorer")}
        right={
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 border border-zinc-800 small-panel-color px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition"
            >
              <Download size={11} />
              {t('ui.exportPdf')}
            </button>
            <GuideButton sectionKey="explorer" openGuide={openGuide} />
          </div>
        }
      >
        {/* Compact asset selector */}
        <div className="mb-3 -mx-1 flex flex-wrap gap-1">
          {assets.map((a) => {
            const isActive = a.symbol === asset.symbol
            const pct = Number(a.funds_percentile_3y)
            const dotColor = pct >= 65 ? '#4ade80' : pct <= 35 ? '#f87171' : '#94a3b8'
            return (
              <button
                key={a.symbol}
                onClick={() => setSelected(a.symbol)}
                style={{
                  padding: '3px 9px',
                  fontSize: '10px',
                  fontWeight: isActive ? 700 : 400,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  border: isActive
                    ? `1px solid rgba(96,165,250,0.6)`
                    : '1px solid rgba(255,255,255,0.07)',
                  background: isActive ? 'rgba(96,165,250,0.12)' : 'transparent',
                  color: isActive ? '#93c5fd' : 'rgba(148,163,184,0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <span style={{
                  width: '5px', height: '5px', borderRadius: '50%',
                  background: dotColor, flexShrink: 0,
                  boxShadow: isActive ? `0 0 5px ${dotColor}` : 'none',
                }} />
                {a.symbol}
              </button>
            )
          })}
        </div>

        {/* Asset title row */}
        <div className="pt-2">
          <div>
            <div className="text-xl font-semibold text-zinc-100">{asset.name}</div>
          </div>
        </div>
      </Panel>

      {/* ── MAIN GRID ── */}
      <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">

        {/* ── LEFT COLUMN ── */}
        <div className="space-y-4">

          {/* Metrics row */}
          <div className="grid gap-3 md:grid-cols-4 metric-card">
            <Metric label={t('ui.fundsNet')}     value={formatNumber(asset.funds_net)} />
            <Metric label={t('ui.dealerNet')}    value={formatNumber(asset.dealer_net)} />
            <Metric label={t('ui.openInterest')} value={formatNumber(asset.open_interest)} />
            <Metric label={t('ui.flowState')} value={translateFlowState(asset.flow_state || 'Neutral', t)} />
          </div>

          {/* Momentum bar */}
          <div className="small-panel-color px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="text-[11px] uppercase tracking-[0.22em] text-slate-200">{t('ui.momentum')}</span>
              <MomentumBadge asset={asset} size="md" />
              <div className="flex items-center gap-6 text-[12px] text-slate-200">
                {asset.funds_index_3w_avg != null && (
                  <span>3w avg: <span className={flowColor(asset.funds_index_3w_avg)}>
                    {asset.funds_index_3w_avg.toFixed(1)}
                  </span></span>
                )}
                {asset.funds_index_8w_avg != null && (
                  <span>8w avg: <span className={flowColor(asset.funds_index_8w_avg)}>
                    {asset.funds_index_8w_avg.toFixed(1)}
                  </span></span>
                )}
                {asset.funds_index_momentum != null && (
                  <span>{t('ui.vsTrend')} <span className={
                    asset.funds_index_momentum > 0 ? "text-emerald-400" :
                    asset.funds_index_momentum < 0 ? "text-rose-400" : "text-zinc-400"
                  }>
                    {asset.funds_index_momentum > 0 ? "+" : ""}
                    {asset.funds_index_momentum.toFixed(1)}
                  </span></span>
                )}
                {asset.funds_index_acceleration && (
                  <span className={
                    asset.funds_index_acceleration === "accelerating" ? "text-emerald-400" :
                    asset.funds_index_acceleration === "decelerating" ? "text-rose-400" :
                    "text-slate-200"
                  }>
                    {tAccel(asset.funds_index_acceleration)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Gauge + Bias Bar — combined */}
          <Panel title={t("panels.setupBiasGauge")}>
            <div className="grid gap-4 md:grid-cols-2 items-center">
              {/* Gauge with glow */}
              <div className="flex flex-col items-center">
                <div style={{
                  filter: profile.pct >= 65
                    ? 'drop-shadow(0 0 8px rgba(74,222,128,0.4))'
                    : profile.pct <= 35
                    ? 'drop-shadow(0 0 8px rgba(248,113,113,0.4))'
                    : 'none',
                }}>
                  <GaugeArc value={profile.pct} />
                </div>
                <div className="mt-1 text-center text-sm font-medium text-zinc-200">
                  {tBias(profile.setupBias)}
                </div>
                <div className="text-center text-[10px] uppercase tracking-[0.18em] text-zinc-500 mt-0.5">
                  {regimeLabel(profile.pct, t)} · {signalLabel(profile.pct, t)}
                </div>
                <div className="flex justify-between gap-2 text-[10px] uppercase">
                  <span className="text-zinc-500">{t('ui.conviction')} {formatPercentile(profile.conviction)}</span>
                  {' · '}
                  <span className="text-zinc-500">{t('ui.crowding')} {tCrowding(profile.crowding)}</span></div>
              </div>

              {/* Bias bar + summary */}
              <div className="space-y-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-200 mb-1">
                  {t('ui.positioningBias')}
                </div>
                <BiasBar value={profile.pct} />
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.15em] text-zinc-500">
                  <span>{t('ui.defensive')}</span>
                  <span className={flowColor(profile.pct)}>{formatPercentile(profile.pct)}</span>
                  <span>{t('ui.constructive')}</span>
                </div>
                <div className="p-3 text-xs text-blue-400 small-panel-color mt-2">
                  {profile.setupSummary}
                </div>
              </div>
            </div>
          </Panel>

          {/* Contextual Interpretation + GPT Commentary */}
          <div className="grid gap-3 xl:grid-cols-2">
            <Panel title={t("panels.contextualInterpretation")}>
              <div className="space-y-1">
                {renderNarrative(profile.contextualInterpretation)}
              </div>
            </Panel>
            <Panel title={t("panels.gptCommentaryLayer")}>
              <div className="space-y-1">
                {renderNarrative(profile.gptCommentary)}
              </div>
            </Panel>
          </div>

          {/* Seasonal Curve */}
          <Panel
            title={t("panels.assetCharts")}
            right={<span className="text-[10px] uppercase tracking-[0.22em] text-slate-200">{t('ui.seasonalContext')}</span>}
          >
            <div className="p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200 mb-3">
                {t('ui.seasonalCurve')}
              </div>
              {sparkProfile.length === 12 ? (
                <>
                  <MiniSparkline values={sparkProfile} positive={profile.pct >= 55} />
                  <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                    <span>{t('months.Jan')}</span>
                    <span className="text-blue-400">{t(`months.${SEASONAL_MONTHS[new Date().getMonth()]}`)}</span>
                    <span>{t('months.Dec')}</span>
                  </div>
                  <div className="mt-3 text-xs leading-5 text-zinc-400">
                    {t('ui.avgMonthlyCotDesc')}
                  </div>
                </>
              ) : (
                <div className="text-sm text-zinc-600">
                  Seasonal data not yet available for this asset.
                </div>
              )}
            </div>
          </Panel>

        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="space-y-4">

          <AIAnalysisPanel
            type="asset"
            data={{
              ...asset,
              contrarian_signal:     profile.contrarianRead?.signal || null,
              contrarian_label:      profile.contrarianRead?.label || null,
              contrarian_confidence: profile.contrarianRead?.confidence || null,
            }}
            aiLanguage={aiLanguage}
            title={t('ui.aiAssetAnalysis')}
          />
                    
          {/* Confirmation Checklist — with box-shadow on dots */}
          <Panel title={t("panels.confirmationChecklist")}>
            <div className="space-y-2">
              {profile.checklist.map((item, idx) => (
                <div
                  key={`${item.label}-${idx}`}
                  className="flex items-start gap-3 small-panel-color p-3"
                >
                  <div
                    className={cls(
                      "mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full",
                      item.pass ? "bg-emerald-400" : "bg-rose-400/60"
                    )}
                    style={{
                      boxShadow: item.pass
                        ? '0 0 8px rgba(74,222,128,0.6), 0 0 2px rgba(74,222,128,0.9)'
                        : '0 0 6px rgba(248,113,113,0.3)',
                    }}
                  />
                  <div>
                    <div className="text-sm text-zinc-100">{item.label}</div>
                    <div className={cls(
                      "mt-0.5 text-[10px] uppercase tracking-[0.18em]",
                      item.pass ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {item.pass ? t('ui.confirmed') : t('ui.notMet')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

                    {/* Contrarian Read — тільки для equity indices */}
{profile.contrarianRead && (
  <div className="default-bg">
    <div className="flex items-center border-b px-4 py-3 justify-between" style={{ borderColor: 'var(--panels-border)'}}>
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full rounded-full-dot bg-blue-400"></div>
        <div className="text-[11px] uppercase tracking-[0.22em]">
        {t('ui.contrarianCotRead')}
        </div>
      </div>
      <span style={{
        fontSize: '10px', padding: '1px 6px', borderRadius: '3px',
        textTransform: 'uppercase', letterSpacing: '0.1em',
        color: '#94a3b8', background: 'rgba(148,163,184,0.08)',
        border: '1px solid rgba(148,163,184,0.15)',
      }}>
        {profile.contrarianRead.confidence}
      </span>
    </div>         
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
      <span style={{
        padding: '2px 10px', borderRadius: '3px', flexShrink: 0,
        fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: profile.contrarianRead.color,
        background: `${profile.contrarianRead.color}12`,
        border: `1px solid ${profile.contrarianRead.color}30`,
      }}>
        {profile.contrarianRead.signal}
      </span>
      <span style={{ fontSize: '12px', color: profile.contrarianRead.color, fontWeight: 600 }}>
        {profile.contrarianRead.label}
      </span>
    </div>
    <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.7', marginBottom: '10px' }}>
      {profile.contrarianRead.simple}
    </div>
    <div style={{
      fontSize: '12px', color: '#60a5fa', lineHeight: '1.65',
      padding: '8px 12px', background: 'var(--small-panel-color)',
      border: '1px solid var(--accent-color)', borderRadius: '6px',
    }}>
      {profile.contrarianRead.action}
    </div>
    <div className="mt-2 pt-3 flex items-center gap-2">
      <div style={{ fontSize: '11px', color: '#b7d5ff' }}>
        {t('ui.directCot')} <span style={{ color: profile.pct >= 65 ? '#4ade80' : profile.pct <= 35 ? '#f87171' : '#94a3b8', fontWeight: 600 }}>
          {profile.setupBias} ({profile.pct.toFixed(0)})
        </span>
      </div>
    </div>
    </div>
  </div>
)}

          {/* Sector Peers */}
          <Panel title={t("panels.sectorPeers")}>
            <div className="space-y-2">
              {sectorPeers.length ? (
                sectorPeers.map((peer) => (
                  <button
                    key={peer.symbol}
                    onClick={() => setSelected(peer.symbol)}
                    className="w-full small-panel-color p-3 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-zinc-100">{peer.name}</div>
                      <div className={cls("text-sm font-medium", flowColor(peer.funds_percentile_3y))}>
                        {formatPercentile(peer.funds_percentile_3y)}
                      </div>
                    </div>
                    <div className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-slate-300">
                      {signalLabel(peer.funds_percentile_3y, t)}
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-sm text-slate-300">{t('ui.noPeerAssets')}</div>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function SignalHistoryTable({ items, loading }) {
  const { t } = useTranslation()
  const [filter, setFilter] = useState('all') // all | active | aging | invalidated
 
  const filtered = useMemo(() => {
    if (filter === 'all') return items
    return items.filter((s) => s.current_state === filter)
  }, [items, filter])
 
  const stateTone = (state) => {
    if (state === 'active')      return 'text-emerald-400'
    if (state === 'aging')       return 'text-blue-400'
    if (state === 'candidate')   return 'text-sky-400'
    if (state === 'stale')       return 'text-slate-200'
    if (state === 'invalidated') return 'text-rose-400'
    return 'text-slate-200'
  }
 
  const dirTone = (dir) =>
    dir === 'long' ? 'text-emerald-400' : dir === 'short' ? 'text-rose-400' : 'text-slate-200'
 
  const fmtDate = (iso) => {
    if (!iso) return '—'
    const [y, m, d] = iso.split('-')
    return `${d}.${m}.${y}`
  }
 
  const ScoreSparkline = ({ history }) => {
    if (!history?.length) return <span className="text-zinc-700">—</span>
    const vals = history.map((h) => h.score)
    const trend = vals[vals.length-1] - vals[0]
    const strokeColor = trend > 2 ? '#4ade80' : trend < -2 ? '#f87171' : '#71717a'
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    const range = max - min || 1
    const w = 60
    const h = 20
    const points = vals.map((v, i) => {
      const x = (i / (vals.length - 1 || 1)) * w
      const y = h - ((v - min) / range) * h
      return `${x},${y}`
    }).join(' ')
    return (
      <svg width={w} height={h} className="overflow-visible">
        <polyline points={points} fill="none" stroke={strokeColor} strokeWidth="1.5" />
        <circle
          cx={w}
          cy={h - ((vals[vals.length - 1] - min) / range) * h}
          r="2"
          fill="#a1a1aa"
        />
      </svg>
    )
  }
 
  return (
    <div className="space-y-3">
      {/* Filter tabs */}
      <div className="flex gap-1">
        {['all', 'active', 'aging', 'invalidated', 'stale'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cls(
              'border px-3 py-1 text-[10px] uppercase tracking-[0.2em] transition',
              filter === f
                ? 'border-amber-500/50 bg-amber-500/10 text-amber-300'
                : 'border-zinc-800 text-zinc-600 hover:text-zinc-400'
            )}
          >
            {f} ({f === 'all' ? items.length : items.filter((s) => s.current_state === f).length})
          </button>
        ))}
      </div>
 
      {loading && (
        <div className="space-y-2 p-4">
          {[100, 85, 70].map((w, i) => (
            <div key={i} className="h-3 animate-pulse rounded bg-zinc-800" style={{ width: `${w}%` }} />
          ))}
        </div>
      )}
 
      {!loading && filtered.length === 0 && (
        <div className="p-4 text-sm text-zinc-600">
          No signals found. Run the worker to populate signal history.
        </div>
      )}
 
      {!loading && filtered.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-[0.2em] text-zinc-600">
                <th className="px-3 py-2 text-left">{t('ui.asset')}</th>
                <th className="px-3 py-2 text-left">{t('ui.direction')}</th>
                <th className="px-3 py-2 text-left">{t('ui.stateCol')}</th>
                <th className="px-3 py-2 text-right">{t('ui.weeks')}</th>
                <th className="px-3 py-2 text-right">{t('ui.cotIndex')}</th>
                <th className="px-3 py-2 text-right">{t('ui.peak')}</th>
                <th className="px-3 py-2 text-left">{t('ui.flow')}</th>
                <th className="px-3 py-2 text-left">{t('ui.firstSeen')}</th>
                <th className="px-3 py-2 text-left">{t('ui.trend8wNow')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-zinc-900/60 hover:bg-zinc-900/30 transition">
                  <td className="px-3 py-2">
                    <div className="text-zinc-200">{s.name}</div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-zinc-600">{s.symbol} · {s.sector}</div>
                  </td>
                  <td className={cls("px-3 py-2 uppercase text-[11px] tracking-[0.2em]", dirTone(s.direction))}>
                    {s.direction === 'long' ? '↑ Long' : '↓ Short'}
                  </td>
                  <td className={cls("px-3 py-2 uppercase text-[10px] tracking-[0.18em]", stateTone(s.current_state))}>
                    {s.current_state}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-zinc-300">
                    {s.weeks_active}w
                  </td>
                  <td className={cls("px-3 py-2 text-right tabular-nums font-medium", flowColor(s.current_score))}>
                    {s.current_score != null ? s.current_score.toFixed(1) : '—'}
                  </td>
                  <td className={cls("px-3 py-2 text-right tabular-nums", flowColor(s.peak_score))}>
                    {s.peak_score != null ? s.peak_score.toFixed(1) : '—'}
                  </td>
                  <td className={cls(
                    "px-3 py-2 text-[10px] uppercase tracking-[0.12em]",
                    s.flow_state === 'Long Extreme'   ? 'text-emerald-400' :
                    s.flow_state === 'Short Extreme'  ? 'text-rose-400' :
                    s.flow_state === 'Accumulation'   ? 'text-emerald-300' :
                    s.flow_state === 'Distribution'   ? 'text-rose-300' :
                    'text-zinc-500'
                  )}>
                    {translateFlowState(s.flow_state, t) || '—'}
                  </td>
                  <td className="px-3 py-2 text-slate-200 tabular-nums text-xs">
                    {fmtDate(s.first_seen_date)}
                    {s.became_active_date && s.became_active_date !== s.first_seen_date && (
                      <div className="text-emerald-600">Active: {fmtDate(s.became_active_date)}</div>
                    )}
                    {s.invalidated_date && (
                      <div className="text-rose-600">Closed: {fmtDate(s.invalidated_date)}</div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <ScoreSparkline history={s.score_history} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function SignalsView({ assets, setActive, setSelected, aiLanguage, openGuide,seasonalityData = [] }) {
  const { t } = useTranslation()

  const macroSleeves = useMemo(() => {
    return Object.entries(MACRO_SLEEVES).map(([key, config]) => {
      const members = findAssetsExact(assets, config.members)
      const score = averagePercentile(members)
      return { key, score }
    })
  }, [assets])

  const growthScore = macroSleeves.find((x) => x.key === 'growth')?.score ?? null
  const inflationScore = macroSleeves.find((x) => x.key === 'inflation')?.score ?? null
  const policyScore = macroSleeves.find((x) => x.key === 'policy')?.score ?? null
  const grainsScore = macroSleeves.find((x) => x.key === 'grains')?.score ?? null

  const macroComposite = averagePercentile([
    { funds_percentile_3y: growthScore },
    { funds_percentile_3y: inflationScore },
    { funds_percentile_3y: grainsScore },
    { funds_percentile_3y: policyScore },
  ])

    const engine = useMemo(
    () => buildSignalEngine(assets, seasonalityData, macroComposite, t),
    [assets, seasonalityData, macroComposite, t]
  )

  const [stateFilter, setStateFilter] = useState('all')
  const [directionFilter, setDirectionFilter] = useState('all')
  const [sectorFilter, setSectorFilter] = useState('all')
  const [minScore, setMinScore] = useState(55)
  const [alertsOnly, setAlertsOnly] = useState(false)
 
  // Signal history state
  const [historyTab, setHistoryTab] = useState('live') // 'live' | 'history'

  const [peakScores, setPeakScores] = React.useState({})

  React.useEffect(() => {
    fetch('/api/signals/peaks')
      .then(r => r.json())
      .then(d => setPeakScores(d.peaks || {}))
      .catch(() => {})
  }, [])
    
 
    // Signal History = live engine signals (same source as Live tab)
  // База використовується тільки для закритих/resolved сигналів в майбутньому
  const signalHistory = useMemo(() => {
    return engine.signals.map(s => ({
      symbol:          s.symbol,
      name:            s.asset,
      sector:          s.sector,
      direction:       s.direction,
      current_state:   s.state,
      current_score:   s.percentile,
      peak_score: peakScores[s.symbol]?.peak_score ?? null,
      flow_state: assets.find(a => a.symbol === s.symbol)?.flow_state || null,
      weeks_active:    inferSignalAgeWeeks(assets.find(a => a.symbol === s.symbol)),
      first_seen_date: (() => {
        const a = assets.find(x => x.symbol === s.symbol)
        if (!a?.report_date) return null
        const wa = inferSignalAgeWeeks(a)
        const d = new Date(a.report_date)
        d.setDate(d.getDate() - (wa - 1) * 7)
        return d.toISOString().slice(0, 10)
      })(),
      last_seen_date: assets.find(a => a.symbol === s.symbol)?.report_date || null,
      score_history: (() => {
        const a = assets.find(x => x.symbol === s.symbol)
        if (!a) return []
        const pts = []
        if (a.funds_index_8w_avg != null) pts.push({ date: '8w', score: a.funds_index_8w_avg })
        if (a.funds_index_3w_avg != null) pts.push({ date: '3w', score: a.funds_index_3w_avg })
        pts.push({ date: 'now', score: s.percentile })
        return pts
      })(),
    }))
  }, [engine.signals, assets])
  
  const [sortBy, setSortBy] = useState('priority')

  const sectors = useMemo(() => {
    return ['all', ...Array.from(new Set(engine.signals.map((x) => x.sector).filter(Boolean)))]
  }, [engine.signals])

  const filteredSignals = useMemo(() => {
    let rows = [...engine.signals]

    if (stateFilter !== 'all') rows = rows.filter((x) => x.state === stateFilter)
    if (directionFilter !== 'all') rows = rows.filter((x) => x.direction === directionFilter)
    if (sectorFilter !== 'all') rows = rows.filter((x) => x.sector === sectorFilter)
    if (alertsOnly) rows = rows.filter((x) => x.alerts.length > 0)
    rows = rows.filter((x) => x.state === 'stale' || x.priorityScore >= minScore)

    rows.sort((a, b) => {
      if (sortBy === 'quality') return b.entryQualityScore - a.entryQualityScore
      if (sortBy === 'freshness') return b.freshnessScore - a.freshnessScore
      if (sortBy === 'age') return a.ageWeeks - b.ageWeeks
      return b.priorityScore - a.priorityScore
    })

    return rows
  }, [engine.signals, stateFilter, directionFilter, sectorFilter, minScore, alertsOnly, sortBy])

  const topSignal = filteredSignals[0] || null
  const activeAlerts = engine.alerts.slice(0, 10)

  return (
    <div className="space-y-4">

      {/* Tabs */}
      <div className="flex justify-between">
        <div className="flex flex-wrap gap-3">
  {[
    { key: 'live',    label: t('ui.liveSignals')},
    { key: 'history', label: t('ui.signalHistory')},
  ].map((tab) => (
    <button key={tab.key} onClick={() => setHistoryTab(tab.key)}
      className={`min-w-[72px] border px-3 py-2 text-xs uppercase tracking-[0.18em] transition ${
        historyTab === tab.key
          ? 'border-blue-400 bg-zinc-950 text-zinc-100'
          : 'small-panel-color text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
      }`}
      style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '5px' }}
    >
      <span>{tab.icon}</span>
      <span>{tab.label}</span>
    </button>
  ))}
</div>
        {/* Sync Signal History */}
        <button
            onClick={async () => {
              const r = await fetch('/api/signals/persist', { method: 'POST' })
              const d = await r.json()
              alert(d.ok ? `${t('ui.synced')}: ${d.report_date}` : d.message)
            }}
            className="border border-blue-400 text-blue-300 hover:bg-blue-400/10 px-2 py-1 text-xs uppercase tracking-[0.22em] transition"
          >
            {t('ui.syncNow')}
        </button>
      </div>

      {historyTab === 'history' ? (
        <Panel title={t('ui.signalLifecycleHistory')}>
          <SignalHistoryTable items={signalHistory} loading={false} />
        </Panel>
      ) : (<>

<div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
  <Panel title={t('ui.rankedLiveSignal')} right={<GuideButton sectionKey="signals" openGuide={openGuide} />}>
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5 metric-card">
      <Metric label={t('ui.signals')} value={engine.counts.total} />
      <Metric label={t('ui.active')}          value={engine.counts.active} />
      <Metric label={t('ui.aging')}           value={engine.counts.aging} />
      <Metric label={t('ui.invalidated')}     value={engine.counts.invalidated} />
      <Metric label={t('ui.alertFeed')}      value={engine.counts.alerts} />
    </div>
  </Panel>
  <AIAnalysisPanel
    type="signals"
    data={{ signals: engine.signals.slice(0, 8).map(s => ({
      asset: s.asset, symbol: s.symbol, direction: s.direction,
      percentile: s.percentile, state: s.state,
      entryQualityScore: s.entryQualityScore, sector: s.sector,
    }))}}
    aiLanguage={aiLanguage}
    title={t('ui.aiSignalAnalysis')}
  />
    </div>
          
<div className="grid gap-3 xl:grid-cols-2">
  {/* ── SHARP POSITION CHANGES ── */}
  {(() => {
    const sharpMoves = assets
      .filter(a => a.funds_index_wow_change != null && Math.abs(a.funds_index_wow_change) >= 6)
      .sort((a, b) => Math.abs(b.funds_index_wow_change) - Math.abs(a.funds_index_wow_change))
      .slice(0, 8)
    if (!sharpMoves.length) return null
    return (
    <Panel title={t('ui.sharpPositionChanges')} right={
      <div className="flex items-center gap-2">
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 7px rgba(251,191,36,0.9)' }} />
        <span className="text-[10px] uppercase tracking-[0.2em] text-amber-300">WoW ≥ 6pts</span>
      </div>
      }>
    <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {sharpMoves.map(a => {
            const wow = a.funds_index_wow_change
            const isUp = wow > 0
            const dc = isUp ? 'long-dir' : 'short-dir'
            const pct = Number(a.funds_percentile_3y)
            return (
              <button
                key={a.symbol}
                onClick={() => { setSelected(a.symbol); setActive('explorer') }}
                className="flex items-center justify-between gap-4 px-4 py-3 small-panel-color text-left last:border-r-0 hover:bg-white/[0.03] transition">
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>{a.name}</div>
                  <div style={{ fontSize: '9px', color: '#638cc4', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>
                    {a.symbol} · {normalizeSector(a.sector)}
                  </div>
                  <div style={{ fontSize: '10px', color: '#f4f8fe', marginTop: '2px' }}>
                    COT Index: <span style={{ color: pct >= 65 ? '#4ade80' : pct <= 35 ? '#f87171' : '#94a3b8', fontWeight: 600 }}>{pct.toFixed(0)}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div className={dc} style={{ fontSize: '18px', fontWeight: 800, lineHeight: 1 }}>
                    {isUp ? '+' : ''}{wow.toFixed(1)}
                  </div>
                  <div className={dc} style={{ fontSize: '12px', marginTop: '2px' }}>
                    {isUp ? `▲ ${t('ui.buying')}` : `▼ ${t('ui.selling')}`}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </Panel>
    )
  })()}

  {/* ── CROWDED WARNINGS ── */}
  {(() => {
    const crowded = assets.filter(a => {
      const pct = Number(a.funds_percentile_3y)
      return pct >= 88 || pct <= 12
    }).sort((a, b) => {
      return Math.abs(Number(b.funds_percentile_3y) - 50) - Math.abs(Number(a.funds_percentile_3y) - 50)
    })
    if (!crowded.length) return null
    return (
      <Panel title={t('ui.crowdedWarnings')} right={
        <div className="flex items-center gap-2">
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#f87171', boxShadow: '0 0 7px rgba(248,113,113,0.9)' }} />
          <span className="text-[10px] uppercase tracking-[0.2em] text-rose-400">
            {t('ui.assetsAtExtreme', { n: crowded.length, label: crowded.length === 1 ? t('ui.assetSingular') : t('ui.assetPlural') })}
          </span>
        </div>
        }>
        <div className="grid gap-3  " style={{ gridTemplateColumns: '1fr 1fr' }}>
          {crowded.map(a => {
            const pct = Number(a.funds_percentile_3y)
            const isLong = pct >= 88
            const dc = isLong ? 'long-dir' : 'short-dir'
            return (
              <button
                key={a.symbol}
                onClick={() => { setSelected(a.symbol); setActive('explorer') }}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-white/[0.03] transition text-left small-panel-color last:border-r-0"
              >
                <div>
                  <div className="text-sm font-semibold text-zinc-100">{a.name}</div>
                  <div className="mt-0.5 text-[9px] uppercase tracking-[0.1em]" style={{ color: '#638cc4' }}>
                    {a.symbol} · {normalizeSector(a.sector)}
                  </div>
                  <div className="mt-0.5 text-[10px] leading-4">
                    {isLong
                      ? t('ui.meanReversionRisk')
                      : t('ui.squeezeRisk')}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div className={dc} style={{ fontSize: '18px', fontWeight: 800, lineHeight: 1 }}>
                    {pct.toFixed(0)}
                  </div>
                  <div className="text-[9px] uppercase tracking-[0.1em] text-zinc-500 mt-0.5">
                    COT Index
                  </div>
                  <div className={dc} style={{textTransform: 'uppercase', fontSize: '10px'}}>
                    {isLong ? t('ui.crowdedLong') : t('ui.crowdedShort')}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </Panel>
    )
  })()}
</div>

          
<div className="grid gap-3 xl:grid-cols-[1.1fr_0.9fr]">
  <Panel
  title={t('ui.rankedSignals')}
  right={<span className="text-xs uppercase tracking-[0.22em] text-slate-200">{t('ui.visible', { n: filteredSignals.length })}</span>}
>
  {/* Filters inline */}
  <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6 pb-4">
    <CustomSelect value={stateFilter} onChange={setStateFilter} minWidth="100%"
      options={[{value:"all",label: t('ui.allStates')},{value:"active",label:"Active"},{value:"aging",label:"Aging"},
        {value:"candidate",label:t('ui.candidate')},{value:"stale",label:"Stale"},{value:"invalidated",label:"Invalidated"}]} />
    <CustomSelect value={directionFilter} onChange={setDirectionFilter} minWidth="100%"
      options={[{value:"all",label:t('ui.allBias')},{value:"long",label:"Long"},{value:"short",label:"Short"},{value:"neutral",label:"Neutral"}]} />
    <CustomSelect value={sectorFilter} onChange={setSectorFilter} minWidth="100%"
      options={sectors.map((s) => ({ value: s, label: s === "all" ? "All Sectors" : s }))} />
    <CustomSelect value={String(minScore)} onChange={(v) => setMinScore(Number(v))} minWidth="100%"
      options={[{value:"0",label:"Score 0+"},{value:"40",label:"Score 40+"},{value:"55",label:"Score 55+"},{value:"70",label:"Score 70+"}]} />
    <CustomSelect value={sortBy} onChange={setSortBy} minWidth="100%"
      options={[{ value: "priority", label: t('ui.priority') }, { value: "quality", label: t('ui.quality') },
        {value:"freshness",label:t('ui.freshness')},{value:"age",label:t('ui.age')}]}/>
    <button
      onClick={() => setAlertsOnly((v) => !v)}
      className={cls(
        'border px-1 py-1 text-[10px] tracking-[0.18em] transition w-full',
        alertsOnly
          ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
          : 'border-zinc-900 small-panel-color text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
      )}
    >
      {alertsOnly ? '⚡ ' + t('ui.alertsOn') : t('ui.alertsOnly')}
    </button>
  </div>
    <div className="space-y-3">
      {filteredSignals.length ? filteredSignals.map((signal) => (
        <button
          key={signal.id}
          onClick={() => {
            setSelected(signal.symbol)
            setActive('explorer')
          }}
          className="w-full default-bg p-4 text-left transition"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-sm text-zinc-100">{signal.asset}</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-200">
                {signal.symbol} · {signal.sector}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className={cls('inline-flex items-center border rounded-[3px] px-[5px] py-[1px] text-[10px] uppercase tracking-[0.22em]', stateTone(signal.state))}>
                {stateLabel(signal.state, t)}
              </span>
              <span className={cls('text-[11px] uppercase tracking-[0.2em]', directionTone(signal.direction))}>
                {directionLabel(signal.direction, t)}
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-4 text-xs signal-tag-grid">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-200">{t('ui.priority')}</div>
              <div className="mt-1 text-sm text-zinc-100">{formatPercentile(signal.priorityScore)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-200">{t('ui.entry')}</div>
              <div className="mt-1 text-sm text-zinc-100">{signal.conviction}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-200">{t('ui.freshness')}</div>
              <div className="mt-1 text-sm text-zinc-100">{formatPercentile(signal.freshnessScore)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-200">{t('ui.age')}</div>
              <div className="mt-1 text-sm text-zinc-100">{signal.ageWeeks}w</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-200">{t('ui.regime')}</div>
              <div className="mt-1 text-sm text-zinc-100">{signal.regime}</div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-5 signal-metric-grid">
            <div className="small-panel-color p-2 text-zinc-400">
              {t('ui.signalColon')} <span className="text-zinc-200">{signal.signalLabel}</span>
            </div>
            <div className="small-panel-color p-2 text-zinc-400">
              {t('ui.flowColon')} <span className="text-zinc-200">{translateFlowState(signal.flowState, t)}</span>
            </div>
            <div className="small-panel-color p-2 text-zinc-400">
              {t('ui.macroColon')} <span className="text-zinc-200">{formatPercentile(signal.macroScore)}</span>
            </div>
            <div className="small-panel-color p-2 text-zinc-400">
              {t('ui.seasonalityColon')} <span className="text-zinc-200">{formatPercentile(signal.seasonalityScore)}</span>
            </div>
          </div>
        </button>
      )) : (
        <div className="text-sm text-zinc-400">{t('ui.noSignalsMatch')}</div>
      )}
    </div>
  </Panel>

  <div className="space-y-4">
    <Panel
      title={t('ui.assetsInPlay')}
      right={<span className="text-xs uppercase tracking-[0.22em] text-blue-400">{t('ui.topSetupsWeek')}</span>}
    >
    <div className="space-y-3">
    {engine.signals
      .filter(s => s.state === 'active' || s.state === 'aging')
      .sort((a, b) => b.priorityScore - a.priorityScore)
      .slice(0, 6)
      .map((s) => {
        const ast = assets.find(x => x.symbol === s.symbol)
        const isLong = s.direction === 'long'
        const dc = isLong ? '#4ade80' : '#f87171'
        const pct = s.percentile
        const wow = ast?.funds_index_wow_change
        const accel = ast?.funds_index_acceleration
        const avg3 = ast?.funds_index_3w_avg
        const avg8 = ast?.funds_index_8w_avg
        const uk = t('__lang__') === 'uk'

        // WHY
        let why = ''
        if (pct != null) {
          if (isLong) {
            if (pct >= 90) why = uk
              ? `Хедж-фонди на 3-річному лонг-екстремумі (${pct.toFixed(0)}). Інституційна впевненість найсильніша за роки.`
              : `Hedge funds are at a 3-year long extreme (${pct.toFixed(0)}). Institutional conviction is as strong as it has been in years.`
            else if (pct >= 75) why = uk
              ? `Фонди тримають сильну лонг-позицію на рівні ${pct.toFixed(0)} за 3-річною шкалою. Позиціонування впевнено бичаче.`
              : `Funds hold a strong long position at ${pct.toFixed(0)} on the 3-year scale. Positioning is firmly bullish.`
            else why = uk
              ? `Фонди в лонгу на рівні ${pct.toFixed(0)} — вище порогу 65, що визначає активний сигнал.`
              : `Funds are positioned long at ${pct.toFixed(0)} — above the 65 threshold that defines an active signal.`
          } else {
            if (pct <= 10) why = uk
              ? `Хедж-фонди на 3-річному шорт-екстремумі (${pct.toFixed(0)}). Інституційний тиск продажу на максимумах циклу.`
              : `Hedge funds are at a 3-year short extreme (${pct.toFixed(0)}). Institutional selling pressure is at cycle highs.`
            else if (pct <= 25) why = uk
              ? `Фонди тримають сильну шорт-позицію на рівні ${pct.toFixed(0)} за 3-річною шкалою. Позиціонування впевнено ведмеже.`
              : `Funds hold a strong short position at ${pct.toFixed(0)} on the 3-year scale. Positioning is firmly bearish.`
            else why = uk
              ? `Фонди в шорті на рівні ${pct.toFixed(0)} — нижче порогу 35, що визначає активний сигнал.`
              : `Funds are positioned short at ${pct.toFixed(0)} — below the 35 threshold that defines an active signal.`
          }
          if (wow != null && Math.abs(wow) >= 4) {
            why += uk
              ? ` Цього тижня фонди ${wow > 0 ? 'наростили' : 'скоротили'} експозицію на ${Math.abs(wow).toFixed(1)} пунктів індексу${accel === 'accelerating' ? ', і рух прискорюється' : ''}.`
              : ` This week funds ${wow > 0 ? 'added' : 'cut'} exposure by ${Math.abs(wow).toFixed(1)} index points${accel === 'accelerating' ? ' and the move is accelerating' : ''}.`
          } else if (avg3 != null && avg8 != null && Math.abs(avg3 - avg8) >= 5) {
            const drift = avg3 - avg8
            why += uk
              ? ` 3т середнє (${avg3.toFixed(1)}) ${drift > 0 ? 'вище' : 'нижче'} 8т середнього (${avg8.toFixed(1)}) — тренд ${drift > 0 ? 'посилюється' : 'слабшає'}.`
              : ` 3w avg (${avg3.toFixed(1)}) is ${drift > 0 ? 'above' : 'below'} 8w avg (${avg8.toFixed(1)}) — ${drift > 0 ? 'strengthening' : 'weakening'} trend.`
          }
        }
 
        // WHAT TO DO
        const action = s.state === 'active'
          ? (isLong
            ? (uk
              ? 'Купуй просідання — інституційні гроші позиціоновані з тобою. Використовуй слабкість як можливість, а не силу для погоні.'
              : 'Buy dips — institutional money is positioned with you. Use weakness as opportunity, not strength to chase.')
            : (uk
              ? 'Продавай ралі — інституційні гроші проти цього активу. Фейдь силу, а не женися за пробоями вниз.'
              : 'Sell rallies — institutional money is against this asset. Fade strength rather than chasing breakdowns.'))
          : (isLong
            ? (uk
              ? 'Сигнал згасає — оптимальне вікно входу могло минути. Підтягни стопи на наявних лонгах, уникай нових входів без сильного підтвердження.'
              : 'Signal is aging — optimal entry window may have passed. Tighten stops on existing longs, avoid new entries without strong confirmation.')
            : (uk
              ? 'Сигнал згасає — найкраще вікно для шорту може бути позаду. Керуй наявними шортами обережно, нові входи потребують чітких тригерів.'
              : 'Signal is aging — best short entry window may be behind. Manage existing shorts carefully, new entries need clear triggers.'))
 
        // RISK NOTE
        let risk = ''
        if (pct >= 85 || pct <= 15) {
          risk = uk
            ? 'Переповнене позиціонування на екстремумі — будь-який каталізатор може спровокувати різке повернення до середнього. Використовуй визначені стопи.'
            : 'Crowded positioning at extreme — any catalyst could trigger sharp mean-reversion. Use defined stops.'
        } else if (s.state === 'aging') {
          risk = uk
            ? 'Сигнал активний кілька тижнів — згасаючий моментум підвищує ризик розвороту. Уважно стеж за наступним COT звітом.'
            : 'Signal has been active for several weeks — fading momentum raises reversal risk. Monitor next COT report closely.'
        } else {
          risk = uk
            ? 'Стеж за наступним тижневим COT звітом на будь-яку ознаку розвороту позиціонування.'
            : 'Monitor next week\u2019s COT report for any sign of positioning reversal.'
        }

        return (
          <div key={s.symbol} className="default-bg p-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize:'14px', fontWeight:400, color:'#f1f5f9' }}>{s.asset} ·</span>
                  <span style={{ fontSize:'10px', color:'#f1f5f9', textTransform:'uppercase', letterSpacing:'0.1em', paddingTop: '3px' }}>{s.symbol} · {s.sector}</span>
                  <span style={{
                    fontSize:'10px', padding:'1px 5px',marginTop: '3px' , borderRadius:'3px', textTransform:'uppercase', letterSpacing:'0.08em',
                    color: s.state==='active' ? '#4ade80' : '#fbbf24',
                    background: s.state==='active' ? 'rgba(74,222,128,0.08)' : 'rgba(251,191,36,0.08)',
                    border: `1px solid ${s.state==='active' ? 'rgba(74,222,128,0.2)' : 'rgba(251,191,36,0.2)'}`,
                  }}>{s.state}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize:'12px', fontWeight:700, color:dc }}>{isLong ? '↑ Long' : '↓ Short'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '11px', color: '#6085ff' }}>{translateFlowState(ast?.flow_state, t) || ''}</span></div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                {pct != null && <div style={{ fontSize:'22px', fontWeight:800, color:dc, lineHeight:1 }}>{pct.toFixed(0)}</div>}
                <div style={{ fontSize:'10px', color:'#6085ff', letterSpacing:'0.08em' }}>{t('ui.cotIndex')}</div>
                {wow != null && <div style={{ fontSize:'11px', color: wow>0?'#4ade80':'#f87171'}}>{wow>0?'+':''}{wow.toFixed(1)} this week</div>}
              </div>
            </div>

            {/* 4 metrics */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[
                { label: t('ui.entryQuality'), value: s.entryQualityScore?.toFixed(0) ?? '—' },
                { label: t('ui.priority'),      value: s.priorityScore?.toFixed(0) ?? '—' },
                { label: '3w avg',        value: avg3 != null ? avg3.toFixed(1) : '—' },
                { label: '8w avg',        value: avg8 != null ? avg8.toFixed(1) : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="small-panel-color px-1 py-1.5 text-center">
                  <div style={{ fontSize:'12px', fontWeight:700, color:'#e2e8f0' }}>{value}</div>
                  <div style={{ fontSize:'9px', color:'#a9cdff', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:'1px' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Why */}
            <div className="mb-2">
              <div style={{ fontSize:'10px', fontWeight:700, color:'#4ade80', textTransform:'uppercase', letterSpacing:'0.15em', marginBottom:'3px' }}>{t('ui.whyThisSignal')}</div>
              <div style={{ fontSize:'13px', color:'#cbd5e1', lineHeight:'1.65' }}>{why}</div>
            </div>

            {/* What to do */}
            <div className="mb-2">
              <div style={{ fontSize:'10px', fontWeight:700, color:'#60a5fa', textTransform:'uppercase', letterSpacing:'0.15em', marginBottom:'3px' }}>{t('ui.whatToDo')}</div>
              <div style={{ fontSize:'13px', color:'#cbd5e1', lineHeight:'1.65' }}>{action}</div>
            </div>

            {/* Risk */}
            <div>
              <div style={{ fontSize:'10px', fontWeight:700, color:'#f87171', textTransform:'uppercase', letterSpacing:'0.15em', marginBottom:'3px' }}>{t('ui.riskNote')}</div>
              <div style={{ fontSize:'13px', color:'#cbd5e1', lineHeight:'1.65' }}>{risk}</div>
            </div>
          </div>
        )
      })}
    {engine.signals.filter(s => s.state==='active'||s.state==='aging').length === 0 && (
      <div className="text-sm text-zinc-500">{t('ui.noActionableSignals')}</div>
    )}
  </div>
</Panel>

          <Panel
            title={t('ui.stateGuide')}
            right={<span className="text-xs uppercase tracking-[0.22em] text-slate-200">{t('ui.readingSignals')}</span>}
          >
            <div className="space-y-3 text-sm leading-7 text-zinc-300">
              <div><span className="text-zinc-100">{t('ui.candidateColon')}</span> {t('ui.candidateDesc')}</div>
              <div><span className="text-zinc-100">{t('ui.activeColon')}</span> {t('ui.activeDesc')}</div>
              <div><span className="text-zinc-100">{t('ui.agingColon')}</span> {t('ui.agingDesc')}</div>
              <div><span className="text-zinc-100">{t('ui.staleColon')}</span> {t('ui.staleDesc')}</div>
              <div><span className="text-zinc-100">{t('ui.invalidatedColon')}</span> {t('ui.invalidatedDesc')}</div>
            </div>
          </Panel>
        </div>
      </div>
      </>)}
    </div>
  )
}

function HistoryBootstrapButton() {
  const { t } = useTranslation()
  const [state, setState] = React.useState('idle')
  const [msg, setMsg] = React.useState('')
  const [lastRun, setLastRun] = React.useState(null)

  React.useEffect(() => {
    if (state !== 'running') return
    const iv = setInterval(async () => {
      try {
        const r = await fetch('/api/system/worker-status')
        const d = await r.json()
        const w = d?.worker?.history
        if (!w?.running) {
          setState(w?.last_status === 'ok' ? 'ok' : 'error')
          setMsg(w?.last_status || '')
          setLastRun(w?.last_run)
          clearInterval(iv)
        }
      } catch {}
    }, 4000)
    return () => clearInterval(iv)
  }, [state])

  const run = async () => {
    setState('running'); setMsg('')
    try {
      const r = await fetch('/api/system/run-history', { method: 'POST' })
      const d = await r.json()
      if (!d.ok) { setState('error'); setMsg(d.message) }
    } catch { setState('error'); setMsg('Network error') }
  }

  const color = state === 'ok' ? '#4ade80' : state === 'error' ? '#f87171' : state === 'running' ? '#fbbf24' : '#60a5fa'

  return (
    <div className="space-y-2">
      <button
        onClick={run}
        disabled={state === 'running'}
        className={cls(
          'border px-4 py-3 text-sm uppercase tracking-[0.22em] transition',
          state === 'running'
            ? 'cursor-not-allowed border-zinc-800 text-zinc-600'
            : 'border-blue-400 text-blue-300 hover:bg-blue-400/10'
        )}
      >
        {state === 'running' ? '⟳  ' + t('ui.running') : t('ui.historyBootstrap')}
      </button>
      {state === 'running' && (
        <div className="text-xs text-amber-400 tracking-[0.1em]">
          Worker is running in background. Page can be closed safely.
        </div>
      )}
      {msg && state !== 'running' && (
        <div style={{ fontSize: '12px', color, letterSpacing: '0.08em' }}>
          {state === 'ok' ? '✓ Completed successfully' : `✗ ${msg}`}
        </div>
      )}
      {lastRun && (
        <div className="text-xs text-zinc-600">
          Last run: {new Date(lastRun).toLocaleString('en-GB')}
        </div>
      )}
    </div>
  )
}

function UpdateDataView({ updateState, updateBusy, onRun, schedulerState, timezone = "Europe/Copenhagen" }) {
  const { t } = useTranslation()
  const isRunning   = updateState?.status === 'running'
  const statusTone  = updateState?.status === 'success'  ? 'text-emerald-400'
                    : updateState?.status === 'error'    ? 'text-rose-400'
                    : updateState?.status === 'running'  ? 'text-blue-400'
                    : 'text-zinc-400'
 
const fmtUtc = (iso) => {
    if (!iso) return '—'
    try {
      const label = TIMEZONES.find((tz) => tz.value === timezone)?.label?.match(/\(([^)]+)\)/)?.[1] || timezone
      return new Date(iso).toLocaleString('en-GB', {
        timeZone: timezone,
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }) + ` (${label})`
    } catch { return iso }
  }
 
  return (
    <div className="grid gap-3 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-4">
 
        {/* Manual run */}
        <Panel title={t("panels.updateControl")}>
          <div className="space-y-4">
            <div className="text-sm leading-7 text-zinc-300">
              {t('ui.runWorkerDesc')} <span className="text-zinc-100">cot_analytics</span>.
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onRun}
                disabled={updateBusy || isRunning}
                className={cls(
                  'border px-4 py-3 text-sm uppercase tracking-[0.22em] transition',
                  updateBusy || isRunning
                    ? 'cursor-not-allowed border-zinc-800 text-zinc-600'
                    : 'border-blue-400 text-blue-300 hover:bg-blue-400/10'
                )}
              >
                {isRunning ? '⟳  ' + t('ui.running') : t('ui.runWorker')}
              </button>
              <div className={cls('text-sm uppercase tracking-[0.2em]', statusTone)}>
                {updateState?.status || t('ui.idle')}
              </div>
            </div>
          </div>
        </Panel>
        {/* History Bootstrap */}
        <Panel title={t('ui.historyBootstrap')}>
          <div className="space-y-4">
            <div className="text-sm leading-7 text-zinc-300">
              {t('ui.runHistoryDesc')} <span className="text-zinc-100">{t('ui.presentLabel')}</span> {t('ui.runHistoryDesc2')}
              {t('ui.takesMinutes')} <span className="text-amber-300">{t('ui.minutesRange')}</span> — {t('ui.nonBlocking')}.
            </div>
            <HistoryBootstrapButton />
          </div>
        </Panel>
        {/* Worker Log */}
        <Panel title={t('ui.workerLog')}>
          <pre className="max-h-[420px] min-h-[78px] overflow-auto whitespace-pre-wrap text-sm leading-6 text-zinc-300">
            {updateState?.log || t('ui.noLogOutput')}
          </pre>
        </Panel>
      </div>
 
      <div className="space-y-4">
 
        {/* Auto-Schedule status */}
        <Panel title={t('ui.autoSchedule')}>
          <div className="space-y-3 text-sm text-zinc-300">
            {schedulerState ? (
              <>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-200">{t('ui.statusLabel')}</span>
                  <span className={schedulerState.scheduler_running ? 'text-emerald-400' : 'text-rose-400'}>
                    {schedulerState.scheduler_running ? t('ui.scheduleActive') : t('ui.scheduleStopped')}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-200">{t('ui.scheduleLabel')}</span>
                  <span className="text-zinc-300">{t('__lang__') === 'uk' ? 'Щоп\'ятниці о 18:30 UTC (20:30 CEST / час Данії)' : schedulerState.schedule}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-200">{t('ui.nextRun')}</span>
                  <span className="text-amber-300">{fmtUtc(schedulerState.next_run_utc)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-200">{t('ui.lastAutoRun')}</span>
                  <span>{fmtUtc(schedulerState.last_auto_run_utc)}</span>
                </div>
                <div className="mt-2 border border-zinc-900 bg-zinc-950 p-3 text-xs text-slate-200">
                  {t('ui.cftcPublishesNote')}
                </div>
              </>
            ) : (
              <div className="text-zinc-600">
                {t('ui.schedulerUnavailable')}
              </div>
            )}
          </div>
        </Panel>
 
        {/* Run Status */}
        <Panel title={t('ui.runStatus')}>
          <div className="space-y-3 text-sm text-zinc-300">
            <div className="flex justify-between gap-4">
              <span className="text-slate-200">{t('ui.statusLabel')}</span>
              <span className={statusTone}>{updateState?.status || t('ui.idle')}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-200">{t('ui.started')}</span>
              <span>{fmtUtc(updateState?.started_at)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-200">{t('ui.finished')}</span>
              <span>{fmtUtc(updateState?.finished_at)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-200">{t('ui.returnCode')}</span>
              <span>{updateState?.return_code ?? '—'}</span>
            </div>
          </div>
        </Panel>
 
        {/* Errors */}
        <Panel title={t('ui.errors')}>
          <div className="text-sm leading-7 text-zinc-300">
            {updateState?.error || t('ui.noErrorsReported')}
          </div>
        </Panel>
 
      </div>
    </div>
  )
}

const TIMEZONES = [
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

function AlertTestButton() {
  const [email, setEmail]   = useState("")
  const [status, setStatus] = useState(null) // null | "sending" | "ok" | "error"
  const [msg, setMsg]       = useState("")
 
  const sendTest = () => {
    if (!email) return
    setStatus("sending")
    setMsg("")
    fetch("/api/alerts/test-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email_enabled: true, email_to: email }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          setStatus("ok")
          setMsg(json.message || "Test email sent!")
        } else {
          setStatus("error")
          setMsg(json.error || "Failed")
        }
      })
      .catch((e) => { setStatus("error"); setMsg(String(e)) })
  }
 
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="recipient@email.com"
          className="border border-zinc-800 bg-[#080808] px-3 py-2 text-sm text-zinc-200 outline-none min-w-[220px] placeholder:text-zinc-700"
        />
        <button
          onClick={sendTest}
          disabled={!email || status === "sending"}
          className={cls(
            "border px-3 py-2 text-[11px] uppercase tracking-[0.2em] transition",
            email && status !== "sending"
              ? "border-sky-500/50 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20"
              : "cursor-not-allowed border-zinc-800 text-zinc-600"
          )}
        >
          {status === "sending" ? "Sending..." : "Send Test"}
        </button>
      </div>
      {msg && (
        <div className={cls("text-xs", status === "ok" ? "text-emerald-400" : "text-rose-400")}>
          {msg}
        </div>
      )}
    </div>
  )
}

function SettingsView({
  uiLanguage,
  aiLanguage,
  syncAiWithUi,
  timezone,
  onChangeUiLanguage,
  onChangeAiLanguage,
  onToggleSyncAiWithUi,
  onChangeTimezone,
}) {
  const { t } = useTranslation();
  
 
  return (
    
    <>
      <div className="settings-panel">
        <Panel title={t("settings.title")}>
      <div className="space-y-6 text-sm text-zinc-300">
        <LanguageSettings
          uiLanguage={uiLanguage}
          aiLanguage={aiLanguage}
          syncAiWithUi={syncAiWithUi}
          onChangeUiLanguage={onChangeUiLanguage}
          onChangeAiLanguage={onChangeAiLanguage}
          onToggleSyncAiWithUi={onToggleSyncAiWithUi} />

        {/* Timezone selector */}
        <div className="space-y-2">
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200">
            Display Timezone
          </div>
          <CustomSelect
            value={timezone}
            onChange={onChangeTimezone}
            options={TIMEZONES}
            minWidth="280px" />
          <div className="text-xs text-zinc-600">
            Used for displaying timestamps in Update tab and scheduler times.
          </div>
        </div>

        {/* Email Alerts */}
        <div className="space-y-3">
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200">
            Email Alerts (Test)
          </div>
          <AlertTestButton />
        </div>
      </div>
    </Panel></div></>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WATCHLIST — новий компонент + інструкції підключення
// Вставити в App.jsx перед функцією App()
// ─────────────────────────────────────────────────────────────────────────────
 
function WatchlistView({ assets, setActive, setSelected, aiLanguage = "en", watchlist, setWatchlist }) {
  const { t } = useTranslation()
 
  // ── Filtered watchlist assets ─────────────────────────────────────────────
  const watchedAssets = useMemo(() =>
    assets.filter((a) => watchlist.includes(a.symbol)),
    [assets, watchlist]
  )
 
  // ── All assets sorted for the "add" selector ──────────────────────────────
  const sortedAssets = useMemo(() =>
    [...assets]
      .filter((a) => !watchlist.includes(a.symbol))
      .sort((a, b) => {
        const sa = normalizeSector(a.sector || "")
        const sb = normalizeSector(b.sector || "")
        if (sa !== sb) return sa.localeCompare(sb)
        return (a.name || "").localeCompare(b.name || "")
      }),
    [assets, watchlist]
  )
 
  const addToWatchlist = (symbol) => {
    if (!watchlist.includes(symbol)) {
      setWatchlist((prev) => [...prev, symbol])
    }
  }
 
  const removeFromWatchlist = (symbol) => {
    setWatchlist((prev) => prev.filter((s) => s !== symbol))
  }
 
  const openAsset = (symbol) => {
    setSelected(symbol)
    setActive("explorer")
  }
 
  // ── Empty state ───────────────────────────────────────────────────────────
  if (watchedAssets.length === 0) {
    return (
      <div className="space-y-4">
        <section className="title-border">
          <div className="px-4 py-3">
            <span className="text-[11px] uppercase tracking-[0.25em] text-slate-200">
              {t('ui.watchlist')}
            </span>
          </div>
          <div className="p-4 space-y-4">
            <p className="text-sm text-slate-200">
              {aiLanguage === "uk"
                ? "Додай активи для швидкого доступу та моніторингу."
                : "Add assets to monitor them in one place."}
            </p>
            <AddAssetRow sortedAssets={sortedAssets} onAdd={addToWatchlist} aiLanguage={aiLanguage} />
          </div>
        </section>
      </div>
    )
  }
 
  return (
    <div className="space-y-4">
 
      {/* Header + Add */}
      <section className="title-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full rounded-full-dot bg-blue-400"></div>
            <span className="text-[11px] uppercase tracking-[0.25em] text-slate-200">
            {t('ui.watchlist')}
            </span>
          </div>
          <span className="text-[11px] uppercase tracking-[0.22em] text-zinc-600">
            {watchedAssets.length} {t('ui.assetsLower')}
          </span>
        </div>
        <div className="p-4">
          <AddAssetRow sortedAssets={sortedAssets} onAdd={addToWatchlist} aiLanguage={aiLanguage} />
        </div>
      </section>
 
      {/* Asset grid */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {watchedAssets.map((asset) => (
          <WatchlistCard
            key={asset.symbol}
            asset={asset}
            onOpen={openAsset}
            onRemove={removeFromWatchlist}
            aiLanguage={aiLanguage}
          />
        ))}
      </div>
    </div>
  )
}
 
// ── Add asset row ─────────────────────────────────────────────────────────────
function AddAssetRow({ sortedAssets, onAdd, aiLanguage }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState("")
 
  const handleAdd = () => {
    if (selected) {
      onAdd(selected)
      setSelected("")
    }
  }
 
  return (
    <div className="flex items-center gap-3">
      <CustomSelect
          value={selected}
          onChange={setSelected}
          placeholder={t('ui.selectAsset')}
          options={sortedAssets.map((a) => ({ value: a.symbol, label: `${a.name} (${a.symbol})` }))}
          minWidth="220px"
        />
      <button
        onClick={handleAdd}
        disabled={!selected}
        className={cls(
          "border px-4 py-2 text-[11px] uppercase tracking-[0.22em] transition",
          selected
            ? "border-amber-500/50 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
            : "cursor-not-allowed border-zinc-800 text-zinc-600"
        )}
      >
        {t('ui.add')}
      </button>
    </div>
  )
}
 
// ── Single watchlist card ─────────────────────────────────────────────────────
function WatchlistCard({ asset, onOpen, onRemove, aiLanguage }) {
  const { t } = useTranslation()
  const idx    = asset.funds_percentile_3y
  const dirMap = { rising: "↑", falling: "↓", flat: "→" }
  const arrow  = dirMap[asset.funds_index_direction] || ""
 
  const idxBg = idx >= 90 ? "border-rose-800/50 bg-rose-950/20"
              : idx <= 10 ? "border-emerald-800/50 bg-emerald-950/20"
              : "default-bg"
 
  return (
    <div className={cls("border p-4 space-y-3 transition hover:brightness-110", idxBg)}>
 
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-medium text-zinc-100">{asset.name}</div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-600">
            {asset.symbol} · {normalizeSector(asset.sector)}
          </div>
        </div>
        {/* Remove button */}
        <button
          onClick={() => onRemove(asset.symbol)}
          className="shrink-0 default-bg px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-600 hover:text-zinc-400 transition"
          title={t('ui.remove')}
        >
          ✕
        </button>
      </div>
 
      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-2">
        {/* COT Index */}
        <div className="small-panel-color p-2 text-center">
          <div className="text-[9px] uppercase tracking-[0.18em] text-zinc-200">Index</div>
          <div className={cls("mt-1 text-base font-semibold tabular-nums", flowColor(idx))}>
            {idx != null ? idx.toFixed(1) : "n/a"}
          </div>
        </div>
        {/* Momentum */}
        <div className="small-panel-color p-2 text-center">
          <div className="text-[9px] uppercase tracking-[0.18em] text-zinc-200">Momentum</div>
          <div className={cls(
            "mt-1 text-sm font-medium",
            asset.funds_index_direction === "rising"  ? "text-emerald-400" :
            asset.funds_index_direction === "falling" ? "text-rose-400" : "text-slate-200"
          )}>
            {arrow} {asset.funds_index_wow_change != null
              ? `${asset.funds_index_wow_change > 0 ? "+" : ""}${asset.funds_index_wow_change.toFixed(1)}`
              : "—"}
          </div>
        </div>
        {/* Flow State */}
        <div className="small-panel-color p-2 text-center">
          <div className="text-[9px] uppercase tracking-[0.18em] text-zinc-200">Flow</div>
          <div className={cls("mt-1 text-[10px] uppercase tracking-[0.14em]", flowColor(idx))}>
            {translateFlowState(asset.flow_state || 'Neutral', t)}
          </div>
        </div>
      </div>
 
      {/* Funds net */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-600 uppercase tracking-[0.18em]">Net</span>
        <span className={cls("tabular-nums font-medium", Number(asset.funds_net) > 0 ? "text-emerald-400" : Number(asset.funds_net) < 0 ? "text-rose-400" : "text-slate-200")}>
          {asset.funds_net != null
            ? new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(asset.funds_net)
            : "—"}
        </span>
      </div>
 
      {/* COT Index bar */}
      <div className="h-1 overflow-hidden bg-blue-950 rounded">
        <div
          className={cls("h-full transition-all", flowColor(idx).replace("text-", "bg-"))}
          style={{ width: `${Math.max(2, idx ?? 0)}%` }}
        />
      </div>
 
      {/* Open in Explorer */}
      <button
        onClick={() => onOpen(asset.symbol)}
        className="w-full default-bg py-1.5 text-[10px] uppercase tracking-[0.22em] text-slate-200"
      >
        {t('ui.openInExplorer')}
      </button>
    </div>
  )
}



// Parses the custom markup:
//   [[BOLD_UPPER]]text[[/]]  → <p> with bold + uppercase styling, own line
//   [[BOLD]]text[[/]]        → <span> with bold, inline
//   \n\n                     → paragraph break
//
function renderGuideContent(text) {
  if (!text) return null
 
  // Split on double newlines first to get paragraphs
  const paragraphs = text.split(/\n\n/)
 
  return paragraphs.map((para, pi) => {
    // Check if the entire paragraph is a [[BOLD_UPPER]] block
    const upperMatch = para.match(/^\[\[BOLD_UPPER\]\]([\s\S]*?)\[\[\/\]\]$/)
    if (upperMatch) {
      return (
        <p key={pi} style={{
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          fontSize: '11px',
          color: '#e2e8f0',
          margin: '18px 0 6px 0',
        }}>
          {upperMatch[1]}
        </p>
      )
    }
 
    // Otherwise parse inline [[BOLD]]...[[/]] markers
    const parts = para.split(/(\[\[BOLD\]\][\s\S]*?\[\[\/\]\])/)
    const rendered = parts.map((part, i) => {
      const boldMatch = part.match(/^\[\[BOLD\]\]([\s\S]*?)\[\[\/\]\]$/)
      if (boldMatch) {
        return <span key={i} style={{ fontWeight: 700, color: '#e2e8f0' }}>{boldMatch[1]}</span>
      }
      // Plain text — render links as <a> if they look like URLs
      return part.split(/(https?:\/\/[^\s]+)/g).map((chunk, j) => {
        if (/^https?:\/\//.test(chunk)) {
          return (
            <a key={j} href={chunk} target="_blank" rel="noopener noreferrer"
              style={{ color: '#60a5fa', textDecoration: 'underline', wordBreak: 'break-all' }}>
              {chunk}
            </a>
          )
        }
        return <span key={j}>{chunk}</span>
      })
    })
 
    return (
      <p key={pi} style={{
        margin: '0 0 12px 0',
        lineHeight: '1.7',
        color: '#a1a1aa',
        fontSize: '13px',
      }}>
        {rendered}
      </p>
    )
  })
}

function renderNoteText(text) {
  if (!text) return null
  return text.split("\n").map((line, i) => {
    if (!line.trim()) return <div key={i} className="h-2" />
    const parts = line.split(/(\*\*[^*]+\*\*)/g)
    const rendered = parts.map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <span key={j}
            className="font-semibold text-zinc-100"
            style={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.9em' }}
          >
            {part.slice(2, -2)}
          </span>
        )
      }
      return <span key={j}>{part}</span>
    })
    return <div key={i} className="leading-7">{rendered}</div>
  })
}

function ResearchNotesView({ aiLanguage = "en" }) {
  const { t } = useTranslation()
  const [notes, setNotes]       = React.useState([])
  const [loading, setLoading]   = React.useState(true)
  const [typeFilter, setTypeFilter] = React.useState("all")
  const [expanded, setExpanded] = React.useState({})
  const [modalNote, setModalNote] = React.useState(null)
  const [translations, setTranslations] = React.useState({}) // { [note.id]: { text, loading } }

const translateNote = async (note) => {
  const targetLang = note.metadata?.language === 'uk' ? 'en' : 'uk'
  setTranslations(prev => ({ ...prev, [note.id]: { text: '', loading: true } }))
  try {
    const r = await fetch('/api/gpt/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: note.content, target: targetLang }),
    })
    const d = await r.json()
    setTranslations(prev => ({ ...prev, [note.id]: { text: d.text, loading: false } }))
  } catch {
    setTranslations(prev => ({ ...prev, [note.id]: { text: '', loading: false } }))
  }
}

// Блокуємо скрол фону коли модалка відкрита
React.useEffect(() => {
  if (modalNote) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
  return () => { document.body.style.overflow = '' }
}, [modalNote])

  const load = React.useCallback(() => {
    setLoading(true)
    fetch(`/api/notes?type=${typeFilter}`)
      .then(r => r.json())
      .then(d => setNotes(d.items || []))
      .catch(() => setNotes([]))
      .finally(() => setLoading(false))
  }, [typeFilter])

  React.useEffect(() => { load() }, [load])

  const togglePin = async (id) => {
    await fetch(`/api/notes/${id}/pin`, { method: 'PATCH' })
    load()
  }

  const deleteNote = async (id) => {
    await fetch(`/api/notes/${id}`, { method: 'DELETE' })
    setNotes(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = async () => {
    if (!window.confirm(t('ui.clearAllConfirm'))) return
    await fetch(`/api/notes?type=${typeFilter}`, { method: 'DELETE' })
    load()
  }

  const typeOptions = [
    { value: 'all',         label: t('ui.allTypes') },
    { value: 'macro',       label: t('nav.macro') },
    { value: 'asset',       label: t('ui.asset') },
    { value: 'correlation', label: t('nav.correlation') },
    { value: 'signals',     label: t('nav.signals') },
    { value: 'seasonality', label: t('nav.seasonality') },
  ]

  const typeBadge = (noteType) => {
    const map = {
      macro:       { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  label: 'Macro' },
      asset:       { color: '#4ade80', bg: 'rgba(74,222,128,0.1)',  label: 'Asset' },
      correlation: { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', label: 'Correlation' },
      signals:     { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  label: 'Signals' },
      seasonality: { color: '#34d399', bg: 'rgba(52,211,153,0.1)',  label: 'Seasonality' },
    }
    return map[noteType] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', label: t }
  }

  const pinnedNotes = notes.filter(n => n.is_pinned)
  const regularNotes = notes.filter(n => !n.is_pinned)

  return (
    <div className="space-y-4">
      {/* Header */}
      <Panel title={t('ui.researchNotes')}
        right={
          <div className="flex items-center gap-3">
            <CustomSelect
              value={typeFilter}
              onChange={setTypeFilter}
              minWidth="0"
              options={typeOptions}
            />
            {notes.length > 0 && (
              <button onClick={clearAll}
                className="border border-zinc-800 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-zinc-500 hover:border-rose-900 hover:text-rose-400 transition">
                {t('ui.clearAll')}
              </button>
            )}
          </div>
        }
      >
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span>{notes.length} {t('ui.notesLower')}</span>
          {pinnedNotes.length > 0 && <span>· 📌 {pinnedNotes.length}{t('ui.pinnedLower')}</span>}
        </div>
      </Panel>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="border border-zinc-900 p-4 space-y-2">
              <div className="h-3 animate-pulse rounded bg-zinc-800 w-1/3" />
              <div className="h-3 animate-pulse rounded bg-zinc-800 w-full" />
              <div className="h-3 animate-pulse rounded bg-zinc-800 w-4/5" />
            </div>
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="border border-zinc-900 small-panel-color p-10 text-center">
          <div style={{ fontSize: '28px', opacity: 0.2, marginBottom: '12px' }}>📝</div>
          <div className="text-sm text-zinc-500">
            {t('ui.noNotesYet')}
          </div>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[...pinnedNotes, ...regularNotes].map(note => {
            const badge = typeBadge(note.type)
            const isExpanded = !!expanded[note.id]
            const preview = note.content.slice(0, 300) + (note.content.length > 300 ? '...' : '')
            const date = new Date(note.created_at).toLocaleDateString('en-GB', {
              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })

            return (
              <div key={note.id} className="border rounded-[8px] border-blue-900"
                style={{
                  borderColor: note.is_pinned ? 'rgba(251,191,36,0.25)' : undefined,
                  cursor: 'default',
                  transition: 'border-color 0.15s',
                }}
                onClick={() => setModalNote(note)}
                onMouseEnter={e => e.currentTarget.style.borderColor = note.is_pinned ? 'rgba(251,191,36,0.5)' : 'rgba(96,165,250,0.25)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = note.is_pinned ? 'rgba(251,191,36,0.25)' : ''}>
                {/* Note header */}
                <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-zinc-900">
                  <div className="flex items-start gap-2 min-w-0">
                    {note.is_pinned && <span style={{ fontSize:'13px', flexShrink:0, marginTop:'1px' }}>📌</span>}
                    <div className="min-w-0">
                      <div
                        className="text-sm font-medium text-zinc-100 truncate cursor-pointer hover:text-blue-300 transition"
                        onClick={() => setModalNote(note)}
                      >
                        {note.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span style={{
                          fontSize:'9px', padding:'1px 6px', borderRadius:'3px',
                          textTransform:'uppercase', letterSpacing:'0.1em',
                          color: badge.color, background: badge.bg,
                        }}>{badge.label}</span>
                        {note.metadata?.symbol && (
                          <span className="text-[10px] text-zinc-500 uppercase tracking-[0.1em]">
                            {note.metadata.symbol}
                          </span>
                        )}
                        <span className="text-[10px] text-zinc-600">{date}</span>
                      </div>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    
                    <button onClick={(e) => { e.stopPropagation(); togglePin(note.id) }}
                      title={note.is_pinned ? 'Unpin' : 'Pin'}
                      style={{
                        padding: '4px 6px', fontSize:'12px',
                        color: note.is_pinned ? '#fbbf24' : '#475569',
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        transition: 'color 0.15s',
                      }}>
                      {note.is_pinned ? '📌' : '📍'}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteNote(note.id) }}
                      style={{
                        display:'flex', alignItems:'center', justifyContent:'center',
                        width:'24px', height:'24px',
                        border:'1px solid rgba(255,255,255,0.08)',
                        color:'#475569', background:'transparent', cursor:'pointer',
                        fontSize:'12px', transition:'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(248,113,113,0.4)'; e.currentTarget.style.color='#f87171' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; e.currentTarget.style.color='#475569' }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
                {/* Note content */}
                <div className="px-4 py-3">
                  <div className="text-sm leading-7 text-zinc-300">
                    {translations[note.id]?.loading
                      ? <div className="flex items-center gap-2 text-zinc-500"><span style={{animation:'spin 1s linear infinite', display:'inline-block'}}>⟳</span> Translating...</div>
                      : renderNoteText(translations[note.id]?.text || (isExpanded ? note.content : preview))
                    }
                  </div>
                  {note.content.length > 180 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setExpanded(prev => ({ ...prev, [note.id]: !isExpanded })) }}
                      className="mt-2 text-[10px] uppercase tracking-[0.15em] text-blue-400 hover:text-blue-300 transition"
                    >
                      {isExpanded
                        ? (aiLanguage === 'uk' ? '▲ Згорнути' : '▲ Collapse')
                        : (aiLanguage === 'uk' ? '▼ Читати далі' : '▼ Read more')}
                    </button>
                  )}
                </div>
              {/* Modal */}
{modalNote && (
  <>
    {/* Backdrop */}
    <div
      className="fixed inset-0 z-50 bg-black/70"
      onClick={() => setModalNote(null)}
    />
    {/* Modal window */}
    <div style={{
      position: 'fixed', zIndex: 51,
      top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '90%', maxWidth: '680px',
      maxHeight: '85vh',
      display: 'flex', flexDirection: 'column',
      background: '#0d1117',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
    }}onClick={(e) => e.stopPropagation()}>
      {/* Modal header */}
      <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-zinc-900" style={{ flexShrink: 0 }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            {modalNote.is_pinned && <span style={{ fontSize:'13px' }}>📌</span>}
            <span className="text-sm font-semibold text-zinc-100">{modalNote.title}</span>
          </div>
          <div className="flex items-center gap-2">
            {(() => {
              const badge = typeBadge(modalNote.type)
              return (
                <span style={{
                  fontSize:'9px', padding:'1px 6px', borderRadius:'3px',
                  textTransform:'uppercase', letterSpacing:'0.1em',
                  color: badge.color, background: badge.bg,
                }}>{badge.label}</span>
              )
            })()}
            {modalNote.metadata?.symbol && (
              <span className="text-[10px] text-zinc-500 uppercase tracking-[0.1em]">
                {modalNote.metadata.symbol}
              </span>
            )}
            <span className="text-[10px] text-zinc-600">
              {new Date(modalNote.created_at).toLocaleDateString('en-GB', {
                day:'2-digit', month:'short', year:'numeric',
                hour:'2-digit', minute:'2-digit'
              })}
            </span>
          </div>
        </div>
        <button
          onClick={() => setModalNote(null)}
          style={{
            display:'flex', alignItems:'center', justifyContent:'center',
            width:'28px', height:'28px', flexShrink: 0,
            border:'1px solid rgba(255,255,255,0.08)',
            color:'#475569', background:'transparent', cursor:'pointer',
            fontSize:'13px', transition:'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(248,113,113,0.4)'; e.currentTarget.style.color='#f87171' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.08)'; e.currentTarget.style.color='#475569' }}
        >
          ✕
        </button>
      </div>
      {/* Modal content — scrollable */}
      <div className="overflow-y-auto px-5 py-4" style={{ flex: 1 }}>
        {translations[modalNote.id]?.loading ? (
        <div className="flex items-center gap-2 text-zinc-500 text-sm">
          <span style={{ animation:'spin 1s linear infinite', display:'inline-block' }}>⟳</span>
          Translating...
        </div>
      ) : (
        <div className="text-sm leading-7 text-zinc-300">
          {renderNoteText(translations[modalNote.id]?.text || modalNote.content)}
        </div>
      )}
      </div>
      {/* Modal footer */}
      <div className="flex items-center gap-3 px-5 py-3 border-t border-zinc-900" style={{ flexShrink: 0 }}>
      <button
        onClick={() => {
          if (translations[modalNote.id]?.text) {
            setTranslations(prev => { const n = {...prev}; delete n[modalNote.id]; return n })
          } else {
            translateNote(modalNote)
          }
        }}
        style={{
          fontSize:'11px',
          color: translations[modalNote.id]?.text ? '#60a5fa' : '#475569',
          background: translations[modalNote.id]?.text ? 'rgba(96,165,250,0.08)' : 'transparent',
          border: `1px solid ${translations[modalNote.id]?.text ? 'rgba(96,165,250,0.3)' : 'rgba(255,255,255,0.08)'}`,
          padding:'4px 10px', cursor:'pointer', transition:'all 0.15s',
          textTransform:'uppercase', letterSpacing:'0.12em',
        }}
      >
        {translations[modalNote.id]?.loading
          ? '⟳ Translating...'
          : translations[modalNote.id]?.text
          ? '🌐 Show Original'
          : '🌐 Translate'}
      </button>
      <button onClick={() => { togglePin(modalNote.id); setModalNote(prev => prev ? {...prev, is_pinned: !prev.is_pinned} : null) }}
          style={{
            fontSize:'11px', color: modalNote.is_pinned ? '#fbbf24' : '#475569',
            background:'transparent', border:'1px solid rgba(255,255,255,0.08)',
            padding:'4px 10px', cursor:'pointer', transition:'all 0.15s',
            textTransform:'uppercase', letterSpacing:'0.12em',
          }}
        >
          {modalNote.is_pinned ? '📌 Unpin' : '📍 Pin'}
        </button>
        <button
          onClick={() => { deleteNote(modalNote.id); setModalNote(null) }}
          style={{
            fontSize:'11px', color:'#f87171',
            background:'transparent', border:'1px solid rgba(248,113,113,0.2)',
            padding:'4px 10px', cursor:'pointer', transition:'all 0.15s',
            textTransform:'uppercase', letterSpacing:'0.12em',
          }}
        >
          Delete
        </button>
      </div>
    </div>
  </>
)}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// NOTE: this function reads `uiLanguage` from settings.
// Make sure your Settings component saves uiLanguage to the same settings
// object that GuideView receives (it already exists per your description).
//
function GuideView({ setActive, initialSection = null, uiLanguage = "en" }) {
  const lang = uiLanguage || 'en'
  const [activeKey, setActiveKey] = React.useState(
    initialSection && GUIDE_SECTIONS.find(s => s.key === initialSection)
      ? initialSection
      : GUIDE_SECTIONS[0].key
  )
  const [openBlocks, setOpenBlocks] = React.useState({})

  React.useEffect(() => {
    if (initialSection && GUIDE_SECTIONS.find(s => s.key === initialSection)) {
      setActiveKey(initialSection)
      setOpenBlocks({}) // reset accordion on tab change
    }
  }, [initialSection])

  // When tab changes — reset accordion
  const handleTabChange = (key) => {
    setActiveKey(key)
    setOpenBlocks({})
  }

  const toggleBlock = (bi) => {
    setOpenBlocks(prev => ({ ...prev, [bi]: !prev[bi] }))
  }

  const activeSection = GUIDE_SECTIONS.find(s => s.key === activeKey) || GUIDE_SECTIONS[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid rgba(90,104,116,0.5)',
        padding: '20px 28px 0', flexShrink: 0,
      }}>
        <div style={{ fontSize: '14px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#f1f5f9', marginBottom: '20px' }}>
          {lang === 'uk' ? 'Посібник користувача' : 'Platform Guide'}
        </div>

        {/* Tab bar */}
        <div className="flex flex-wrap gap-2" style={{ paddingBottom: '16px' }}>
          {GUIDE_SECTIONS.map(sec => {
            const isActive = activeKey === sec.key
            const label = typeof sec.title === 'object' ? sec.title[lang] : sec.title
            return (
              <button key={sec.key} onClick={() => handleTabChange(sec.key)}
                className={`min-w-[72px] border px-3 py-2 text-xs uppercase tracking-[0.18em] transition ${
                  isActive
                    ? 'border-blue-400 bg-zinc-950 text-zinc-100'
                    : 'border-zinc-900 small-panel-color text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
                style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <span>{sec.icon}</span>
                <span>{label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Content area */}
      <div className="guide-content" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        {/* Section summary */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.7)', margin: 0, lineHeight: 1.7 }}>
            {typeof activeSection.summary === 'object' ? activeSection.summary[lang] : activeSection.summary}
          </p>
        </div>

        {/* Accordion blocks */}
        {activeSection.blocks.map((block, bi) => {
          const isOpen = !!openBlocks[bi]
          const title = typeof block.title === 'object' ? block.title[lang] : block.title
          const content = typeof block.content === 'object' ? block.content[lang] : block.content
          return (
            <div key={bi} style={{
              marginBottom: '8px',
              border: `1px solid ${isOpen ? 'rgba(90,104,116,0.6)' : 'rgba(90,104,116,0.25)'}`,
              borderRadius: '8px',
              overflow: 'hidden',
              transition: 'border-color 0.15s',
            }}>
              {/* Accordion header — clickable */}
              <button
                onClick={() => toggleBlock(bi)}
                style={{
                  width: '100%', textAlign: 'left',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 20px',
                  background: isOpen ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                  border: 'none', cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                <span style={{
                  fontSize: '11px', fontWeight: 700,
                  color: isOpen ? activeSection.color : '#94a3b8',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  transition: 'color 0.15s',
                }}>
                  {title}
                </span>
                <span style={{
                  fontSize: '12px', color: isOpen ? activeSection.color : '#475569',
                  transition: 'transform 0.2s, color 0.15s',
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  display: 'inline-block',
                }}>
                  ▾
                </span>
              </button>

              {/* Accordion body */}
              {isOpen && (
                <div style={{ padding: '4px 20px 20px', borderTop: '1px solid rgba(90,104,116,0.25)' }}>
                  {renderGuideContent(content)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
 

export default function App() {
  const [active, setActive] = useState('workspace')
  const [selected, setSelected] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    typeof window !== 'undefined' && window.innerWidth <= 768
  )
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
  fetch('/api/calendar?limit=80'),
  fetch('/api/news?limit=200'),
])

    if (!statusRes.ok || !assetsRes.ok || !workspaceRes.ok) {
      throw new Error('Failed to load API data')
}

const statusJson      = await statusRes.json()
const assetsJson      = await assetsRes.json()
const workspaceJson   = await workspaceRes.json()
const seasonalityJson = seasonalityRes.ok ? await seasonalityRes.json() : { items: [] }
const calendarJson    = calendarRes.ok    ? await calendarRes.json()    : { items: [] }
const newsJson        = newsRes?.ok       ? await newsRes.json()        : { items: [] }

setStatus(statusJson)
setAssets(assetsJson.items || [])
setSeasonalityData(seasonalityJson.items || [])
setWorkspaceData({
  macro_regime: workspaceJson.macro_regime || null,
  releases: workspaceJson.releases || [],
  calendar: calendarJson.items?.length ? calendarJson.items : (workspaceJson.calendar || []),
  news: newsJson.items?.length ? newsJson.items : (workspaceJson.news || []),
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
    fetchUpdateStatus()
    fetchSchedulerStatus()
    const timer = setInterval(() => {
      fetchUpdateStatus()
      fetchSchedulerStatus()
    }, 5000)
    return () => clearInterval(timer)
  }, [])
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
            : view}
        </div>
      </main>
    </div>
  )
}