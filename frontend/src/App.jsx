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
  Star,
  Zap,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSettings from "./components/LanguageSettings";
import AIAnalysisPanel from "./components/AIAnalysisPanel";
import CustomSelect from "./components/CustomSelect"
import GuideButton from "./components/GuideButton"



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

function signalStrengthLabel(score) {
  if (score == null || Number.isNaN(score)) return 'Unrated'
  if (score >= 85) return 'High Conviction'
  if (score >= 70) return 'Strong'
  if (score >= 55) return 'Moderate'
  if (score >= 40) return 'Developing'
  return 'Weak'
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
    <div className={cls("flex items-center gap-1.5", isSmall ? "text-[10px]" : "text-xs")}>
      {/* Direction arrow */}
      <span className={cls("font-bold tabular-nums", dirColor, isSmall ? "text-xs" : "text-sm")}>
        {arrow}
      </span>
 
      {/* WoW change */}
      {wow != null && (
        <span className={cls("tabular-nums uppercase tracking-[0.14em]", dirColor)}>
          {wow > 0 ? "+" : ""}{wow.toFixed(1)}
        </span>
      )}
 
      {/* Acceleration dot */}
      {accel && !isSmall && (
        <div className={cls("h-1.5 w-1.5 rounded-full", accelColor)} title={accel} />
      )}
 
      {/* 3w / 8w avg — only in md size */}
      {!isSmall && avg3w != null && avg8w != null && (
        <span className="text-zinc-600 tabular-nums">
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

function signalLabel(percentile) {
  if (percentile == null) return 'No Signal'
  if (percentile >= 90) return 'Strong Long Bias'
  if (percentile >= 65) return 'Long Bias'
  if (percentile <= 10) return 'Strong Short Bias'
  if (percentile <= 35) return 'Short Bias'
  return 'Neutral'
}

function regimeLabel(percentile) {
  if (percentile == null) return 'Insufficient History'
  if (percentile >= 90) return 'Crowded Long'
  if (percentile >= 65) return 'Trend Build'
  if (percentile <= 10) return 'Crowded Short'
  if (percentile <= 35) return 'Short Build'
  return 'Range'
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
  const pct = Number(asset?.funds_percentile_3y)
  if (Number.isNaN(pct)) return 99
  const distanceFromCenter = Math.abs(pct - 50)
  if (distanceFromCenter >= 40) return 1
  if (distanceFromCenter >= 30) return 2
  if (distanceFromCenter >= 20) return 3
  if (distanceFromCenter >= 10) return 4
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
  if (state === 'active') return 'text-emerald-300 border-emerald-700/40 bg-emerald-500/5'
  if (state === 'aging') return 'text-amber-300 border-amber-700/40 bg-amber-500/5'
  if (state === 'stale') return 'text-zinc-400 border-zinc-700/40 bg-zinc-500/5'
  if (state === 'invalidated') return 'text-rose-300 border-rose-700/40 bg-rose-500/5'
  return 'text-sky-300 border-sky-700/40 bg-sky-500/5'
}

function stateLabel(state) {
  if (state === 'active') return 'Active'
  if (state === 'aging') return 'Aging'
  if (state === 'stale') return 'Stale'
  if (state === 'invalidated') return 'Invalidated'
  return 'Candidate'
}

function directionTone(direction) {
  if (direction === 'long') return 'text-emerald-300'
  if (direction === 'short') return 'text-rose-300'
  return 'text-zinc-400'
}

function directionLabel(direction) {
  if (direction === 'long') return 'Long'
  if (direction === 'short') return 'Short'
  return 'Neutral'
}

function entryQualityBucket(score) {
  if (score >= 85) return 'High Conviction'
  if (score >= 70) return 'Strong'
  if (score >= 55) return 'Moderate'
  if (score >= 40) return 'Developing'
  return 'Weak'
}

function alertImpactTone(impact) {
  if (impact === 'high') return 'text-rose-300 border-rose-700/40 bg-rose-500/5'
  if (impact === 'medium') return 'text-amber-300 border-amber-700/40 bg-amber-500/5'
  return 'text-sky-300 border-sky-700/40 bg-sky-500/5'
}

function buildSignalAlerts(signal) {
  const alerts = []

  if (signal.state === 'active' && signal.entryQualityScore >= 70) {
    alerts.push({
      type: 'new-signal',
      impact: signal.entryQualityScore >= 85 ? 'high' : 'medium',
      title: `${signal.asset} ready for action`,
      text: `${directionLabel(signal.direction)} setup is active with ${entryQualityBucket(signal.entryQualityScore).toLowerCase()} entry quality.`,
    })
  }

  if (signal.state === 'aging') {
    alerts.push({
      type: 'aging',
      impact: 'medium',
      title: `${signal.asset} signal is aging`,
      text: `The setup is still valid, but freshness is fading after ${signal.ageWeeks} inferred weeks in market.`,
    })
  }

  if (signal.state === 'invalidated') {
    alerts.push({
      type: 'invalidated',
      impact: 'high',
      title: `${signal.asset} signal lost quality`,
      text: `The signal no longer meets minimum quality conditions and should be treated as invalidated.`,
    })
  }

  if (signal.state === 'stale') {
    alerts.push({
      type: 'stale',
      impact: 'low',
      title: `${signal.asset} signal is stale`,
      text: `The directional idea is too old or too weak to rank as an actionable setup.`,
    })
  }

  if (signal.regimeShift === 'bullish-activation') {
    alerts.push({
      type: 'regime-shift',
      impact: 'high',
      title: `${signal.asset} entered bullish activation`,
      text: `Positioning moved into a stronger long-biased regime with improving entry conditions.`,
    })
  }

  if (signal.regimeShift === 'bearish-activation') {
    alerts.push({
      type: 'regime-shift',
      impact: 'high',
      title: `${signal.asset} entered bearish activation`,
      text: `Positioning moved into a stronger short-biased regime with improving entry conditions.`,
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

function buildSignalEngine(assets, seasonalityRows = [], macroComposite = null) {
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
        regime: regimeLabel(percentile),
        signalLabel: signalLabel(percentile),
        entryQualityScore: Number(entryQualityScore.toFixed(1)),
        freshnessScore: Number(freshnessScore.toFixed(1)),
        regimeAlignmentScore: Number(regimeAlignmentScore.toFixed(1)),
        seasonalityScore: Number(seasonalityScore.toFixed(1)),
        macroScore: Number(macroScore.toFixed(1)),
        directionalStrength: Number(directionalStrength.toFixed(1)),
        priorityScore: Number(priorityScore.toFixed(1)),
        conviction: entryQualityBucket(entryQualityScore),
        regimeShift,
      }

      return {
        ...signal,
        alerts: buildSignalAlerts(signal),
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

function dispersionLabel(value) {
  if (value == null) return 'Unavailable'
  if (value >= 60) return 'Highly Dispersed'
  if (value >= 40) return 'Dispersed'
  if (value >= 25) return 'Moderately Clustered'
  return 'Tightly Clustered'
}

function safeName(pair, side = 'left') {
  if (!pair) return 'n/a'
  return side === 'left' ? pair.left?.name || 'n/a' : pair.right?.name || 'n/a'
}

function buildCorrelationNarrative(
  { avgDistance, avgAlignment, alignedPairs, opposedPairs, sameSectorPairs, crossSectorPairs },
  t
) {
  const topAligned = alignedPairs?.[0];
  const topOpposed = opposedPairs?.[0];

  const crossBias =
    crossSectorPairs > sameSectorPairs
      ? "Cross-sector relationships dominate the current map."
      : "Same-sector relationships dominate the current map.";

  const summary =
    avgDistance == null
      ? "No live positioning narrative is available yet."
      : `The cross-asset positioning map is currently ${dispersionLabel(
          avgDistance,
          t
        ).toLowerCase()}, with average alignment at ${formatPercentile(
          avgAlignment
        )} and an average percentile gap of ${formatPercentile(
          avgDistance
        )} across the tracked universe.`;

  const interpretation =
    !topAligned && !topOpposed
      ? "There is not enough data to interpret live pair structure."
      : `The closest live positioning match is ${safeName(
          topAligned,
          "left"
        )} ↔ ${safeName(
          topAligned,
          "right"
        )}, while the widest current positioning gap is ${safeName(
          topOpposed,
          "left"
        )} ↔ ${safeName(topOpposed, "right")}. ${crossBias}`;

  const tradingRelevance =
    avgDistance == null
      ? "Trading relevance is unavailable without pair data."
      : avgDistance >= 60
        ? "The market is highly fragmented. This favors selective relative-value thinking over broad one-direction macro conviction."
        : avgDistance >= 40
          ? "The market is moderately dispersed. Some sleeves are aligned, but cross-asset signals should still be confirmed before trade execution."
          : "The market is relatively clustered. Cross-asset confirmation is stronger, and macro themes are traveling more consistently together.";

  const whatToWatch =
    !topAligned && !topOpposed
      ? "Wait for more live data."
      : `Watch whether the current positioning gap between ${safeName(
          topOpposed,
          "left"
        )} and ${safeName(
          topOpposed,
          "right"
        )} begins to narrow, and whether the positioning match between ${safeName(
          topAligned,
          "left"
        )} ↔ ${safeName(
          topAligned,
          "right"
        )} remains stable. A break in these live relationships can signal regime transition.`;

  return { summary, interpretation, tradingRelevance, whatToWatch };
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
  if (score == null) return 'Insufficient Data'
  if (score >= 80) return 'Strong Risk-On'
  if (score >= 65) return 'Risk-On Bias'
  if (score <= 20) return 'Strong Defensive'
  if (score <= 35) return 'Defensive Bias'
  return 'Balanced'
}

function macroVerdict(growth, inflation, policy, t) {
  const values = [growth, inflation, policy].filter((x) => x != null && !Number.isNaN(x))
  if (!values.length) return 'Macro composite unavailable.'
  const avg = values.reduce((sum, x) => sum + x, 0) / values.length
  if (avg >= 70) return 'Broad COT backdrop is supportive of cyclical and pro-risk positioning.'
  if (avg <= 30) return 'Broad COT backdrop is defensive, with risk appetite under pressure.'
  return 'Current COT backdrop is balanced across major sleeves.'
}

function macroPhase(score, t) {
  if (score == null) return 'Unavailable'
  if (score >= 80) return 'Extreme Long'
  if (score >= 65) return 'Constructive'
  if (score <= 20) return 'Extreme Defensive'
  if (score <= 35) return 'Defensive'
  return 'Balanced'
}

function macroDispersionLabel(value, t) {
  if (value == null) return 'Unavailable'
  if (value >= 35) return 'High Internal Divergence'
  if (value >= 20) return 'Moderate Internal Divergence'
  if (value >= 10) return 'Mild Internal Divergence'
  return 'Tightly Aligned'
}

function buildMacroNarrative({ growth, inflation, policy }, t) {
	const values = [growth, inflation, policy].filter(
		(x) => x != null && !Number.isNaN(x)
	  );

	const composite = values.length
		? values.reduce((sum, x) => sum + x, 0) / values.length
		: null;

	const strongestSleeve = [
		{ key: "Growth", value: growth },
		{ key: "Inflation", value: inflation },
		{ key: "Policy", value: policy },
	  ]
		.filter((x) => x.value != null && !Number.isNaN(x.value))
		.sort((a, b) => b.value - a.value)[0];

	const weakestSleeve = [
		{ key: "Growth", value: growth },
		{ key: "Inflation", value: inflation },
		{ key: "Policy", value: policy },
	  ]
		.filter((x) => x.value != null && !Number.isNaN(x.value))
		.sort((a, b) => a.value - b.value)[0];

	const dispersion =
		strongestSleeve && weakestSleeve
		  ? strongestSleeve.value - weakestSleeve.value
		  : null;

	const summary =
		composite == null
		  ? "No macro narrative is available yet."
		  : `The macro positioning backdrop is currently ${macroLabel(
			  composite,
			  t
			).toLowerCase()}, with a composite score of ${formatPercentile(
			  composite
			)} and sleeve dispersion at ${formatPercentile(
			  dispersion
			)} across growth, inflation, and policy.`;

	const interpretation =
		!strongestSleeve || !weakestSleeve
		  ? "There is not enough sleeve data to interpret the macro structure."
		  : `${strongestSleeve.key} is currently the strongest sleeve at ${formatPercentile(
			  strongestSleeve.value
			)}, while ${weakestSleeve.key} is the weakest at ${formatPercentile(
			  weakestSleeve.value
			)}. Internal sleeve dispersion is ${macroDispersionLabel(
			  dispersion,
			  t
			).toLowerCase()}, which suggests the macro composite is being driven more by ${strongestSleeve.key.toLowerCase()} than by a uniformly aligned market.`;

	const tradingRelevance =
		composite == null
		  ? "Trading relevance is unavailable without macro sleeve data."
		  : dispersion != null && dispersion >= 35
			? "Macro positioning has high internal divergence. Be careful with broad risk-on or risk-off assumptions, because the composite is not being confirmed evenly across sleeves."
			: composite >= 70
			  ? "Macro positioning is supportive of pro-risk and cyclical expressions, with reasonably coherent sleeve support."
			  : composite <= 30
				? "Macro positioning is defensive. This favors caution on aggressive risk-taking and raises the importance of capital preservation and selective exposure."
				: "Macro positioning is balanced. This is not a high-conviction broad macro environment, so confirmation from structure, price action, or cross-asset context matters more.";

	const whatToWatch =
		!strongestSleeve || !weakestSleeve
		  ? "Wait for more sleeve data."
		  : `Watch whether ${weakestSleeve.key} begins to improve and whether ${strongestSleeve.key} remains stable. The macro regime becomes more credible when sleeve dispersion narrows and all three sleeves move into better alignment rather than relying on one dominant sleeve.`;

	return {
		composite,
		dispersion,
		summary,
		interpretation,
		tradingRelevance,
		whatToWatch,
	};
}

function seasonalCellTone(value) {
  if (value == null || Number.isNaN(value)) return 'bg-zinc-950 text-zinc-600'
  if (value >= 70) return 'bg-emerald-500/20 text-emerald-300'
  if (value >= 55) return 'bg-emerald-500/10 text-emerald-200'
  if (value <= 30) return 'bg-rose-500/20 text-rose-300'
  if (value <= 45) return 'bg-rose-500/10 text-rose-200'
  return 'bg-zinc-900 text-zinc-300'
}

function seasonalBiasLabel(value) {
  if (value == null || Number.isNaN(value)) return 'Unavailable'
  if (value >= 70) return 'Strong Tailwind'
  if (value >= 55) return 'Tailwind'
  if (value <= 30) return 'Strong Headwind'
  if (value <= 45) return 'Headwind'
  return 'Mixed'
}

function seasonalBiasTone(value) {
  if (value == null || Number.isNaN(value)) return 'text-slate-200'
  if (value >= 55) return 'text-emerald-300'
  if (value <= 45) return 'text-rose-300'
  return 'text-amber-300'
}

function buildSeasonalityNarrative(rows, t) {
  const valid = rows.filter((x) => x.current != null && !Number.isNaN(x.current))
  if (!valid.length) return { breadth: null, strongest: null, weakest: null, summary: 'No seasonality narrative is available yet.', interpretation: 'There is not enough seasonal data to interpret the current calendar window.', tradingRelevance: 'Trading relevance is unavailable without seasonality data.', whatToWatch: 'Wait for more seasonal inputs.' }
  const bullishCount = valid.filter((x) => x.current >= 55).length
  const bearishCount = valid.filter((x) => x.current <= 45).length
  const breadth = ((bullishCount - bearishCount) / valid.length) * 100
  const strongest = [...valid].sort((a, b) => b.current - a.current)[0]
  const weakest = [...valid].sort((a, b) => a.current - b.current)[0]
  const summary = `The current seasonal map shows ${bullishCount} supportive windows and ${bearishCount} weak windows across the tracked universe, with breadth at ${formatPercentile(breadth)}.`
  const interpretation = `${strongest.name || strongest.asset} currently has the strongest seasonal tailwind at ${formatPercentile(strongest.current)}, while ${weakest.name || weakest.asset} shows the weakest seasonal window at ${formatPercentile(weakest.current)}.`
  const tradingRelevance = breadth >= 20 ? 'Seasonal breadth is supportive. Calendar tendencies can act as a useful confirmation layer for long-biased trade selection.' : breadth <= -20 ? 'Seasonal breadth is weak. This argues for more caution and selective exposure rather than broad participation.' : 'Seasonal breadth is mixed. Seasonality should be treated as a secondary filter rather than a primary trade driver.'
  const whatToWatch = 'Watch whether the strongest seasonal windows remain aligned with live positioning and price structure, and whether currently weak seasonal assets begin to improve into the next calendar turn.'
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
    <svg viewBox={`0 0 ${width} ${height}`} className="h-[84px] w-full rounded border border-zinc-900 bg-[#080808] p-2" preserveAspectRatio="none" aria-hidden="true">
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
        <div className="pdf-section-title">Key Metrics</div>
        <div className="pdf-grid">
          <div className="pdf-metric">
            <div className="pdf-metric-label">COT Index</div>
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
            <div className="pdf-metric-label">Flow State</div>
            <div className={`pdf-metric-value ${idx >= 65 ? "c-green" : idx <= 35 ? "c-red" : "c-neutral"}`} style={{ fontSize: "13px" }}>
              {asset.flow_state || "Neutral"}
            </div>
            <div className="pdf-metric-sub">{profile.setupBias}</div>
          </div>
          <div className="pdf-metric">
            <div className="pdf-metric-label">Momentum</div>
            <div className={`pdf-metric-value ${direction === "rising" ? "c-green" : direction === "falling" ? "c-red" : "c-neutral"}`}>
              {dirArrow} {asset.funds_index_wow_change != null ? `${asset.funds_index_wow_change > 0 ? "+" : ""}${asset.funds_index_wow_change.toFixed(1)}` : "—"}
            </div>
            <div className="pdf-metric-sub">
              {asset.funds_index_acceleration || "—"}
            </div>
          </div>
          <div className="pdf-metric">
            <div className="pdf-metric-label">Open Interest</div>
            <div className="pdf-metric-value" style={{ fontSize: "13px", color: "#f4f4f5" }}>
              {fmtN(asset.open_interest)}
            </div>
          </div>
        </div>
      </div>
 
      {/* Rolling Averages */}
      <div className="pdf-section">
        <div className="pdf-section-title">Rolling Averages & Trend</div>
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
        <div className="pdf-section-title">Positioning Detail</div>
        <table className="pdf-table">
          <thead>
            <tr>
              <th>Group</th>
              <th style={{ textAlign: "right" }}>Long</th>
              <th style={{ textAlign: "right" }}>Short</th>
              <th style={{ textAlign: "right" }}>Net</th>
              <th style={{ textAlign: "right" }}>% Long</th>
              <th style={{ textAlign: "right" }}>% Short</th>
              <th style={{ textAlign: "right" }}>Index</th>
            </tr>
          </thead>
          <tbody>
            {asset.source_type === "TFF" ? (
              <>
                <tr>
                  <td className="highlight">Leveraged Funds</td>
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
                  <td className="highlight">Dealer / Banks</td>
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
                  <td className="highlight">Asset Manager</td>
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
                  <td className="highlight">Managed Money</td>
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
                  <td className="highlight">Producer / Merchant</td>
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
                  <td className="highlight">Swap Dealers</td>
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
        <div className="pdf-section-title">Setup Analysis</div>
        <div style={{ border: "1px solid #27272a", padding: "12px", background: "#0a0a0a", fontSize: "11px", color: "#a1a1aa", lineHeight: "1.7" }}>
          <div style={{ color: "#f4f4f5", fontWeight: "600", marginBottom: "6px" }}>{profile.setupBias}</div>
          <div className="text-sm leading-6 text-zinc-300">{profile.setupSummary}</div>
          <div style={{ marginTop: "8px", color: "#71717a" }}>{profile.contextualInterpretation}</div>
        </div>
      </div>
 
      {/* Seasonality */}
      {sparkProfile.length === 12 && (
        <div className="pdf-section">
          <div className="pdf-section-title">Seasonal Pattern (5-Year Average)</div>
          <div className="pdf-season">
            {MONTHS.map((m, i) => {
              const v = sparkProfile[i]
              const bg = v >= 65 ? "#14532d" : v <= 35 ? "#450a0a" : "#18181b"
              const color = v >= 65 ? "#4ade80" : v <= 35 ? "#f87171" : "#71717a"
              const isCurrent = i === currentMonth
              return (
                <div key={m} className="pdf-season-cell" style={{
                  background: bg,
                  color,
                  border: isCurrent ? "1px solid #f59e0b" : "1px solid #1a1a1a",
                  fontWeight: isCurrent ? "700" : "400",
                }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "8px", color: "#52525b" }}>{m}</div>
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
  const glow  = safe >= 65
    ? '0 0 8px rgba(52,211,153,0.7), 0 0 2px rgba(52,211,153,1)'
    : safe <= 35
    ? '0 0 8px rgba(251,113,133,0.7), 0 0 2px rgba(251,113,133,1)'
    : '0 0 8px rgba(245,158,11,0.7), 0 0 2px rgba(245,158,11,1)'
  return (
    <div className="h-2 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <div style={{
        width: `${Math.max(6, safe)}%`,
        height: '100%',
        background: color,
        borderRadius: '9999px',
        boxShadow: glow,
      }} />
    </div>
  )
}

function GaugeArc({ value = 50 }) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  const radius = 42;
  const circumference = Math.PI * radius;
  const progress = (safe / 100) * circumference;
  const tone = safe >= 65 ? "#34d399" : safe <= 35 ? "#fb7185" : "#f59e0b";
  const filterId = `glow-${safe}`;

  return (
    <div className="mx-auto flex w-full max-w-[220px] justify-center overflow-hidden">
      <svg
        viewBox="0 0 120 70"
        className="h-24 w-[120px]"
        aria-hidden="true"
      >
        <defs>
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feFlood floodColor={tone} floodOpacity="0.8" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g transform="translate(60 60)">
          {/* Background arc — no filter */}
          <circle
            r={radius}
            cx="0"
            cy="0"
            fill="none"
            stroke="#27272a"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference * 2}`}
            strokeDashoffset="0"
            transform="rotate(180)"
          />
          {/* Colored arc — glow filter only on this element */}
          <circle
            r={radius}
            cx="0"
            cy="0"
            fill="none"
            stroke={tone}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${progress} ${circumference * 2}`}
            strokeDashoffset="0"
            transform="rotate(180)"
            filter={`url(#${filterId})`}
          />
          <text
            x="0"
            y="8"
            textAnchor="middle"
            fill="#f4f4f5"
            fontSize="18"
            fontWeight="600"
          >
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
    <aside className={cls(
      'fixed left-0 top-0 z-30 flex h-screen flex-col border-r bg-[#0a0e1a]','border-[#1e2d4a]',
      'transition-[width] duration-300 ease-in-out overflow-hidden',
      collapsed ? 'w-0' : 'w-60'
    )}>
 
       {/* Logo — fixed at bottom */}
      <div className={cls(
        'shrink-0 border-b logo transition-all duration-300',
        collapsed ? 'px-0 py-1 flex justify-center' : 'px-4 py-2.5'
      )}>
        {collapsed ? (
          /* Collapsed: monogram only */
          <div className="flex h-8 w-8 items-center justify-center border border-zinc-800">
            <div className="flex h-8 w-8 items-center justify-center bg-white">
  <span className="text-[10px] font-bold tracking-[0.15em] text-zinc-900">KP</span>
</div>
          </div>
        ) : (
          /* Expanded: full logo */
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-white">
              <span className="text-[14px] font-bold tracking-[0.10em] text-zinc-900">KP</span>
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
              onClick={() => setActive(item.key)}
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
  )
}

function AlertBell({ onOpen }) {
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
      title="Alerts"
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
        <div className="flex items-center justify-between border-b border-zinc-900 px-4 py-3">
          <span className="text-[11px] uppercase tracking-[0.25em]">
            COT Alerts
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllRead}
              className="text-[10px] uppercase tracking-[0.2em] text-zinc-600 hover:text-zinc-400 transition"
            >
              Mark all read
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
              <div className="text-sm text-zinc-600">No alerts yet.</div>
              <div className="text-xs text-zinc-700">
                Alerts fire automatically after each weekly COT update.
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
                    !alert.is_read ? severityTone(alert.severity) : "border-zinc-900 text-zinc-600"
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
                      <span className="text-rose-600">high priority</span>
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
              fetch("/api/alerts/run", { method: "POST" })
                .then(() => load())
            }}
            className="w-full border border-zinc-800 py-2 text-[11px] uppercase tracking-[0.22em] text-slate-200 hover:border-zinc-700 hover:text-zinc-300 transition"
          >
            Run Alert Check Now
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
          aria-label="Toggle sidebar"
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
        <span className="text-zinc-400">
          {t(NAV_ITEMS.find((n) => n.key === active)?.labelKey || 'nav.workspace')}
        </span>
      </div>
 
      {/* Right: stats */}
      {/* Right: stats + alert bell */}
      <div className="flex items-center gap-4">
        <div className="flex gap-6 text-xs uppercase tracking-[0.24em] text-slate-200">
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
    <section className="border bg-[#0f1629]" style={{ borderColor: 'var(--panels-border)' }}>
    <div className="flex items-center justify-between border-b px-4 py-3 text-[11px] uppercase tracking-[0.25em]" style={{ borderColor: 'var(--panels-border)' }}>
        <span>{title}</span>
        {right ? <div>{right}</div> : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

function Metric({ label, value }) {
  return (
    <div className="border p-3" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--panels-border)', borderRadius: '10px' }}>
      <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200">{label}</div>
      <div className="mt-2 text-zinc-100">{value}</div>
    </div>
  )
}

function ImpactBadge({ impact }) {
  const { t } = useTranslation();
  const tone = impact === 'High' ? 'text-rose-400' : impact === 'Med' ? 'text-blue-400' : 'text-zinc-400'
  return <span className={cls('text-xs uppercase tracking-[0.2em]', tone)}>{impact}</span>
}

// ─────────────────────────────────────────────────────────────────────────────

function Workspace({ heatmap, workspaceData, setActive, setSelected, assets = [], aiLanguage = "en", openGuide, timezone = "Europe/Copenhagen" }) {
  const { t } = useTranslation()
  const [calImpact, setCalImpact] = React.useState("all")
  const [calCountry, setCalCountry] = React.useState("all")
  const [newsCategory,  setNewsCategory]  = React.useState("all")
  const [newsSource,    setNewsSource]    = React.useState("all")
  const [newsImportance, setNewsImportance] = React.useState("all")
  const macro    = workspaceData?.macro_regime
  const calendar = workspaceData?.calendar || []
  const news     = workspaceData?.news     || []

  const topSignals = useMemo(() => {
    if (!assets.length) return []
    const engine = buildSignalEngine(assets, [], null)
    return engine.signals.filter((s) => s.state === "active").slice(0, 6)
  }, [assets])

  const sleeveScores = useMemo(() => {
    const result = {}
    Object.entries(MACRO_SLEEVES).forEach(([key, config]) => {
      const members = findAssetsExact(assets, config.members)
      result[key] = averagePercentile(members)
    })
    return result
  }, [assets])

  const macroComposite = averagePercentile([
    { funds_percentile_3y: sleeveScores.growth },
    { funds_percentile_3y: sleeveScores.inflation },
    { funds_percentile_3y: sleeveScores.policy },
  ])

  const alertFeed = useMemo(() => {
    if (!assets.length) return []
    const engine = buildSignalEngine(assets, [], null)
    return engine.alerts.slice(0, 5)
  }, [assets])

  // ── Large circular signal card ─────────────────────────────────────────────
  const SignalCircleCard = ({ signal }) => {
    const score  = signal.priorityScore ?? 0
    const pct    = Math.max(0, Math.min(100, score)) / 100
    const isLong = signal.direction === "long"
    const isShort= signal.direction === "short"
    const color  = isLong ? "#4ade80" : isShort ? "#f87171" : "#94a3b8"
    const bgColor= isLong ? "rgba(74,222,128,0.06)" : isShort ? "rgba(248,113,113,0.06)" : "rgba(255,255,255,0.03)"
    const borderC= isLong ? "rgba(74,222,128,0.18)" : isShort ? "rgba(248,113,113,0.18)" : "rgba(255,255,255,0.07)"
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
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={`${dash} ${circ - dash}`}
              style={{ filter: `drop-shadow(0 0 5px ${color}60)`, transition: "stroke-dasharray 0.6s ease" }}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "12px", color, lineHeight: 1, marginBottom: "1px" }}>
              {isLong ? "↑" : isShort ? "↓" : "→"}
            </span>
            <span style={{ fontSize: "20px", fontWeight: "700", color, lineHeight: 1 }}>
              {Math.round(score)}
            </span>
          </div>
        </div>
        <div style={{ marginTop: "8px", textAlign: "center" }}>
          <div style={{ fontSize: "12px", fontWeight: "600", color: "#f1f5f9", lineHeight: 1.2 }}>
            {signal.asset}
          </div>
          <div style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.14em",
            color: "rgba(148,163,184,0.45)", marginTop: "3px" }}>
            {signal.symbol} · {signal.sector}
          </div>
        </div>
        <div style={{ marginTop: "6px", textAlign: "center" }}>
          <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.2em",
            fontWeight: "600", color }}>
            {isLong ? "Long" : isShort ? "Short" : "Neutral"}
          </div>
          <div style={{ fontSize: "10px", color: "rgba(148,163,184,0.35)", marginTop: "2px" }}>
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
  const bg = pct >= 90 ? "rgba(248,113,113,0.18)" : pct >= 65 ? "rgba(74,222,128,0.1)"
           : pct <= 10 ? "rgba(74,222,128,0.18)"  : pct <= 35 ? "rgba(248,113,113,0.1)"
           : "rgba(255,255,255,0.03)"
  const border = pct >= 90 ? "rgba(248,113,113,0.4)" : pct >= 65 ? "rgba(74,222,128,0.25)"
               : pct <= 10 ? "rgba(74,222,128,0.4)"  : pct <= 35 ? "rgba(248,113,113,0.25)"
               : "rgba(255,255,255,0.08)"
  const arrow = dir === "rising" ? "↑" : dir === "falling" ? "↓" : "→"

  return (
    <button onClick={() => { setSelected(a.symbol); setActive("explorer") }}
      title={a.name}
      style={{
        display: "flex", flexDirection: "column", alignItems: "flex-start",
        padding: "4px 5px", borderRadius: "10px",
        background: bg, border: `1px solid ${border}`,
        cursor: "pointer", transition: "filter 0.15s", width: "100%",
      }}
      onMouseEnter={(e) => e.currentTarget.style.filter = "brightness(1.15)"}
      onMouseLeave={(e) => e.currentTarget.style.filter = "brightness(1)"}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: "8px", color: "rgba(148,163,184,0.6)", textTransform: "uppercase",
          letterSpacing: "0.12em", lineHeight: 1 }}>{a.symbol}</span>
        {wow != null && (
          <span style={{ fontSize: "6px", color: wowClr, lineHeight: 1, fontWeight: 600 }}>
            {arrow}{Math.abs(wow).toFixed(1)}
          </span>
        )}
      </div>
      <span style={{ fontSize: "12px", fontWeight: "700", color, lineHeight: 1.1, marginTop: "4px" }}>
        {pct != null ? pct.toFixed(0) : "—"}
      </span>
      <span style={{ fontSize: "9px", color: "rgba(148,163,184,0.4)", marginTop: "4px",
        textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {a.flow_state || "Neutral"}
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
    </div><div className="space-y-4">

        {/* ══ ROW 1: 2 equal cols ══════════════════════════════════════════════ */}
        <div className="grid gap-4 mt-6" style={{ gridTemplateColumns: "1fr 1fr" }}>

          {/* LEFT col: Macro Context + Macro Regime stacked */}
          <div className="space-y-4">
            <MacroContextPanel aiLanguage={aiLanguage} />

            <section className="border border-zinc-900 ">
              <div className="flex items-center justify-between border-b border-zinc-900 px-4 py-3">
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
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: "growth", label: "Growth", color: "text-emerald-400" },
                    { key: "inflation", label: "Inflation", color: "text-blue-400" },
                    { key: "policy", label: "Policy", color: "text-sky-400" },
                  ].map(({ key, label, color }) => {
                    const score = sleeveScores[key];
                    return (
                      <div key={key} className="border border-zinc-900 small-panel-color p-3" style={{ borderRadius: "10px" }}>
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
                <div className="mt-3 border border-zinc-900 small-panel-color p-3" style={{ borderRadius: "10px" }}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="uppercase tracking-[0.2em] text-zinc-600">Composite</span>
                    <span className={cls("font-semibold tabular-nums", macroTone(macroComposite))}>
                      {macroComposite != null ? macroComposite.toFixed(1) : "n/a"}
                    </span>
                  </div>
                  <div className="mt-1.5 text-xs leading-5 text-slate-200">
                    {macro?.verdict || macroVerdict(sleeveScores.growth, sleeveScores.inflation, sleeveScores.policy, t)}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT col: Alert Feed + AI Briefing (fills remaining height) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* AI Briefing fills remaining space + expands with content */}
            <AIAnalysisPanel
              type="macro"
              data={{
                growth_score: sleeveScores.growth,
                inflation_score: sleeveScores.inflation,
                policy_score: sleeveScores.policy,
                composite: macroComposite,
                growth_assets: findAssetsExact(assets, MACRO_SLEEVES.growth.members),
                inflation_assets: findAssetsExact(assets, MACRO_SLEEVES.inflation.members),
                policy_assets: findAssetsExact(assets, MACRO_SLEEVES.policy.members),
              }}
              aiLanguage={aiLanguage}
              title="AI — Weekly Briefing"
              fillHeight={true} />
            <section className="border border-zinc-900" style={{ flexShrink: 0 }}>
              <div className="border-b border-zinc-900 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full rounded-full-dot bg-blue-400"></div> 
                    <span className="text-[11px] uppercase tracking-[0.25em] text-slate-200">Alert Feed</span>
                </div>
              </div>
              <div className="divide-y divide-zinc-900">
                {alertFeed.length === 0 ? (
                  <div className="px-4 py-4 text-sm text-zinc-600">No alerts right now.</div>
                ) : alertFeed.map((alert) => (
                  <div key={alert.id} className="px-4 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm text-zinc-200 leading-5">{alert.title}</div>
                      <span className={cls("shrink-0 border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.2em]",
                        alertImpactTone(alert.impact))}>
                        {alert.impact}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs leading-4 text-zinc-600">{alert.text}</div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* ══ ROW 2: 2 equal cols ══════════════════════════════════════════════ */}
        <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>

          {/* LEFT: Top Active Signals — 3×2 circles */}
          <section className="border border-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-900 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full rounded-full-dot bg-blue-400"></div> 
                <span className="text-[11px] uppercase tracking-[0.25em] text-slate-200">
                Top Active Signals
                </span>
              </div>
              <button onClick={() => setActive("signals")}
                className="text-[11px] uppercase tracking-[0.22em] text-slate-200 hover:text-zinc-300 transition">
                All →
              </button>
            </div>
            <div className="p-4">
              {topSignals.length === 0 ? (
                <div className="py-8 text-center text-sm text-zinc-600">No active signals right now.</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                  {topSignals.map((signal) => <SignalCircleCard key={signal.id} signal={signal} />)}
                </div>
              )}
            </div>
          </section>

          {/* RIGHT: COT Heatmap compact */}
          <section className="border border-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-900 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full rounded-full-dot bg-blue-400"></div> 
                  <span className="text-[11px] uppercase tracking-[0.25em] text-slate-200">
                    {t("panels.cotFlowHeatmap")}
                  </span>
                </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-zinc-700">0</span>
                <div style={{
                  width: "60px", height: "3px", borderRadius: "2px",
                  background: "linear-gradient(90deg, #f87171, rgba(148,163,184,0.3) 50%, #4ade80)"
                }} />
                <span className="text-[9px] text-zinc-700">100</span>
              </div>
            </div>
            <div className="px-4 py-3 space-y-3">
              {Object.entries(heatmap || {}).map(([sector, items]) => (
                <div key={sector}>
                  <div className="mb-1.5 text-[9px] uppercase tracking-[0.25em]"
                    style={{ color: "rgba(148,163,184,0.35)" }}>{sector}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: "6px" }}>
                    {items.map((a) => <HeatmapCard key={a.symbol} a={a} />)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ══ ROW 3: 3 equal cols — Calendar | News | Guide ════════════════════ */}
        <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr", alignItems: "start" }}>

          {/* Economic Calendar */}
          <section className="border border-zinc-900">
            <div className="border-b border-zinc-900 px-3 py-2.5 shrink-0">
              <div className="flex items-center justify-between gap-2 mb-2">
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
                  placeholder="All Impact"
                  options={[
                    {value:"all",    label:"All Impact"},
                    {value:"high",   label:"High"},
                    {value:"medium", label:"Medium"},
                    {value:"low",    label:"Low"},
                  ]}
                />
                <CustomSelect
                  value={calCountry}
                  onChange={setCalCountry}
                  minWidth="0"
                  placeholder="All Countries"
                  options={[
                    {value:"all", label:"All Countries"},
                    {value:"US",  label:"US"},
                    {value:"EU",  label:"EU"},
                    {value:"GB",  label:"GB"},
                    {value:"JP",  label:"JP"},
                    {value:"CN",  label:"CN"},
                    {value:"CA",  label:"CA"},
                    {value:"AU",  label:"AU"},
                  ]}
                />
              </div>
            </div>
            <div className="divide-y divide-zinc-900" style={{ maxHeight: '420px', overflowY: 'auto' }}>
              {calendar.length === 0 ? (
                <div className="px-4 py-4 text-sm text-slate-200">No calendar events.</div>
              ) : [...calendar]
                  .sort((a, b) => (a.datetime || "").localeCompare(b.datetime || ""))
                  .reverse()
                  .filter(e => calImpact === "all" || e.importance === calImpact)
                  .filter(e => calCountry === "all" || (e.country || "").toUpperCase() === calCountry.toUpperCase())
                  .map((event, idx) => {
                  const imp = (event.importance || "").toLowerCase();
                  const isHigh = imp === "high";
                  const isMed  = imp === "medium";
                  const hasData = event.actual != null || event.forecast != null || event.previous != null;
                  const actColor = actualColor(event.title, event.actual, event.forecast);
                  const isPast = event.datetime ? new Date(event.datetime) < new Date() : false;
                  return (
                    <div key={`${event.id}-${idx}`}
                       className={isHigh ? 'cal-item-high' : isMed ? 'cal-item-medium' : ''}>
                      {/* Row 1: time + currency + title + importance */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="calendar-row flex items-center gap-2 min-w-0 flex-1">
                          {(() => {
                            const { time, date, day } = formatEventDateTime(event.datetime, timezone);
                            return (
                              <div className="flex flex-col items-end shrink-0 gap-0.5" style={{ minWidth: '72px' }}>
                                <span style={{ fontSize: '10px', fontWeight: 700, color: isPast ? '#2d4060' : '#94a3b8', letterSpacing: '0.08em' }}>
                                  {day} {date}
                                </span>
                                <span className="text-[11px] tabular-nums font-mono" style={{ color: '#60a5fa' }}>
                                  {time}
                                </span>
                              </div>
                            );
                          })()}
                          <span className="text-blue-400 ml-14" style={{
                            fontSize: '14px', fontWeight: 700,
                            letterSpacing: '0.12em', textTransform: 'uppercase', flexShrink: 0
                          }}>
                            {event.currency || event.country || ""}
                          </span>
                          <span className="text-sm leading-5" style={{ fontWeight: isPast ? 400 : 500, color: isPast ? '#4a6080' : '#e2e8f0' }}>{event.title || "TBD"}</span>
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
<section className="border border-zinc-900 ">
  <div className="border-b border-zinc-900 px-3 py-2.5">
    <div className="flex items-center justify-between gap-2 mb-2">
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
        placeholder="All Categories"
        options={[
          {value:"all",          label:"All Categories"},
          {value:"POLICY",       label:"Policy"},
          {value:"MACRO",        label:"Macro"},
          {value:"MARKETS",      label:"Markets"},
          {value:"FOREX",        label:"Forex"},
          {value:"FINANCE",      label:"Finance"},
          {value:"COT",          label:"COT"},
          {value:"CRYPTO",       label:"Crypto"},
        ]}
      />
      <CustomSelect
        value={newsSource}
        onChange={setNewsSource}
        minWidth="0"
        placeholder="All Sources"
        options={[
          {value:"all",              label:"All Sources"},
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
        placeholder="All Priority"
        options={[
          {value:"all",    label:"All Priority"},
          {value:"high",   label:"High"},
          {value:"medium", label:"Medium"},
          {value:"low",    label:"Low"},
        ]}
      />
    </div>
  </div>
  <div className="divide-y divide-zinc-900" style={{ maxHeight: '420px', overflowY: 'auto' }}>
    {news.length === 0 ? (
      <div className="px-4 py-4 text-sm" style={{ color: '#60a5fa' }}>No market news.</div>
    ) : [...news]
        .filter(item => newsCategory === "all" || item.category === newsCategory)
        .filter(item => newsSource === "all" || item.source === newsSource)
        .filter(item => newsImportance === "all" || item.importance === newsImportance)
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
          <span className="text-[11px] uppercase tracking-[0.25em] text-slate-200">Chart Range</span>
        </div>

        {/* ── Chart 1: Net Position ────────────────────────────────────── */}
        <div className="px-4 pb-2">
          <div className="mb-3 text-[11px] uppercase tracking-[0.22em] text-slate-200">
            Net Position — Thousands of Contracts
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis
                dataKey="date"
                tickFormatter={xTickFormatter}
                tick={{ fill: "#52525b", fontSize: 10 }}
                axisLine={{ stroke: "#27272a" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#52525b", fontSize: 10 }}
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
              <Line type="monotone" dataKey="fundsNet"  name="Funds"  stroke="#34d399" strokeWidth={1.5} dot={false} connectNulls />
              <Line type="monotone" dataKey="amNet"     name={amLabel === "Asset Manager" ? "AM" : "Producer"} stroke="#fbbf24" strokeWidth={1.5} dot={false} connectNulls />
              <Line type="monotone" dataKey="dealerNet" name="Dealer" stroke="#38bdf8" strokeWidth={1.5} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* ── Chart 2: COT Index ───────────────────────────────────────── */}
        <div className="border-t border-zinc-900 px-4 pb-2 pt-4">
          <div className="mb-3 text-[11px] uppercase tracking-[0.22em] text-slate-200">
            COT Index — Min-Max 156w (0 = 3y Low, 100 = 3y High)
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis
                dataKey="date"
                tickFormatter={xTickFormatter}
                tick={{ fill: "#52525b", fontSize: 10 }}
                axisLine={{ stroke: "#27272a" }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "#52525b", fontSize: 10 }}
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
              <Line type="monotone" dataKey="fundsIdx"  name="Funds Index"  stroke="#34d399" strokeWidth={2} dot={false} connectNulls />
              <Line type="monotone" dataKey="amIdx"     name={amLabel === "Asset Manager" ? "AM Index" : "Producer Index"} stroke="#fbbf24" strokeWidth={1.5} dot={false} connectNulls />
              <Line type="monotone" dataKey="dealerIdx" name="Dealer Index" stroke="#38bdf8" strokeWidth={1.5} dot={false} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* ── Chart 3: Open Interest ───────────────────────────────────── */}
        <div className="border-t border-zinc-900 px-4 pb-4 pt-4">
          <div className="mb-3 text-[11px] uppercase tracking-[0.22em] text-slate-200">
            Open Interest — Thousands of Contracts
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={xTickFormatter}
                tick={{ fill: "#52525b", fontSize: 10 }}
                axisLine={{ stroke: "#27272a" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#52525b", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}k`}
                width={40}
              />
              <Tooltip content={<ChartTooltip unit="k" />} />
              <Bar dataKey="oi" name="Open Interest" fill="#3f3f46" radius={[1, 1, 0, 0]} />
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
      <section className="border border-zinc-900 ">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-900 px-4 py-3">
          <span className="text-[11px] uppercase tracking-[0.25em] text-slate-200">
            Historical COT Data
          </span>
          {data && (
            <span className="text-[11px] uppercase tracking-[0.22em] text-zinc-300">
              {data.total_rows} weeks · {data.name} · {normalizeSector(data.sector)}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-4 p-4">
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-zinc-600">Asset</div>
            <CustomSelect
                value={selectedSymbol}
                onChange={(v) => { setSelectedSymbol(v); setYearFilter("all") }}
                options={sortedAssets.map((a) => ({ value: a.symbol, label: `${a.name} (${a.symbol})` }))}
                minWidth="200px"
              />
          </div>

          <div>
            <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-zinc-600">Year (Table)</div>
            <CustomSelect
              value={yearFilter}
              onChange={setYearFilter}
              options={[{ value: "all", label: "All years" }, ...availableYears.map((y) => ({ value: String(y), label: String(y) }))]}
              minWidth="120px"
            />
          </div>
          <div>
      <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-zinc-600">COT Index Window</div>
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
            {filteredRows.length} rows
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 border-t border-zinc-900 px-4 py-2.5 text-[10px] uppercase tracking-[0.16em] text-zinc-600">
          <span><span className="inline-block w-2.5 h-2.5 mr-1 bg-rose-900/60" />Index ≥90 extreme long</span>
          <span><span className="inline-block w-2.5 h-2.5 mr-1 bg-emerald-900/60" />Index ≤10 extreme short</span>
          <span><span className="inline-block w-2.5 h-2.5 mr-1 bg-amber-900/40" />Sharp net change</span>
          <span><span className="inline-block w-2.5 h-2.5 mr-1 bg-violet-900/50" />Net flip</span>
          <span><span className="inline-block w-2.5 h-2.5 mr-1 bg-sky-900/40" />OI spike</span>
          <span className="text-sky-800">Row tint = divergence</span>
        </div>
      </section>

      {loading && (
        <section className="border border-zinc-900  p-6">
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
        <section className="border border-zinc-900 ">
          <div className="border-b border-zinc-900 px-4 py-3 flex items-center justify-between">
            <span className="text-[12px] uppercase tracking-[0.25em] text-zinc-200">
              Charts — {data?.name}
            </span>
            <span className="text-[11px] uppercase tracking-[0.2em] text-zinc-300">
              {chartData.length} weeks shown
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
        <section className="border border-zinc-900 ">
          <div className="border-b border-zinc-900 px-4 py-3">
            <span className="text-[11px] uppercase tracking-[0.25em] text-slate-200">
              Data Table
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[1600px] w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10 ">
                <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-[0.22em]">
                  <th rowSpan={2} className="sticky left-0 z-20  px-3 py-3 text-left font-medium text-slate-200 min-w-[105px]">
                    Date
                  </th>
                  <th colSpan={2} className="px-3 py-2 text-center font-medium text-slate-200 border-l border-zinc-800">Open Interest</th>
                  <th colSpan={1} className="px-3 py-2 text-center font-medium text-violet-700 border-l border-zinc-800">Momentum</th>
                  <th colSpan={7} className="px-3 py-2 text-center font-medium text-emerald-700 border-l border-zinc-800">Funds / Non-Commercials</th>
                  <th colSpan={7} className="px-3 py-2 text-center font-medium text-amber-700 border-l border-zinc-800">{amLabel}</th>
                  <th colSpan={7} className="px-3 py-2 text-center font-medium text-sky-700 border-l border-zinc-800">Dealer / Banks</th>
                </tr>
                <tr className="border-b border-zinc-900 text-[10px] uppercase tracking-[0.18em] text-zinc-600">
                  <th className="px-3 py-2 text-right border-l border-zinc-800">OI</th>
                  <th className="px-3 py-2 text-right">Chg</th>
                  <th className="px-3 py-2 text-left border-l border-zinc-800 text-violet-900">Direction</th>
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
// MacroContextPanel — вставити в App.jsx перед function MacroView
// Показує VIX, Yield Curve, DXY як macro backdrop для COT аналізу
// ─────────────────────────────────────────────────────────────────────────────

function MacroContextPanel({ aiLanguage = "en" }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")
  const [lastFetch, setLastFetch] = useState(null)

  const load = React.useCallback(() => {
    setLoading(true)
    setError("")
    fetch("/api/macro-context")
      .then((r) => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then((json) => {
        setData(json)
        setLastFetch(new Date())
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  // Auto-load on mount
  React.useEffect(() => { load() }, [load])

  // ── Regime color ────────────────────────────────────────────────────────
  const regimeTone = (regime) => {
    if (!regime) return "text-slate-200"
    const r = regime.toLowerCase()
    if (r.includes("risk-off") || r.includes("stress") || r.includes("contraction"))
      return "text-rose-400"
    if (r.includes("risk-on") || r.includes("expansion") || r.includes("benign"))
      return "text-emerald-400"
    if (r.includes("warning") || r.includes("inversion") || r.includes("pressure"))
      return "text-blue-400"
    return "text-sky-400"
  }

  // ── Item card color ─────────────────────────────────────────────────────
  const itemTone = (item) => {
    if (!item?.regime) return "text-zinc-300"
    const r = item.regime
    // VIX
    if (r === "extreme_fear" || r === "fear") return "text-rose-300"
    if (r === "complacent")                   return "text-blue-300"
    if (r === "calm")                         return "text-emerald-400"
    if (r === "elevated")                     return "text-blue-400"
    // Yield curve
    if (r === "inverted") return "text-rose-400"
    if (r === "flat")     return "text-blue-400"
    if (r === "steep")    return "text-emerald-400"
    // DXY
    if (r === "strengthening") return "text-blue-400"
    if (r === "weakening")     return "text-emerald-400"
    return "text-zinc-300"
  }

  const itemBg = (item) => {
    if (!item?.alert) return "border-zinc-900 small-panel-color "
    const r = item?.regime
    if (r === "inverted" || r === "fear" || r === "extreme_fear")
      return "border-rose-900/40 bg-rose-950/15"
    if (r === "flat" || r === "complacent" || r === "strengthening")
      return "border-amber-900/40 bg-rose-500/10"
    return "border-emerald-900/40 bg-emerald-950/15"
  }

  const fmtValue = (item) => {
    if (item.value == null) return "n/a"
    if (item.key === "yield_curve") {
      const sign = item.value >= 0 ? "+" : ""
      return `${sign}${item.value.toFixed(2)}%`
    }
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
    <section className="border border-zinc-900 ">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full rounded-full-dot bg-sky-400" />
          <span className="text-[11px] uppercase tracking-[0.25em] text-slate-200">
            {aiLanguage === "uk" ? "Макро контекст" : "Macro Context"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {data?.macro_regime && (
            <span className={cls("text-[11px] uppercase tracking-[0.22em]", regimeTone(data.macro_regime))}>
              {data.macro_regime}
            </span>
          )}
          <button
            onClick={load}
            disabled={loading}
            className={cls(
              "border px-2 py-1 text-[10px] uppercase tracking-[0.2em] transition",
              loading
                ? "cursor-not-allowed border-zinc-800 text-zinc-600"
                : "border-zinc-800 text-slate-200 hover:border-zinc-700 hover:text-zinc-300"
            )}
          >
            {loading ? "..." : aiLanguage === "uk" ? "Оновити" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && !data && (
        <div className="p-4 space-y-2">
          {[100, 80, 60].map((w, i) => (
            <div key={i} className="h-3 animate-pulse rounded bg-zinc-800" style={{ width: `${w}%` }} />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-4 py-3 text-xs text-rose-400">
          {aiLanguage === "uk" ? "Помилка: " : "Error: "}{error}
        </div>
      )}

      {/* Items */}
      {data?.items?.length > 0 && (
        <div className="p-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {data.items.map((item) => (
              <div key={item.key} className={cls("border p-3 space-y-2", itemBg(item))}>
                {/* Label + regime badge */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-slate-200">
                    {item.label}
                  </span>
                  {item.regime && (
                    <span className={cls("text-[9px] uppercase tracking-[0.16em]", itemTone(item))}>
                      {item.regime.replace(/_/g, " ")}
                    </span>
                  )}
                </div>

                {/* Value + change */}
                <div className="flex items-end justify-between gap-2">
                  <span className={cls("text-xl font-semibold tabular-nums", itemTone(item))}>
                    {fmtValue(item)}
                  </span>
                  {fmtChange(item) && (
                    <span className={cls(
                      "text-xs tabular-nums mb-0.5",
                      item.change_pct >= 0 ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {fmtChange(item)}
                    </span>
                  )}
                </div>

                {/* Yield curve detail */}
                {item.key === "yield_curve" && item.t10y && item.t2y && (
                  <div className="text-[10px] text-zinc-600">
                    10Y: {item.t10y.toFixed(2)}% · 2Y: {item.t2y.toFixed(2)}%
                  </div>
                )}

                {/* Interpretation */}
                <div className="text-[11px] leading-5 text-slate-200">
                  {item.interpretation}
                </div>

                {/* Alert dot */}
                {item.alert && (
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-amber-400">
                    <div className="h-1.5 w-1.5 rounded-full rounded-full-dotbg-amber-400 animate-pulse" />
                    {aiLanguage === "uk" ? "Увага" : "Watch"}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Last fetch time */}
          {lastFetch && (
            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">
              {aiLanguage === "uk" ? "Оновлено: " : "Updated: "}
              {lastFetch.toLocaleTimeString()}
            </div>
          )}
        </div>
      )}

      {/* No data */}
      {!loading && !error && (!data?.items || data.items.length === 0) && (
        <div className="px-4 py-4 text-sm text-zinc-600">
          {aiLanguage === "uk"
            ? "Дані недоступні. Встанови yfinance: pip install yfinance"
            : "No data available. Install yfinance: pip install yfinance"}
        </div>
      )}
    </section>
  )
}

function MacroView({ assets, aiLanguage, openGuide }) {
  const { t } = useTranslation();

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
    { funds_percentile_3y: policyScore }
  ])

  // Sleeve label color
  const sleeveColor = (key) => {
    if (key === 'growth')    return 'text-emerald-400'
    if (key === 'inflation') return 'text-amber-400'
    if (key === 'grains')    return 'text-lime-400'
    return 'text-sky-400'
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.35fr_0.9fr]">

      {/* ── LEFT COLUMN ── */}
      <div className="space-y-4">

        {/* 1. MACRO COMPOSITE — sleeve overview + verdict */}
        <Panel title={t("panels.macroComposite")} right={<GuideButton sectionKey="macro" openGuide={openGuide} />}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
            {sleeveData.map((sleeve) => (
              <div key={sleeve.key} className="default-bg p-3 border border-zinc-900">
                <div className={cls('text-[10px] uppercase tracking-[0.24em] mb-1', sleeveColor(sleeve.key))}>
                  {sleeve.title}
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
          <div className="text-sm leading-7 text-blue-300 border-t border-zinc-900 pt-3">
            <span className="text-rose-400 uppercase tracking-[0.18em] text-[10px] mr-2">Verdict</span>
            {macroVerdict(growthScore, inflationScore, policyScore, t)}
          </div>
        </Panel>

        {/* 2. MACRO CONTEXT — VIX / Yield Curve / DXY / S&P 500 */}
        <MacroContextPanel aiLanguage={aiLanguage} />

        {/* 3. SLEEVE DETAIL — the most important breakdown */}
        <Panel title={t("panels.sleeveDetail")}>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {sleeveData.map((sleeve) => (
              <div key={sleeve.key} className="border border-zinc-900 small-panel-color p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className={cls('text-[10px] uppercase tracking-[0.2em]', sleeveColor(sleeve.key))}>
                    {sleeve.title}
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
                    <div key={a.symbol} className="flex items-center justify-between border-t border-zinc-900 pt-2 first:border-t-0 first:pt-0">
                      <div>
                        <div className="text-xs text-zinc-100">{a.name}</div>
                        <div className="text-[10px] uppercase tracking-[0.15em] text-slate-400 mt-0.5">
                          {a.flow_state || 'Neutral'}
                        </div>
                      </div>
                      <div className={cls('text-sm font-medium', flowColor(a.funds_percentile_3y))}>
                        {formatPercentile(a.funds_percentile_3y)}
                      </div>
                    </div>
                  )) : <div className="text-xs text-slate-400">No data available.</div>}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* 4. INTERPRETATION + TRADING RELEVANCE */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="p-4 default-bg border border-zinc-900">
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200 mb-3">Interpretation</div>
            <div className="text-sm leading-7 text-zinc-200">{macroNarrative.interpretation}</div>
          </div>
          <div className="p-4 default-bg border border-zinc-900">
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200 mb-3">Trading Relevance</div>
            <div className="text-sm leading-7 text-zinc-200">{macroNarrative.tradingRelevance}</div>
          </div>
        </div>

      </div>

      {/* ── RIGHT COLUMN ── */}
      <div className="space-y-4">

        {/* 1. AI ANALYSIS */}
        <AIAnalysisPanel
          type="macro"
          data={{
            growth_score:     growthScore,
            inflation_score:  inflationScore,
            policy_score:     policyScore,
            composite:        macroComposite,
            growth_assets:    sleeveData.find((x) => x.key === "growth")?.members || [],
            inflation_assets: findAssetsExact(assets, MACRO_SLEEVES.inflation.members),
            policy_assets:    findAssetsExact(assets, MACRO_SLEEVES.policy.members),
          }}
          aiLanguage={aiLanguage}
          title={aiLanguage === "uk" ? "AI Макро-аналіз" : "AI Macro Analysis"}
        />

        {/* 2. COMPOSITE SCORES + DISPERSION + PHASE */}
        <Panel title={t("panels.compositeScores")}>
          <div className="space-y-2 mb-4">
            {sleeveData.map((sleeve) => (
              <div key={sleeve.key} className="flex items-center justify-between py-2 border-b border-zinc-900 last:border-b-0">
                <span className={cls('text-xs uppercase tracking-[0.18em]', sleeveColor(sleeve.key))}>
                  {sleeve.title} ({sleeve.memberCount}/{sleeve.expectedCount})
                </span>
                <span className={cls('text-sm font-semibold', macroTone(sleeve.score))}>
                  {formatPercentile(sleeve.score)}
                </span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="default-bg p-3 border border-zinc-900">
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-300 mb-1">Sleeve Dispersion</div>
              <div className="text-xl font-semibold text-zinc-100">{formatPercentile(macroNarrative.dispersion)}</div>
              <div className="text-[10px] text-zinc-500 mt-1">{macroDispersionLabel(macroNarrative.dispersion, t)}</div>
            </div>
            <div className="default-bg p-3 border border-zinc-900">
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-300 mb-1">Macro Phase</div>
              <div className="text-xl font-semibold text-zinc-100">{macroPhase(macroComposite, t)}</div>
              <div className="text-[10px] text-zinc-500 mt-1">Composite regime state</div>
            </div>
          </div>
        </Panel>

        {/* 3. NARRATIVE SUMMARY */}
        <div className="default-bg p-4 border border-zinc-900">
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200 mb-3">Narrative Summary</div>
          <div className="text-sm leading-7 text-zinc-200">{macroNarrative.summary}</div>
        </div>

        {/* 4. WHAT TO WATCH */}
        <div className="default-bg p-4 border border-zinc-900">
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200 mb-3">What To Watch</div>
          <div className="text-sm leading-7 text-zinc-200">{macroNarrative.whatToWatch}</div>
        </div>

      </div>
    </div>
  )
}

function CorrelationView({ assets, openGuide, aiLanguage = "en" }) {
  const { t } = useTranslation();
  const universeAssets = useMemo(() => findAssetsExact(assets, CORRELATION_UNIVERSE), [assets])
  const pairs = useMemo(() => buildPositioningPairs(universeAssets), [universeAssets])
  const alignedPairs = useMemo(() => [...pairs].sort((a, b) => a.distance - b.distance).slice(0, 8), [pairs])
  const opposedPairs = useMemo(() => [...pairs].sort((a, b) => b.distance - a.distance).slice(0, 8), [pairs])
  const avgAlignment = useMemo(() => !pairs.length ? null : pairs.reduce((sum, pair) => sum + pair.alignment, 0) / pairs.length, [pairs])
  const avgDistance = useMemo(() => !pairs.length ? null : pairs.reduce((sum, pair) => sum + pair.distance, 0) / pairs.length, [pairs])
  const sameSectorPairs = useMemo(() => pairs.filter((pair) => pair.sameSector).length, [pairs])
  const crossSectorPairs = useMemo(() => pairs.filter((pair) => !pair.sameSector).length, [pairs])
 const narrative = useMemo(
  () =>
    buildCorrelationNarrative(
      {
        avgDistance,
        avgAlignment,
        alignedPairs,
        opposedPairs,
        sameSectorPairs,
        crossSectorPairs,
      },
      t
    ),
  [avgDistance, avgAlignment, alignedPairs, opposedPairs, sameSectorPairs, crossSectorPairs, t]
);

  const quickGuide = useMemo(() => {
    if (avgDistance == null) {
      return {
        title: 'How to read this',
        summary: 'Correlation here means positioning similarity, not classical rolling price correlation.',
        takeaway: 'Small gaps mean two assets are being positioned in a similar way by funds. Large gaps mean they are currently telling different stories.',
      }
    }
    if (avgDistance >= 60) {
      return {
        title: 'Plain-English read',
        summary: 'The market is fragmented right now. Different assets are carrying very different positioning profiles instead of moving as one macro block.',
        takeaway: 'This usually favors selective ideas and relative-value thinking, not broad all-in risk-on or risk-off assumptions.',
      }
    }
    if (avgDistance >= 40) {
      return {
        title: 'Plain-English read',
        summary: 'The market has mixed alignment. Some assets are traveling together, but others are clearly out of sync.',
        takeaway: 'This is a confirmation environment. Cross-check one market with another before trusting a macro theme.',
      }
    }
    return {
      title: 'Plain-English read',
      summary: 'The market is fairly synchronized. A lot of assets are expressing a similar positioning message.',
      takeaway: 'This can strengthen macro conviction because confirmation across assets is cleaner.',
    }
  }, [avgDistance])

  const chartExplanation = useMemo(() => {
    const topAligned = alignedPairs[0]
    const topOpposed = opposedPairs[0]
    if (!topAligned || !topOpposed) {
      return 'The mini pair charts compare the current percentile position of two assets. When the two points sit close together, positioning is aligned. When the gap is large, the assets are expressing different positioning regimes.'
    }
    return `Right now the cleanest alignment is ${topAligned.left.name} versus ${topAligned.right.name}, while the biggest split is ${topOpposed.left.name} versus ${topOpposed.right.name}. Read each mini chart as a simple distance check between the two current positioning states.`
  }, [alignedPairs, opposedPairs])

  return (
    <div className="space-y-4">
      <Panel title={t("panels.correlation")} right={<GuideButton sectionKey="correlation" openGuide={openGuide} />}>
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-4 md:grid-cols-4 metric-card">
            <Metric label="Universe" value={universeAssets.length} />
            <Metric label="Pairs" value={pairs.length} />
            <Metric label="Avg Alignment" value={formatPercentile(avgAlignment)} />
            <Metric label="Dispersion" value={formatPercentile(avgDistance)} />
          </div>
          <div className="small-panel-color p-4 text-sm leading-7 text-zinc-300">
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200">Quick Guide</div>
            <div className="mt-3 text-zinc-100">This is not price correlation in the classic statistical sense.</div>
            <div className="mt-2">Here correlation means how similar current COT positioning is across assets. Small percentile gaps mean stronger alignment. Large gaps mean a more conflicted macro map.</div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel title={t("panels.crossAssetPositioningMap")} right={<span className="text-xs uppercase tracking-[0.22em] text-slate-200">live percentile relationships</span>}>
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <div className=" small-panel-color p-3 text-sm text-zinc-300">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200">Small gap</div>
              <div className="mt-2">Assets are being positioned in a similar way. Their macro message is closer.</div>
            </div>
            <div className=" small-panel-color p-3 text-sm text-zinc-300">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200">Large gap</div>
              <div className="mt-2">Assets are expressing different or opposing positioning conditions.</div>
            </div>
            <div className=" small-panel-color p-3 text-sm text-zinc-300">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200">Why it matters</div>
              <div className="mt-2">When several markets confirm each other, trade conviction is easier. When they disagree, be more selective.</div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="small-panel-color p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200 ">Narrative Summary</div>
              <div className="mt-3 text-sm leading-7 text-zinc-200">{narrative.summary}</div>
              <div className="mt-3 text-sm text-slate-200">Same-sector pairs: {sameSectorPairs} · Cross-sector pairs: {crossSectorPairs}</div>
            </div>
            <div className="small-panel-color p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200">Interpretation</div>
              <div className="mt-3 text-sm leading-7 text-zinc-200">{narrative.interpretation}</div>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-900 text-[11px] uppercase tracking-[0.22em] text-slate-200">
                <tr>
                  <th className="pb-3 pr-4 font-medium">Asset</th>
                  <th className="pb-3 pr-4 font-medium">Sector</th>
                  <th className="pb-3 pr-4 font-medium">Percentile</th>
                  <th className="pb-3 pr-4 font-medium">Flow</th>
                  <th className="pb-3 pr-4 font-medium">Regime</th>
                  <th className="pb-3 font-medium">Signal</th>
                </tr>
              </thead>
              <tbody>
                {universeAssets.map((a) => (
                  <tr key={a.symbol} className="border-b border-zinc-950">
                    <td className="py-3 pr-4 text-zinc-100">{a.name}</td>
                    <td className="py-3 pr-4 text-slate-200">{normalizeSector(a.sector)}</td>
                    <td className={cls('py-3 pr-4', flowColor(a.funds_percentile_3y))}>{formatPercentile(a.funds_percentile_3y)}</td>
                    <td className="py-3 pr-4 text-zinc-400">{a.flow_state || 'Neutral'}</td>
                    <td className="py-3 pr-4 text-zinc-400">{regimeLabel(a.funds_percentile_3y, t)}</td>
                    <td className="py-3 text-zinc-400">{signalLabel(a.funds_percentile_3y, t)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title={quickGuide.title} >
            <div className="space-y-3 text-sm leading-7 text-zinc-300">
              <div>{quickGuide.summary}</div>
              <div className="small-panel-color p-3 text-zinc-400">{quickGuide.takeaway}</div>
            </div>
          </Panel>

          <AIAnalysisPanel
            type="correlation"
            data={{
              avg_alignment: avgAlignment,
              avg_distance: avgDistance,
              same_sector_pairs: sameSectorPairs,
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
            title={aiLanguage === "uk" ? "AI — Крос-активний аналіз" : "AI — Cross-Asset Analysis"}
          />

          <Panel title={t("panels.regimeHealth")}>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              <div className="small-panel-color p-4">
                <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200">Alignment State</div>
                <div className="mt-2 text-lg text-zinc-100">{dispersionLabel(avgDistance, t)}</div>
                <div className="mt-1 text-sm text-slate-200">Average gap between assets</div>
              </div>
              <div className="small-panel-color p-4">
                <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200">Cross-Asset Bias</div>
                <div className="mt-2 text-lg text-zinc-100">{crossSectorPairs > sameSectorPairs ? 'Cross-Sector' : 'Same-Sector'}</div>
                <div className="mt-1 text-sm text-slate-200">Dominant relationship structure</div>
              </div>
            </div>
          </Panel>

          <div className=".default-bg bg-zinc-950 p-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200">Trading Relevance</div>
            <div className="mt-3 text-sm leading-7 text-zinc-200">{narrative.tradingRelevance}</div>
          </div>
          
          
        <div className=".default-bg bg-zinc-950 p-4">
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200">What To Watch</div>
          <div className="mt-3 text-sm leading-7 text-zinc-200">{narrative.whatToWatch}</div>
          </div>         
        </div>
      </div>

      <Panel title={t("panels.pairCharts")} right={<span className="text-xs uppercase tracking-[0.22em] text-slate-200">visual explanation</span>}>
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-4 md:grid-cols-2">
            {[...alignedPairs.slice(0, 2), ...opposedPairs.slice(0, 2)].map((pair) => (
              <div key={`${pair.key}-chart`} className="border border-zinc-900 small-panel-color p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm text-zinc-100">{pair.left.name} ↔ {pair.right.name}</div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-200">{pair.relationship}</div>
                  </div>
                  <span className={cls('inline-flex items-center border px-2 py-1 text-[10px] uppercase tracking-[0.22em]', sectorBadgeTone(pair.sameSector))}>{pair.sectorLabel}</span>
                </div>
                <div className="mt-4">
                  <PairAlignmentSpark left={pair.leftPct} right={pair.rightPct} />
                </div>
                <div className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-200">Gap intensity</div>
                <div className="mt-2"><PairDistanceBar distance={pair.distance} /></div>
                <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-200">
                  <span>{formatPercentile(pair.leftPct)} / {formatPercentile(pair.rightPct)}</span>
                  <span>Gap {formatPercentile(pair.distance)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="small-panel-color p-4 text-sm leading-7 text-zinc-300">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200">What these charts mean</div>
              <div className="mt-3">{chartExplanation}</div>
            </div>
            <div className="small-panel-color p-4 text-sm leading-7 text-zinc-300">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200">How to use them</div>
              <div className="mt-3">Use aligned pairs as confirmation tools. If one asset gives you a directional idea, check whether a related asset is sitting in a similar percentile state. Use opposed pairs as warning signs that the macro message may be split.</div>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title={t("panels.topAlignedPairs")}>
          <div className="space-y-3">
            {alignedPairs.map((pair) => (
              <div key={pair.key} className="border border-zinc-900 small-panel-color p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-zinc-100">{pair.left.name} ↔ {pair.right.name}</div>
                  <div className={cls('text-sm', relationshipTone(pair.distance))}>{pair.relationship}</div>
                </div>
                <div className="mt-2"><PairDistanceBar distance={pair.distance} /></div>
                <div className="mt-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-200">
                  <span>{formatPercentile(pair.leftPct)} / {formatPercentile(pair.rightPct)}</span>
                  <span>gap {formatPercentile(pair.distance)}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title={t("panels.topOpposedPairs")}>
          <div className="space-y-3">
            {opposedPairs.map((pair) => (
              <div key={pair.key} className="border border-zinc-900 small-panel-color p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-zinc-100">{pair.left.name} ↔ {pair.right.name}</div>
                  <div className={cls('text-sm', relationshipTone(pair.distance))}>{pair.relationship}</div>
                </div>
                <div className="mt-2"><PairDistanceBar distance={pair.distance} /></div>
                <div className="mt-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-200">
                  <span>{formatPercentile(pair.leftPct)} / {formatPercentile(pair.rightPct)}</span>
                  <span>gap {formatPercentile(pair.distance)}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}
function SeasonalityView({ assets, openGuide, seasonalityData = [], aiLanguage = "en" }) {  const { t } = useTranslation();
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

  const simpleGuide = useMemo(() => {
    if (narrative.breadth == null) {
      return {
        title: 'How to read this',
        summary: 'Seasonality shows how friendly or unfriendly the calendar has historically been for an asset during different months.',
        takeaway: 'Green cells mean the month tends to support that asset more often. Red cells mean the month tends to be weaker or less supportive.',
      }
    }

    if (narrative.breadth >= 20) {
      return {
        title: 'Plain-English read',
        summary: `The calendar is currently helping more assets than it is hurting. ${supportiveCount} assets are in supportive seasonal windows, while ${headwindCount} are in weak windows.`,
        takeaway: 'This does not mean buy everything. It means seasonality can support long ideas when COT positioning and chart structure agree.',
      }
    }

    if (narrative.breadth <= -20) {
      return {
        title: 'Plain-English read',
        summary: `The current month is a tougher seasonal backdrop. Only a smaller part of the universe has a helpful calendar tailwind, while ${headwindCount} assets are facing seasonal pressure.`,
        takeaway: 'In this kind of backdrop, seasonality is more useful as a warning filter than as a trigger to enter trades.',
      }
    }

    return {
      title: 'Plain-English read',
      summary: 'The calendar backdrop is mixed right now. Some assets have a supportive month, but the whole universe is not moving with one clear seasonal bias.',
      takeaway: 'Here seasonality should be used as a secondary layer. It helps more with ranking assets than with making broad market calls.',
    }
  }, [narrative.breadth, supportiveCount, headwindCount])

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
 
  return (
    <div className="space-y-4">
      <Panel title={t("panels.seasonality")} right={<GuideButton sectionKey="seasonality" openGuide={openGuide} />}>
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-4 md:grid-cols-3 metric-card">
            <Metric label="Current Month" value={currentMonth} />
            <Metric label="Seasonal Breadth" value={formatPercentile(narrative.breadth)} />
            <Metric label="Supportive Windows" value={`${supportiveCount}/${rows.length || 0}`} />
          </div>
          <div className="border border-zinc-900 small-panel-color p-4 text-sm leading-7 text-zinc-300">
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200">Quick Guide</div>
            <div className="mt-3 text-zinc-100">Seasonality is a calendar tendency.</div>
            <div className="mt-2">It asks a simple question: does this asset usually behave better, worse, or mixed in this month compared with the rest of the year?</div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.85fr]">
        <Panel title={t("panels.seasonalityHeatmap")} right={<span className="text-xs uppercase tracking-[0.22em] text-slate-200">12 month map</span>}>
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <div className="border border-zinc-900 small-panel-color p-3 text-sm text-zinc-300">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200">How to read green</div>
              <div className="mt-2">Green means the calendar month has been more supportive for that asset.</div>
            </div>
            <div className="border border-zinc-900 small-panel-color p-3 text-sm text-zinc-300">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200">How to read red</div>
              <div className="mt-2">Red means that month has historically been less supportive or weaker.</div>
            </div>
            <div className="border border-zinc-900 small-panel-color p-3 text-sm text-zinc-300">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200">Amber outline</div>
              <div className="mt-2">The outlined column marks the current month, so you know where to focus first.</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[1040px]">
              <div className="grid grid-cols-[180px_repeat(12,minmax(0,1fr))] gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-200">
                <div>Asset</div>
                {SEASONAL_MONTHS.map((m) => (
                  <div key={m} className="text-center">{m}</div>
                ))}
              </div>
              <div className="mt-3 space-y-2">
                {rows.map((row) => (
                  <div key={row.symbol} className="grid grid-cols-[180px_repeat(12,minmax(0,1fr))] gap-2">
                    <div className="flex items-center border border-zinc-900 bg-zinc-950 px-3 py-2">
                      <div>
                        <div className="text-sm text-zinc-100">{row.name}</div>
                        <div className="text-xs text-slate-200">{normalizeSector(row.sector)}</div>
                      </div>
                    </div>
                    {row.values.map((value, idx) => (
                      <div
                        key={`${row.symbol}-${SEASONAL_MONTHS[idx]}`}
                        className={cls(
                          'flex h-[52px] items-center justify-center border border-zinc-900 text-xs',
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
        </Panel>

        <div className="space-y-4">
          <AIAnalysisPanel
            type="seasonality"
            data={{
              current_month: currentMonth,
              supportive_count: supportiveCount,
              headwind_count: headwindCount,
              total_assets: rows.length,
              top_assets: rows.slice(0, 6).map(r => ({
                name: r.name, symbol: r.symbol,
                current: r.current,
                cot_index: r.cot_index ?? null
              })),
              bottom_assets: [...rows].reverse().slice(0, 4).map(r => ({
                name: r.name, symbol: r.symbol,
                current: r.current,
                cot_index: r.cot_index ?? null
              })),
            }}
            aiLanguage={aiLanguage}
            title={aiLanguage === "uk" ? "AI — Сезонний аналіз" : "AI — Seasonal Analysis"}
          />
         <Panel title={t("panels.currentMonthRanking")} right={<span className="text-xs uppercase tracking-[0.22em] text-slate-200">{currentMonth}</span>}>
            <div className="space-y-3">
              {topRanked.map((row) => (
                <div key={row.symbol} className="border border-zinc-900 small-panel-color p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-base text-zinc-100">{row.name}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-200">{normalizeSector(row.sector)}</div>
                    </div>
                    <div className={cls('text-sm', seasonalBiasTone(row.current))}>{seasonalBiasLabel(row.current)}</div>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden bg-zinc-900">
                    <div
                      className={cls('h-full', row.current >= 55 ? 'bg-emerald-400' : row.current <= 45 ? 'bg-rose-400' : 'bg-amber-300')}
                      style={{ width: `${Math.max(6, row.current)}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-slate-200">Seasonal score</span>
                    <span className="text-zinc-200">{formatPercentile(row.current)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title={simpleGuide.title}>
            <div className="space-y-3 text-sm leading-7 text-zinc-300">
              <div>{simpleGuide.summary}</div>
              <div className="border border-zinc-900 small-panel-color p-3 text-zinc-400">{simpleGuide.takeaway}</div>
            </div>
          </Panel>
        </div>
      </div>

      <Panel title={t("panels.seasonalityCurves")} right={<span className="text-xs uppercase tracking-[0.22em] text-slate-200">visual explanation</span>}>
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-4 md:grid-cols-3">
            {chartRows.map((row) => (
              <div key={`${row.symbol}-spark`} className="border border-zinc-900 small-panel-color p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm text-zinc-100">{row.name}</div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-200">{seasonalBiasLabel(row.current)}</div>
                  </div>
                  <div className="text-sm text-zinc-400">{formatPercentile(row.current)}</div>
                </div>
                <div className="mt-4">
                  <MiniSparkline values={row.values} positive={row.current >= 55} />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-200">
                  <span>Worst {formatPercentile(row.worst)}</span>
                  <span>Best {formatPercentile(row.best)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="border border-zinc-900 small-panel-color p-4 text-sm leading-7 text-zinc-300">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200">What these charts mean</div>
              <div className="mt-3">{chartExplanation}</div>
            </div>
            <div className="border border-zinc-900 small-panel-color p-4 text-sm leading-7 text-zinc-300">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200">How to use them</div>
              <div className="mt-3">First look at the outlined current month in the heatmap. Then check whether the current month score sits near the upper or lower area of the sparkline. If the current month is strong and COT is also supportive, the setup is easier to trust.</div>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="border border-zinc-900 default-bg p-4">
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200">Narrative Summary</div>
          <div className="mt-3 text-sm leading-7 text-zinc-200">{narrative.summary}</div>
        </div>
        <div className="border border-zinc-900 default-bg p-4">
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200">Interpretation</div>
          <div className="mt-3 text-sm leading-7 text-zinc-200">{narrative.interpretation}</div>
        </div>
        <div className="border border-zinc-900 default-bg p-4">
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200">Trading Relevance</div>
          <div className="mt-3 text-sm leading-7 text-zinc-200">{narrative.tradingRelevance}</div>
        </div>
        <div className="border border-zinc-900 default-bg p-4">
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200">What To Watch</div>
          <div className="mt-3 text-sm leading-7 text-zinc-200">{narrative.whatToWatch}</div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="border border-zinc-900 bg-[#080808] p-4">
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200">Strongest Tailwind</div>
          <div className="mt-2 text-lg text-zinc-100">{strongest?.name || 'n/a'}</div>
          <div className="mt-1 text-sm text-slate-200">Current month score: {formatPercentile(strongest?.current)}</div>
        </div>
        <div className="border border-zinc-900 bg-[#080808] p-4">
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200">Weakest Window</div>
          <div className="mt-2 text-lg text-zinc-100">{weakest?.name || 'n/a'}</div>
          <div className="mt-1 text-sm text-slate-200">Current month score: {formatPercentile(weakest?.current)}</div>
        </div>
        <div className="border border-zinc-900 bg-[#080808] p-4">
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200">Why this matters</div>
          <div className="mt-2 text-sm leading-7 text-zinc-300">Use seasonality as a background filter. Prefer assets where the calendar bias, COT positioning, and chart structure point in the same direction.</div>
        </div>
      </div>
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
    <div className="flex justify-end">
      <GuideButton sectionKey="cot" openGuide={openGuide} />
    </div>
    {Object.entries(sectorGroups).map(([sector, items]) => {
      const headerGroups = items.length ? getGroupConfig(items[0]) : []

      return (
        <Panel key={sector} title={sector}>
          <div className="overflow-x-auto">
            <table className="min-w-[1200px] w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-zinc-950">
                <tr className="border-b border-zinc-800 text-[11px] uppercase tracking-[0.22em] text-blue-50">
                  <th rowSpan={2} className="sticky left-0 z-20 bg-zinc-950 px-3 py-3 text-left font-medium">
                    Symbol
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
                      <th className="px-3 py-2 text-right">Long</th>
                      <th className="px-3 py-2 text-right">Short</th>
                      <th className="px-3 py-2 text-right">Net</th>
                      <th className="px-3 py-2 text-right">Index</th>
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
    const sym   = asset.symbol;

    const conviction = Math.abs(safe - 50) * 2;

    const crowding =
      safe >= 90 || safe <= 10 ? "Extreme" :
      safe >= 75 || safe <= 25 ? "Elevated" : "Moderate";

    const setupBias =
      safe >= 90 ? "Long Extreme" :
      safe >= 65 ? "Bullish Context" :
      safe <= 10 ? "Short Extreme" :
      safe <= 35 ? "Bearish Context" : "Balanced";

    const wowAbs = wow != null ? Math.abs(wow).toFixed(1) : null;
    let momentumLine = "";
    if (wow != null && wowAbs !== null) {
      const wowDir = wow > 0 ? "added" : "reduced";
      const wowSize = Math.abs(wow) >= 10 ? "sharply" : Math.abs(wow) >= 5 ? "meaningfully" : "modestly";
      momentumLine = `This week funds ${wowDir} exposure ${wowSize} (${wow > 0 ? "+" : ""}${wow.toFixed(1)} index points).`;
    }

    const trendLine = accel === "accelerating"
      ? "The move is accelerating — institutional conviction is growing."
      : accel === "decelerating"
      ? "The move is decelerating — watch for a potential stall or reversal."
      : accel === "stable"
      ? "The pace of positioning change is stable."
      : "";

    const avgLine = avg3w != null && avg8w != null
      ? `Short-term average (3w: ${avg3w.toFixed(1)}) is ${avg3w > avg8w ? "above" : "below"} the medium-term average (8w: ${avg8w.toFixed(1)}) — ${avg3w > avg8w ? "strengthening trend" : "weakening momentum"}.`
      : "";

    let setupSummary = "";
    if (safe >= 90) {
      setupSummary = `${name} is at a 3-year positioning extreme — funds hold their largest long position of the cycle at ${safe.toFixed(0)}.`;
    } else if (safe >= 65) {
      setupSummary = `${name} sits firmly in the bullish positioning zone at ${safe.toFixed(0)} on the 3-year scale.`;
    } else if (safe <= 10) {
      setupSummary = `${name} is at a 3-year short extreme (${safe.toFixed(0)}). Funds are as bearish as they have been in years.`;
    } else if (safe <= 35) {
      setupSummary = `${name} is in a bearish positioning zone at ${safe.toFixed(0)}. Funds hold a net short bias.`;
    } else {
      setupSummary = `${name} sits in a neutral zone at ${safe.toFixed(0)} — neither convincingly long nor short.`;
    }

    let contextualInterpretation = "";
    if (safe >= 90) {
      contextualInterpretation += `**Crowded long.** Funds are at cycle highs. The risk here is asymmetric — upside is limited while downside from forced liquidation is real. `;
    } else if (safe >= 65) {
      contextualInterpretation += `**Constructive positioning.** This is the sweet spot for trend trades. Funds are clearly positioned long but haven't reached the crowded extreme. `;
    } else if (safe <= 10) {
      contextualInterpretation += `**Crowded short.** The market is heavily positioned for downside. Mean-reversion risk is elevated — any positive catalyst could spark a sharp squeeze. `;
    } else if (safe <= 35) {
      contextualInterpretation += `**Bearish positioning.** Funds lean short without being at extremes. The backdrop supports selling rallies rather than buying dips. `;
    } else {
      contextualInterpretation += `**Neutral zone.** Positioning alone provides no directional edge. Conviction from other sources is needed before acting. `;
    }
    if (trendLine) contextualInterpretation += `${trendLine} `;
    if (momentumLine) contextualInterpretation += `${momentumLine} `;
    if (avgLine) contextualInterpretation += `\n\n${avgLine}`;

    let gptCommentary = "";
    if (safe >= 90) {
      gptCommentary = `**Positioning edge:** None from a fresh long entry — risk is skewed to the downside from here.\n\n**Trade approach:** Avoid new longs. Consider lightening existing positions or using tight stops.\n\n**Key level to watch:** A COT Index drop below 75 would signal the crowd is starting to exit.`;
    } else if (safe >= 65) {
      gptCommentary = `**Positioning edge:** Long bias is confirmed — use weakness as an opportunity.\n\n**Trade approach:** Buy dips within the trend. Keep stops below recent swing lows.\n\n**Key level to watch:** Watch for COT Index to sustain above 65 — a drop below would shift the bias.`;
    } else if (safe <= 10) {
      gptCommentary = `**Positioning edge:** Squeeze potential is high — be cautious on fresh shorts.\n\n**Trade approach:** Avoid adding shorts. Watch for any catalyst that could force covering.\n\n**Key level to watch:** A COT Index cross above 15 would be early confirmation of a squeeze forming.`;
    } else if (safe <= 35) {
      gptCommentary = `**Positioning edge:** Bearish bias is supported — rallies are selling opportunities.\n\n**Trade approach:** Fade strength rather than chasing breakdown. Short into bounces.\n\n**Key level to watch:** If COT rises back above 45, the bearish thesis weakens considerably.`;
    } else {
      gptCommentary = `**Positioning edge:** None — neutral positioning means neither bulls nor bears have institutional backing.\n\n**Trade approach:** Wait for a directional break above 65 or below 35 before committing.\n\n**Key level to watch:** A sustained move to either extreme zone would establish a new setup.`;
    }

    const checklist = [
      { label: "COT regime agrees with bias",     pass: safe >= 65 || safe <= 35 },
      { label: "Flow state is directional",        pass: flow !== "Neutral" },
      { label: "Not in the most crowded zone",     pass: safe < 90 && safe > 10 },
      { label: "Momentum confirms direction",      pass: accel === "accelerating" },
    ];

    return {
      pct: safe, conviction, crowding, setupBias,
      setupSummary, contextualInterpretation, gptCommentary, checklist,
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
        <div className="text-sm text-zinc-400">No asset data loaded.</div>
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
              Export PDF
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
        <div className="flex flex-wrap items-end justify-between gap-3 border-t border-zinc-900 pt-3">
          <div>
            <div className="text-xl font-semibold text-zinc-100">{asset.name}</div>
            <div className="mt-0.5 text-[11px] uppercase tracking-[0.22em] text-slate-300">
              {asset.symbol} · {normalizeSector(asset.sector)} ·{' '}
              <span className={flowColor(profile.pct)}>{profile.setupBias}</span>
              {' · '}
              <span className="text-zinc-500">Conviction {formatPercentile(profile.conviction)}</span>
              {' · '}
              <span className="text-zinc-500">Crowding {profile.crowding}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Quick COT badge */}
            <div style={{
              padding: '4px 12px', fontSize: '13px', fontWeight: 700,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
              color: profile.pct >= 65 ? '#4ade80' : profile.pct <= 35 ? '#f87171' : '#94a3b8',
              boxShadow: profile.pct >= 65
                ? '0 0 12px rgba(74,222,128,0.25)'
                : profile.pct <= 35
                ? '0 0 12px rgba(248,113,113,0.25)'
                : 'none',
            }}>
              {formatPercentile(profile.pct)}
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
              {asset.flow_state || 'Neutral'}
            </div>
          </div>
        </div>
      </Panel>

      {/* ── MAIN GRID ── */}
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">

        {/* ── LEFT COLUMN ── */}
        <div className="space-y-4">

          {/* Metrics row */}
          <div className="grid gap-4 md:grid-cols-4 metric-card">
            <Metric label="Funds Net"     value={formatNumber(asset.funds_net)} />
            <Metric label="Dealer Net"    value={formatNumber(asset.dealer_net)} />
            <Metric label="Open Interest" value={formatNumber(asset.open_interest)} />
            <Metric label="Flow State"    value={asset.flow_state || "Neutral"} />
          </div>

          {/* Momentum bar */}
          <div className="border border-zinc-900 bg-[#080808] px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="text-[11px] uppercase tracking-[0.22em] text-slate-200">Momentum</span>
              <MomentumBadge asset={asset} size="md" />
              <div className="flex items-center gap-6 text-[11px] text-slate-200">
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
                  <span>vs trend: <span className={
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
                    {asset.funds_index_acceleration}
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
                  {profile.setupBias}
                </div>
                <div className="text-center text-[10px] uppercase tracking-[0.18em] text-zinc-500 mt-0.5">
                  {regimeLabel(profile.pct, t)} · {signalLabel(profile.pct, t)}
                </div>
              </div>

              {/* Bias bar + summary */}
              <div className="space-y-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-200 mb-1">
                  Positioning Bias
                </div>
                <BiasBar value={profile.pct} />
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.15em] text-zinc-500">
                  <span>Defensive</span>
                  <span className={flowColor(profile.pct)}>{formatPercentile(profile.pct)}</span>
                  <span>Constructive</span>
                </div>
                <div className="border border-zinc-900 p-3 text-xs text-blue-400 small-panel-color mt-2">
                  {profile.setupSummary}
                </div>
              </div>
            </div>
          </Panel>

          {/* Contextual Interpretation + GPT Commentary */}
          <div className="grid gap-4 xl:grid-cols-2">
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
            right={<span className="text-[10px] uppercase tracking-[0.22em] text-slate-200">seasonal context</span>}
          >
            <div className="border border-zinc-900 small-panel-color p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200 mb-3">
                Seasonal Curve
              </div>
              {sparkProfile.length === 12 ? (
                <>
                  <MiniSparkline values={sparkProfile} positive={profile.pct >= 55} />
                  <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                    <span>Jan</span>
                    <span className="text-blue-400">{SEASONAL_MONTHS[new Date().getMonth()]}</span>
                    <span>Dec</span>
                  </div>
                  <div className="mt-3 text-xs leading-5 text-zinc-400">
                    Average monthly COT positioning over the last 5 years.
                    Aligned seasonal + COT direction strengthens the setup.
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

          {/* Confirmation Checklist — with box-shadow on dots */}
          <Panel title={t("panels.confirmationChecklist")}>
            <div className="space-y-2">
              {profile.checklist.map((item, idx) => (
                <div
                  key={`${item.label}-${idx}`}
                  className="flex items-start gap-3 border border-zinc-900 small-panel-color p-3"
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
                      {item.pass ? "Confirmed" : "Not met"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* AI Asset Analysis */}
          <AIAnalysisPanel
            type="asset"
            data={asset}
            aiLanguage={aiLanguage}
            title={aiLanguage === "uk" ? "AI-Аналіз активу" : "AI Asset Analysis"}
          />

          {/* Sector Peers */}
          <Panel title={t("panels.sectorPeers")}>
            <div className="space-y-2">
              {sectorPeers.length ? (
                sectorPeers.map((peer) => (
                  <button
                    key={peer.symbol}
                    onClick={() => setSelected(peer.symbol)}
                    className="w-full border border-zinc-900 small-panel-color p-3 text-left hover:border-zinc-700 transition"
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
                <div className="text-sm text-slate-300">No peer assets available.</div>
              )}
            </div>
          </Panel>

        </div>
      </div>
    </div>
  );
}

function SignalHistoryTable({ items, loading }) {
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
        <polyline points={points} fill="none" stroke="#71717a" strokeWidth="1.5" />
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
                <th className="px-3 py-2 text-left">Asset</th>
                <th className="px-3 py-2 text-left">Dir</th>
                <th className="px-3 py-2 text-left">State</th>
                <th className="px-3 py-2 text-right">Weeks</th>
                <th className="px-3 py-2 text-right">Current</th>
                <th className="px-3 py-2 text-right">Peak</th>
                <th className="px-3 py-2 text-left">First seen</th>
                <th className="px-3 py-2 text-left">8w trend</th>
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

  const macroComposite = averagePercentile([
    { funds_percentile_3y: growthScore },
    { funds_percentile_3y: inflationScore },
    { funds_percentile_3y: policyScore },
  ])

    const engine = useMemo(
    () => buildSignalEngine(assets, seasonalityData, macroComposite),
    [assets, seasonalityData, macroComposite]
  )

 const [stateFilter, setStateFilter] = useState('all')
  const [directionFilter, setDirectionFilter] = useState('all')
  const [sectorFilter, setSectorFilter] = useState('all')
  const [minScore, setMinScore] = useState(55)
  const [alertsOnly, setAlertsOnly] = useState(false)
 
  // Signal history state
  const [signalHistory, setSignalHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyTab, setHistoryTab] = useState('live') // 'live' | 'history'
 
  React.useEffect(() => {
    setHistoryLoading(true)
    fetch('/api/signals/history?active_only=false&limit=200')
      .then((r) => r.ok ? r.json() : { items: [] })
      .then((json) => setSignalHistory(json.items || []))
      .catch(() => setSignalHistory([]))
      .finally(() => setHistoryLoading(false))
  }, [])
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
    rows = rows.filter((x) => x.priorityScore >= minScore)

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
      <div className="flex border-b border-zinc-900">
        {[{key:'live',label:'Live Signals'},{key:'history',label:'Signal History'}].map((tab) => (
          <button key={tab.key} onClick={() => setHistoryTab(tab.key)}
            className={cls('border-b-2 px-4 py-2.5 text-[11px] uppercase tracking-[0.22em] transition',
              historyTab === tab.key ? 'border-amber-400 text-zinc-100' : 'border-transparent text-slate-200 hover:text-zinc-300'
            )}>
            {tab.label}
          </button>
        ))}
      </div>

      {historyTab === 'history' ? (
        <Panel title="Signal Lifecycle History">
          <SignalHistoryTable items={signalHistory} loading={historyLoading} />
        </Panel>
      ) : (<>

      <Panel title="Ranked Live Signal" right={<GuideButton sectionKey="signals" openGuide={openGuide} />}>
            
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5 metric-card">
          <Metric label="Tracked Signals" value={engine.counts.total} />
          <Metric label="Active" value={engine.counts.active} />
          <Metric label="Aging" value={engine.counts.aging} />
          <Metric label="Invalidated" value={engine.counts.invalidated} />
          <Metric label="Alert Feed" value={engine.counts.alerts} />
        </div>
      </Panel>

      <Panel
        title="Filters"
        right={<span className="text-xs uppercase tracking-[0.22em] text-slate-200">control the queue</span>}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div>
            <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-slate-200">State</div>
            <CustomSelect value={stateFilter} onChange={setStateFilter} minWidth="100%"
              options={[{value:"all",label:"All"},{value:"active",label:"Active"},{value:"aging",label:"Aging"},
                {value:"candidate",label:"Candidate"},{value:"stale",label:"Stale"},{value:"invalidated",label:"Invalidated"}]} />
          </div>

          <div>
            <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-slate-200">Direction</div>
            <CustomSelect value={directionFilter} onChange={setDirectionFilter} minWidth="100%"
              options={[{value:"all",label:"All"},{value:"long",label:"Long"},{value:"short",label:"Short"},{value:"neutral",label:"Neutral"}]} />
          </div>

          <div>
            <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-slate-200">Sector</div>
            <CustomSelect value={sectorFilter} onChange={setSectorFilter} minWidth="100%"
              options={sectors.map((s) => ({ value: s, label: s === "all" ? "All" : s }))} />
          </div>

          <div>
            <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-slate-200">Minimum Score</div>
            <CustomSelect value={String(minScore)} onChange={(v) => setMinScore(Number(v))} minWidth="100%"
              options={[{value:"0",label:"0+"},{value:"40",label:"40+"},{value:"55",label:"55+"},{value:"70",label:"70+"},{value:"85",label:"85+"}]} />
          </div>

          <div>
            <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-slate-200">Sort By</div>
            <CustomSelect value={sortBy} onChange={setSortBy} minWidth="100%"
              options={[{value:"priority",label:"Priority"},{value:"quality",label:"Entry Quality"},
                {value:"freshness",label:"Freshness"},{value:"age",label:"Age"}]} />
          </div>

          <div>
            <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-slate-200">Alerts Only</div>
            <button
              onClick={() => setAlertsOnly((v) => !v)}
              className={cls(
                'w-full border px-3 py-2 text-sm transition',
                alertsOnly
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                  : 'border-zinc-900 bg-[#080808] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              )}
            >
              {alertsOnly ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel
          title="Ranked Signals"
          right={<span className="text-xs uppercase tracking-[0.22em] text-slate-200">{filteredSignals.length} visible</span>}
        >
          <div className="space-y-3">
            {filteredSignals.length ? filteredSignals.map((signal) => (
              <button
                key={signal.id}
                onClick={() => {
                  setSelected(signal.symbol)
                  setActive('explorer')
                }}
                className="w-full border border-zinc-900 small-panel-color p-4 text-left transition hover:border-zinc-700"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm text-zinc-100">{signal.asset}</div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-200">
                      {signal.symbol} · {signal.sector}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cls('inline-flex items-center border px-2 py-1 text-[10px] uppercase tracking-[0.22em]', stateTone(signal.state))}>
                      {stateLabel(signal.state)}
                    </span>
                    <span className={cls('text-[11px] uppercase tracking-[0.2em]', directionTone(signal.direction))}>
                      {directionLabel(signal.direction)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-5">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-slate-200">Priority</div>
                    <div className="mt-1 text-sm text-zinc-100">{formatPercentile(signal.priorityScore)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-slate-200">Entry</div>
                    <div className="mt-1 text-sm text-zinc-100">{signal.conviction}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-slate-200">Freshness</div>
                    <div className="mt-1 text-sm text-zinc-100">{formatPercentile(signal.freshnessScore)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-slate-200">Age</div>
                    <div className="mt-1 text-sm text-zinc-100">{signal.ageWeeks}w</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-slate-200">Regime</div>
                    <div className="mt-1 text-sm text-zinc-100">{signal.regime}</div>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 md:grid-cols-4 text-xs">
                  <div className="border border-zinc-900 bg-zinc-950 p-2 text-zinc-400">
                    Signal: <span className="text-zinc-200">{signal.signalLabel}</span>
                  </div>
                  <div className="border border-zinc-900 bg-zinc-950 p-2 text-zinc-400">
                    Flow: <span className="text-zinc-200">{signal.flowState}</span>
                  </div>
                  <div className="border border-zinc-900 bg-zinc-950 p-2 text-zinc-400">
                    Macro: <span className="text-zinc-200">{formatPercentile(signal.macroScore)}</span>
                  </div>
                  <div className="border border-zinc-900 bg-zinc-950 p-2 text-zinc-400">
                    Seasonality: <span className="text-zinc-200">{formatPercentile(signal.seasonalityScore)}</span>
                  </div>
                </div>
              </button>
            )) : (
              <div className="text-sm text-zinc-400">No signals match the active filters.</div>
            )}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel
            title="Alert Feed"
            right={<span className="text-xs uppercase tracking-[0.22em] text-rose-300">transition monitor</span>}
          >
            <div className="space-y-3">
              {activeAlerts.length ? activeAlerts.map((alert) => (
                <div key={alert.id} className="border border-zinc-900 small-panel-color p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm text-zinc-100">{alert.title}</div>
                      <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-200">
                        {alert.asset} · {directionLabel(alert.direction)}
                      </div>
                    </div>
                    <span className={cls('inline-flex items-center border px-2 py-1 text-[10px] uppercase tracking-[0.22em]', alertImpactTone(alert.impact))}>
                      {alert.impact}
                    </span>
                  </div>
                  <div className="mt-3 text-sm leading-7 text-zinc-300">{alert.text}</div>
                </div>
              )) : (
                <div className="text-sm text-zinc-400">No live alerts right now.</div>
              )}
            </div>
          </Panel>

          <Panel
            title="State Guide"
            right={<span className="text-xs uppercase tracking-[0.22em] text-slate-200">reading signals</span>}
          >
            <div className="space-y-3 text-sm leading-7 text-zinc-300">
              <div><span className="text-zinc-100">Candidate:</span> a directional idea exists, but quality or confirmation is not strong enough yet.</div>
              <div><span className="text-zinc-100">Active:</span> a live setup with adequate quality and timing.</div>
              <div><span className="text-zinc-100">Aging:</span> the setup is still alive, but time decay is reducing its usefulness.</div>
              <div><span className="text-zinc-100">Stale:</span> the setup has lost timing edge and should not be treated as fresh.</div>
              <div><span className="text-zinc-100">Invalidated:</span> the signal failed minimum quality conditions or lost structural support.</div>
            </div>
          </Panel>

          <Panel
            title="Engine Notes"
            right={<span className="text-xs uppercase tracking-[0.22em] text-slate-200">phase one</span>}
          >
            <div className="space-y-3 text-sm leading-7 text-zinc-300">
              <div>This phase computes signal lifecycle directly from live positioning context without persistent backend history.</div>
              <div>Signal age is inferred from current percentile extremity rather than stored event timestamps.</div>
              <div className="border border-zinc-900 small-panel-color p-3 text-zinc-400">
                Next phase can persist prior signal states and generate true transition alerts between weekly updates.
              </div>
            </div>
          </Panel>

          <AIAnalysisPanel
            type="signals"
            data={{ signals: engine.signals.slice(0, 6) }}
            aiLanguage={aiLanguage}
            title={aiLanguage === "uk" ? "AI-Аналіз сигналів" : "AI Signal Analysis"}
          />
        </div>
      </div>
      </>)}
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
    <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
      <div className="space-y-4">
 
        {/* Manual run */}
        <Panel title={t("panels.updateControl")}>
          <div className="space-y-4">
            <div className="text-sm leading-7 text-zinc-300">
              Run the Python worker manually from the UI. This will download current CFTC data,
              compute metrics and upsert records into <span className="text-zinc-100">cot_analytics</span>.
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onRun}
                disabled={updateBusy || isRunning}
                className={cls(
                  'border px-4 py-3 text-sm uppercase tracking-[0.22em]',
                  updateBusy || isRunning
                    ? 'cursor-not-allowed border-zinc-800 text-zinc-600'
                    : 'border-amber-400 text-amber-300 hover:bg-amber-400/10'
                )}
              >
                {isRunning ? 'Worker Running...' : 'Run Worker'}
              </button>
              <div className={cls('text-sm uppercase tracking-[0.2em]', statusTone)}>
                {updateState?.status || 'idle'}
              </div>
            </div>
          </div>
        </Panel>
 
        {/* Worker Log */}
        <Panel title="Worker Log">
          <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap text-sm leading-6 text-zinc-300">
            {updateState?.log || 'No log output yet.'}
          </pre>
        </Panel>
      </div>
 
      <div className="space-y-4">
 
        {/* Auto-Schedule status */}
        <Panel title="Auto-Schedule">
          <div className="space-y-3 text-sm text-zinc-300">
            {schedulerState ? (
              <>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-200">Status</span>
                  <span className={schedulerState.scheduler_running ? 'text-emerald-400' : 'text-rose-400'}>
                    {schedulerState.scheduler_running ? 'Active' : 'Stopped'}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-200">Schedule</span>
                  <span className="text-zinc-300">{schedulerState.schedule}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-200">Next run</span>
                  <span className="text-amber-300">{fmtUtc(schedulerState.next_run_utc)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-slate-200">Last auto-run</span>
                  <span>{fmtUtc(schedulerState.last_auto_run_utc)}</span>
                </div>
                <div className="mt-2 border border-zinc-900 bg-zinc-950 p-3 text-xs text-slate-200">
                  CFTC publishes every Friday ~15:30 EST. Auto-run fires at 16:00 EST (21:00 UTC)
                  with 30 min buffer to ensure data is available.
                </div>
              </>
            ) : (
              <div className="text-zinc-600">
                Scheduler status unavailable. Restart backend to activate.
              </div>
            )}
          </div>
        </Panel>
 
        {/* Run Status */}
        <Panel title="Run Status">
          <div className="space-y-3 text-sm text-zinc-300">
            <div className="flex justify-between gap-4">
              <span className="text-slate-200">Status</span>
              <span className={statusTone}>{updateState?.status || 'idle'}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-200">Started</span>
              <span>{fmtUtc(updateState?.started_at)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-200">Finished</span>
              <span>{fmtUtc(updateState?.finished_at)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-200">Return code</span>
              <span>{updateState?.return_code ?? '—'}</span>
            </div>
          </div>
        </Panel>
 
        {/* Errors */}
        <Panel title="Errors">
          <div className="text-sm leading-7 text-zinc-300">
            {updateState?.error || 'No errors reported.'}
          </div>
        </Panel>
 
      </div>
    </div>
  )
}

function Placeholder({ title }) { return (<Panel title={title}><div className="text-sm text-zinc-400">This tab is scaffolded. Live data is already connected for core COT views.</div></Panel>) }

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
    <Panel title={t("settings.title")}>
      <div className="space-y-6 text-sm text-zinc-300">
        <LanguageSettings 
          uiLanguage={uiLanguage}
          aiLanguage={aiLanguage}
          syncAiWithUi={syncAiWithUi}
          onChangeUiLanguage={onChangeUiLanguage}
          onChangeAiLanguage={onChangeAiLanguage}
          onToggleSyncAiWithUi={onToggleSyncAiWithUi}
        />
 
        {/* Timezone selector */}
        <div className="space-y-2">
          <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200">
            Display Timezone
          </div>
          <CustomSelect
            value={timezone}
            onChange={onChangeTimezone}
            options={TIMEZONES}
            minWidth="280px"
          />
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
    </Panel>
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
        <section className="border border-zinc-900 ">
          <div className="border-b border-zinc-900 px-4 py-3">
            <span className="text-[11px] uppercase tracking-[0.25em] text-slate-200">
              {aiLanguage === "uk" ? "Список спостереження" : "Watchlist"}
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
      <section className="border border-zinc-900 ">
        <div className="flex items-center justify-between border-b border-zinc-900 px-4 py-3">
          <span className="text-[11px] uppercase tracking-[0.25em] text-slate-200">
            {aiLanguage === "uk" ? "Список спостереження" : "Watchlist"}
          </span>
          <span className="text-[11px] uppercase tracking-[0.22em] text-zinc-600">
            {watchedAssets.length} {aiLanguage === "uk" ? "активів" : "assets"}
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
          placeholder={aiLanguage === "uk" ? "Обери актив..." : "Select asset..."}
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
        {aiLanguage === "uk" ? "Додати" : "Add"}
      </button>
    </div>
  )
}
 
// ── Single watchlist card ─────────────────────────────────────────────────────
function WatchlistCard({ asset, onOpen, onRemove, aiLanguage }) {
  const idx    = asset.funds_percentile_3y
  const dirMap = { rising: "↑", falling: "↓", flat: "→" }
  const arrow  = dirMap[asset.funds_index_direction] || ""
 
  const idxBg = idx >= 90 ? "border-rose-800/50 bg-rose-950/20"
              : idx <= 10 ? "border-emerald-800/50 bg-emerald-950/20"
              : "border-zinc-800 bg-[#080808]"
 
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
          title={aiLanguage === "uk" ? "Видалити" : "Remove"}
        >
          ✕
        </button>
      </div>
 
      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-2">
        {/* COT Index */}
        <div className="border border-zinc-900 small-panel-color p-2 text-center">
          <div className="text-[9px] uppercase tracking-[0.18em] text-zinc-200">Index</div>
          <div className={cls("mt-1 text-base font-semibold tabular-nums", flowColor(idx))}>
            {idx != null ? idx.toFixed(1) : "n/a"}
          </div>
        </div>
        {/* Momentum */}
        <div className="border border-zinc-900 small-panel-color p-2 text-center">
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
        <div className="border border-zinc-900 small-panel-color p-2 text-center">
          <div className="text-[9px] uppercase tracking-[0.18em] text-zinc-200">Flow</div>
          <div className={cls("mt-1 text-[10px] uppercase tracking-[0.14em]", flowColor(idx))}>
            {asset.flow_state || "Neutral"}
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
      <div className="h-1 overflow-hidden bg-zinc-900">
        <div
          className={cls("h-full transition-all", flowColor(idx).replace("text-", "bg-"))}
          style={{ width: `${Math.max(2, idx ?? 0)}%` }}
        />
      </div>
 
      {/* Open in Explorer */}
      <button
        onClick={() => onOpen(asset.symbol)}
        className="w-full border border-zinc-800 py-1.5 text-[10px] uppercase tracking-[0.22em] text-slate-200 hover:border-zinc-700 hover:text-zinc-300 transition"
      >
        {aiLanguage === "uk" ? "Відкрити аналіз →" : "Open in Explorer →"}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// GUIDE VIEW — вставити в App.jsx перед function App()
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// GUIDE_SECTIONS — complete bilingual (EN / UK) platform guide
// Syntax rules:
//   [[BOLD_UPPER]]Short heading[[/]]  → rendered as bold UPPERCASE on its own line
//   [[BOLD]]inline text[[/]]          → rendered as bold inline within a sentence
//   \n\n                              → paragraph break
// ─────────────────────────────────────────────────────────────────────────────

const GUIDE_SECTIONS = [

  // ── 1. WORKSPACE ────────────────────────────────────────────────────────────
  {
    key: "workspace",
    icon: "⊞",
    color: "#60a5fa",
    title: {
      en: "Live Workspace",
      uk: "Робочий простір"
    },
    summary: {
      en: "Your weekly starting point. Everything that matters for decision-making on one screen — market mood, COT positioning, signals, news, and economic events.",
      uk: "Ваша щотижнева відправна точка. Все найважливіше для прийняття рішень на одному екрані — настрій ринку, позиціонування COT, сигнали, новини та економічні події."
    },
    blocks: [
      {
        title: {
          en: "What this section gives you and how to use it",
          uk: "Що дає цей розділ і як ним користуватися"
        },
        content: {
          en: `Workspace is designed to be opened first every Monday morning, after the CFTC Commitments of Traders report has been published on Friday. In ten minutes of reviewing this screen you should understand: what the macroeconomic mood is, where institutional money is positioned, which signals are currently active, and what economic events are coming this week.

[[BOLD_UPPER]]Recommended weekly routine[[/]]

First, look at the Macro Context block to understand whether the market is in a risk-on or risk-off mood. Second, review the Macro Regime block to see where the big money is positioned across three large groups of assets. Third, check the Top Active Signals to spot the highest-quality setups. Fourth, scan the COT Heatmap to compare all twenty-five assets at once. Fifth, look at the Economic Calendar to know which days require extra caution. Sixth, read through Market News to understand the narrative context.

Only after this full circle do you move to deeper sections — Asset Explorer for detailed analysis of a specific instrument, or Signals for a complete ranked list of all setups.

[[BOLD]]Useful link:[[/]] the official CFTC page about the Commitments of Traders report — https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm`,
          uk: `Робочий простір створений для того, щоб ви відкривали його першим щопонеділка вранці, після того як у п'ятницю CFTC опублікувала звіт про зобов'язання трейдерів. За десять хвилин перегляду цього екрану ви маєте розуміти: який зараз макроекономічний настрій, де знаходяться позиції великих гравців, які сигнали зараз активні та які економічні події попереду на цьому тижні.

[[BOLD_UPPER]]Рекомендований щотижневий розпорядок[[/]]

Спочатку подивіться на блок Макроекономічний контекст, щоб зрозуміти, в якому настрої ринок — схильному до ризику чи такому, що ризику уникає. Потім перегляньте блок Макроекономічний режим, щоб побачити, де позиціоновані великі гроші по трьох великих групах активів. Третім кроком перевірте Топ активних сигналів. Четвертим — проскануйте Теплову карту звіту COT, щоб порівняти всі двадцять п'ять активів одночасно. П'ятим — подивіться Економічний календар. Шостим — прочитайте Ринкові новини.

Тільки після цього повного кола ви переходите до глибших розділів — Дослідник активів для детального аналізу конкретного інструмента, або Сигнали для повного ранжованого списку всіх торгових конфігурацій.

[[BOLD]]Корисне посилання:[[/]] офіційна сторінка CFTC про звіт про зобов'язання трейдерів — https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm`
        }
      },
      {
        title: {
          en: "Macro Context: VIX, Yield Curve, Dollar Index, S&P 500",
          uk: "Макроекономічний контекст: VIX, Крива дохідності, Індекс долара, S&P 500"
        },
        content: {
          en: `Macro Context is four indicators that tell you what is happening in the broader market before you look at COT data. Think of it as checking the weather before getting dressed.

[[BOLD_UPPER]]VIX — the fear index[[/]]

VIX (Volatility Index) measures the expected volatility of the S&P 500 over the next thirty days. It is calculated by the Chicago Board Options Exchange based on options prices and is considered the main barometer of fear and complacency in the market.

When VIX is below fifteen, the market is calm and traders are complacent. This is a paradoxically dangerous moment for opening new long positions, because complacency historically precedes corrections. When VIX is between fifteen and twenty, this is a normal trading mode. When VIX rises into the range from twenty to thirty, this signals growing anxiety and increased risks. When VIX exceeds thirty, the market is in a state of fear — this is a classic risk-off mood when investors flee to defensive assets: gold, Japanese yen, US dollar, and government bonds.

[[BOLD]]Practical example:[[/]] VIX is at twenty-eight, the Dollar Index is strengthening, and the S&P 500 has fallen three percent over the week. This is a classic risk-off environment. If at the same time the COT report shows hedge funds actively buying gold, that signal is confirmed by the macroeconomic context and its probability of success increases significantly.

[[BOLD_UPPER]]Yield Curve — the relationship between two-year and ten-year bonds[[/]]

This indicator shows the difference between the yield on US ten-year Treasury bonds and two-year ones. It is historically one of the most reliable indicators of the economic cycle.

When the difference is positive, for example plus zero point five percent, this is a normal yield curve — the economy is growing. When the difference approaches zero, the curve is flattening — a warning of slowing growth. When the difference becomes negative, for example minus zero point three percent, this is called an inverted yield curve. Historically, inversion preceded every US recession over the last fifty years, usually with a lag of twelve to eighteen months.

[[BOLD]]Practical example:[[/]] The curve is inverted by minus zero point two percent, VIX is at twenty-two, the S&P 500 is at all-time highs. This is a sign of overheating with underlying systemic risk. In such an environment, a COT signal for a long position in stock indices is much less reliable. On the contrary, a signal for shorting the S&P 500 gets significant additional macroeconomic support.

[[BOLD]]Useful link:[[/]] real-time yield curve data on the Federal Reserve of St. Louis website — https://fred.stlouisfed.org/series/T10Y2Y

[[BOLD_UPPER]]Dollar Index (DXY)[[/]]

This is the weighted value of the US dollar against a basket of six major currencies: euro, Japanese yen, British pound, Canadian dollar, Swedish krona, and Swiss franc. The euro has the largest weight at fifty-seven point six percent.

When the Dollar Index strengthens, this puts pressure on gold, silver, oil, and other commodities priced in dollars. When the Dollar Index weakens, this creates favorable conditions for commodities and currencies trading against the dollar.

[[BOLD_UPPER]]S&P 500 as a thermometer of risk appetite[[/]]

This is the stock index of five hundred largest American companies, considered the main indicator of global risk appetite. If the S&P 500 is growing alongside a low VIX, hedge funds and institutional investors are buying risk. If the S&P 500 is falling and VIX is rising — this is a clear risk-off signal.`,
          uk: `Макроекономічний контекст — це чотири показники, які говорять вам, що відбувається в широкому ринку до того, як ви подивитеся на дані звіту COT. Думайте про це як про перевірку погоди перед тим, як одягтися.

[[BOLD_UPPER]]VIX — індекс страху[[/]]

VIX (Volatility Index, Індекс волатильності) вимірює очікувану волатильність індексу S&P 500 на найближчі тридцять днів. Він розраховується Чиказькою опціонною біржею на основі цін опціонів і вважається головним барометром страху та самозаспокоєння на ринку.

Коли VIX нижче п'ятнадцяти, ринок спокійний і трейдери самозаспокоєні. Це парадоксально небезпечний момент для відкриття нових довгих позицій — самозаспокоєння історично передує корекціям. Коли VIX між п'ятнадцятьма та двадцятьма — це нормальний режим торгівлі. Коли VIX піднімається в діапазон від двадцяти до тридцяти — це сигнал зростаючої тривоги та підвищених ризиків. Коли VIX перевищує тридцять — ринок у стані страху, це класичний настрій уникнення ризику: інвестори тікають у захисні активи — золото, японська єна, долар США, державні облігації.

[[BOLD]]Практичний приклад:[[/]] VIX знаходиться на рівні двадцяти восьми, Індекс долара посилюється, S&P 500 за тиждень впав на три відсотки. Це класичне середовище уникнення ризику. Якщо при цьому звіт COT показує, що хедж-фонди активно купують золото, цей сигнал підтверджений макроекономічним контекстом і його ймовірність успіху суттєво зростає.

[[BOLD_UPPER]]Крива дохідності — співвідношення дворічних та десятирічних облігацій[[/]]

Цей показник демонструє різницю між дохідністю американських десятирічних державних облігацій та дворічних. Це один із найнадійніших індикаторів економічного циклу за всю сучасну фінансову історію.

Коли різниця позитивна, наприклад плюс нуль цілих п'ять десятих відсотка — це нормальна крива дохідності, економіка зростає. Коли різниця наближається до нуля — крива стає плоскою, попередження про уповільнення. Коли різниця стає від'ємною, наприклад мінус нуль цілих три десятих відсотка — це інверсія кривої дохідності. Інверсія передувала кожній рецесії в США за останні п'ятдесят років, зазвичай із затримкою дванадцять-вісімнадцять місяців.

[[BOLD]]Практичний приклад:[[/]] Крива інвертована на мінус нуль цілих дві десятих відсотка, VIX на рівні двадцяти двох, S&P 500 на історичних максимумах. Це ознака перегріву з підстилаючим системним ризиком. У такому середовищі сигнал COT на довгу позицію в фондових індексах значно менш надійний. Навпаки, сигнал на коротку позицію в S&P 500 отримує суттєву додаткову підтримку.

[[BOLD]]Корисне посилання:[[/]] дані кривої дохідності в реальному часі — https://fred.stlouisfed.org/series/T10Y2Y

[[BOLD_UPPER]]Індекс долара (DXY)[[/]]

Це зважена вартість долара США відносно кошика з шести основних валют: євро, японська єна, британський фунт, канадський долар, шведська крона та швейцарський франк. Євро має найбільшу вагу — п'ятдесят сім цілих шість десятих відсотка.

Коли Індекс долара посилюється, це чинить тиск на золото, срібло, нафту та інші сировинні товари, що оцінюються в доларах. Коли Індекс долара слабшає, це створює сприятливі умови для сировинних товарів і валют, що торгуються проти долара.

[[BOLD_UPPER]]S&P 500 як термометр апетиту до ризику[[/]]

Це фондовий індекс п'ятисот найбільших американських компаній, головний індикатор глобального апетиту до ризику. Якщо S&P 500 росте разом з низьким VIX — хедж-фонди та інституційні інвестори купують ризик. Якщо S&P 500 падає і VIX росте — це чіткий сигнал уникнення ризику.`
        }
      },
      {
        title: {
          en: "Macro Regime: Growth, Inflation, and Policy segments",
          uk: "Макроекономічний режим: сегменти Зростання, Інфляція та Монетарна політика"
        },
        content: {
          en: `Macro Regime takes COT positioning data across three groups of assets and calculates a composite score for each group. This gives you an x-ray of the entire market through the eyes of institutional money.

[[BOLD_UPPER]]Growth segment — equity indices[[/]]

Includes the S&P 500, Nasdaq 100, and Dow Jones Industrial Average. The composite score shows where hedge funds are positioned in stock index futures.

When the Growth score is above sixty-five, hedge funds collectively believe in economic growth and are actively buying stock indices. This is a risk-on environment that supports long positions across most asset classes. When the score is below thirty-five, hedge funds are exiting risk and expect a slowdown. In this environment, even good signals on individual instruments lose some of their value, because the macroeconomic backdrop does not support them.

[[BOLD_UPPER]]Inflation segment — commodities[[/]]

Includes gold, silver, copper, and crude oil. The composite score shows whether the inflation trade is currently active.

When the Inflation score is above sixty-five, funds are actively buying inflation-sensitive assets, expecting either inflation growth or dollar weakening. When the score is below thirty-five, the inflation trade is dying down — funds expect deflationary pressure or a strong dollar environment.

[[BOLD_UPPER]]Policy segment — currencies[[/]]

Includes the US dollar index, euro, Japanese yen, British pound, and Swiss franc. The composite score reflects expectations regarding the monetary policy of the Federal Reserve and other central banks.

When the Policy score is above sixty-five, the dollar dominates and funds bet on Fed tightening. This is a hawkish environment that puts pressure on gold and risk assets. When the score is below thirty-five, funds expect monetary easing, the dollar weakens — a dovish environment favorable for gold and risk assets.

[[BOLD_UPPER]]How to read the composite score[[/]]

The Composite is the average of three segments. For example: Growth is at seventy-two, Inflation is at sixty-eight, Policy is at thirty-one — the composite score is fifty-seven. Formally this is a neutral zone, but in reality there is a divergence: the inflation trade and growth are active, but Policy does not support them. This is a warning of possible instability and an internal contradiction within the macroeconomic regime.

[[BOLD]]Practical rule:[[/]] if all three segments are above sixty-five — this is a strong risk-on regime, the most favorable environment for aggressive trades. If all three are below thirty-five — strong risk-off, time for defensive positions. If the segments diverge significantly — be especially careful, the market is not synchronized.

[[BOLD]]Useful link:[[/]] Investopedia explanation of risk-on / risk-off regimes — https://www.investopedia.com/terms/r/risk-on-risk-off.asp`,
          uk: `Макроекономічний режим бере дані позиціонування зі звіту COT по трьох групах активів і розраховує композитний показник для кожної групи. Це дає вам рентгенівський знімок усього ринку очима інституційних грошей.

[[BOLD_UPPER]]Сегмент Зростання — фондові індекси[[/]]

Включає S&P 500, Nasdaq 100 та Dow Jones Industrial Average. Композитний показник демонструє, де знаходяться позиції хедж-фондів у ф'ючерсах на фондові індекси.

Коли показник Зростання вище шістдесяти п'яти, хедж-фонди колективно вірять в економічне зростання і активно купують фондові індекси. Це сприятливе для ризику середовище. Коли показник нижче тридцяти п'яти, хедж-фонди виходять із ризику і очікують уповільнення. У цьому середовищі навіть хороші сигнали на окремих інструментах втрачають частину своєї цінності, бо макроекономічний фон їх не підтримує.

[[BOLD_UPPER]]Сегмент Інфляція — сировинні товари[[/]]

Включає золото, срібло, мідь та сиру нафту. Композитний показник демонструє, чи активний зараз інфляційний трейд.

Коли показник Інфляції вище шістдесяти п'яти, фонди активно купують активи, чутливі до інфляції, очікуючи або зростання інфляції, або послаблення долара. Коли показник нижче тридцяти п'яти, інфляційний трейд згасає — фонди очікують дефляційного тиску або сильного долара.

[[BOLD_UPPER]]Сегмент Монетарна політика — валюти[[/]]

Включає індекс долара США, євро, японську єну, британський фунт та швейцарський франк. Показник відображає очікування щодо монетарної політики Федерального резерву та інших центральних банків.

Коли показник Монетарної політики вище шістдесяти п'яти, домінує долар і фонди роблять ставку на жорсткішу монетарну політику. Це яструбине середовище, яке чинить тиск на золото та ризикові активи. Коли показник нижче тридцяти п'яти, фонди очікують пом'якшення — голубине середовище, сприятливе для золота та ризикових активів.

[[BOLD_UPPER]]Як читати композитний показник[[/]]

Композитний показник — це середнє значення трьох сегментів. Наприклад: Зростання на рівні сімдесяти двох, Інфляція на рівні шістдесяти восьми, Монетарна політика на рівні тридцяти одного — композитний показник дорівнює п'ятдесяти семи. Формально нейтральна зона, але насправді присутнє розходження: інфляційний трейд та зростання активні, але Монетарна політика їх не підтримує. Це попередження про можливу нестабільність всередині макроекономічного режиму.

[[BOLD]]Практичне правило:[[/]] якщо всі три сегменти вище шістдесяти п'яти — сильний режим схильності до ризику, найсприятливіше середовище для агресивних угод. Якщо всі три нижче тридцяти п'яти — сильний режим уникнення ризику, час захисних позицій. Якщо сегменти суттєво розходяться — будьте особливо обережні.

[[BOLD]]Корисне посилання:[[/]] пояснення режимів схильності та уникнення ризику — https://www.investopedia.com/terms/r/risk-on-risk-off.asp`
        }
      },
      {
        title: {
          en: "Top Active Signals: how to read the six circles",
          uk: "Топ активних сигналів: як читати шість кружечків"
        },
        content: {
          en: `The six circles in the Top Active Signals block show assets with the best COT setup right now. This is a quick way to spot the most actionable opportunities without diving into details for every instrument.

[[BOLD_UPPER]]Color and arrow direction[[/]]

A green circle with an upward arrow means long bias — hedge funds are positioned for growth of this asset. A red circle with a downward arrow means short bias — hedge funds expect a decline. The color reflects only the direction, not the strength.

[[BOLD_UPPER]]The number inside — Priority Score from zero to one hundred[[/]]

This is a comprehensive assessment that combines four factors. Forty percent comes from the strength of COT positioning — how extreme it is relative to the three-year range. Twenty percent comes from the freshness of the signal — how recently it appeared. Twenty percent comes from seasonality — does the current calendar period historically support this direction? Twenty percent comes from the macroeconomic context — do the regime segments agree with the signal direction?

[[BOLD_UPPER]]Practical examples[[/]]

Gold shows a score of eighty-four with a green upward arrow. This means: hedge funds are near three-year highs in long positions (COT Index around eighty-eight), seasonality supports the long direction, the Inflation segment of the macro regime is also bullish, and the signal appeared two to three weeks ago — relatively fresh. This is a high-conviction long setup that deserves serious attention.

The euro shows a score of sixty-two with a red downward arrow. This means: hedge funds lean toward short positions but not extremely (COT Index around twenty-eight), the Policy segment of the macro regime does not fully support the bearish direction, and the freshness of the signal is moderate. This is a developing setup — worth monitoring but not yet time to act aggressively.

[[BOLD_UPPER]]How to interact[[/]]

Clicking any circle opens the full Asset Explorer for that instrument, where you will see detailed COT data, seasonality, AI commentary, and confirmation checklist. The circles are intended for quick scanning — the actual decision is always made in the Explorer.

[[BOLD]]Practical rule:[[/]] focus on assets with a Priority Score above seventy. Scores from seventy to eighty-four are strong setups. Scores above eighty-five are rare high-conviction signals. Scores below sixty are developing configurations worth watching but not entering yet.`,
          uk: `Шість кружечків у блоці Топ активних сигналів показують активи з найкращою конфігурацією за звітом COT прямо зараз. Це швидкий спосіб помітити найбільш дієві можливості без занурення в деталі кожного інструмента.

[[BOLD_UPPER]]Колір та напрямок стрілки[[/]]

Зелений кружечок зі стрілкою вгору означає бичачий ухил — хедж-фонди позиціоновані на зростання цього активу. Червоний кружечок зі стрілкою вниз означає ведмежий ухил — хедж-фонди очікують падіння. Колір відображає лише напрямок, а не силу сигналу.

[[BOLD_UPPER]]Число всередині — Оцінка пріоритету від нуля до ста[[/]]

Це комплексна оцінка, що поєднує чотири фактори. Сорок відсотків — сила позиціонування за звітом COT, наскільки воно екстремальне відносно трирічного діапазону. Двадцять відсотків — свіжість сигналу, як давно він з'явився. Двадцять відсотків — сезонність, чи підтримує поточний календарний період цей напрямок historically. Двадцять відсотків — макроекономічний контекст, чи узгоджуються сегменти режиму з напрямком сигналу.

[[BOLD_UPPER]]Практичні приклади[[/]]

Золото показує оцінку вісімдесят чотири із зеленою стрілкою вгору. Це означає: хедж-фонди знаходяться поблизу трирічних максимумів за довгими позиціями (Індекс COT близько вісімдесяти восьми), сезонність підтримує бичачий напрямок, сегмент Інфляції макроекономічного режиму також бичачий, а сигнал з'явився два-три тижні тому — відносно свіжий. Це конфігурація для довгої позиції з високою впевненістю, яка заслуговує на серйозну увагу.

Євро показує оцінку шістдесят два із червоною стрілкою вниз. Це означає: хедж-фонди схиляються до коротких позицій, але не екстремально (Індекс COT близько двадцяти восьми), сегмент Монетарної політики макрорежиму не повністю підтримує ведмежий напрямок, а свіжість сигналу помірна. Це конфігурація, що розвивається — варто спостерігати, але ще не час діяти агресивно.

[[BOLD_UPPER]]Як взаємодіяти[[/]]

Клік на будь-якому кружечку відкриває повний Дослідник активів для цього інструмента, де ви побачите детальні дані COT, сезонність, коментар штучного інтелекту та контрольний список підтвердження. Кружечки призначені для швидкого сканування — фактичне рішення завжди приймається в Дослідникові.

[[BOLD]]Практичне правило:[[/]] фокусуйтеся на активах з Оцінкою пріоритету вище сімдесяти. Оцінки від сімдесяти до вісімдесяти чотирьох — сильні конфігурації. Вище вісімдесяти п'яти — рідкісні сигнали з високою впевненістю. Нижче шістдесяти — конфігурації, що розвиваються, які варто спостерігати, але не входити в них.`
        }
      },
      {
        title: {
          en: "COT Heatmap: a panoramic view of all twenty-five assets",
          uk: "Теплова карта COT: панорамний огляд усіх двадцяти п'яти активів"
        },
        content: {
          en: `The Heatmap lets you see the entire tracked universe in one panel. The goal is to understand the overall positioning picture in ten seconds and spot interesting candidates for deeper analysis.

[[BOLD_UPPER]]Structure of each card[[/]]

Top left — the asset symbol. Top right — the weekly shift of the COT Index with an arrow, for example plus five point two means the COT Index grew by five point two points over the week. The large number in the center is the current COT Index value from zero to one hundred. The text at the bottom is the current flow state of the asset.

[[BOLD_UPPER]]Color logic of the frame[[/]]

A dark green frame means the COT Index is at or above ninety — this is a crowded long zone, dangerous because of the risk of forced position liquidation. A green frame means the COT Index is between sixty-five and eighty-nine — a healthy bullish zone, the most reliable for long trades. A red frame means the COT Index is between eleven and thirty-five — a bearish zone, optimal for short positions. A dark red frame means the COT Index is at or below ten — a crowded short zone with squeeze potential. A gray frame is the neutral zone between thirty-five and sixty-five.

[[BOLD_UPPER]]How to scan effectively[[/]]

Move through the Heatmap from left to right by sectors. Look for assets where two conditions are simultaneously met: a brightly colored frame AND a directional arrow pointing the same way. For example, gold with a green frame and an upward arrow of plus five point two means hedge funds are actively adding long positions and are already in the bullish zone. This is a candidate worth opening in Explorer for further analysis.

[[BOLD_UPPER]]Extreme zones require special attention[[/]]

Assets with a COT Index above ninety or below ten are at statistical extremes. Such positioning rarely lasts long. Either the trend continues with profit-taking, or a sharp reversal happens due to liquidation of crowded positions. Working with extreme zones always requires tighter risk control and smaller position sizes.

[[BOLD_UPPER]]Cross-sector patterns[[/]]

If most assets in the commodities sector simultaneously have green frames, this is a sign of a synchronized inflation trade. If currencies other than the dollar all turn red, this is dollar dominance. These cross-asset patterns are valuable signals about the overall market regime that you cannot see by looking at individual assets in isolation.`,
          uk: `Теплова карта дозволяє побачити весь відстежуваний всесвіт активів в одній панелі. Мета — за десять секунд зрозуміти загальну картину позиціонування і помітити цікавих кандидатів для глибшого аналізу.

[[BOLD_UPPER]]Структура кожної картки[[/]]

Зверху ліворуч — символ активу. Зверху праворуч — тижневий зсув Індексу COT зі стрілкою, наприклад плюс п'ять цілих дві десятих означає, що Індекс COT виріс на п'ять цілих дві десятих пункту за тиждень. Велике число в центрі — поточне значення Індексу COT від нуля до ста. Текст знизу — поточний стан потоку активу.

[[BOLD_UPPER]]Кольорова логіка рамки[[/]]

Темно-зелена рамка означає Індекс COT на рівні дев'яноста або вище — зона перенасиченого лонгу, небезпечна через ризик примусового закриття позицій. Зелена рамка — Індекс COT між шістдесятьма п'ятьма та вісімдесятьма дев'ятьма — здорова бичача зона, найнадійніша для довгих угод. Червона рамка — Індекс COT між одинадцятьма та тридцятьма п'ятьма — ведмежа зона, оптимальна для коротких позицій. Темно-червона рамка — Індекс COT на рівні десяти або нижче — зона перенасиченого шорту з потенціалом сквізу. Сіра рамка — нейтральна зона між тридцятьма п'ятьма та шістдесятьма п'ятьма.

[[BOLD_UPPER]]Як ефективно сканувати[[/]]

Переглядайте Теплову карту зліва направо по секторах. Шукайте активи, де одночасно виконуються дві умови: яскраво забарвлена рамка І стрілка напрямку вказує в той самий бік. Наприклад, золото з зеленою рамкою і стрілкою вгору на плюс п'ять цілих дві десятих — хедж-фонди активно додають довгі позиції і вже знаходяться в бичачій зоні. Це кандидат, якого варто відкрити в Дослідникові для подальшого аналізу.

[[BOLD_UPPER]]Екстремальні зони вимагають особливої уваги[[/]]

Активи з Індексом COT вище дев'яноста або нижче десяти знаходяться на статистичних екстремумах. Таке позиціонування рідко триває довго. Або тренд продовжиться з фіксацією прибутку, або відбудеться різкий розворот через примусове закриття скупчених позицій. Робота з екстремальними зонами завжди вимагає жорсткішого контролю ризиків і менших розмірів позицій.

[[BOLD_UPPER]]Міжсекторні патерни[[/]]

Якщо більшість активів у сировинному секторі одночасно мають зелені рамки — це ознака синхронізованого інфляційного трейду. Якщо валюти крім долара всі стають червоними — це домінування долара. Такі крос-активні патерни є цінними сигналами про загальний режим ринку, які неможливо побачити, дивлячись на окремі активи ізольовано.`
        }
      },
      {
        title: {
          en: "Economic Calendar and Market News",
          uk: "Економічний календар та Ринкові новини"
        },
        content: {
          en: `These two blocks provide context that cannot be extracted from COT data alone. The COT report shows where the money is positioned, but the calendar and news tell you what is happening right now and what can move the market in the coming days.

[[BOLD_UPPER]]Economic Calendar[[/]]

Shows upcoming releases of macroeconomic data and central bank decisions for the next two weeks. Events are marked by importance — high, medium, and low.

High-importance events are highlighted with a red border. These are the most market-moving releases: Federal Reserve interest rate decisions, European Central Bank decisions, nonfarm payrolls, unemployment rate, Consumer Price Index, Producer Price Index, Gross Domestic Product, and key business activity indices.

[[BOLD_UPPER]]How to use the calendar with COT signals[[/]]

Suppose you found a strong long signal for gold on Monday with a Priority Score of eighty-five. You check the calendar and see that on Wednesday the Federal Reserve is announcing its interest rate decision. This is a serious factor of uncertainty. The wise approach is either to wait for the announcement and enter afterward, or to enter with a reduced position size. The signal will still be there after the announcement, but the risk around a Federal Reserve decision can destroy even the highest-quality setup.

[[BOLD_UPPER]]Calendar filters[[/]]

You can filter by importance level — only high, only medium, or all events. You can also filter by country — United States, European Union, United Kingdom, Japan, Canada, Australia, and others. For most traders the most relevant events are those of the United States and the eurozone, but if you trade the British pound or Japanese yen — filter by the corresponding countries.

[[BOLD_UPPER]]Market News[[/]]

Aggregates news from official sources — the Federal Reserve System, the European Central Bank, the CFTC, the Bureau of Labor Statistics, Reuters, ForexLive, and others. High-importance news items are highlighted with a red border, the source is shown in blue.

[[BOLD_UPPER]]Why official sources matter[[/]]

Social networks and analytical aggregators often distort or editorialize news. The original press release from the Federal Reserve gives you the exact wording, which can differ radically from secondary headlines. Reading news directly from the source develops your independent judgment and reduces vulnerability to manipulation and misinformation.

[[BOLD]]Useful link:[[/]] Federal Reserve publication schedule — https://www.federalreserve.gov/newsevents/calendar.htm`,
          uk: `Ці два блоки дають контекст, який неможливо здобути з даних COT окремо. Звіт COT показує, де позиціоновані гроші, але календар і новини розповідають вам, що відбувається прямо зараз і що може зрушити ринок у найближчі дні.

[[BOLD_UPPER]]Економічний календар[[/]]

Показує майбутні релізи макроекономічних даних та рішення центральних банків на найближчі два тижні. Події позначені за важливістю — висока, середня та низька.

Події з високою важливістю виділені червоною рамкою. Це релізи, які найбільше рухають ринок: рішення Федерального резерву щодо процентної ставки, рішення Європейського центрального банку, дані про кількість робочих місць поза сільським господарством, рівень безробіття, Індекс споживчих цін, Індекс цін виробників, Валовий внутрішній продукт та ключові індекси ділової активності.

[[BOLD_UPPER]]Як використовувати календар разом із сигналами COT[[/]]

Припустимо, ви знайшли сильний сигнал на довгу позицію в золоті в понеділок з Оцінкою пріоритету вісімдесят п'ять. Перевіряєте календар і бачите, що в середу Федеральний резерв оголошує рішення щодо процентної ставки. Це серйозний фактор невизначеності. Розумний підхід — або зачекати на оголошення і увійти після нього, або увійти зі зменшеним розміром позиції. Сигнал нікуди не дінеться після оголошення, а ризик навколо рішення Федерального резерву може зруйнувати навіть найякіснішу конфігурацію.

[[BOLD_UPPER]]Фільтри календаря[[/]]

Ви можете фільтрувати за рівнем важливості — тільки висока, тільки середня або всі події. Також можна фільтрувати за країнами — Сполучені Штати Америки, Європейський Союз, Велика Британія, Японія, Канада, Австралія та інші. Для більшості трейдерів найбільш релевантні події Сполучених Штатів та єврозони, але якщо ви торгуєте британським фунтом або японською єною — відфільтруйте за відповідними країнами.

[[BOLD_UPPER]]Ринкові новини[[/]]

Агрегують новини з офіційних джерел — Федерального резерву, Європейського центрального банку, Комісії з торгівлі товарними ф'ючерсами США, Бюро статистики праці, Reuters, ForexLive та інших. Новини з високою важливістю виділені червоною рамкою, джерело позначено синім кольором.

[[BOLD_UPPER]]Чому важливі офіційні джерела[[/]]

Соціальні мережі та аналітичні агрегатори часто спотворюють або інтерпретують новини. Першоджерело прес-релізу Федерального резерву дає вам точне формулювання, яке може кардинально відрізнятися від вторинних заголовків. Читання новин безпосередньо з першоджерела розвиває самостійне судження і знижує вразливість до маніпуляцій.

[[BOLD]]Корисне посилання:[[/]] графік публікацій Федерального резерву — https://www.federalreserve.gov/newsevents/calendar.htm`
        }
      }
    ]
  },

  // ── 2. COT SUMMARY ──────────────────────────────────────────────────────────
  {
    key: "cot",
    icon: "≡",
    color: "#a78bfa",
    title: {
      en: "COT Summary",
      uk: "Зведення COT"
    },
    summary: {
      en: "The complete positioning table. Understanding who stands where in the futures market is the foundation of every analysis on this platform.",
      uk: "Повна таблиця позиціонування. Розуміння того, хто де стоїть на ф'ючерсному ринку, є основою кожного аналізу на цій платформі."
    },
    blocks: [
      {
        title: {
          en: "What the COT report is and where the data comes from",
          uk: "Що таке звіт COT і звідки беруться дані"
        },
        content: {
          en: `The CFTC — Commodity Futures Trading Commission, the American regulator of derivatives markets — requires all large market participants to report their futures positions every week. This data is compiled into the Commitments of Traders report and published publicly.

[[BOLD_UPPER]]Publication schedule[[/]]

The report is published every Friday at 3:30 PM Eastern Time and contains data as of Tuesday of the same week. This means there is a lag of approximately three and a half days between reality and publication. By the time you read the report on Friday evening, the data inside reflects Tuesday's close.

[[BOLD_UPPER]]Two types of reports[[/]]

The TFF report, which stands for Traders in Financial Futures, covers financial futures: currency pairs, stock indices, VIX volatility index, US Treasury bonds, and cryptocurrencies. The Disaggregated report covers commodity futures: gold, silver, copper, crude oil, natural gas, grains, soft commodities like coffee and cocoa. The platform automatically determines which report type to use for each asset.

[[BOLD_UPPER]]Why this data matters[[/]]

The COT report is one of the few publicly available sources that shows you what institutional money is actually doing — not what analysts are saying or what headlines claim, but actual positions held by the largest players in the market. This is the closest thing to seeing the cards of the biggest players at the table.

[[BOLD]]Useful link:[[/]] official CFTC COT report archive and explanation — https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm`,
          uk: `CFTC — Комісія з торгівлі товарними ф'ючерсами, американський регулятор ринків деривативів — зобов'язує всіх великих учасників ринку щотижня звітувати про свої позиції у ф'ючерсах. Ці дані збираються у звіт про зобов'язання трейдерів і публікуються у відкритому доступі.

[[BOLD_UPPER]]Графік публікацій[[/]]

Звіт публікується щоп'ятниці о 15:30 за східним часом США і містить дані станом на вівторок того ж тижня. Це означає, що між реальністю і публікацією існує лаг приблизно три з половиною дні. На момент, коли ви читаєте звіт у п'ятницю ввечері, дані всередині відображають закриття вівторка.

[[BOLD_UPPER]]Два типи звітів[[/]]

Звіт TFF, що розшифровується як Трейдери у фінансових ф'ючерсах, охоплює фінансові ф'ючерси: валютні пари, фондові індекси, індекс волатильності VIX, казначейські облігації США та криптовалюти. Деталізований звіт охоплює товарні ф'ючерси: золото, срібло, мідь, сиру нафту, природний газ, зернові, м'які товари як кава та какао. Платформа автоматично визначає, який тип звіту використовувати для кожного активу.

[[BOLD_UPPER]]Чому ці дані важливі[[/]]

Звіт COT — одне з небагатьох загальнодоступних джерел, яке показує вам, що інституційні гроші насправді роблять — не те, що кажуть аналітики або стверджують заголовки, а реальні позиції, які тримають найбільші гравці на ринку. Це найближче до того, щоб побачити карти найбільших гравців за столом.

[[BOLD]]Корисне посилання:[[/]] офіційний архів звітів COT та пояснення від CFTC — https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm`
        }
      },
      {
        title: {
          en: "Who is who: Leveraged Funds, Asset Managers, Dealers, and Producers",
          uk: "Хто є хто: Хедж-фонди з плечем, Керуючі активами, Дилери та Виробники"
        },
        content: {
          en: `Understanding the different trader categories is essential before reading any COT data. Each group has a different motivation for holding positions.

[[BOLD_UPPER]]Leveraged Funds (hedge funds and CTAs)[[/]]

This is the "smart money" — speculative players who take directional bets using leverage. Commodity Trading Advisors, also known as CTAs, are systematic trend-following funds that use algorithms. Together with hedge funds, they form the most closely watched group in the COT report.

When they aggressively buy — the trend is confirmed. When they are at the peak of a long position — the market is crowded, reversal risk is elevated. When they are at the peak of a short position — there is squeeze potential if they are wrong. Their positioning is the primary signal source on this platform.

[[BOLD_UPPER]]Asset Managers (pension funds and long-only funds)[[/]]

Slower and more conservative than Leveraged Funds. They represent the long-term macro view of the world's largest institutional money — pension funds, sovereign wealth funds, insurance companies. They do not trade frequently, but when they shift positioning, it reflects a fundamental change in view. When both Asset Managers and Leveraged Funds are simultaneously in long positions — this is a strong confluence of institutional conviction.

[[BOLD_UPPER]]Dealers and Intermediaries (large banks)[[/]]

Banks are typically on the opposite side of Leveraged Funds — they hedge client flows and market-make. If Dealers are massively short while Leveraged Funds are massively long, and the price starts falling, Leveraged Funds may be forced to liquidate their longs, accelerating the move. Dealers' positioning is informative primarily as a counterbalance to hedge fund positioning.

[[BOLD_UPPER]]Producers and Merchants (in Disaggregated reports only)[[/]]

Oil companies, mining companies, grain farmers — they hedge their future production. An oil producer who plans to sell oil in six months will hedge by selling futures today, regardless of their directional view on price. This means Producers are almost always in a net short position in commodity futures — and this is completely normal, not a bearish signal. Never interpret Producer short positions as a market signal.

[[BOLD_UPPER]]Managed Money (in Disaggregated reports)[[/]]

This is the equivalent of Leveraged Funds for commodity markets — the speculative directional money. All the same rules apply: their positioning is the primary signal source for gold, silver, oil, and other commodities.

[[BOLD]]Useful link:[[/]] detailed CFTC explanation of each trader category — https://www.cftc.gov/idc/groups/public/@commitmentsoftraders/documents/file/tfmexplanatorynotes.pdf`,
          uk: `Розуміння різних категорій трейдерів є необхідним перш ніж читати будь-які дані COT. Кожна група має різну мотивацію для утримання позицій.

[[BOLD_UPPER]]Хедж-фонди з плечем (хедж-фонди та CTA)[[/]]

Це "розумні гроші" — спекулятивні гравці, які роблять спрямовані ставки з використанням кредитного плеча. Радники з торгівлі товарними активами, також відомі як CTA, — це систематичні фонди слідування за трендом, що використовують алгоритми. Разом із хедж-фондами вони формують групу, за якою найуважніше стежать при читанні звіту COT.

Коли вони агресивно купують — тренд підтверджується. Коли вони знаходяться на піку довгої позиції — ринок перенасичений, ризик розвороту підвищений. Коли вони на піку короткої позиції — є потенціал для сквізу, якщо вони помиляються. Їхнє позиціонування є основним джерелом сигналів на цій платформі.

[[BOLD_UPPER]]Керуючі активами (пенсійні фонди та фонди тільки з довгими позиціями)[[/]]

Повільніші та консервативніші за хедж-фонди з плечем. Вони представляють довгостроковий макроекономічний погляд найбільших інституційних грошей світу — пенсійних фондів, суверенних фондів добробуту, страхових компаній. Вони не торгують часто, але коли вони змінюють позиціонування, це відображає фундаментальну зміну погляду. Коли одночасно і Керуючі активами, і Хедж-фонди з плечем знаходяться в довгих позиціях — це сильне збіжіння інституційної переконаності.

[[BOLD_UPPER]]Дилери та посередники (великі банки)[[/]]

Банки зазвичай знаходяться на протилежній стороні від Хедж-фондів з плечем — вони хеджують клієнтські потоки та виступають маркет-мейкерами. Якщо Дилери масово тримають короткі позиції, поки Хедж-фонди масово тримають довгі, і ціна починає падати, Хедж-фонди можуть бути змушені закрити свої довгі позиції, прискорюючи рух. Позиціонування Дилерів є інформативним насамперед як противага позиціонуванню хедж-фондів.

[[BOLD_UPPER]]Виробники та торговці (тільки в Деталізованих звітах)[[/]]

Нафтові компанії, гірничодобувні підприємства, фермери, що вирощують зернові — вони хеджують своє майбутнє виробництво. Нафтова компанія, яка планує продати нафту через шість місяців, захеджується, продаючи ф'ючерси сьогодні, незалежно від свого бачення напрямку ціни. Це означає, що Виробники майже завжди знаходяться в нетто-короткій позиції у товарних ф'ючерсах — і це абсолютно нормально, не ведмежий сигнал. Ніколи не інтерпретуйте короткі позиції Виробників як ринковий сигнал.

[[BOLD_UPPER]]Кошти під управлінням (в Деталізованих звітах)[[/]]

Це еквівалент Хедж-фондів з плечем для товарних ринків — спекулятивні спрямовані гроші. Застосовуються всі ті самі правила: їхнє позиціонування є основним джерелом сигналів для золота, срібла, нафти та інших сировинних товарів.

[[BOLD]]Корисне посилання:[[/]] детальне пояснення від CFTC про кожну категорію трейдерів — https://www.cftc.gov/idc/groups/public/@commitmentsoftraders/documents/file/tfmexplanatorynotes.pdf`
        }
      },
      {
        title: {
          en: "COT Index from zero to one hundred: the most important number",
          uk: "Індекс COT від нуля до ста: найважливіше число"
        },
        content: {
          en: `The COT Index is a normalization of the net position of Leveraged Funds (or Managed Money for commodities) over the past one hundred and fifty-six weeks, which equals three years.

[[BOLD_UPPER]]The formula[[/]]

COT Index equals the net position now minus the minimum over three years, divided by the maximum over three years minus the minimum over three years, multiplied by one hundred.

[[BOLD_UPPER]]What the result means[[/]]

A value of one hundred means funds hold the largest long position of the past three years. A value of zero means funds hold the largest short position of the past three years. A value of fifty means funds are exactly in the middle of their three-year range — completely neutral.

[[BOLD_UPPER]]Key zones and their meaning[[/]]

A COT Index of ninety or above is a crowded long zone. Funds are at cycle highs. Even minor negative news can trigger a liquidation cascade where forced selling accelerates the price decline. A COT Index between sixty-five and eighty-nine is the bullish zone. This is the best area for trend-following long positions — funds are clearly positioned long but not yet at dangerous extremes. A COT Index between thirty-five and sixty-four is the neutral zone. Additional confirmation from macro, seasonality, or momentum is required before taking action. A COT Index between eleven and thirty-four is the bearish zone. Optimal area for short bias — funds lean short but there is still room before an extreme. A COT Index of ten or below is a crowded short zone. Squeeze potential is elevated. Do not add short positions here.

[[BOLD_UPPER]]Practical example with real numbers[[/]]

Gold net position right now: plus one hundred and forty-five thousand contracts. Minimum over three years: minus twenty-five thousand contracts. Maximum over three years: plus one hundred and eighty-five thousand contracts.

The calculation: one hundred and forty-five thousand minus the negative twenty-five thousand equals one hundred and seventy thousand. One hundred and eighty-five thousand minus the negative twenty-five thousand equals two hundred and ten thousand. One hundred and seventy thousand divided by two hundred and ten thousand multiplied by one hundred equals eighty-one.

Conclusion: Gold is in the bullish zone at eighty-one. Funds are clearly positioned long but have not reached the extreme crowded zone above ninety. This is a healthy long setup with room for further accumulation before danger.

[[BOLD]]Useful link:[[/]] Investopedia explanation of how COT data is used in trading — https://www.investopedia.com/terms/c/cot.asp`,
          uk: `Індекс COT — це нормалізація нетто-позиції Хедж-фондів з плечем (або Коштів під управлінням для сировинних товарів) за останні сто п'ятдесят шість тижнів, що дорівнює трьом рокам.

[[BOLD_UPPER]]Формула[[/]]

Індекс COT дорівнює нетто-позиції зараз мінус мінімум за три роки, поділеному на максимум за три роки мінус мінімум за три роки, помноженому на сто.

[[BOLD_UPPER]]Що означає результат[[/]]

Значення сто означає, що фонди тримають найбільшу довгу позицію за останні три роки. Значення нуль означає, що фонди тримають найбільшу коротку позицію за останні три роки. Значення п'ятдесят означає, що фонди знаходяться рівно посередині свого трирічного діапазону — повністю нейтрально.

[[BOLD_UPPER]]Ключові зони та їх значення[[/]]

Індекс COT на рівні дев'яноста або вище — зона перенасиченого лонгу. Фонди знаходяться на циклічних максимумах. Навіть незначні негативні новини можуть спровокувати каскад примусового закриття позицій, де вимушені продажі прискорюють падіння ціни. Індекс COT між шістдесятьма п'ятьма та вісімдесятьма дев'ятьма — бичача зона. Це найкраща область для довгих позицій за трендом — фонди чітко позиціоновані в лонг, але ще не на небезпечних екстремумах. Індекс COT між тридцятьма п'ятьма та шістдесятьма чотирма — нейтральна зона. Потрібне додаткове підтвердження з боку макро, сезонності або моментуму. Індекс COT між одинадцятьма та тридцятьма чотирма — ведмежа зона. Оптимальна область для ведмежого ухилу — фонди схиляються до коротких позицій, але є ще простір до екстремуму. Індекс COT на рівні десяти або нижче — зона перенасиченого шорту. Потенціал для сквізу підвищений. Не додавайте короткі позиції тут.

[[BOLD_UPPER]]Практичний приклад із реальними числами[[/]]

Нетто-позиція золота зараз: плюс сто сорок п'ять тисяч контрактів. Мінімум за три роки: мінус двадцять п'ять тисяч контрактів. Максимум за три роки: плюс сто вісімдесят п'ять тисяч контрактів.

Розрахунок: сто сорок п'ять тисяч мінус негативні двадцять п'ять тисяч дорівнює сто сімдесят тисяч. Сто вісімдесят п'ять тисяч мінус негативні двадцять п'ять тисяч дорівнює двісті десять тисяч. Сто сімдесят тисяч поділити на двісті десять тисяч помножити на сто дорівнює вісімдесяти одному.

Висновок: золото знаходиться в бичачій зоні на рівні вісімдесяти одного. Фонди чітко позиціоновані в лонг, але ще не досягли екстремальної зони перенасиченості вище дев'яноста. Це здорова конфігурація для довгої позиції з простором для подальшого накопичення перед небезпечною зоною.

[[BOLD]]Корисне посилання:[[/]] пояснення Investopedia про те, як дані COT використовуються в торгівлі — https://www.investopedia.com/terms/c/cot.asp`
        }
      },
      {
        title: {
          en: "Momentum: Direction, weekly change, averages, and acceleration",
          uk: "Моментум: напрямок, тижнева зміна, середні значення та прискорення"
        },
        content: {
          en: `Knowing the current COT Index level is important, but knowing the direction and speed of change is equally important. An asset at COT Index sixty-eight moving upward rapidly is a very different setup from one at sixty-eight moving downward.

[[BOLD_UPPER]]Direction arrows[[/]]

An upward arrow means the COT Index has been rising over the last four weeks — a net upward trend in positioning. A downward arrow means the COT Index has been falling. A horizontal arrow means the COT Index has been flat — neither building nor reducing positions.

[[BOLD_UPPER]]Week-over-Week change[[/]]

This is how many index points the COT Index moved in the most recent weekly report. A value of plus eight point three means funds aggressively added long exposure in a single week — this is a strong momentum signal. A value of minus two point one is a modest reduction — profit taking or a beginning of reversal? Context from the other momentum indicators helps determine which.

[[BOLD_UPPER]]Three-week and eight-week averages[[/]]

The three-week average is the short-term momentum gauge. The eight-week average is the medium-term trend. When the three-week average is above the eight-week average, the short-term momentum is stronger than the medium-term trend — a classic crossover signal of an accelerating move. When the three-week average is below the eight-week average, the recent momentum is weakening relative to the established trend.

[[BOLD_UPPER]]Versus Trend (COT Index minus eight-week average)[[/]]

This number tells you whether the current reading is above or below the recent trend. A positive value means the current COT Index is above the medium-term trend — positioning is stretching higher than recent history. A negative value means positioning is pulling back below the trend.

[[BOLD_UPPER]]Acceleration[[/]]

The acceleration state describes the speed of change. Accelerating means the rate of movement is increasing — funds are entering or exiting positions at a growing pace. Decelerating means the rate of movement is slowing down — watch for a potential stall or reversal. Stable means a consistent pace of positioning change.

[[BOLD_UPPER]]Practical example reading all five together[[/]]

COT Index is at seventy-five. Week-over-week change is plus six point two. Three-week average is seventy. Eight-week average is sixty-two. Acceleration state is accelerating.

Reading: the asset is in the bullish zone, funds added strongly this week, the short-term average is above the medium-term average confirming the upward crossover, and the pace is increasing. This is a high-quality momentum-confirmed long setup.`,
          uk: `Знати поточний рівень Індексу COT важливо, але знати напрямок і швидкість зміни так само важливо. Актив на рівні Індексу COT шістдесят вісім, що швидко рухається вгору, — це дуже відмінна конфігурація від того, що знаходиться на шістдесяти восьми та рухається вниз.

[[BOLD_UPPER]]Стрілки напрямку[[/]]

Стрілка вгору означає, що Індекс COT зростав протягом останніх чотирьох тижнів — загальний висхідний тренд у позиціонуванні. Стрілка вниз означає, що Індекс COT падав. Горизонтальна стрілка означає, що Індекс COT був стабільним — фонди ні нарощували, ні скорочували позиції.

[[BOLD_UPPER]]Тижнева зміна[[/]]

Це кількість пунктів індексу, на яку змінився Індекс COT у найновішому тижневому звіті. Значення плюс вісім цілих три десятих означає, що фонди агресивно додали довгі позиції за один тиждень — це сильний сигнал моментуму. Значення мінус дві цілих одна десята — скромне скорочення, фіксація прибутку чи початок розвороту? Контекст від інших показників моментуму допомагає визначити, що саме відбувається.

[[BOLD_UPPER]]Трьох- та восьмитижневі середні значення[[/]]

Трьохтижневе середнє є короткостроковим датчиком моментуму. Восьмитижневе середнє — середньостроковий тренд. Коли трьохтижневе середнє вище восьмитижневого, короткостроковий моментум сильніший за середньостроковий тренд — класичний сигнал перетину, що свідчить про прискорення руху. Коли трьохтижневе середнє нижче восьмитижневого, недавній моментум слабшає відносно встановленого тренду.

[[BOLD_UPPER]]Порівняно з трендом (Індекс COT мінус восьмитижневе середнє)[[/]]

Це число показує, чи знаходиться поточне значення вище або нижче недавнього тренду. Позитивне значення означає, що поточний Індекс COT вище середньострокового тренду — позиціонування розтягується вище недавньої історії. Від'ємне значення означає, що позиціонування відкочується нижче тренду.

[[BOLD_UPPER]]Прискорення[[/]]

Стан прискорення описує швидкість зміни. Прискорення означає, що темп руху збільшується — фонди входять або виходять з позицій із зростаючою швидкістю. Уповільнення означає, що темп руху сповільнюється — слідкуйте за можливою зупинкою або розворотом. Стабільний означає рівномірний темп зміни позиціонування.

[[BOLD_UPPER]]Практичний приклад читання всіх п'яти показників разом[[/]]

Індекс COT знаходиться на рівні сімдесяти п'яти. Тижнева зміна плюс шість цілих дві десятих. Трьохтижневе середнє сімдесят. Восьмитижневе середнє шістдесят два. Стан прискорення — прискорення.

Читання: актив знаходиться в бичачій зоні, фонди сильно додали на цьому тижні, короткострокове середнє вище середньострокового, що підтверджує висхідний перетин, а темп зростає. Це якісна конфігурація для довгої позиції, підтверджена моментумом.`
        }
      },
      {
        title: {
          en: "Flow State: what the five states mean",
          uk: "Стан потоку: що означають п'ять станів"
        },
        content: {
          en: `Flow State is a qualitative label that summarizes the overall positioning regime of an asset in a single phrase. It is derived from the combination of the COT Index level and the direction of recent momentum.

[[BOLD_UPPER]]Long Extreme[[/]]

The COT Index is at or above ninety. Funds hold historically maximum long exposure. This is the most dangerous zone for new long entries — the crowd is fully positioned and any negative catalyst can trigger a cascade of forced liquidations. If you are already in a profitable long position, tighten your stop loss significantly.

[[BOLD_UPPER]]Accumulation[[/]]

The COT Index is in the range from sixty-five to eighty-nine and is moving upward or flat. Funds are actively building long positions. This is the most reliable zone for long trades — enough institutional conviction to sustain the move, but not yet at the extreme where reversal risk spikes.

[[BOLD_UPPER]]Neutral[[/]]

The COT Index is between thirty-five and sixty-four. Funds have no strong directional conviction. The market is balanced and lacks a clear COT edge. In this state, technical analysis and macroeconomic context become more important since the COT signal alone is insufficient.

[[BOLD_UPPER]]Distribution[[/]]

The COT Index is in the range from eleven to thirty-four and is moving downward or flat. Funds are actively building short positions or unwinding longs. This is the most reliable zone for short trades — the mirror image of Accumulation. Rallies in this state are selling opportunities.

[[BOLD_UPPER]]Short Extreme[[/]]

The COT Index is at or below ten. Funds hold historically maximum short exposure. Squeeze potential is elevated — if the price moves against funds, they may be forced to cover shorts rapidly, creating a sharp upward move. Do not add new shorts here. This is potentially the setup for a long reversal trade if combined with macro and seasonality confirmation.`,
          uk: `Стан потоку — це якісна мітка, яка узагальнює загальний режим позиціонування активу в одній фразі. Вона виводиться з поєднання рівня Індексу COT та напрямку недавнього моментуму.

[[BOLD_UPPER]]Екстремум лонгу[[/]]

Індекс COT знаходиться на рівні дев'яноста або вище. Фонди тримають історично максимальні довгі позиції. Це найнебезпечніша зона для нових довгих входів — натовп повністю позиціонований, і будь-який негативний каталізатор може спровокувати каскад примусових ліквідацій. Якщо ви вже знаходитеся в прибутковій довгій позиції, суттєво підтягніть стоп-лосс.

[[BOLD_UPPER]]Накопичення[[/]]

Індекс COT знаходиться в діапазоні від шістдесяти п'яти до вісімдесяти дев'яти і рухається вгору або є стабільним. Фонди активно нарощують довгі позиції. Це найнадійніша зона для довгих угод — достатньо інституційної переконаності для підтримки руху, але ще не на екстремумі, де ризик розвороту різко зростає.

[[BOLD_UPPER]]Нейтральний[[/]]

Індекс COT знаходиться між тридцятьма п'ятьма та шістдесятьма чотирма. Фонди не мають сильної спрямованої переконаності. Ринок збалансований і не має чіткої переваги за звітом COT. У цьому стані технічний аналіз та макроекономічний контекст стають важливішими, оскільки сигналу COT самого по собі недостатньо.

[[BOLD_UPPER]]Розподіл[[/]]

Індекс COT знаходиться в діапазоні від одинадцяти до тридцяти чотирьох і рухається вниз або є стабільним. Фонди активно нарощують короткі позиції або розгортають довгі. Це найнадійніша зона для коротких угод — дзеркальне відображення Накопичення. Ралі в цьому стані є можливостями для продажу.

[[BOLD_UPPER]]Екстремум шорту[[/]]

Індекс COT знаходиться на рівні десяти або нижче. Фонди тримають історично максимальні короткі позиції. Потенціал для сквізу підвищений — якщо ціна рухається проти фондів, вони можуть бути змушені швидко закрити короткі позиції, створюючи різкий рух вгору. Не додавайте нові короткі позиції тут. Це потенційно конфігурація для довгої позиції на розворот, якщо вона поєднується з підтвердженням від макро та сезонності.`
        }
      }
    ]
  },

  // ── 3. ASSET EXPLORER ───────────────────────────────────────────────────────
  {
    key: "explorer",
    icon: "◈",
    color: "#f59e0b",
    title: {
      en: "Asset Explorer",
      uk: "Дослідник активів"
    },
    summary: {
      en: "Deep dive into a single asset: positioning breakdown, momentum analysis, AI commentary, confirmation checklist, and seasonal curve.",
      uk: "Глибоке занурення в один актив: розбір позиціонування, аналіз моментуму, коментар штучного інтелекту, контрольний список підтвердження та сезонна крива."
    },
    blocks: [
      {
        title: {
          en: "Setup Analysis: Setup Bias, Conviction, and Crowding",
          uk: "Аналіз конфігурації: ухил конфігурації, переконаність та перенасиченість"
        },
        content: {
          en: `The Setup Analysis block at the top of the Explorer gives you three numbers that together tell you the quality and risk profile of the current COT setup for this asset.

[[BOLD_UPPER]]Setup Bias — the directional label[[/]]

Long Extreme means the COT Index is at or above ninety — the largest long position in three years. Bullish Context means the COT Index is between sixty-five and eighty-nine — funds lean long but not at dangerous extremes. Balanced means the COT Index is between thirty-five and sixty-four — no clear directional edge. Bearish Context means the COT Index is between eleven and thirty-four — funds lean short. Short Extreme means the COT Index is at or below ten — the largest short position in three years.

[[BOLD_UPPER]]Conviction Score from zero to one hundred[[/]]

This measures how far the current positioning is from the neutral zone at fifty. The formula is: the absolute value of the COT Index minus fifty, multiplied by two.

A COT Index of eighty-five gives a Conviction Score of seventy. A COT Index of ninety-seven gives a Conviction Score of ninety-four. A COT Index of forty-eight gives a Conviction Score of four — almost no conviction in either direction.

[[BOLD_UPPER]]Crowding — risk from overextension[[/]]

Extreme Crowding means the COT Index is at or above ninety or at or below ten. This is a warning: the crowd is fully positioned, and the risk of a sharp reversal from forced liquidation is at its highest. Elevated Crowding means the COT Index is between seventy-five and eighty-nine or between eleven and twenty-five — caution, but not yet at the most dangerous extreme. Moderate Crowding means the COT Index is between twenty-five and seventy-five — normal operating zone with reasonable risk.

[[BOLD_UPPER]]How to combine the three numbers[[/]]

The ideal entry setup has: high Conviction (above sixty), Moderate Crowding (the COT Index is not in the extreme zone), and a Setup Bias that matches your trade direction. When Conviction is high but Crowding is Extreme — you are late. The crowd is already in. Wait for the COT Index to pull back from the extreme before entering, or reduce your position size significantly.`,
          uk: `Блок аналізу конфігурації у верхній частині Дослідника дає вам три числа, які разом розповідають про якість та профіль ризику поточної конфігурації COT для цього активу.

[[BOLD_UPPER]]Ухил конфігурації — спрямована мітка[[/]]

Екстремум лонгу означає, що Індекс COT знаходиться на рівні дев'яноста або вище — найбільша довга позиція за три роки. Бичачий контекст означає, що Індекс COT між шістдесятьма п'ятьма та вісімдесятьма дев'ятьма — фонди схиляються до лонгу, але не на небезпечних екстремумах. Збалансований означає, що Індекс COT між тридцятьма п'ятьма та шістдесятьма чотирма — немає чіткої спрямованої переваги. Ведмежий контекст означає, що Індекс COT між одинадцятьма та тридцятьма чотирма — фонди схиляються до шорту. Екстремум шорту означає, що Індекс COT на рівні десяти або нижче — найбільша коротка позиція за три роки.

[[BOLD_UPPER]]Оцінка переконаності від нуля до ста[[/]]

Це вимірює, наскільки далеко поточне позиціонування від нейтральної зони на рівні п'ятдесяти. Формула: абсолютне значення Індексу COT мінус п'ятдесят, помножене на два.

Індекс COT вісімдесят п'ять дає Оцінку переконаності сімдесят. Індекс COT дев'яносто сім дає Оцінку переконаності дев'яносто чотири. Індекс COT сорок вісім дає Оцінку переконаності чотири — майже жодної переконаності в жодному напрямку.

[[BOLD_UPPER]]Перенасиченість — ризик від перерозтягнення[[/]]

Екстремальна перенасиченість означає, що Індекс COT на рівні дев'яноста або вище, або на рівні десяти або нижче. Це попередження: натовп повністю позиціонований, і ризик різкого розвороту від примусової ліквідації є найвищим. Підвищена перенасиченість означає Індекс COT між сімдесятьма п'ятьма та вісімдесятьма дев'ятьма або між одинадцятьма та двадцятьма п'ятьма — обережність, але ще не на найнебезпечнішому екстремумі. Помірна перенасиченість означає Індекс COT між двадцятьма п'ятьма та сімдесятьма п'ятьма — нормальна операційна зона з розумним ризиком.

[[BOLD_UPPER]]Як поєднувати три числа[[/]]

Ідеальна конфігурація входу має: високу Переконаність (вище шістдесяти), Помірну перенасиченість (Індекс COT не знаходиться в екстремальній зоні) та Ухил конфігурації, що відповідає напрямку вашої угоди. Коли Переконаність висока, але Перенасиченість екстремальна — ви запізнилися. Натовп вже всередині. Зачекайте, поки Індекс COT відкотиться від екстремуму перед входом, або суттєво зменшіть розмір позиції.`
        }
      },
      {
        title: {
          en: "Contextual Interpretation: reading the auto-generated analysis",
          uk: "Контекстна інтерпретація: читання автоматично згенерованого аналізу"
        },
        content: {
          en: `The Contextual Interpretation text is generated automatically from real COT numbers for this specific asset — it is not a generic template. Every sentence reflects actual current data.

[[BOLD_UPPER]]Structure of the text[[/]]

The first block describes the current positioning regime: whether funds are in a crowded long, constructive long, neutral, bearish, or crowded short state. It also explains what this means for trade direction — for example, whether rallies are buying or selling opportunities.

The second block covers momentum context. Is the move accelerating or decelerating? How many index points did funds add or remove this week? Is the short-term average above or below the long-term average, and what does the crossover relationship tell us?

[[BOLD_UPPER]]How to read a bearish example[[/]]

WTI Oil, COT Index at twenty-three: the text would read something like — bearish positioning confirmed, funds lean short without being at extremes, the backdrop supports selling rallies rather than buying dips. The move is decelerating — watch for a potential stall. This week funds reduced exposure modestly. The short-term average is slightly above the medium-term average, suggesting the downtrend may be losing momentum.

Reading this: the short bias is valid, but the deceleration signal warns against chasing new shorts aggressively. The correct approach is to wait for a rally into resistance and then look for a short entry there, rather than selling into a falling market.

[[BOLD_UPPER]]How to read a bullish example[[/]]

Silver, COT Index at seventy-eight: the text would read — accumulation phase confirmed, funds actively building long exposure. The move is accelerating — momentum is strengthening. Short-term average crossed above medium-term average this week, confirming trend strength. No crowding risk yet.

Reading this: active accumulation with accelerating momentum and no crowding danger. This is exactly the setup to focus on.

The Contextual Interpretation should always be read together with the Confirmation Checklist and the Seasonal Curve to form a complete picture before making any trading decision.`,
          uk: `Текст контекстної інтерпретації генерується автоматично з реальних даних COT для цього конкретного активу — це не загальний шаблон. Кожне речення відображає фактичні поточні дані.

[[BOLD_UPPER]]Структура тексту[[/]]

Перший блок описує поточний режим позиціонування: чи перебувають фонди в стані перенасиченого лонгу, конструктивного лонгу, нейтральному, ведмежому чи в стані перенасиченого шорту. Він також пояснює, що це означає для напрямку торгівлі — наприклад, чи є ралі можливостями для купівлі або продажу.

Другий блок охоплює контекст моментуму. Чи прискорюється або сповільнюється рух? Скільки пунктів індексу фонди додали або прибрали цього тижня? Чи знаходиться короткострокове середнє вище або нижче довгострокового, і що говорить нам співвідношення перетину?

[[BOLD_UPPER]]Як читати ведмежий приклад[[/]]

Нафта WTI, Індекс COT на рівні двадцяти трьох: текст читатиметься приблизно так — ведмежа позиція підтверджена, фонди схиляються до коротких позицій, не перебуваючи на екстремумах, фон підтримує продаж на ралі, а не купівлю на зниженнях. Рух сповільнюється — слідкуйте за можливою зупинкою. Цього тижня фонди скромно скоротили позиції. Короткострокове середнє трохи вище середньострокового, що свідчить про можливу втрату імпульсу низхідного тренду.

Читання цього: ведмежий ухил є дійсним, але сигнал уповільнення застерігає від агресивного переслідування нових коротких позицій. Правильний підхід — чекати на ралі до рівня опору і там шукати короткий вхід, а не продавати на ринку, що падає.

[[BOLD_UPPER]]Як читати бичачий приклад[[/]]

Срібло, Індекс COT на рівні сімдесяти восьми: текст читатиметься — фаза накопичення підтверджена, фонди активно нарощують довгі позиції. Рух прискорюється — моментум посилюється. Короткострокове середнє перетнуло середньострокове вгору цього тижня, підтверджуючи силу тренду. Ризику перенасиченості поки що немає.

Читання цього: активне накопичення з прискоренням моментуму і без небезпеки перенасиченості. Це саме та конфігурація, на яку варто звернути увагу.

Контекстну інтерпретацію завжди слід читати разом із Контрольним списком підтвердження та Сезонною кривою, щоб сформувати повну картину перед прийняттям будь-якого торгового рішення.`
        }
      },
      {
        title: {
          en: "Confirmation Checklist: four conditions for a quality signal",
          uk: "Контрольний список підтвердження: чотири умови якісного сигналу"
        },
        content: {
          en: `The Confirmation Checklist evaluates four independent conditions for the current asset. Each condition either passes or fails. Together they give you a quick quality score for the setup.

[[BOLD_UPPER]]Condition one: COT regime agrees with bias[[/]]

For a long signal: the COT Index must be at or above sixty-five. For a short signal: the COT Index must be at or below thirty-five. If the COT Index is in the neutral zone between thirty-five and sixty-five, this condition fails — the positioning does not yet provide sufficient directional confirmation.

[[BOLD_UPPER]]Condition two: flow state is directional[[/]]

The Flow State must not be Neutral. It should be Accumulation or Long Extreme for long setups, and Distribution or Short Extreme for short setups. A Neutral flow state means the positioning has no clear direction and the signal lacks conviction.

[[BOLD_UPPER]]Condition three: not in the most crowded zone[[/]]

The COT Index must be between eleven and eighty-nine, meaning not in the extreme crowded zones. If the COT Index is above eighty-nine or below eleven, this condition fails — the crowding risk is too high to enter a new position with full size.

[[BOLD_UPPER]]Condition four: momentum confirms direction[[/]]

The acceleration state must be accelerating. A decelerating or stable momentum does not provide this confirmation. The move must be gaining speed, meaning funds are entering positions at an increasing rate.

[[BOLD_UPPER]]How to use the checklist[[/]]

All four conditions passing — this is an ideal setup, the highest quality you will find. Three of four conditions passing — this is a strong setup worth trading with standard position size. Two conditions passing — this is a developing setup. Watch it but reduce position size significantly if you choose to trade. One or zero conditions passing — skip this trade. Wait for a better entry.

[[BOLD_UPPER]]Practical example[[/]]

Silver: COT Index is at seventy-eight (condition one passes, above sixty-five). Flow State is Accumulation (condition two passes). COT Index is not in the extreme zone (condition three passes). Acceleration state is accelerating (condition four passes). Result: four out of four — this is a high-quality long setup.`,
          uk: `Контрольний список підтвердження оцінює чотири незалежні умови для поточного активу. Кожна умова або проходить, або ні. Разом вони дають вам швидку оцінку якості конфігурації.

[[BOLD_UPPER]]Умова перша: режим COT узгоджується з ухилом[[/]]

Для сигналу на довгу позицію: Індекс COT повинен знаходитися на рівні шістдесяти п'яти або вище. Для сигналу на коротку позицію: Індекс COT повинен знаходитися на рівні тридцяти п'яти або нижче. Якщо Індекс COT знаходиться в нейтральній зоні між тридцятьма п'ятьма та шістдесятьма п'ятьма, ця умова не проходить — позиціонування ще не забезпечує достатнього спрямованого підтвердження.

[[BOLD_UPPER]]Умова друга: стан потоку є спрямованим[[/]]

Стан потоку не повинен бути Нейтральним. Для конфігурацій довгих позицій він повинен бути Накопиченням або Екстремумом лонгу, а для конфігурацій коротких позицій — Розподілом або Екстремумом шорту. Нейтральний стан потоку означає, що позиціонування не має чіткого напрямку і сигнал позбавлений переконаності.

[[BOLD_UPPER]]Умова третя: не в найбільш перенасиченій зоні[[/]]

Індекс COT повинен знаходитися між одинадцятьма та вісімдесятьма дев'ятьма, тобто не в екстремальних зонах перенасиченості. Якщо Індекс COT вище вісімдесяти дев'яти або нижче одинадцяти, ця умова не проходить — ризик перенасиченості занадто високий, щоб входити в нову позицію з повним розміром.

[[BOLD_UPPER]]Умова четверта: моментум підтверджує напрямок[[/]]

Стан прискорення повинен бути «прискорення». Уповільнення або стабільний моментум не забезпечують цього підтвердження. Рух повинен набирати швидкість, тобто фонди входять у позиції з зростаючою швидкістю.

[[BOLD_UPPER]]Як використовувати контрольний список[[/]]

Всі чотири умови проходять — це ідеальна конфігурація, найвища якість, яку ви знайдете. Три з чотирьох умов проходять — це сильна конфігурація, яку варто торгувати зі стандартним розміром позиції. Дві умови проходять — це конфігурація, що розвивається. Спостерігайте за нею, але суттєво зменшіть розмір позиції, якщо вирішите торгувати. Одна або нуль умов проходять — пропустіть цю угоду. Зачекайте на кращий вхід.

[[BOLD_UPPER]]Практичний приклад[[/]]

Срібло: Індекс COT на рівні сімдесяти восьми (перша умова проходить, вище шістдесяти п'яти). Стан потоку — Накопичення (друга умова проходить). Індекс COT не знаходиться в екстремальній зоні (третя умова проходить). Стан прискорення — прискорення (четверта умова проходить). Результат: чотири з чотирьох — це якісна конфігурація для довгої позиції.`
        }
      },
      {
        title: {
          en: "Seasonal Curve: using historical positioning patterns",
          uk: "Сезонна крива: використання історичних патернів позиціонування"
        },
        content: {
          en: `The Seasonal Curve shows the average COT Index for each calendar month based on the last five years of data. It is your third filter after COT positioning and macroeconomic context.

[[BOLD_UPPER]]What seasonality does and does not do[[/]]

Seasonality does not predict price. It does not guarantee any market movement. What it does is show you a statistical tendency — in which months have funds historically been positioned bullish or bearish for this specific asset. It provides a calendar tailwind or headwind for your COT signal.

[[BOLD_UPPER]]How to read the grid[[/]]

Green cells in the seasonal curve mean that in this month, funds have historically maintained bullish positioning. Red cells mean funds have historically leaned bearish. The brighter the color, the stronger the historical tendency. The cell highlighted with a yellow border is the current month.

[[BOLD_UPPER]]Practical example with gold in November[[/]]

Suppose the five-year average COT Index for gold in November across the last five years was: eighty-two in 2020, seventy-one in 2021, sixty-four in 2022, seventy-eight in 2023, and eighty-five in 2024. The five-year average is seventy-six — a clearly green cell. This means that statistically, November has been a favorable period for bullish positioning in gold. It does not mean gold will rise in November this year, but it means the seasonal wind is blowing behind your back if you hold a long position.

[[BOLD_UPPER]]Three scenarios for combining seasonality with COT[[/]]

First scenario — all three aligned: the COT Index is at seventy-four (bullish), the macroeconomic context is supportive, and the seasonal score for the current month is also bullish. High conviction — this is the best possible moment for entering a long position.

Second scenario — COT and macro aligned but seasonality against: the COT Index is at seventy-one, macro is supportive, but the seasonal score for the current month is red (historically bearish for this asset). The signal exists but there is a calendar headwind. The wise approach is to reduce position size or wait for the beginning of a more favorable seasonal window in the next month.

Third scenario — COT is bullish but both macro and seasonality are against: the COT Index is at sixty-eight, but macro is in defensive mode and seasonality is also red. Skip this trade. When three independent filters all disagree, the probability of a successful outcome falls significantly.

[[BOLD_UPPER]]Using seasonality for exits[[/]]

If you are already in a profitable long position and the seasonal curve shows that the current month is the last green month before several red months — this is a strong signal to take profits or tighten your stop loss, even if the COT Index is still in the bullish zone.`,
          uk: `Сезонна крива показує середній Індекс COT для кожного календарного місяця на основі даних за останні п'ять років. Це ваш третій фільтр після позиціонування COT та макроекономічного контексту.

[[BOLD_UPPER]]Що сезонність робить і що не робить[[/]]

Сезонність не передбачає ціну. Вона не гарантує жодного ринкового руху. Те, що вона робить — показує статистичну тенденцію: в які місяці фонди historically утримували бичаче або ведмеже позиціонування для цього конкретного активу. Вона забезпечує календарний попутний або зустрічний вітер для вашого сигналу COT.

[[BOLD_UPPER]]Як читати сітку[[/]]

Зелені клітинки в сезонній кривій означають, що в цьому місяці фонди historically утримували бичаче позиціонування. Червоні клітинки означають, що фонди historically схилялися до ведмежого. Чим яскравіший колір, тим сильніша historical тенденція. Клітинка, виділена жовтою рамкою, — це поточний місяць.

[[BOLD_UPPER]]Практичний приклад із золотом у листопаді[[/]]

Припустимо, п'ятирічне середнє значення Індексу COT для золота в листопаді за останні п'ять років було: вісімдесят два в 2020, сімдесят один в 2021, шістдесят чотири в 2022, сімдесят вісім в 2023 і вісімдесят п'ять в 2024. П'ятирічне середнє дорівнює сімдесяти шести — чітко зелена клітинка. Це означає, що статистично листопад був сприятливим періодом для бичачого позиціонування в золоті. Це не означає, що золото зросте в листопаді цього року, але це означає, що сезонний вітер дме вам у спину, якщо ви тримаєте довгу позицію.

[[BOLD_UPPER]]Три сценарії поєднання сезонності з COT[[/]]

Перший сценарій — всі три узгоджені: Індекс COT на рівні сімдесяти чотирьох (бичачий), макроекономічний контекст сприятливий, і сезонний показник поточного місяця також бичачий. Висока впевненість — це найкращий можливий момент для входу в довгу позицію.

Другий сценарій — COT і макро узгоджені, але сезонність проти: Індекс COT на рівні сімдесяти одного, макро сприятливий, але сезонний показник поточного місяця червоний (historically ведмежий для цього активу). Сигнал існує, але є календарний зустрічний вітер. Розумний підхід — зменшити розмір позиції або зачекати на початок більш сприятливого сезонного вікна наступного місяця.

Третій сценарій — COT бичачий, але і макро, і сезонність проти: Індекс COT на рівні шістдесяти восьми, але макро в захисному режимі і сезонність теж червона. Пропустіть цю угоду. Коли три незалежні фільтри всі не погоджуються, ймовірність успішного результату суттєво падає.

[[BOLD_UPPER]]Використання сезонності для виходів[[/]]

Якщо ви вже знаходитеся в прибутковій довгій позиції і сезонна крива показує, що поточний місяць є останнім зеленим місяцем перед кількома червоними місяцями — це сильний сигнал для фіксації прибутку або підтягування стоп-лоссу, навіть якщо Індекс COT ще знаходиться в бичачій зоні.`
        }
      }
    ]
  },

  // ── 4. SIGNALS ──────────────────────────────────────────────────────────────
  {
    key: "signals",
    icon: "⚡",
    color: "#f87171",
    title: {
      en: "Signals",
      uk: "Сигнали"
    },
    summary: {
      en: "A ranked list of all active COT signals with quality scores, lifecycle stage, and entry assessment. Your shortlist of the best current opportunities.",
      uk: "Ранжований список усіх активних сигналів COT з оцінками якості, стадією життєвого циклу та оцінкою входу. Ваш короткий список найкращих поточних можливостей."
    },
    blocks: [
      {
        title: {
          en: "Signal lifecycle: from Candidate to Invalidated",
          uk: "Життєвий цикл сигналу: від Кандидата до Анульованого"
        },
        content: {
          en: `Every signal on this platform passes through five defined states. Understanding which state a signal is in determines whether you should be watching it, entering it, managing it, or exiting.

[[BOLD_UPPER]]Candidate[[/]]

The COT Index is moving in the right direction but has not yet reached the threshold to become an active signal. The Entry Quality score is below forty. This is a signal to watch, not to trade. Add it to your watchlist and revisit it the following Friday when the new COT data is published.

[[BOLD_UPPER]]Active[[/]]

The COT Index has crossed above sixty-five (for a long signal) or below thirty-five (for a short signal), and the Entry Quality score is at or above forty. This signal is live and tradeable. Confirm with macro context and seasonality before entering.

[[BOLD_UPPER]]Aging[[/]]

The signal has been in the Active state for four or more weeks. The freshness component of the scoring has started to decay. This does not mean the signal is wrong — some of the strongest trends persist for ten or twelve weeks — but the edge is no longer as fresh as it was at week one. If you are already in a position, tighten your stop loss. If you are considering a new entry, reduce your position size.

[[BOLD_UPPER]]Stale[[/]]

The signal has been active long enough that the entry edge has largely disappeared. The risk-to-reward of entering now is significantly worse than it was at the beginning of the signal. If you are already in a position from earlier, reassess whether the original thesis still holds or whether the signal has simply aged out without delivering.

[[BOLD_UPPER]]Invalidated[[/]]

The COT Index has moved decisively in the opposite direction, or the Entry Quality score has fallen below the minimum threshold. The signal is no longer valid. If you hold a position based on this signal, it is time to exit or the market has already stopped you out.

[[BOLD_UPPER]]Practical example following a complete lifecycle[[/]]

Week one: Gold COT Index reaches sixty-eight, Entry Quality is fifty-five. Status becomes Active. You enter a long position.

Week three: Gold COT Index is at seventy-four, Entry Quality is sixty-two. Status remains Active. You hold and trail your stop.

Week five: Gold COT Index is at seventy-one, Entry Quality is forty-eight. Status becomes Aging. You tighten your stop loss significantly to protect most of the profit.

Week seven: Gold COT Index falls back to fifty-eight, Entry Quality is thirty-two. Status becomes Stale. Your tightened stop has been triggered and you exit the trade with most of the profit captured.`,
          uk: `Кожен сигнал на цій платформі проходить через п'ять визначених станів. Розуміння того, в якому стані знаходиться сигнал, визначає, чи слід вам за ним спостерігати, входити в нього, управляти ним або виходити.

[[BOLD_UPPER]]Кандидат[[/]]

Індекс COT рухається в правильному напрямку, але ще не досяг порогу, щоб стати активним сигналом. Оцінка якості входу нижче сорока. Це сигнал для спостереження, а не для торгівлі. Додайте його до свого списку спостереження і перегляньте наступної п'ятниці, коли будуть опубліковані нові дані COT.

[[BOLD_UPPER]]Активний[[/]]

Індекс COT перетнув рівень шістдесяти п'яти вгору (для сигналу на довгу позицію) або рівень тридцяти п'яти вниз (для сигналу на коротку позицію), і Оцінка якості входу знаходиться на рівні сорока або вище. Цей сигнал живий і придатний для торгівлі. Підтвердіть за допомогою макроекономічного контексту та сезонності перед входом.

[[BOLD_UPPER]]Старіючий[[/]]

Сигнал знаходиться в активному стані чотири або більше тижнів. Компонент свіжості в оцінці почав знижуватися. Це не означає, що сигнал неправильний — деякі з найсильніших трендів тривають десять або дванадцять тижнів — але перевага вже не така свіжа, як на першому тижні. Якщо ви вже знаходитеся в позиції, підтягніть стоп-лосс. Якщо ви розглядаєте новий вхід, зменшіть розмір позиції.

[[BOLD_UPPER]]Застарілий[[/]]

Сигнал був активним досить довго, щоб перевага входу в основному зникла. Співвідношення ризику до потенційного прибутку від входу зараз значно гірше, ніж воно було на початку сигналу. Якщо ви вже знаходитеся в позиції з раніше, переоцініть, чи первісна теза ще актуальна, або сигнал просто вичерпав себе, не реалізувавшись.

[[BOLD_UPPER]]Анульований[[/]]

Індекс COT рішуче рухнувся в протилежному напрямку, або Оцінка якості входу впала нижче мінімального порогу. Сигнал більше не є дійсним. Якщо ви тримаєте позицію на основі цього сигналу, час виходити, або ринок вже спрацював ваш стоп.

[[BOLD_UPPER]]Практичний приклад повного життєвого циклу[[/]]

Тиждень перший: Індекс COT золота досягає шістдесяти восьми, Оцінка якості входу п'ятдесят п'ять. Статус стає Активним. Ви входите в довгу позицію.

Тиждень третій: Індекс COT золота на рівні сімдесяти чотирьох, Оцінка якості входу шістдесят два. Статус залишається Активним. Ви тримаєте позицію і підтягуєте стоп.

Тиждень п'ятий: Індекс COT золота на рівні сімдесяти одного, Оцінка якості входу сорок вісім. Статус стає Старіючим. Ви суттєво підтягуєте стоп-лосс, щоб захистити більшу частину прибутку.

Тиждень сьомий: Індекс COT золота падає назад до п'ятдесяти восьми, Оцінка якості входу тридцять два. Статус стає Застарілим. Ваш підтягнутий стоп спрацьовує і ви виходите з угоди, зафіксувавши більшу частину прибутку.`
        }
      },
      {
        title: {
          en: "Priority Score and Entry Quality: how the scores are calculated",
          uk: "Оцінка пріоритету та Якість входу: як розраховуються оцінки"
        },
        content: {
          en: `There are two distinct scores for every signal. Understanding the difference between them helps you know when to act and when to wait.

[[BOLD_UPPER]]Entry Quality Score from zero to one hundred[[/]]

This score answers the question: how good is the entry opportunity right now? It is composed of four weighted factors.

Forty percent comes from positioning strength — how far the COT Index is into the directional zone. A COT Index of ninety gives maximum points here; a COT Index of sixty-six gives minimal points.

Twenty percent comes from the flow state regime — whether the flow state is strongly directional (Accumulation or Distribution scores high) or neutral (scores zero).

Twenty percent comes from seasonality — whether the seasonal curve for the current month supports the signal direction.

Twenty percent comes from macroeconomic alignment — whether the relevant macro segment (Growth for indices, Inflation for commodities, Policy for currencies) is positioned in the same direction as the signal.

[[BOLD_UPPER]]Priority Score from zero to one hundred[[/]]

This score answers the question: how should this signal be ranked relative to all others? It uses Entry Quality as its foundation but also incorporates signal freshness and overall trend strength.

Fifty-five percent comes from Entry Quality. Twenty percent comes from freshness — a signal that appeared two weeks ago scores higher than one that appeared ten weeks ago. Fifteen percent comes from directional strength, meaning how consistently the COT has moved in the signal direction over the past eight weeks. Ten percent comes from regime alignment, a broader macro confirmation.

[[BOLD_UPPER]]Practical reading of the scores[[/]]

A Priority Score of eighty-five or above paired with an Entry Quality of seventy or above means: this is among the best setups currently available in the entire universe of tracked assets. Rare, but actionable with confidence.

A Priority Score between seventy and eighty-four with an Entry Quality between fifty and sixty-nine means: a strong signal worth trading with standard position size, pending confirmation from your own technical analysis for the entry point.

A Priority Score between fifty-five and sixty-nine means: a developing signal. Reduce position size if trading and set tighter parameters. Do not trade with full conviction.

A Priority Score below fifty-five: skip. The COT edge is insufficient to justify the trade risk.`,
          uk: `Для кожного сигналу існують дві окремі оцінки. Розуміння різниці між ними допомагає вам знати, коли діяти, а коли чекати.

[[BOLD_UPPER]]Оцінка якості входу від нуля до ста[[/]]

Ця оцінка відповідає на питання: наскільки хороша можливість входу прямо зараз? Вона складається з чотирьох зважених факторів.

Сорок відсотків — від сили позиціонування, наскільки далеко Індекс COT знаходиться в спрямованій зоні. Індекс COT дев'яносто дає максимальні бали тут; Індекс COT шістдесят шість дає мінімальні бали.

Двадцять відсотків — від режиму стану потоку, чи є стан потоку чітко спрямованим (Накопичення або Розподіл отримує високий бал) або нейтральним (отримує нуль).

Двадцять відсотків — від сезонності, чи підтримує сезонна крива поточного місяця напрямок сигналу.

Двадцять відсотків — від макроекономічного узгодження, чи відповідний макро сегмент (Зростання для індексів, Інфляція для сировинних товарів, Монетарна політика для валют) позиціонований в тому ж напрямку, що й сигнал.

[[BOLD_UPPER]]Оцінка пріоритету від нуля до ста[[/]]

Ця оцінка відповідає на питання: як цей сигнал повинен бути ранжований відносно всіх інших? Вона використовує Якість входу як основу, але також враховує свіжість сигналу та загальну силу тренду.

П'ятдесят п'ять відсотків — від Якості входу. Двадцять відсотків — від свіжості, сигнал, що з'явився два тижні тому, отримує вищий бал, ніж той, що з'явився десять тижнів тому. П'ятнадцять відсотків — від спрямованої сили, тобто наскільки послідовно COT рухався в напрямку сигналу протягом останніх восьми тижнів. Десять відсотків — від узгодження режиму, ширшого макро підтвердження.

[[BOLD_UPPER]]Практичне читання оцінок[[/]]

Оцінка пріоритету вісімдесят п'ять або вище в парі з Якістю входу сімдесят або вище означає: це одна з найкращих конфігурацій, доступних в даний момент у всьому всесвіті відстежуваних активів. Рідкість, але придатна для впевнених дій.

Оцінка пріоритету між сімдесятьма та вісімдесятьма чотирма з Якістю входу між п'ятдесятьма та шістдесятьма дев'ятьма означає: сильний сигнал, який варто торгувати зі стандартним розміром позиції, очікуючи підтвердження від вашого власного технічного аналізу для точки входу.

Оцінка пріоритету між п'ятдесятьма п'ятьма та шістдесятьма дев'ятьма означає: конфігурація, що розвивається. Зменшіть розмір позиції при торгівлі та встановіть жорсткіші параметри. Не торгуйте з повною переконаністю.

Оцінка пріоритету нижче п'ятдесяти п'яти: пропустіть. Перевага COT недостатня для виправдання торгового ризику.`
        }
      },
      {
        title: {
          en: "Signal History: learning from completed signals",
          uk: "Історія сигналів: навчання на завершених сигналах"
        },
        content: {
          en: `The Signal History tab stores the record of all past signals — both those that are still active and those that have already been closed. This is one of the most valuable educational tools on the platform.

[[BOLD_UPPER]]Weeks Active[[/]]

This shows how many weeks each signal remained in an active or aging state. The average productive signal lasts four to eight weeks. A signal that lasts twelve or more weeks usually means either an exceptionally strong institutional trend, or a signal that stalled without delivering meaningful movement. Reviewing week counts across many past signals will help you build intuition about typical signal durations for each asset.

[[BOLD_UPPER]]Peak Score versus Current Score[[/]]

The Peak Score is the highest Priority Score the signal reached during its lifetime. The Current Score is today's value. When the Current Score is significantly below the Peak Score, the signal is weakening. The further the Current Score falls from the Peak, the higher the probability that the signal has exhausted itself. This divergence is an early warning to tighten risk management.

[[BOLD_UPPER]]Eight-week sparkline chart[[/]]

The sparkline is a small chart showing the COT Index movement over the past eight weeks. A rising line means growing institutional conviction in the signal direction. A falling line means the COT is retreating. A flat line means the positioning has stalled. Learning to read sparklines quickly lets you assess momentum at a glance before opening the full Asset Explorer.

[[BOLD_UPPER]]First Seen, Active date, and Closed date[[/]]

First Seen is when the signal first appeared as a Candidate — when the COT Index first started moving in the relevant direction. Active date is when it crossed the threshold and became tradeable. Closed date is when the signal was invalidated or became stale.

The gap between First Seen and Active tells you how long the setup took to develop — a signal that moved quickly from Candidate to Active often has stronger momentum than one that took four weeks to reach the threshold.

[[BOLD_UPPER]]How to use Signal History for learning[[/]]

Every week after reviewing the current signals, spend five minutes going through the Signal History for your most-watched assets. Find signals that were recently Active and compare the COT movement with what you know about price movements during that period. Over time this builds pattern recognition — you will start to see which types of setups tend to precede strong sustained moves and which ones tend to stall or reverse quickly.`,
          uk: `Вкладка Історії сигналів зберігає запис усіх минулих сигналів — як тих, що ще активні, так і тих, що вже закриті. Це один з найцінніших навчальних інструментів на платформі.

[[BOLD_UPPER]]Кількість активних тижнів[[/]]

Це показує, скільки тижнів кожен сигнал залишався в активному або старіючому стані. Середній продуктивний сигнал триває від чотирьох до восьми тижнів. Сигнал, який триває дванадцять або більше тижнів, зазвичай означає або виключно сильний інституційний тренд, або сигнал, який застряг без значущого руху. Перегляд кількості тижнів по багатьох минулих сигналах допоможе вам виробити інтуїцію щодо типових тривалостей сигналів для кожного активу.

[[BOLD_UPPER]]Пікова оцінка проти поточної оцінки[[/]]

Пікова оцінка — це найвища Оцінка пріоритету, якої сигнал досяг за своє існування. Поточна оцінка — це сьогоднішнє значення. Коли поточна оцінка значно нижче пікової, сигнал слабшає. Чим далі поточна оцінка падає від пікової, тим вища ймовірність того, що сигнал вичерпав себе. Це розходження є раннім попередженням для підтягування управління ризиком.

[[BOLD_UPPER]]Восьмитижневий спарклайн-графік[[/]]

Спарклайн — це невеликий графік, що показує рух Індексу COT за останні вісім тижнів. Висхідна лінія означає зростаючу інституційну переконаність у напрямку сигналу. Спадна лінія означає, що COT відступає. Пряма лінія означає, що позиціонування застряло. Навчившись швидко читати спарклайни, ви зможете оцінювати моментум з першого погляду перед відкриттям повного Дослідника активів.

[[BOLD_UPPER]]Дата першого появи, дата активації та дата закриття[[/]]

Дата першого появи — це коли сигнал вперше з'явився як Кандидат, тобто коли Індекс COT вперше почав рухатися у відповідному напрямку. Дата активації — це коли він перетнув поріг і став придатним для торгівлі. Дата закриття — це коли сигнал був анульований або застарів.

Проміжок між першою появою та активацією розповідає вам, скільки часу знадобилося конфігурації для розвитку — сигнал, який швидко перейшов від Кандидата до Активного, часто має сильніший моментум, ніж той, якому знадобилося чотири тижні для досягнення порогу.

[[BOLD_UPPER]]Як використовувати Історію сигналів для навчання[[/]]

Кожного тижня після перегляду поточних сигналів витрачайте п'ять хвилин на перегляд Історії сигналів для активів, за якими ви найбільш уважно стежите. Знаходьте сигнали, які нещодавно були Активними, і порівнюйте рух COT з тим, що ви знаєте про рухи ціни протягом того ж часу. Поступово це формує розпізнавання патернів — ви почнете бачити, які типи конфігурацій мають тенденцію передувати сильним стійким рухам, а які мають тенденцію стопоритися або швидко розвертатися.`
        }
      }
    ]
  },

  // ── 5. MACRO REGIME ─────────────────────────────────────────────────────────
  {
    key: "macro",
    icon: "◎",
    color: "#34d399",
    title: {
      en: "Macro Regime",
      uk: "Макроекономічний режим"
    },
    summary: {
      en: "Deep analysis of three institutional segments and their composite picture. The framework for understanding what the entire market is pricing in right now.",
      uk: "Глибокий аналіз трьох інституційних сегментів та їх зведена картина. Основа для розуміння того, що зараз закладає в ціни весь ринок."
    },
    blocks: [
      {
        title: {
          en: "Reading the three segments and the Composite",
          uk: "Читання трьох сегментів та Композитного показника"
        },
        content: {
          en: `The Macro Regime section gives you a bird's-eye view of institutional positioning across the three major thematic groups of assets. Each segment has its own score from zero to one hundred, and together they form the Composite score.

[[BOLD_UPPER]]Growth segment in detail[[/]]

The Growth segment tracks the S&P 500, Nasdaq 100, and Dow Jones Industrial Average. These are the three most liquid and widely held equity futures in the world. When hedge funds and leveraged traders are net long these instruments, they are expressing a view that corporate earnings will grow, the economy will expand, and risk-taking will be rewarded.

A Growth score above sixty-five means that the majority of the tracked equity futures are in the bullish positioning zone. This historically correlates with a period of rising equity markets and expanding risk appetite across other asset classes. A Growth score below thirty-five means institutional money has rotated out of equity risk. Historically this has preceded or accompanied equity corrections and a broader risk-off mood.

[[BOLD_UPPER]]Inflation segment in detail[[/]]

The Inflation segment tracks gold, silver, copper, and crude oil. These four assets together capture the inflation trade in its full breadth. Gold and silver are monetary inflation hedges. Copper is the industrial metal most sensitive to global growth expectations and is sometimes called "Doctor Copper" because of its historical reliability as an economic indicator. Crude oil captures both energy inflation and global demand expectations.

When all four are simultaneously in the bullish positioning zone — this is the strongest possible inflation trade signal. It means institutional money across multiple asset types is simultaneously betting on rising prices, a weaker dollar, or both. When copper is bullish but gold is not, this signals growth-driven commodity demand rather than monetary inflation. When gold is bullish but copper is not, this signals defensive monetary hedging rather than growth expectations.

[[BOLD_UPPER]]Policy segment in detail[[/]]

The Policy segment tracks the US dollar index futures, euro, Japanese yen, British pound, and Swiss franc. Together these five instruments capture the global view on monetary policy divergence between the major central banks.

When the dollar-denominated instruments push the Policy score above sixty-five, funds are positioned for Federal Reserve hawkishness — higher interest rates, tighter financial conditions. This creates headwinds for gold, emerging market currencies, and risk assets. When the non-dollar currencies push the Policy score below thirty-five, funds expect dollar weakness — dovish Federal Reserve, rate cuts, quantitative easing. This creates tailwinds for gold, commodities, and risk assets.

[[BOLD_UPPER]]The Composite and what it means[[/]]

The Composite score is the simple average of the three segment scores. But more important than the number itself is the internal consistency of the three segments. Three segments all above sixty-five (Composite above sixty-five) means the entire institutional universe is aligned in a risk-on, inflation-accepting, policy-supportive direction — the most powerful macro backdrop for aggressive trading. Three segments all below thirty-five (Composite below thirty-five) means the opposite — a broad institutional retreat from risk.

When segments diverge, the Composite number loses meaning. A Composite of fifty that comes from Growth at seventy, Inflation at sixty-five, and Policy at fifteen is very different from a Composite of fifty that comes from all three segments near fifty. The first case has a real internal tension that often resolves with volatility. The second case is genuinely balanced.`,
          uk: `Розділ Макроекономічного режиму дає вам погляд з висоти пташиного польоту на інституційне позиціонування по трьох основних тематичних групах активів. Кожен сегмент має власну оцінку від нуля до ста, і разом вони формують Композитну оцінку.

[[BOLD_UPPER]]Сегмент Зростання детально[[/]]

Сегмент Зростання відстежує S&P 500, Nasdaq 100 та Dow Jones Industrial Average. Це три найбільш ліквідні та широко утримувані ф'ючерси на акціонерний капітал у світі. Коли хедж-фонди та трейдери з кредитним плечем мають нетто-довгі позиції в цих інструментах, вони висловлюють погляд, що корпоративні прибутки зростатимуть, економіка розширюватиметься і прийняття ризику буде винагороджуватись.

Оцінка Зростання вище шістдесяти п'яти означає, що більшість відстежуваних ф'ючерсів на акціонерний капітал знаходяться в зоні бичачого позиціонування. Historically це корелює з періодом зростання ринків акцій і розширення апетиту до ризику в інших класах активів. Оцінка Зростання нижче тридцяти п'яти означає, що інституційні гроші вийшли з акціонерного ризику. Historically це передувало або супроводжувало корекції акцій та ширший настрій уникнення ризику.

[[BOLD_UPPER]]Сегмент Інфляція детально[[/]]

Сегмент Інфляція відстежує золото, срібло, мідь та сиру нафту. Ці чотири активи разом охоплюють інфляційний трейд у всій його широті. Золото та срібло є монетарними інфляційними хеджами. Мідь є промисловим металом, найбільш чутливим до глобальних очікувань зростання, і іноді її називають "Доктор Мідь" через її historical надійність як економічного індикатора. Сира нафта охоплює як енергетичну інфляцію, так і очікування глобального попиту.

Коли всі четверо одночасно знаходяться в зоні бичачого позиціонування — це найсильніший можливий сигнал інфляційного трейду. Це означає, що інституційні гроші по кількох типах активів одночасно роблять ставку на зростання цін, ослаблення долара або й те, і інше. Коли мідь бичача, але золото ні, це сигналізує про попит на сировинні товари, пов'язаний із зростанням, а не про монетарну інфляцію. Коли золото бичаче, але мідь ні, це сигналізує про захисне монетарне хеджування, а не про очікування зростання.

[[BOLD_UPPER]]Сегмент Монетарна політика детально[[/]]

Сегмент Монетарна політика відстежує ф'ючерси на індекс долара США, євро, японську єну, британський фунт та швейцарський франк. Разом ці п'ять інструментів охоплюють глобальний погляд на розбіжність монетарної політики між основними центральними банками.

Коли інструменти, деноміновані в доларах, штовхають оцінку Монетарної політики вище шістдесяти п'яти, фонди позиціоновані на яструбиність Федерального резерву — вищі процентні ставки, жорсткіші фінансові умови. Це створює зустрічні вітри для золота, валют країн, що розвиваються, та ризикових активів. Коли валюти, відмінні від долара, штовхають оцінку Монетарної політики нижче тридцяти п'яти, фонди очікують слабкість долара — голубиний Федеральний резерв, зниження ставок, кількісне пом'якшення. Це створює попутні вітри для золота, сировинних товарів та ризикових активів.

[[BOLD_UPPER]]Композитний показник і що він означає[[/]]

Композитний показник — це просте середнє трьох сегментних оцінок. Але важливіше за саме число є внутрішня узгодженість трьох сегментів. Три сегменти, всі вище шістдесяти п'яти (Композитний вище шістдесяти п'яти), означає, що весь інституційний всесвіт узгоджений у спрямованому до ризику, інфляційно-прийнятному, підтримуваному політикою напрямку — найпотужніший макроекономічний фон для агресивної торгівлі. Три сегменти, всі нижче тридцяти п'яти (Композитний нижче тридцяти п'яти) означає протилежне — широкий інституційний відступ від ризику.

Коли сегменти розходяться, число Композитного показника втрачає значення. Композитний рівень п'ятдесяти, що утворюється від Зростання на сімдесяти, Інфляції на шістдесяти п'яти та Монетарної політики на п'ятнадцяти, дуже відрізняється від Композитного рівня п'ятдесяти, що утворюється від всіх трьох сегментів поблизу п'ятдесяти. Перший випадок має реальну внутрішню напруженість, яка часто вирішується волатильністю. Другий випадок є по-справжньому збалансованим.`
        }
      },
      {
        title: {
          en: "Segment Dispersion and Macro Phase",
          uk: "Розкид між сегментами та Макроекономічна фаза"
        },
        content: {
          en: `Segment Dispersion measures how far apart the three segment scores are from each other. It is the difference between the highest and lowest segment scores.

[[BOLD_UPPER]]Why dispersion matters more than the average[[/]]

Imagine Growth is at seventy-two, Inflation is at sixty-eight, and Policy is at sixty-seven. The Dispersion is five — extremely low. All three segments are telling the same story: broad institutional risk-on. This is a high-conviction macro environment where COT signals across all three thematic groups should be treated with increased confidence.

Now imagine Growth is at seventy-five, Inflation is at thirty, and Policy is at seventy-one. The Dispersion is forty-five — very high. Growth and Policy say one thing, but Inflation says the opposite. An equity long makes sense, a commodities long does not. A macro-divergent environment like this requires you to be asset-specific, not directionally global.

[[BOLD_UPPER]]Practical rule for dispersion levels[[/]]

When Dispersion is below fifteen — the macro message is unified and clear. You can trade themes broadly and treat all supporting signals in the same direction as high-confidence. When Dispersion is between fifteen and thirty-five — moderate divergence exists. Be selective about which segment's signals you act on. When Dispersion is above thirty-five — the macro environment is contradictory. Reduce overall risk, trade smaller sizes, and only act on the strongest individual signals where the specific segment aligns with the trade.

[[BOLD_UPPER]]Macro Phase — the five regime states[[/]]

The Macro Phase label translates the Composite score into a qualitative description of the current market environment.

Strong Risk-On means the Composite score is at or above eighty. This is the most favorable environment for aggressive long positions across growth assets, inflation assets, and momentum trades. Historical periods with this reading tend to be characterized by trending markets with relatively low volatility.

Constructive means the Composite score is between sixty-five and seventy-nine. A bullish environment with some limitations. Most signals can be acted upon but with normal position sizing.

Balanced means the Composite score is between thirty-five and sixty-four. A neutral environment requiring case-by-case analysis. Do not make directional bets based purely on macro — look for the specific assets with strong individual COT setups.

Defensive means the Composite score is between twenty and thirty-four. The macro backdrop is unfavorable for aggressive risk-taking. Reduce position sizes across all trades and focus on the highest-quality setups only.

Strong Defensive means the Composite score is below twenty. The broadest institutional retreat from risk. In historical precedent, this reading has appeared near major market dislocations. Trade defensively, protect capital first.`,
          uk: `Розкид між сегментами вимірює, наскільки далеко три сегментні оцінки відстоять одна від одної. Це різниця між найвищою та найнижчою сегментними оцінками.

[[BOLD_UPPER]]Чому розкид важливіший за середнє[[/]]

Уявіть, що Зростання на рівні сімдесяти двох, Інфляція на рівні шістдесяти восьми, і Монетарна політика на рівні шістдесяти семи. Розкид дорівнює п'яти — надзвичайно низький. Всі три сегменти розповідають одну й ту саму історію: широкий інституційний апетит до ризику. Це макроекономічне середовище з високою впевненістю, де сигнали COT по всіх трьох тематичних групах слід розглядати з підвищеною довірою.

Тепер уявіть, що Зростання на рівні сімдесяти п'яти, Інфляція на рівні тридцяти, і Монетарна політика на рівні сімдесяти одного. Розкид дорівнює сорока п'яти — дуже високий. Зростання та Монетарна політика говорять одне, але Інфляція говорить протилежне. Довга позиція в акціях має сенс, довга позиція в сировинних товарах — ні. Макро-дивергентне середовище, як це, вимагає від вас бути специфічними щодо активів, а не глобально спрямованими.

[[BOLD_UPPER]]Практичне правило для рівнів розкиду[[/]]

Коли Розкид нижче п'ятнадцяти — макроекономічне повідомлення єдине та чітке. Ви можете торгувати темами широко і розглядати всі підтримуючі сигнали в одному напрямку як такі з високою впевненістю. Коли Розкид між п'ятнадцятьма та тридцятьма п'ятьма — існує помірна дивергенція. Будьте вибірковими щодо того, за сигналами якого сегменту ви дієте. Коли Розкид вище тридцяти п'яти — макроекономічне середовище суперечливе. Зменшіть загальний ризик, торгуйте меншими розмірами і дійте лише за найсильнішими індивідуальними сигналами, де конкретний сегмент узгоджується з угодою.

[[BOLD_UPPER]]Макроекономічна фаза — п'ять режимних станів[[/]]

Мітка Макроекономічної фази перетворює Композитну оцінку на якісний опис поточного ринкового середовища.

Сильна схильність до ризику означає, що Композитна оцінка знаходиться на рівні вісімдесяти або вище. Це найсприятливіше середовище для агресивних довгих позицій по активах зростання, інфляційних активах та угодах за моментумом. Historically такі показники характеризуються трендовими ринками з відносно низькою волатильністю.

Конструктивний означає Композитну оцінку між шістдесятьма п'ятьма та сімдесятьма дев'ятьма. Бичаче середовище з певними обмеженнями. Більшість сигналів можна виконувати, але зі стандартним розміром позиції.

Збалансований означає Композитну оцінку між тридцятьма п'ятьма та шістдесятьма чотирма. Нейтральне середовище, що вимагає аналізу в кожному конкретному випадку. Не робіть спрямованих ставок, ґрунтуючись виключно на макро — шукайте конкретні активи з сильними індивідуальними конфігураціями COT.

Захисний означає Композитну оцінку між двадцятьма та тридцятьма чотирма. Макроекономічний фон несприятливий для агресивного прийняття ризику. Зменшіть розміри позицій по всіх угодах і зосередьтеся лише на конфігураціях найвищої якості.

Сильно захисний означає Композитну оцінку нижче двадцяти. Найширший інституційний відступ від ризику. В historical прецеденті цей показник з'являвся поблизу великих ринкових дислокацій. Торгуйте захисно, захист капіталу перш за все.`
        }
      }
    ]
  },

  // ── 6. CORRELATION ──────────────────────────────────────────────────────────
  {
    key: "correlation",
    icon: "⇄",
    color: "#86efac",
    title: {
      en: "Correlation",
      uk: "Кореляція"
    },
    summary: {
      en: "Which assets are positioned similarly and what that means for your trades. Cross-asset COT alignment analysis.",
      uk: "Які активи позиціоновані схожим чином і що це означає для ваших угод. Аналіз крос-активного узгодження COT."
    },
    blocks: [
      {
        title: {
          en: "What correlation means here — and what it does not",
          uk: "Що означає кореляція тут — і що вона не означає"
        },
        content: {
          en: `The correlation shown on this platform is not statistical price correlation. This is a critical distinction to understand before using this section.

[[BOLD_UPPER]]Price correlation versus COT positioning alignment[[/]]

Traditional price correlation asks: when asset A moves up by one percent, how much does asset B tend to move? This is calculated from price history. Gold and silver have a high statistical price correlation — they tend to move in the same direction most of the time.

The correlation on this platform asks a different question: how similar is the current COT positioning level of asset A compared to asset B? If gold has a COT Index of seventy-eight and silver has a COT Index of seventy-five, their positioning is highly aligned — institutional money is simultaneously bullish on both. If gold has a COT Index of seventy-eight and natural gas has a COT Index of twenty-two, their positioning is opposed — institutional money is bullish on gold and bearish on natural gas at the same time.

[[BOLD_UPPER]]Why this distinction matters[[/]]

Two assets can have high price correlation but opposed COT positioning. If gold and silver typically move together in price but right now hedge funds are aggressively long gold and bearish on silver, this positioning divergence is meaningful — it suggests funds see a different near-term dynamic for each metal despite their normal price relationship.

Conversely, two assets that do not normally move together in price can have highly aligned COT positioning if they share a common macro theme at this moment. The Dollar Index and Japanese yen futures might have opposed COT positioning simultaneously — not because of price correlation, but because the macro trade driving both is dollar strength versus yen weakness.

[[BOLD_UPPER]]Highly Aligned pairs[[/]]

When two assets have a COT Index gap of less than twelve points, they are Highly Aligned. Institutional money is positioned similarly on both. They are telling the same macro story. When one gives a COT signal, the other serves as confirmation. If you find a strong long signal on copper and see that gold is also Highly Aligned in the same direction, the copper signal has additional institutional support.

[[BOLD_UPPER]]Opposed pairs and their trading relevance[[/]]

When two assets have a COT Index gap of more than fifty points, they are in Opposed positioning. One is in or near the bullish zone while the other is in or near the bearish zone. This creates a potential pair trade: simultaneously long the bullish asset and short the bearish asset. The pair trade is particularly powerful when the two assets share a natural economic relationship — for example, long gold and short the US dollar, or long copper and short natural gas.

[[BOLD]]Useful link:[[/]] explanation of how institutional positioning flows between related assets — https://www.investopedia.com/terms/i/intermarket-analysis.asp`,
          uk: `Кореляція, показана на цій платформі, не є статистичною кореляцією цін. Це критичне розрізнення, яке слід зрозуміти перед використанням цього розділу.

[[BOLD_UPPER]]Кореляція цін проти узгодження позиціонування COT[[/]]

Традиційна кореляція цін запитує: коли актив A рухається вгору на один відсоток, наскільки зазвичай рухається актив B? Це розраховується з цінової history. Золото та срібло мають високу статистичну кореляцію цін — вони, як правило, рухаються в одному напрямку більшість часу.

Кореляція на цій платформі задає інше питання: наскільки схожий поточний рівень позиціонування COT активу A в порівнянні з активом B? Якщо золото має Індекс COT сімдесят вісім, а срібло має Індекс COT сімдесят п'ять, їхнє позиціонування є дуже узгодженим — інституційні гроші одночасно бичачі до обох. Якщо золото має Індекс COT сімдесят вісім, а природний газ має Індекс COT двадцять два, їхнє позиціонування є протилежним — інституційні гроші бичачі до золота і ведмежі до природного газу одночасно.

[[BOLD_UPPER]]Чому це розрізнення важливе[[/]]

Два активи можуть мати високу кореляцію цін, але протилежне позиціонування COT. Якщо золото та срібло зазвичай рухаються разом у ціні, але зараз хедж-фонди агресивно тримають довгі позиції по золоту і є ведмежими до срібла, це розходження позиціонування є значущим — воно свідчить про те, що фонди бачать різну короткострокову динаміку для кожного металу, незважаючи на їхні нормальні цінові відносини.

Навпаки, два активи, які зазвичай не рухаються разом у ціні, можуть мати дуже узгоджене позиціонування COT, якщо вони ділять спільну макро тему в даний момент. Ф'ючерси на Індекс долара та японської єни можуть мати протилежне позиціонування COT одночасно — не через кореляцію цін, а тому що макро трейд, що рухає обома, — це сила долара проти слабкості єни.

[[BOLD_UPPER]]Дуже узгоджені пари[[/]]

Коли два активи мають розрив Індексу COT менше дванадцяти пунктів, вони є Дуже узгодженими. Інституційні гроші позиціоновані схожим чином до обох. Вони розповідають одну й ту саму макро історію. Коли один дає сигнал COT, інший служить підтвердженням. Якщо ви знайдете сильний сигнал на довгу позицію в міді і побачите, що золото також є Дуже узгодженим в тому ж напрямку, сигнал міді має додаткову інституційну підтримку.

[[BOLD_UPPER]]Протилежні пари та їх торгова значимість[[/]]

Коли два активи мають розрив Індексу COT більше п'ятдесяти пунктів, вони знаходяться в Протилежному позиціонуванні. Один знаходиться в або поблизу бичачої зони, тоді як інший знаходиться в або поблизу ведмежої зони. Це створює потенційну парну угоду: одночасно довга позиція в бичачому активі та коротка позиція в ведмежому активі. Парна угода є особливо потужною, коли два активи ділять природний економічний взаємозв'язок — наприклад, довга позиція в золоті та коротка позиція в доларі США, або довга позиція в міді та коротка позиція в природному газі.

[[BOLD]]Корисне посилання:[[/]] пояснення того, як інституційні потоки позиціонування рухаються між пов'язаними активами — https://www.investopedia.com/terms/i/intermarket-analysis.asp`
        }
      },
      {
        title: {
          en: "Average Alignment and how to use cross-asset patterns",
          uk: "Середнє узгодження та як використовувати крос-активні патерни"
        },
        content: {
          en: `The Average Alignment Score shows the overall degree of synchronization across all tracked assets. It is calculated as the average closeness of all pairwise COT Index comparisons across the full universe.

[[BOLD_UPPER]]What high alignment tells you[[/]]

When the Average Alignment Score is above seventy, most assets in the universe are positioned similarly. The market is synchronized around one or two dominant themes. This makes trading simpler in one sense — the macro story is clear and consistent. But it also means that when the dominant theme reverses, many assets will reverse simultaneously, so individual position sizing should reflect this systemic risk.

[[BOLD_UPPER]]What low alignment tells you[[/]]

When the Average Alignment Score is below forty, the market is fragmented. Different asset classes are telling contradictory stories. Growth assets may be bullish while inflation assets are bearish. Currencies may be giving opposite signals. In this environment, do not try to trade a broad market theme — instead, focus on the specific individual assets with the clearest and strongest COT setups, regardless of whether they fit a coherent macro narrative.

[[BOLD_UPPER]]Top Aligned Pairs — strongest confluences[[/]]

The list of Top Aligned Pairs shows which specific pairs of assets currently have the most similar COT positioning. These pairs represent the strongest confluences available in the market right now. If both assets in a top-aligned pair are in the bullish zone, and you have a long signal on one of them, the alignment with the other provides additional validation. If you are already in a position on one asset, a top-aligned partner in the same direction gives you confidence to hold.

[[BOLD_UPPER]]Top Opposed Pairs — potential pair trades[[/]]

The list of Top Opposed Pairs shows which specific pairs currently have the most divergent COT positioning. These are your best candidate pair trades. The most reliable pair trades combine a top-opposed positioning relationship with a natural economic connection between the two assets.

Classic examples from the platform: gold long paired with dollar short when their positioning is opposed, because the economic inverse relationship between gold and the dollar makes the institutional divergence more meaningful. Copper long paired with natural gas short when commodity positioning diverges along growth-versus-supply lines.

[[BOLD_UPPER]]Important limitation to remember[[/]]

COT alignment does not tell you when or how much the price will move. It tells you the direction of institutional conviction. You still need technical analysis for entry timing, and risk management for position sizing. The correlation analysis is a filter and a validation tool, not a standalone trading system.`,
          uk: `Оцінка середнього узгодження показує загальний ступінь синхронізації по всіх відстежуваних активах. Вона розраховується як середня близькість усіх парних порівнянь Індексу COT по всьому всесвіту.

[[BOLD_UPPER]]Що говорить вам висока узгодженість[[/]]

Коли Оцінка середнього узгодження вище сімдесяти, більшість активів у всесвіті позиціоновані схожим чином. Ринок синхронізований навколо однієї або двох домінантних тем. Це спрощує торгівлю в одному сенсі — макро історія є чіткою та послідовною. Але це також означає, що коли домінантна тема розвертається, багато активів розвернуться одночасно, тому розміри окремих позицій повинні відображати цей системний ризик.

[[BOLD_UPPER]]Що говорить вам низька узгодженість[[/]]

Коли Оцінка середнього узгодження нижче сорока, ринок є фрагментованим. Різні класи активів розповідають суперечливі історії. Активи зростання можуть бути бичачими, поки інфляційні активи є ведмежими. Валюти можуть давати протилежні сигнали. У цьому середовищі не намагайтеся торгувати широкою ринковою темою — натомість зосередьтеся на конкретних індивідуальних активах з найчіткішими та найсильнішими конфігураціями COT, незалежно від того, чи вписуються вони в послідовний макро наратив.

[[BOLD_UPPER]]Топ узгоджених пар — найсильніші збіжності[[/]]

Список Топ узгоджених пар показує, які конкретні пари активів наразі мають найбільш схоже позиціонування COT. Ці пари представляють найсильніші збіжності, доступні на ринку прямо зараз. Якщо обидва активи у топ-узгодженій парі знаходяться в бичачій зоні, і у вас є сигнал на довгу позицію по одному з них, узгодженість з іншим забезпечує додаткову валідацію. Якщо ви вже знаходитеся в позиції по одному активу, партнер у тому ж напрямку з топ-узгодженості дає вам впевненість тримати.

[[BOLD_UPPER]]Топ протилежних пар — потенційні парні угоди[[/]]

Список Топ протилежних пар показує, які конкретні пари наразі мають найбільш розбіжне позиціонування COT. Це ваші найкращі кандидати для парних угод. Найнадійніші парні угоди поєднують відносини протилежного позиціонування з природним економічним зв'язком між двома активами.

Класичні приклади з платформи: довга позиція в золоті в парі з короткою позицією в доларі, коли їхнє позиціонування є протилежним, тому що економічна зворотна залежність між золотом і доларом робить інституційне розходження більш значущим. Довга позиція в міді в парі з короткою позицією в природному газі, коли позиціонування сировинних товарів розходиться по лінії зростання та пропозиції.

[[BOLD_UPPER]]Важливе обмеження, яке слід пам'ятати[[/]]

Узгодженість COT не говорить вам, коли або наскільки зміниться ціна. Вона говорить вам про напрямок інституційної переконаності. Вам все одно потрібен технічний аналіз для визначення часу входу та управління ризиком для розміру позиції. Аналіз кореляції є фільтром і інструментом валідації, а не самостійною торговою системою.`
        }
      }
    ]
  },

  // ── 7. SEASONALITY ──────────────────────────────────────────────────────────
  {
    key: "seasonality",
    icon: "◷",
    color: "#67e8f9",
    title: {
      en: "Seasonality",
      uk: "Сезонність"
    },
    summary: {
      en: "Calendar-based statistical tendencies in COT positioning based on a five-year average. Your third filter after COT and macro — never the first.",
      uk: "Календарні статистичні тенденції в позиціонуванні COT на основі п'ятирічного середнього. Ваш третій фільтр після COT та макро — ніколи не перший."
    },
    blocks: [
      {
        title: {
          en: "How seasonality is calculated and why it is useful",
          uk: "Як розраховується сезонність і чому вона корисна"
        },
        content: {
          en: `For each asset and each calendar month, the platform calculates the average COT Index value over the last five years for that specific month. The result is a twelve-cell grid showing the typical institutional positioning tendency for each month of the year.

[[BOLD_UPPER]]The calculation step by step[[/]]

Take gold in November as an example. The platform looks at the COT Index reading for gold during November across the last five years: in 2020 the average November COT Index was eighty-two, in 2021 it was seventy-one, in 2022 it was sixty-four, in 2023 it was seventy-eight, and in 2024 it was eighty-five. The five-year average is seventy-six.

A result of seventy-six means that statistically, in November, hedge funds have historically been in a bullish positioning zone for gold. The seasonal grid shows this as a green cell.

[[BOLD_UPPER]]What the colors mean[[/]]

Green cells indicate months where the five-year average COT Index is above sixty — historically favorable positioning for long trades. Brighter green indicates stronger historical tendency. Red cells indicate months where the five-year average COT Index is below forty — historically unfavorable for long trades and supportive of short positioning. The yellow-bordered cell is the current month.

[[BOLD_UPPER]]Seasonal Breadth[[/]]

Seasonal Breadth is the percentage of all tracked assets that currently have a supportive seasonal window — meaning their current month falls in a green zone. When Breadth is above sixty percent, the overall calendar context is favorable. Most assets are in historically positive seasonal windows, providing a general tailwind for long positions. When Breadth is below thirty percent, the calendar is working against the majority of assets. This does not mean you cannot trade, but it is an additional headwind that should be factored into position sizing and risk management.

[[BOLD_UPPER]]What seasonality cannot tell you[[/]]

Seasonality is a statistical average of historical positioning. It does not know about this year's specific Federal Reserve policy, this year's geopolitical events, or this year's supply disruptions. An asset with a historically red November can still deliver a strong bullish COT signal in November if the fundamental or macro conditions are unusual. Seasonality is a headwind or tailwind, not a wall.

[[BOLD]]Useful link:[[/]] explanation of seasonal patterns in commodity markets — https://www.cmegroup.com/education/courses/introduction-to-futures/understanding-seasonal-tendencies.html`,
          uk: `Для кожного активу та кожного календарного місяця платформа розраховує середнє значення Індексу COT за останні п'ять років для цього конкретного місяця. Результатом є сітка з дванадцяти клітинок, що показує типову інституційну тенденцію позиціонування для кожного місяця року.

[[BOLD_UPPER]]Розрахунок крок за кроком[[/]]

Візьмемо золото у листопаді як приклад. Платформа дивиться на значення Індексу COT для золота в листопаді за останні п'ять років: у 2020 році середній листопадовий Індекс COT становив вісімдесят два, у 2021 — сімдесят один, у 2022 — шістдесят чотири, у 2023 — сімдесят вісім, і у 2024 — вісімдесят п'ять. П'ятирічне середнє дорівнює сімдесяти шести.

Результат сімдесят шість означає, що статистично в листопаді хедж-фонди historically знаходилися в бичачій зоні позиціонування для золота. Сезонна сітка показує це як зелену клітинку.

[[BOLD_UPPER]]Що означають кольори[[/]]

Зелені клітинки вказують на місяці, де п'ятирічне середнє значення Індексу COT перевищує шістдесят — historically сприятливе позиціонування для довгих угод. Яскравіший зелений вказує на сильнішу historical тенденцію. Червоні клітинки вказують на місяці, де п'ятирічне середнє значення Індексу COT нижче сорока — historically несприятливе для довгих угод та таке, що підтримує коротке позиціонування. Клітинка з жовтою рамкою є поточним місяцем.

[[BOLD_UPPER]]Сезонний охват[[/]]

Сезонний охват — це відсоток усіх відстежуваних активів, які наразі мають сприятливе сезонне вікно, тобто їхній поточний місяць припадає на зелену зону. Коли Охват вище шістдесяти відсотків, загальний календарний контекст є сприятливим. Більшість активів знаходиться в historically позитивних сезонних вікнах, забезпечуючи загальний попутний вітер для довгих позицій. Коли Охват нижче тридцяти відсотків, календар працює проти більшості активів. Це не означає, що ви не можете торгувати, але це додатковий зустрічний вітер, який слід враховувати при розмірі позиції та управлінні ризиком.

[[BOLD_UPPER]]Що сезонність не може вам розповісти[[/]]

Сезонність є статистичним середнім historical позиціонування. Вона не знає про цьогорічну конкретну політику Федерального резерву, цьогорічні геополітичні події або цьогорічні перебої в постачанні. Актив з historically червоним листопадом все одно може дати сильний бичачий сигнал COT у листопаді, якщо фундаментальні або макроекономічні умови є незвичними. Сезонність — це зустрічний або попутний вітер, а не стіна.

[[BOLD]]Корисне посилання:[[/]] пояснення сезонних патернів на товарних ринках — https://www.cmegroup.com/education/courses/introduction-to-futures/understanding-seasonal-tendencies.html`
        }
      },
      {
        title: {
          en: "Three scenarios: how to combine seasonality with COT and macro",
          uk: "Три сценарії: як поєднувати сезонність з COT та макро"
        },
        content: {
          en: `Seasonality is most powerful when used as a third filter that either reinforces or tempers the conclusion you have already reached from the COT and macro analysis.

[[BOLD_UPPER]]Scenario one — all three aligned (ideal setup)[[/]]

The COT Index is at seventy-four and in the Accumulation flow state, confirming a bullish setup. The relevant macro segment (for example, the Inflation segment for gold) is above sixty-five, providing macro confirmation. The seasonal score for the current month is seventy-six (green cell), indicating a historically favorable calendar window.

All three independent filters agree. This is the highest-confidence scenario. Position size can be at its maximum within your risk parameters. Entry can be taken when technical analysis provides a suitable level.

[[BOLD_UPPER]]Scenario two — COT and macro agree but seasonality is against[[/]]

The COT Index is at seventy-one, the macro context is supportive, but the seasonal score for the current month is twenty-eight (red cell) — historically this month has been bearish for this asset.

The signal exists and is valid, but there is a calendar headwind. Two approaches make sense here. First: reduce your position size to half of what you would normally use, to reflect the lower historical probability. Second: wait for the beginning of the next calendar month if that month transitions to a green zone — the signal may still be active and you enter with a seasonality tailwind instead of a headwind. Do not abandon a quality COT signal purely due to seasonality, but do respect the friction it introduces.

[[BOLD_UPPER]]Scenario three — COT is bullish but both macro and seasonality are against[[/]]

The COT Index is at sixty-eight, suggesting a possible long setup, but the macro regime is in Defensive mode (Composite below thirty-five) and the seasonal score is also red at twenty-two. Two out of three filters are against the trade.

Skip this trade entirely. When two independent filters simultaneously contradict a COT signal, the probability of a successful outcome falls significantly. The COT setup may be real, but the timing is wrong. Wait for either the macro environment to improve or the seasonal window to turn favorable before acting.

[[BOLD_UPPER]]Using seasonality to time exits[[/]]

Seasonality is not only useful for entries — it can also help you decide when to exit a profitable position.

Suppose you are holding a profitable long position in an asset. The COT Index is still at seventy, confirming the long setup is intact. But the seasonal curve shows that the current month is the last green month before two consecutive red months. This is a strong signal to take profits on most of the position or to tighten your stop loss significantly. Even if the COT signal remains technically active, the declining seasonal probability over the next two months creates asymmetric risk — the time-weighted expected value of holding shifts in favor of taking money off the table.

[[BOLD_UPPER]]The golden rule of seasonality[[/]]

Never use seasonality as your primary reason to enter a trade. It must always be the third confirmation after COT positioning and macroeconomic context. A green seasonal cell alone, without a supportive COT regime and macro alignment, is not a tradeable signal. Seasonality tells you the wind direction — you still need the engine of COT and the navigation of macro to make the journey worthwhile.`,
          uk: `Сезонність є найбільш потужною, коли використовується як третій фільтр, який або підсилює, або пом'якшує висновок, до якого ви вже дійшли з аналізу COT та макро.

[[BOLD_UPPER]]Сценарій перший — всі три узгоджені (ідеальна конфігурація)[[/]]

Індекс COT знаходиться на рівні сімдесяти чотирьох і перебуває в стані потоку Накопичення, підтверджуючи бичачу конфігурацію. Відповідний макро сегмент (наприклад, сегмент Інфляції для золота) знаходиться вище шістдесяти п'яти, забезпечуючи макро підтвердження. Сезонний показник поточного місяця становить сімдесят шість (зелена клітинка), вказуючи на historically сприятливе календарне вікно.

Всі три незалежні фільтри погоджуються. Це сценарій найвищої впевненості. Розмір позиції може бути максимальним в рамках ваших параметрів ризику. Вхід можна здійснювати, коли технічний аналіз надає підходящий рівень.

[[BOLD_UPPER]]Сценарій другий — COT і макро погоджуються, але сезонність проти[[/]]

Індекс COT на рівні сімдесяти одного, макро контекст сприятливий, але сезонний показник поточного місяця становить двадцять вісім (червона клітинка) — historically цей місяць був ведмежим для цього активу.

Сигнал існує і є дійсним, але є календарний зустрічний вітер. Тут мають сенс два підходи. Перший: зменшіть розмір позиції до половини від того, що ви зазвичай використовуєте, щоб відобразити нижчу historical ймовірність. Другий: зачекайте на початок наступного календарного місяця, якщо цей місяць переходить у зелену зону — сигнал може бути ще активним і ви входите з попутним вітром сезонності замість зустрічного. Не відмовляйтеся від якісного сигналу COT виключно через сезонність, але поважайте тертя, яке вона вносить.

[[BOLD_UPPER]]Сценарій третій — COT бичачий, але і макро, і сезонність проти[[/]]

Індекс COT на рівні шістдесяти восьми, що припускає можливу конфігурацію для довгої позиції, але макро режим знаходиться в Захисному режимі (Композитний нижче тридцяти п'яти) і сезонний показник також червоний на рівні двадцяти двох. Два з трьох фільтрів проти угоди.

Повністю пропустіть цю угоду. Коли два незалежні фільтри одночасно суперечать сигналу COT, ймовірність успішного результату суттєво падає. Конфігурація COT може бути реальною, але час є неправильним. Зачекайте, поки або макро середовище покращиться, або сезонне вікно стане сприятливим перед тим, як діяти.

[[BOLD_UPPER]]Використання сезонності для визначення часу виходів[[/]]

Сезонність корисна не лише для входів — вона також може допомогти вам вирішити, коли виходити з прибуткової позиції.

Припустимо, ви тримаєте прибуткову довгу позицію в активі. Індекс COT все ще на рівні сімдесяти, підтверджуючи, що конфігурація для довгої позиції є незмінною. Але сезонна крива показує, що поточний місяць є останнім зеленим місяцем перед двома послідовними червоними місяцями. Це сильний сигнал для фіксації прибутку по більшій частині позиції або для суттєвого підтягування стоп-лоссу. Навіть якщо сигнал COT залишається технічно активним, падіння сезонної ймовірності протягом наступних двох місяців створює асиметричний ризик — зважена за часом очікувана цінність утримання зміщується на користь зняття грошей зі столу.

[[BOLD_UPPER]]Золоте правило сезонності[[/]]

Ніколи не використовуйте сезонність як вашу основну причину для входу в угоду. Вона завжди повинна бути третім підтвердженням після позиціонування COT та макроекономічного контексту. Зелена сезонна клітинка сама по собі, без підтримуючого режиму COT та макро узгодження, не є придатним для торгівлі сигналом. Сезонність говорить вам напрямок вітру — вам все одно потрібен двигун COT та навігація макро, щоб подорож мала сенс.`
        }
      }
    ]
  }
]

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

  React.useEffect(() => {
    if (initialSection && GUIDE_SECTIONS.find(s => s.key === initialSection)) {
      setActiveKey(initialSection)
    }
  }, [initialSection])
  
  const activeSection = GUIDE_SECTIONS.find(s => s.key === activeKey) || GUIDE_SECTIONS[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Header */}
      <div style={{
        borderBottom: '1px solid rgba(90,104,116,0.5)',
        padding: '20px 28px 0',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: '11px', letterSpacing: '0.35em', textTransform: 'uppercase', color: 'rgba(148,163,184,0.5)', marginBottom: '3px' }}>
          {lang === 'uk' ? 'Платформа' : 'Platform'}
        </div>
        <div style={{ fontSize: '19px', fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.02em', marginBottom: '16px' }}>
          {lang === 'uk' ? 'Посібник користувача' : 'Platform Guide'}
        </div>

        {/* Tab bar */}
        <div className="flex flex-wrap gap-2" style={{ paddingBottom: '16px' }}>
          {GUIDE_SECTIONS.map(sec => {
            const isActive = activeKey === sec.key
            const label = typeof sec.title === 'object' ? sec.title[lang] : sec.title
            return (
              <button key={sec.key} onClick={() => setActiveKey(sec.key)}
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
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>

        {/* Section summary */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '13px', color: 'rgba(148,163,184,0.7)', margin: 0, lineHeight: 1.7 }}>
            {typeof activeSection.summary === 'object' ? activeSection.summary[lang] : activeSection.summary}
          </p>
        </div>

        {/* Blocks */}
        {activeSection.blocks.map((block, bi) => (
          <div key={bi} style={{
            marginBottom: '20px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(90,104,116,0.4)',
            borderRadius: '10px',
            padding: '20px 24px',
          }}>
            <h3 style={{
              fontSize: '12px', fontWeight: 600, color: activeSection.color,
              margin: '0 0 14px 0', letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              {typeof block.title === 'object' ? block.title[lang] : block.title}
            </h3>
            <div>
              {renderGuideContent(
                typeof block.content === 'object' ? block.content[lang] : block.content
              )}
            </div>
          </div>
        ))}

      </div>
    </div>
  )
}
 

export default function App() {
  const [active, setActive] = useState('workspace')
  const [selected, setSelected] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [status, setStatus] = useState(null)
  const [heatmap, setHeatmap] = useState({})
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

    const [statusRes, heatmapRes, assetsRes, signalsRes, workspaceRes, seasonalityRes, calendarRes, newsRes] = await Promise.all([
  fetch('/api/system/status'),
  fetch('/api/heatmap'),
  fetch('/api/assets'),
  fetch('/api/signals'),
  fetch('/api/workspace'),
  fetch('/api/seasonality'),
  fetch('/api/calendar?limit=80'),
  fetch('/api/news?limit=200'),
])

if (!statusRes.ok || !heatmapRes.ok || !assetsRes.ok || !signalsRes.ok || !workspaceRes.ok) {
  throw new Error('Failed to load API data')
}

const statusJson      = await statusRes.json()
const heatmapJson     = await heatmapRes.json()
const assetsJson      = await assetsRes.json()
const signalsJson     = await signalsRes.json()
const workspaceJson   = await workspaceRes.json()
const seasonalityJson = seasonalityRes.ok ? await seasonalityRes.json() : { items: [] }
const calendarJson    = calendarRes.ok    ? await calendarRes.json()    : { items: [] }
const newsJson        = newsRes?.ok       ? await newsRes.json()        : { items: [] }

setStatus(statusJson)
setHeatmap(heatmapJson.sectors || {})
setAssets(assetsJson.items || [])
setSignals(signalsJson.items || [])
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
  workspace: <Workspace heatmap={heatmap} workspaceData={workspaceData} setActive={setActive} setSelected={setSelected} assets={assets} aiLanguage={appSettings.aiLanguage} openGuide={openGuide} timezone={appSettings.timezone || "Europe/Copenhagen"}/>, 
  macro: <MacroView assets={assets} aiLanguage={appSettings.aiLanguage} openGuide={openGuide}/>, 
  summary: <Summary assets={assets} setActive={setActive} setSelected={setSelected} openGuide={openGuide}/>,
  watchlist: <WatchlistView assets={assets} setActive={setActive} setSelected={setSelected} aiLanguage={appSettings.aiLanguage} watchlist={watchlist} setWatchlist={setWatchlist} />,
  history: <HistoricalDataView assets={assets} />, 
	explorer: <Explorer assets={assets} selected={selected} setSelected={setSelected} aiLanguage={appSettings.aiLanguage} seasonalityData={seasonalityData} openGuide={openGuide}/>,
  correlation: <CorrelationView assets={assets} openGuide={openGuide} aiLanguage={appSettings.aiLanguage}/>,
  seasonality: <SeasonalityView assets={assets} seasonalityData={seasonalityData} openGuide={openGuide} aiLanguage={appSettings.aiLanguage}/>,
	signals: <SignalsView signals={signals} assets={assets} setActive={setActive} setSelected={setSelected} aiLanguage={appSettings.aiLanguage} seasonalityData={seasonalityData} openGuide={openGuide}/>, 
	guide: <GuideView setActive={setActive} initialSection={guideSection} uiLanguage={uiLanguage} />,
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
        <div className="flex-1 p-4 md:p-6">
          {loading
            ? <Panel title="Loading"><div className="text-sm text-zinc-400">Loading live dashboard data...</div></Panel>
            : error
            ? <Panel title={t("panels.errors")}><div className="text-sm text-rose-400">{error}</div></Panel>
            : view}
        </div>
      </main>
    </div>
  )
}