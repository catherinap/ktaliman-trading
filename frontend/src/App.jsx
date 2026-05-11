import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Database,
  Globe,
  Layout,
  LineChart,
  Settings,
  Zap,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSettings from "./components/LanguageSettings";
import AIAnalysisPanel from "./components/AIAnalysisPanel";


const NAV_ITEMS = [
  { key: "workspace", labelKey: "nav.workspace", icon: Layout },
  { key: "macro", labelKey: "nav.macro", icon: Globe },
  { key: "summary", labelKey: "nav.summary", icon: BarChart2 },
  { key: "explorer", labelKey: "nav.explorer", icon: Activity },
  { key: "correlation", labelKey: "nav.correlation", icon: LineChart },
  { key: "seasonality", labelKey: "nav.seasonality", icon: Calendar },
  { key: "signals", labelKey: "nav.signals", icon: Zap },
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
  if (percentile == null) return 'text-zinc-400'
  if (percentile >= 65) return 'text-emerald-400'
  if (percentile <= 35) return 'text-rose-400'
  return 'text-zinc-300'
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

function importanceTone(level) {
  const v = String(level || "").toLowerCase();
  if (v === "high") return "text-rose-400";
  if (v === "medium") return "text-amber-300";
  return "text-zinc-500";
}

function categoryTone(category) {
  const v = String(category || "").toLowerCase();
  if (v === "forex") return "text-cyan-300";
  if (v === "crypto") return "text-violet-300";
  return "text-zinc-300";
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
  const map = { FX: 'Currencies', MET: 'Metals', IDX: 'Indices', NRG: 'Energy', SFT: 'Softs' }
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
  const seasonalityMap = new Map(seasonalityRows.map((row) => [row.asset, row]))

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
    ["Gold", "GC"],
    ["Silver", "SI"],
    ["Copper", "COPPER", "COPPER GRADE #1","COPPER #1", "HG"],
    ["WTI Crude", "WTI", "Crude Oil", "Light Sweet Crude Oil", "CL"],
  ],
  description: "Inflation sleeve tracks metals and energy proxies.",
},
  policy: {
    title: 'Policy',
    members: ['USD', 'EUR', 'JPY', 'GBP', 'CHF'],
    description: 'Policy sleeve tracks major reserve and policy-sensitive FX positioning.',
  },
}

const CORRELATION_UNIVERSE = ['S&P 500','Nasdaq','Dow Jones','Gold','Silver','Copper','WTI Crude','USD','EUR','JPY','GBP','CHF']
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
  if (value == null || Number.isNaN(value)) return 'text-zinc-500'
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
  const interpretation = `${strongest.asset} currently has the strongest seasonal tailwind at ${formatPercentile(strongest.current)}, while ${weakest.asset} shows the weakest seasonal window at ${formatPercentile(weakest.current)}.`
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
                : "border-zinc-900 bg-[#080808] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
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
  const tone = safe >= 65 ? 'bg-emerald-400' : safe <= 35 ? 'bg-rose-400' : 'bg-amber-300'
  return (
    <div className="h-2 overflow-hidden bg-zinc-900">
      <div className={cls('h-full', tone)} style={{ width: `${Math.max(6, safe)}%` }} />
    </div>
  )
}

function GaugeArc({ value = 50 }) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  const radius = 42;
  const circumference = Math.PI * radius;
  const progress = (safe / 100) * circumference;
  const tone = safe >= 65 ? "#34d399" : safe <= 35 ? "#fb7185" : "#f59e0b";

  return (
    <div className="mx-auto flex w-full max-w-[220px] justify-center overflow-hidden">
      <svg
        viewBox="0 0 120 70"
        className="h-24 w-[120px]"
        aria-hidden="true"
      >
        <g transform="translate(60 60)">
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
  const { t } = useTranslation(); 
  return (
    <aside className={cls('shrink-0 border-r border-zinc-900 bg-[#070707] transition-all duration-300', collapsed ? 'w-20' : 'w-64')}>
      <div className={cls('flex items-center border-b border-zinc-900', collapsed ? 'justify-center px-2 py-5' : 'justify-between px-4 py-5')}>
        <div className={cls('flex items-center gap-3 overflow-hidden', collapsed && 'justify-center')}>
          <div className="grid h-10 w-10 shrink-0 place-items-center border border-zinc-800 text-xs font-bold tracking-[0.35em] text-white">KP</div>
          {!collapsed ? (
            <div>
              <div className="text-[11px] uppercase tracking-[0.35em] text-zinc-500">kpanchenko</div>
              <div className="text-sm uppercase tracking-[0.25em] text-zinc-200">trading</div>
            </div>
          ) : null}
        </div>
        {!collapsed ? (
          <button
            onClick={() => setCollapsed(true)}
            className="grid h-9 w-9 place-items-center border border-zinc-800 text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        ) : null}
      </div>
      <div className="p-3">
        {collapsed ? (
          <div className="mb-3 flex justify-center">
            <button
              onClick={() => setCollapsed(false)}
              className="grid h-10 w-10 place-items-center border border-zinc-800 text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
              aria-label="Expand sidebar"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        ) : null}
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = active === item.key
            return (
              <button
                key={item.key}
                onClick={() => setActive(item.key)}
                title={collapsed ? t(item.labelKey) : undefined}
                className={cls(
                  'flex w-full items-center border-l text-left text-xs uppercase tracking-[0.22em] transition',
                  collapsed ? 'justify-center px-0 py-3' : 'gap-3 px-3 py-3',
                  isActive ? 'border-amber-400 bg-zinc-900/70 text-zinc-100' : 'border-transparent text-zinc-500 hover:bg-zinc-900/40 hover:text-zinc-300'
                )}
              >
                <Icon size={16} className="shrink-0" />
                {!collapsed ? <span className="whitespace-nowrap">{t(item.labelKey)}</span> : null}
              </button>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

function TopBar({ active, status }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between border-b border-zinc-900 bg-[#090909] px-6 py-3 text-xs uppercase tracking-[0.24em] text-zinc-500">
      <div>{t(NAV_ITEMS.find((n) => n.key === active)?.labelKey || "nav.workspace")}</div>
<div className="flex gap-6">
  <span>{t("topbar.assets")} {status?.asset_count ?? "..."}</span>
  <span>{t("topbar.rows")} {status?.total_rows ?? "..."}</span>
  <span>{status?.latest_report_date ?? t("topbar.noData")}</span>
</div>
    </div>
  )
}

function Panel({ title, children, right }) {
  return (
    <section className="border border-zinc-900 bg-[#0a0a0a]">
      <div className="flex items-center justify-between border-b border-zinc-900 px-4 py-3 text-[11px] uppercase tracking-[0.25em] text-zinc-500">
        <span>{title}</span>
        {right ? <div>{right}</div> : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

function Metric({ label, value }) {
  return (
    <div className="border border-zinc-900 bg-[#080808] p-3">
      <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">{label}</div>
      <div className="mt-2 text-zinc-100">{value}</div>
    </div>
  )
}

function ImpactBadge({ impact }) {
  const { t } = useTranslation();
  const tone = impact === 'High' ? 'text-rose-400' : impact === 'Med' ? 'text-amber-400' : 'text-zinc-400'
  return <span className={cls('text-xs uppercase tracking-[0.2em]', tone)}>{impact}</span>
}

function Workspace({ heatmap, workspaceData, setActive, setSelected }) {
  const { t } = useTranslation();
  const macro = workspaceData?.macro_regime
  const [macroFeedLoading, setMacroFeedLoading] = useState(false)
  const releases = workspaceData?.releases || []
  const calendar = workspaceData?.calendar || []
  const news = workspaceData?.news || []

  return (
    <div className="grid gap-4 xl:grid-cols-[2.15fr_1fr]">
      <div className="space-y-4">
        <Panel title={t("panels.macroRegime")} right={<span className="text-amber-400">{macro?.title || 'COT live composite'}</span>}>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <div className="mb-3 text-[11px] uppercase tracking-[0.24em] text-emerald-400">Growth</div>
              <div className="text-sm leading-7 text-zinc-200">{macro?.growth || 'No growth commentary available.'}</div>
            </div>
            <div>
              <div className="mb-3 text-[11px] uppercase tracking-[0.24em] text-amber-400">Inflation</div>
              <div className="text-sm leading-7 text-zinc-200">{macro?.inflation || 'No inflation commentary available.'}</div>
            </div>
            <div>
              <div className="mb-3 text-[11px] uppercase tracking-[0.24em] text-sky-400">Policy</div>
              <div className="text-sm leading-7 text-zinc-200">{macro?.policy || 'No policy commentary available.'}</div>
            </div>
          </div>
          <div className="mt-5 border-t border-zinc-900 pt-4 text-sm leading-7 text-zinc-300">
            <span className="text-zinc-500">Verdict: </span>
            {macro?.verdict || 'No composite verdict available.'}
          </div>
        </Panel>

        <Panel title={t("panels.cotFlowHeatmap")} right={<span className="text-emerald-400">live data</span>}>
          <div className="space-y-5">
            {Object.entries(heatmap || {}).map(([sector, items]) => (
              <div key={sector}>
                <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-zinc-500">{sector}</div>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {items.map((a) => (
                    <button
                      key={a.symbol}
                      onClick={() => {
                        setSelected(a.symbol)
                        setActive('explorer')
                      }}
                      className="border border-zinc-900 bg-[#080808] p-3 text-left hover:border-zinc-700"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-zinc-100">{a.name}</div>
                        <div className={cls('text-sm font-semibold', flowColor(a.funds_percentile_3y))}>
                          {formatPercentile(a.funds_percentile_3y)}
                        </div>
                      </div>
                      <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-zinc-500">{a.symbol}</div>
                      <div className={cls('mt-3 text-xs uppercase tracking-[0.2em]', flowColor(a.funds_percentile_3y))}>
                        {a.flow_state || 'Neutral'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="space-y-4">
        <>
          <section className="rounded-none border border-zinc-800 bg-black/40">
  <div className="border-b border-zinc-900 px-5 py-4 text-[11px] uppercase tracking-[0.35em] text-zinc-500">
    Economic Calendar
  </div>

  <div className="divide-y divide-zinc-900">
    {macroFeedLoading && calendar.length === 0 ? (
      <div className="px-5 py-5 text-sm text-zinc-500">Loading calendar...</div>
    ) : calendar.length === 0 ? (
      <div className="px-5 py-5 text-sm text-zinc-500">No calendar events available.</div>
    ) : (
      calendar.map((event) => {
        const label = event.title || "TBD"
        const place = event.currency || event.country || ""
        const actual = event.actual ?? null
        const forecast = event.forecast ?? null
        const previous = event.previous ?? null

        return (
          <div key={event.id} className="grid grid-cols-[72px_72px_1fr_56px] gap-3 px-5 py-4 text-sm">
            <div className="text-zinc-200">{formatClockTime(event.datetime)}</div>
            <div className="text-zinc-500">{place}</div>

            <div className="text-zinc-100">
              <div>{label}</div>
              <div className="mt-1 text-xs text-zinc-500">
                {actual !== null ? `Actual: ${actual}` : "Actual: n/a"}
                {" · "}
                {forecast !== null ? `Forecast: ${forecast}` : "Forecast: n/a"}
                {" · "}
                {previous !== null ? `Previous: ${previous}` : "Previous: n/a"}
              </div>
            </div>

            <div className={cls("text-right uppercase", importanceTone(event.importance))}>
              {event.importance || "n/a"}
            </div>
          </div>
        )
      })
    )}
  </div>
</section>

<section className="mt-5 rounded-none border border-zinc-800 bg-black/40">
  <div className="border-b border-zinc-900 px-5 py-4 text-[11px] uppercase tracking-[0.35em] text-zinc-500">
    Market News
  </div>

  <div className="divide-y divide-zinc-900">
    {macroFeedLoading && news.length === 0 ? (
      <div className="px-5 py-5 text-sm text-zinc-500">Loading news...</div>
    ) : news.length === 0 ? (
      <div className="px-5 py-5 text-sm text-zinc-500">No market news available.</div>
    ) : (
      news.slice(0, 8).map((item) => {
        const url = item.url && item.url !== "#" ? item.url : null
        const title = item.title || "Untitled article"
        const summary = item.summary || "Open article for full details."
        const category = item.category || "market"
        const source = item.source || "source"

        return (
          <a
            key={item.id}
            href={url || undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-5 py-4 transition-colors hover:bg-zinc-950/70"
            onClick={(e) => {
              if (!url) e.preventDefault()
            }}
          >
            <div className="mb-2 flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.18em]">
              <span className={categoryTone(category)}>{category}</span>
              <span className="text-zinc-500">{source}</span>
            </div>

            <div className="text-sm leading-6 text-zinc-100">{title}</div>

            <div className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-500">
              {summary}
            </div>
          </a>
        )
      })
    )}
  </div>
</section>
        </>
      </div>
    </div>
  )
}

function MacroView({ assets, aiLanguage }) {
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
      : `${config.title} positioning is ${macroLabel(score, t).toLowerCase()} across ${members.length}/${config.members.length} sleeve members.`
  }
}), [assets, t])

  const growth = sleeveData.find((x) => x.key === 'growth')
  const inflation = sleeveData.find((x) => x.key === 'inflation')
  const policy = sleeveData.find((x) => x.key === 'policy')
  const growthScore = growth?.score ?? null
  const inflationScore = inflation?.score ?? null
  const policyScore = policy?.score ?? null

  const macroNarrative = useMemo(
	  () => buildMacroNarrative(
		{
		  growth: growthScore,
		  inflation: inflationScore,
		  policy: policyScore,
		},
		t
	  ),
	  [growthScore, inflationScore, policyScore, t]
  )

  const macroComposite = averagePercentile([
    { funds_percentile_3y: growthScore },
    { funds_percentile_3y: inflationScore },
    { funds_percentile_3y: policyScore }
  ])

  return (
    <div className="grid gap-4 xl:grid-cols-[1.35fr_0.9fr]">
      <div className="space-y-4">
        <Panel title={t("panels.macroComposite")} right={<span className={cls('text-xs uppercase tracking-[0.22em]', macroTone(macroComposite))}>live cot composite</span>}>
          <div className="grid gap-6 md:grid-cols-3">
            {sleeveData.map((sleeve) => (
              <div key={sleeve.key}>
                <div className={cls(
					  'mb-3 text-[11px] uppercase tracking-[0.24em]',
					  sleeve.key === 'growth'
						? 'text-emerald-400'
						: sleeve.key === 'inflation'
						  ? 'text-amber-400'
						  : 'text-sky-400'
					)}>
                  {sleeve.title}
                </div>
                <div className="text-sm leading-7 text-zinc-200">
                  {sleeve.text} Composite percentile: {formatPercentile(sleeve.score)}.
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-zinc-900 pt-4 text-sm leading-7 text-zinc-300">
            <span className="text-zinc-500">Verdict:</span> {macroVerdict(growthScore, inflationScore, policyScore, t)}
          </div>
        </Panel>

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="border border-zinc-900 bg-[#080808] p-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Sleeve Dispersion</div>
            <div className="mt-2 text-2xl text-zinc-100">{formatPercentile(macroNarrative.dispersion)}</div>
            <div className="mt-1 text-sm text-zinc-500">{macroDispersionLabel(macroNarrative.dispersion, t)}</div>
          </div>

          <div className="border border-zinc-900 bg-[#080808] p-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Macro Phase</div>
            <div className="mt-2 text-2xl text-zinc-100">{macroPhase(macroComposite, t)}</div>
            <div className="mt-1 text-sm text-zinc-500">Composite regime state</div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="border border-zinc-900 bg-zinc-950 p-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Narrative Summary</div>
            <div className="mt-3 text-sm leading-7 text-zinc-200">{macroNarrative.summary}</div>
          </div>

          <div className="border border-zinc-900 bg-zinc-950 p-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Interpretation</div>
            <div className="mt-3 text-sm leading-7 text-zinc-200">{macroNarrative.interpretation}</div>
          </div>

          <div className="border border-zinc-900 bg-zinc-950 p-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Trading Relevance</div>
            <div className="mt-3 text-sm leading-7 text-zinc-200">{macroNarrative.tradingRelevance}</div>
          </div>

          <div className="border border-zinc-900 bg-zinc-950 p-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">What To Watch</div>
            <div className="mt-3 text-sm leading-7 text-zinc-200">{macroNarrative.whatToWatch}</div>
          </div>
        </div>

        <Panel title={t("panels.sleeveDetail")}>
          <div className="grid gap-4 md:grid-cols-3">
            {sleeveData.map((sleeve) => (
              <div key={sleeve.key} className="border border-zinc-900 bg-[#080808] p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm uppercase tracking-[0.22em] text-zinc-400">{sleeve.title}</div>
                  <div className={cls('text-sm font-semibold', macroTone(sleeve.score))}>
                    {formatPercentile(sleeve.score)}
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                  <span>{macroLabel(sleeve.score, t)}</span>
                  <span>{sleeve.memberCount}/{sleeve.expectedCount}</span>
                </div>

                <div className="mt-4 space-y-3">
                  {sleeve.members.length ? sleeve.members.map((a) => (
                    <div key={a.symbol} className="border-t border-zinc-900 pt-3 first:border-t-0 first:pt-0">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-zinc-100">{a.name}</div>
                        <div className={cls('text-sm', flowColor(a.funds_percentile_3y))}>
                          {formatPercentile(a.funds_percentile_3y)}
                        </div>
                      </div>
                      <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                        {a.flow_state || 'Neutral'}
                      </div>
                    </div>
                  )) : <div className="text-sm text-zinc-500">No sleeve members available.</div>}
                </div>
              </div>
            ))}
          </div>
		  <AIAnalysisPanel
          type="macro"
          data={{
            growth_score: growthScore,
            inflation_score: inflationScore,
            policy_score: policyScore,
            composite: macroComposite,
            growth_assets: sleeveData.find((x) => x.key === "growth")?.members || [],
            inflation_assets: sleeveData.find((x) => x.key === "inflation")?.members || [],
            policy_assets: sleeveData.find((x) => x.key === "policy")?.members || [],
          }}
          aiLanguage={aiLanguage}
          title={aiLanguage === "uk" ? "AI Макро-аналіз" : "AI Macro Analysis"}
        />
        </Panel>
      </div>

      <div className="space-y-4">
        <Panel title={t("panels.macroNotes")}>
          <div className="space-y-4 text-sm leading-7 text-zinc-300">
            <div>Macro view is derived directly from current COT positioning composites, not from live economic news.</div>
            <div>Growth uses index futures, Inflation uses metals and energy proxies, and Policy uses major FX contracts.</div>
            <div className="border border-zinc-900 bg-zinc-950 p-3 text-zinc-400">
              This is phase one macro logic. Next step can add news-aware commentary and rolling regime history.
            </div>
          </div>
        </Panel>

        <Panel title={t("panels.compositeScores")}>
          <div className="space-y-3">
            {sleeveData.map((sleeve) => (
              <div key={sleeve.key} className="flex items-center justify-between border-b border-zinc-900 pb-3 text-sm last:border-b-0">
                <span className="text-zinc-500">{sleeve.title} ({sleeve.memberCount}/{sleeve.expectedCount})</span>
                <span className={cls(macroTone(sleeve.score))}>{formatPercentile(sleeve.score)}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}

function CorrelationView({ assets }) {
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
      <Panel title={t("panels.correlation")} right={<span className="text-amber-400">positioning relationships</span>}>
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-4 md:grid-cols-4">
            <Metric label="Universe" value={universeAssets.length} />
            <Metric label="Pairs" value={pairs.length} />
            <Metric label="Avg Alignment" value={formatPercentile(avgAlignment)} />
            <Metric label="Dispersion" value={formatPercentile(avgDistance)} />
          </div>
          <div className="border border-zinc-900 bg-zinc-950 p-4 text-sm leading-7 text-zinc-300">
            <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Quick Guide</div>
            <div className="mt-3 text-zinc-100">This is not price correlation in the classic statistical sense.</div>
            <div className="mt-2">Here correlation means how similar current COT positioning is across assets. Small percentile gaps mean stronger alignment. Large gaps mean a more conflicted macro map.</div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel title={t("panels.crossAssetPositioningMap")} right={<span className="text-xs uppercase tracking-[0.22em] text-zinc-500">live percentile relationships</span>}>
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <div className="border border-zinc-900 bg-[#080808] p-3 text-sm text-zinc-300">
              <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Small gap</div>
              <div className="mt-2">Assets are being positioned in a similar way. Their macro message is closer.</div>
            </div>
            <div className="border border-zinc-900 bg-[#080808] p-3 text-sm text-zinc-300">
              <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Large gap</div>
              <div className="mt-2">Assets are expressing different or opposing positioning conditions.</div>
            </div>
            <div className="border border-zinc-900 bg-[#080808] p-3 text-sm text-zinc-300">
              <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Why it matters</div>
              <div className="mt-2">When several markets confirm each other, trade conviction is easier. When they disagree, be more selective.</div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="border border-zinc-900 bg-zinc-950 p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Narrative Summary</div>
              <div className="mt-3 text-sm leading-7 text-zinc-200">{narrative.summary}</div>
              <div className="mt-3 text-sm text-zinc-500">Same-sector pairs: {sameSectorPairs} · Cross-sector pairs: {crossSectorPairs}</div>
            </div>
            <div className="border border-zinc-900 bg-zinc-950 p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Interpretation</div>
              <div className="mt-3 text-sm leading-7 text-zinc-200">{narrative.interpretation}</div>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-900 text-[11px] uppercase tracking-[0.22em] text-zinc-500">
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
                    <td className="py-3 pr-4 text-zinc-500">{normalizeSector(a.sector)}</td>
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
          <Panel title={quickGuide.title}>
            <div className="space-y-3 text-sm leading-7 text-zinc-300">
              <div>{quickGuide.summary}</div>
              <div className="border border-zinc-900 bg-zinc-950 p-3 text-zinc-400">{quickGuide.takeaway}</div>
            </div>
          </Panel>

          <Panel title={t("panels.regimeHealth")}>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              <div className="border border-zinc-900 bg-[#080808] p-4">
                <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Alignment State</div>
                <div className="mt-2 text-lg text-zinc-100">{dispersionLabel(avgDistance, t)}</div>
                <div className="mt-1 text-sm text-zinc-500">Average gap between assets</div>
              </div>
              <div className="border border-zinc-900 bg-[#080808] p-4">
                <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Cross-Asset Bias</div>
                <div className="mt-2 text-lg text-zinc-100">{crossSectorPairs > sameSectorPairs ? 'Cross-Sector' : 'Same-Sector'}</div>
                <div className="mt-1 text-sm text-zinc-500">Dominant relationship structure</div>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <Panel title={t("panels.pairCharts")} right={<span className="text-xs uppercase tracking-[0.22em] text-zinc-500">visual explanation</span>}>
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-4 md:grid-cols-2">
            {[...alignedPairs.slice(0, 2), ...opposedPairs.slice(0, 2)].map((pair) => (
              <div key={`${pair.key}-chart`} className="border border-zinc-900 bg-zinc-950 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm text-zinc-100">{pair.left.name} ↔ {pair.right.name}</div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-zinc-500">{pair.relationship}</div>
                  </div>
                  <span className={cls('inline-flex items-center border px-2 py-1 text-[10px] uppercase tracking-[0.22em]', sectorBadgeTone(pair.sameSector))}>{pair.sectorLabel}</span>
                </div>
                <div className="mt-4">
                  <PairAlignmentSpark left={pair.leftPct} right={pair.rightPct} />
                </div>
                <div className="mt-3 text-xs uppercase tracking-[0.18em] text-zinc-500">Gap intensity</div>
                <div className="mt-2"><PairDistanceBar distance={pair.distance} /></div>
                <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-zinc-500">
                  <span>{formatPercentile(pair.leftPct)} / {formatPercentile(pair.rightPct)}</span>
                  <span>Gap {formatPercentile(pair.distance)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="border border-zinc-900 bg-[#080808] p-4 text-sm leading-7 text-zinc-300">
              <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">What these charts mean</div>
              <div className="mt-3">{chartExplanation}</div>
            </div>
            <div className="border border-zinc-900 bg-zinc-950 p-4 text-sm leading-7 text-zinc-300">
              <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">How to use them</div>
              <div className="mt-3">Use aligned pairs as confirmation tools. If one asset gives you a directional idea, check whether a related asset is sitting in a similar percentile state. Use opposed pairs as warning signs that the macro message may be split.</div>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title={t("panels.topAlignedPairs")}>
          <div className="space-y-3">
            {alignedPairs.map((pair) => (
              <div key={pair.key} className="border border-zinc-900 bg-[#080808] p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-zinc-100">{pair.left.name} ↔ {pair.right.name}</div>
                  <div className={cls('text-sm', relationshipTone(pair.distance))}>{pair.relationship}</div>
                </div>
                <div className="mt-2"><PairDistanceBar distance={pair.distance} /></div>
                <div className="mt-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-zinc-500">
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
              <div key={pair.key} className="border border-zinc-900 bg-[#080808] p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-zinc-100">{pair.left.name} ↔ {pair.right.name}</div>
                  <div className={cls('text-sm', relationshipTone(pair.distance))}>{pair.relationship}</div>
                </div>
                <div className="mt-2"><PairDistanceBar distance={pair.distance} /></div>
                <div className="mt-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-zinc-500">
                  <span>{formatPercentile(pair.leftPct)} / {formatPercentile(pair.rightPct)}</span>
                  <span>gap {formatPercentile(pair.distance)}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="border border-zinc-900 bg-zinc-950 p-4">
          <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Trading Relevance</div>
          <div className="mt-3 text-sm leading-7 text-zinc-200">{narrative.tradingRelevance}</div>
        </div>
        <div className="border border-zinc-900 bg-zinc-950 p-4">
          <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">What To Watch</div>
          <div className="mt-3 text-sm leading-7 text-zinc-200">{narrative.whatToWatch}</div>
        </div>
      </div>
    </div>
  )
}
function SeasonalityView({ assets, seasonalityData = [] }) {
  const { t } = useTranslation();
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
        <div className="space-y-3 text-sm text-zinc-500">
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
      <Panel title={t("panels.seasonality")} right={<span className="text-amber-400">calendar context</span>}>
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="grid gap-4 md:grid-cols-3">
            <Metric label="Current Month" value={currentMonth} />
            <Metric label="Seasonal Breadth" value={formatPercentile(narrative.breadth)} />
            <Metric label="Supportive Windows" value={`${supportiveCount}/${rows.length || 0}`} />
          </div>
          <div className="border border-zinc-900 bg-zinc-950 p-4 text-sm leading-7 text-zinc-300">
            <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Quick Guide</div>
            <div className="mt-3 text-zinc-100">Seasonality is a calendar tendency.</div>
            <div className="mt-2">It asks a simple question: does this asset usually behave better, worse, or mixed in this month compared with the rest of the year?</div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.85fr]">
        <Panel title={t("panels.seasonalityHeatmap")} right={<span className="text-xs uppercase tracking-[0.22em] text-zinc-500">12 month map</span>}>
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <div className="border border-zinc-900 bg-[#080808] p-3 text-sm text-zinc-300">
              <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">How to read green</div>
              <div className="mt-2">Green means the calendar month has been more supportive for that asset.</div>
            </div>
            <div className="border border-zinc-900 bg-[#080808] p-3 text-sm text-zinc-300">
              <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">How to read red</div>
              <div className="mt-2">Red means that month has historically been less supportive or weaker.</div>
            </div>
            <div className="border border-zinc-900 bg-[#080808] p-3 text-sm text-zinc-300">
              <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Amber outline</div>
              <div className="mt-2">The outlined column marks the current month, so you know where to focus first.</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[1040px]">
              <div className="grid grid-cols-[180px_repeat(12,minmax(0,1fr))] gap-2 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                <div>Asset</div>
                {SEASONAL_MONTHS.map((m) => (
                  <div key={m} className="text-center">{m}</div>
                ))}
              </div>
              <div className="mt-3 space-y-2">
                {rows.slice(0, 18).map((row) => (
                  <div key={row.symbol} className="grid grid-cols-[180px_repeat(12,minmax(0,1fr))] gap-2">
                    <div className="flex items-center border border-zinc-900 bg-zinc-950 px-3 py-2">
                      <div>
                        <div className="text-sm text-zinc-100">{row.asset}</div>
                        <div className="text-xs text-zinc-500">{normalizeSector(row.sector)}</div>
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
         <Panel title={t("panels.currentMonthRanking")} right={<span className="text-xs uppercase tracking-[0.22em] text-zinc-500">{currentMonth}</span>}>
            <div className="space-y-3">
              {topRanked.map((row) => (
                <div key={row.symbol} className="border border-zinc-900 bg-[#080808] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-base text-zinc-100">{row.asset}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">{normalizeSector(row.sector)}</div>
                    </div>
                    <div className={cls('text-sm', seasonalBiasTone(row.current))}>{row.bias}</div>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden bg-zinc-900">
                    <div
                      className={cls('h-full', row.current >= 55 ? 'bg-emerald-400' : row.current <= 45 ? 'bg-rose-400' : 'bg-amber-300')}
                      style={{ width: `${Math.max(6, row.current)}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-zinc-500">Seasonal score</span>
                    <span className="text-zinc-200">{formatPercentile(row.current)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title={simpleGuide.title}>
            <div className="space-y-3 text-sm leading-7 text-zinc-300">
              <div>{simpleGuide.summary}</div>
              <div className="border border-zinc-900 bg-zinc-950 p-3 text-zinc-400">{simpleGuide.takeaway}</div>
            </div>
          </Panel>
        </div>
      </div>

      <Panel title={t("panels.seasonalityCurves")} right={<span className="text-xs uppercase tracking-[0.22em] text-zinc-500">visual explanation</span>}>
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="grid gap-4 md:grid-cols-3">
            {chartRows.map((row) => (
              <div key={`${row.symbol}-spark`} className="border border-zinc-900 bg-zinc-950 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm text-zinc-100">{row.asset}</div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-zinc-500">{row.bias}</div>
                  </div>
                  <div className="text-sm text-zinc-400">{formatPercentile(row.current)}</div>
                </div>
                <div className="mt-4">
                  <MiniSparkline values={row.values} positive={row.current >= 55} />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-zinc-500">
                  <span>Worst {formatPercentile(row.worst)}</span>
                  <span>Best {formatPercentile(row.best)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="border border-zinc-900 bg-[#080808] p-4 text-sm leading-7 text-zinc-300">
              <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">What these charts mean</div>
              <div className="mt-3">{chartExplanation}</div>
            </div>
            <div className="border border-zinc-900 bg-zinc-950 p-4 text-sm leading-7 text-zinc-300">
              <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">How to use them</div>
              <div className="mt-3">First look at the outlined current month in the heatmap. Then check whether the current month score sits near the upper or lower area of the sparkline. If the current month is strong and COT is also supportive, the setup is easier to trust.</div>
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="border border-zinc-900 bg-zinc-950 p-4">
          <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Narrative Summary</div>
          <div className="mt-3 text-sm leading-7 text-zinc-200">{narrative.summary}</div>
        </div>
        <div className="border border-zinc-900 bg-zinc-950 p-4">
          <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Interpretation</div>
          <div className="mt-3 text-sm leading-7 text-zinc-200">{narrative.interpretation}</div>
        </div>
        <div className="border border-zinc-900 bg-zinc-950 p-4">
          <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Trading Relevance</div>
          <div className="mt-3 text-sm leading-7 text-zinc-200">{narrative.tradingRelevance}</div>
        </div>
        <div className="border border-zinc-900 bg-zinc-950 p-4">
          <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">What To Watch</div>
          <div className="mt-3 text-sm leading-7 text-zinc-200">{narrative.whatToWatch}</div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="border border-zinc-900 bg-[#080808] p-4">
          <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Strongest Tailwind</div>
          <div className="mt-2 text-lg text-zinc-100">{strongest?.asset || 'n/a'}</div>
          <div className="mt-1 text-sm text-zinc-500">Current month score: {formatPercentile(strongest?.current)}</div>
        </div>
        <div className="border border-zinc-900 bg-[#080808] p-4">
          <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Weakest Window</div>
          <div className="mt-2 text-lg text-zinc-100">{weakest?.asset || 'n/a'}</div>
          <div className="mt-1 text-sm text-zinc-500">Current month score: {formatPercentile(weakest?.current)}</div>
        </div>
        <div className="border border-zinc-900 bg-[#080808] p-4">
          <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Why this matters</div>
          <div className="mt-2 text-sm leading-7 text-zinc-300">Use seasonality as a background filter. Prefer assets where the calendar bias, COT positioning, and chart structure point in the same direction.</div>
        </div>
      </div>
    </div>
  )
}

function Summary({ assets, setActive, setSelected }) {
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
        <Panel key={sector} title={sector}>
          <div className="overflow-x-auto">
            <table className="min-w-[1200px] w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-zinc-950">
                <tr className="border-b border-zinc-800 text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                  <th rowSpan={2} className="sticky left-0 z-20 bg-zinc-950 px-3 py-3 text-left font-medium">
                    Symbol
                  </th>
                  <th rowSpan={2} className="px-3 py-3 text-right font-medium">
                    OI
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

                <tr className="border-b border-zinc-900 text-[11px] uppercase tracking-[0.2em] text-zinc-500">
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
                        <div className="text-sm font-medium text-zinc-100">{asset.symbol}</div>
                      </td>

                      <td className="px-3 py-2 text-right tabular-nums text-zinc-200">
                        {formatNumber(asset.open_interest)}
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

function Explorer({ assets, selected, setSelected, aiLanguage, seasonalityData = [] }) {
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

  const profile = useMemo(() => {
    if (!asset) return null;

    const pct = Number(asset.funds_percentile_3y);
    const safePct = Number.isNaN(pct) ? 50 : pct;
    const conviction = Math.abs(safePct - 50) * 2;

    const crowding =
      safePct >= 90 || safePct <= 10
        ? "Extreme"
        : safePct >= 75 || safePct <= 25
          ? "Elevated"
          : "Moderate";

    const setupBias =
      safePct >= 65
        ? "Bullish Context"
        : safePct <= 35
          ? "Bearish Context"
          : "Balanced Context";

    const setupSummary =
      safePct >= 65
        ? `${asset.name} is sitting in the upper part of its positioning range, so the current backdrop leans constructive rather than neutral.`
        : safePct <= 35
          ? `${asset.name} is sitting in the lower part of its positioning range, so the current backdrop leans defensive or short-biased.`
          : `${asset.name} is in a middle positioning zone, so the setup is more balanced and needs extra confirmation.`;

    const contextualInterpretation =
      safePct >= 90
        ? "This is a crowded long environment. Momentum can persist, but the setup also becomes more sensitive to reversals or disappointment."
        : safePct >= 65
          ? "Funds are leaning long without being at the most extreme zone. This is often the healthiest area for a trend continuation thesis."
          : safePct <= 10
            ? "This is a crowded short environment. Pressure can continue, but the asset also becomes vulnerable to sharp short-covering moves."
            : safePct <= 35
              ? "Funds are leaning short, which supports a defensive read unless other evidence starts to improve."
              : "Positioning alone is not decisive here. The asset needs price structure, macro context, or cross-asset confirmation to become more actionable.";

    const checklist = [
      { label: "COT regime agrees with bias", pass: safePct >= 65 || safePct <= 35 },
      { label: "Flow state is directional", pass: (asset.flow_state || "Neutral") !== "Neutral" },
      { label: "Not in the most crowded zone", pass: safePct < 90 && safePct > 10 },
      { label: "Cross-asset confirmation needed", pass: safePct >= 65 || safePct <= 35 },
    ];

    const gptCommentary =
      safePct >= 65
        ? `Base case: treat ${asset.symbol} as a constructive asset until positioning weakens. The preferred use case is continuation or pullback logic, not blind breakout chasing.`
        : safePct <= 35
          ? `Base case: treat ${asset.symbol} as a defensive or short-biased asset until positioning improves. The preferred use case is weakness continuation or cautious fade planning around resistance.`
          : `Base case: keep ${asset.symbol} on watch rather than forcing conviction. The current positioning profile is informative, but not strong enough to stand alone.`;

    return {
      pct: safePct,
      conviction,
      crowding,
      setupBias,
      setupSummary,
      contextualInterpretation,
      checklist,
      gptCommentary,
    };
  }, [asset]);

  const sparkProfile = useMemo(() => {
    if (!asset) return []
    const real = seasonalityData.find((s) => s.symbol === asset.symbol)
    if (real && Array.isArray(real.values) && real.values.length === 12) {
      return real.values
    }
    return []   // порожній масив → MiniSparkline покаже порожній блок
  }, [asset, seasonalityData, t])

  if (!asset || !profile) {
    return (
      <Panel title={t("panels.assetExplorer")}>
        <div className="text-sm text-zinc-400">No asset data loaded.</div>
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      <Panel
        title={t("panels.assetExplorer")}
        right={<span className="text-amber-400">deep analysis</span>}
      >
        <div className="space-y-4">
          <ExplorerTabs
            assets={assets}
            selected={selected}
            setSelected={setSelected}
          />

          <div className="flex flex-wrap items-end justify-between gap-4 border-t border-zinc-900 pt-4">
            <div>
              <div className="text-2xl text-zinc-100">{asset.name}</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                {asset.symbol} · {normalizeSector(asset.sector)} · {profile.setupBias}
              </div>
            </div>

            <div className="text-sm text-zinc-400">
              Selected from COT Summary or quick tabs above.
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Metric label="Funds Net" value={formatNumber(asset.funds_net)} />
            <Metric label="Dealer Net" value={formatNumber(asset.dealer_net)} />
            <Metric label="Open Interest" value={formatNumber(asset.open_interest)} />
            <Metric label="Flow State" value={asset.flow_state || "Neutral"} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <Panel title={t("panels.setupBiasGauge")}>
              <div className="space-y-3">
                <GaugeArc value={profile.pct} />
                <div className="text-center text-sm text-zinc-300">
                  {profile.setupBias}
                </div>
                <div className="text-center text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Regime: {regimeLabel(profile.pct, t)} · Signal: {signalLabel(profile.pct, t)}
                </div>
              </div>
            </Panel>

            <Panel title={t("panels.summary")}>
              <div className="space-y-3 text-sm leading-7 text-zinc-300">
                <div>{profile.setupSummary}</div>
                <div className="border border-zinc-900 bg-zinc-950 p-3 text-zinc-400">
                  Conviction score: {formatPercentile(profile.conviction)} · Crowding: {profile.crowding}
                </div>
              </div>
            </Panel>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Panel title={t("panels.contextualInterpretation")}>
              <div className="text-sm leading-7 text-zinc-300">
                {profile.contextualInterpretation}
              </div>
            </Panel>

            <Panel title={t("panels.gptCommentaryLayer")}>
              <div className="text-sm leading-7 text-zinc-300">
                {profile.gptCommentary}
              </div>
            </Panel>
          </div>

          <Panel
            title={t("panels.assetCharts")}
            right={
              <span className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                visual context
              </span>
            }
          >
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="border border-zinc-900 bg-zinc-950 p-4">
                <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                  Positioning Bias
                </div>
                <div className="mt-3">
                  <BiasBar value={profile.pct} />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-zinc-500">
                  <span>Defensive</span>
                  <span>{formatPercentile(profile.pct)}</span>
                  <span>Constructive</span>
                </div>
                <div className="mt-4 text-sm leading-7 text-zinc-300">
                  This bar shows where the asset sits inside its current positioning range. Left side means weaker positioning, right side means stronger positioning.
                </div>
              </div>

              <div className="border border-zinc-900 bg-zinc-950 p-4">
                <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">
                  Seasonal Curve
                </div>
                {sparkProfile.length === 12 ? (
                  <>
                    <div className="mt-3">
                      <MiniSparkline values={sparkProfile} positive={profile.pct >= 55} />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-zinc-500">
                      <span>Jan</span>
                      <span>{SEASONAL_MONTHS[new Date().getMonth()]}</span>
                      <span>Dec</span>
                    </div>
                    <div className="mt-4 text-sm leading-7 text-zinc-300">
                      Based on average monthly COT positioning over the last 5 years.
                      If seasonal direction and COT bias are aligned, the setup becomes easier to trust.
                    </div>
                  </>
                ) : (
                  <div className="mt-3 text-sm text-zinc-600">
                    n/a — seasonal data not yet available for this asset.
                  </div>
                )}
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title={t("panels.confirmationChecklist")}>
            <div className="space-y-3">
              {profile.checklist.map((item, idx) => (
                <div
                  key={`${item.label}-${idx}`}
                  className="flex items-start gap-3 border border-zinc-900 bg-[#080808] p-3"
                >
                  <div
                    className={cls(
                      "mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full",
                      item.pass ? "bg-emerald-400" : "bg-rose-400"
                    )}
                  />
                  <div>
                    <div className="text-sm text-zinc-100">{item.label}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">
                      {item.pass ? "Confirmed" : "Needs work"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title={t("panels.setupStats")}>
            <div className="space-y-3 text-sm text-zinc-300">
              <div className="flex justify-between gap-4">
                <span className="text-zinc-500">Percentile</span>
                <span>{formatPercentile(profile.pct)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-zinc-500">Regime</span>
                <span>{regimeLabel(profile.pct, t)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-zinc-500">Signal</span>
                <span>{signalLabel(profile.pct, t)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-zinc-500">Crowding</span>
                <span>{profile.crowding}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-zinc-500">Conviction</span>
                <span>{formatPercentile(profile.conviction)}</span>
              </div>
            </div>
          </Panel>

          <Panel title={t("panels.sectorPeers")}>
            <div className="space-y-3">
              {sectorPeers.length ? (
                sectorPeers.map((peer) => (
                  <button
                    key={peer.symbol}
                    onClick={() => setSelected(peer.symbol)}
                    className="w-full border border-zinc-900 bg-[#080808] p-3 text-left hover:border-zinc-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-zinc-100">{peer.name}</div>
                      <div className={cls("text-sm", flowColor(peer.funds_percentile_3y))}>
                        {formatPercentile(peer.funds_percentile_3y)}
                      </div>
                    </div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                      {signalLabel(peer.funds_percentile_3y, t)}
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-sm text-zinc-500">No peer assets available.</div>
              )}
            </div>
          </Panel>

          <AIAnalysisPanel
            type="asset"
            data={asset}
            aiLanguage={aiLanguage}
            title={aiLanguage === "uk" ? "AI-Аналіз активу" : "AI Asset Analysis"}
          />
        </div>
      </div>
    </div>
  );
}

function SignalsView({ assets, setActive, setSelected, aiLanguage, seasonalityData = [] }) {

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
      <Panel
        title="Signals Engine"
        right={<span className="text-xs uppercase tracking-[0.22em] text-amber-400">ranked live signals</span>}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Metric label="Tracked Signals" value={engine.counts.total} />
          <Metric label="Active" value={engine.counts.active} />
          <Metric label="Aging" value={engine.counts.aging} />
          <Metric label="Invalidated" value={engine.counts.invalidated} />
          <Metric label="Alert Feed" value={engine.counts.alerts} />
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="border border-zinc-900 bg-zinc-950 p-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">How it works</div>
            <div className="mt-3 text-sm leading-7 text-zinc-300">
              Signals are ranked by entry quality, freshness, directional strength, and macro-context alignment.
              States are designed to behave like an alert engine rather than a static scanner.
            </div>
            <div className="mt-3 border border-zinc-900 bg-[#080808] p-3 text-sm text-zinc-400">
              Active signals are actionable now, aging signals need caution, stale signals have lost timing edge,
              and invalidated signals no longer meet minimum quality conditions.
            </div>
          </div>

          <div className="border border-zinc-900 bg-zinc-950 p-4">
            <div className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Top Ranked Signal</div>
            {topSignal ? (
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg text-zinc-100">{topSignal.asset}</div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                      {topSignal.symbol} · {topSignal.sector}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelected(topSignal.symbol)
                      setActive('explorer')
                    }}
                    className="border border-zinc-800 px-3 py-2 text-[11px] uppercase tracking-[0.22em] text-zinc-300 transition hover:border-zinc-700 hover:text-zinc-100"
                  >
                    Open Asset
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="border border-zinc-900 bg-[#080808] p-3">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Priority</div>
                    <div className="mt-2 text-xl text-zinc-100">{formatPercentile(topSignal.priorityScore)}</div>
                  </div>
                  <div className="border border-zinc-900 bg-[#080808] p-3">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Entry Quality</div>
                    <div className="mt-2 text-xl text-zinc-100">{topSignal.conviction}</div>
                  </div>
                  <div className="border border-zinc-900 bg-[#080808] p-3">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">State</div>
                    <div className="mt-2 text-xl text-zinc-100">{stateLabel(topSignal.state)}</div>
                  </div>
                </div>

                <div className="text-sm leading-7 text-zinc-300">
                  {topSignal.asset} currently ranks first because its directional positioning, inferred freshness,
                  and contextual filters are stronger than the rest of the live universe.
                </div>
              </div>
            ) : (
              <div className="mt-3 text-sm text-zinc-400">No signals match the current filter set.</div>
            )}
          </div>
        </div>
      </Panel>

      <Panel
        title="Filters"
        right={<span className="text-xs uppercase tracking-[0.22em] text-zinc-500">control the queue</span>}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div>
            <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-zinc-500">State</div>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full border border-zinc-900 bg-[#080808] px-3 py-2 text-sm text-zinc-200 outline-none"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="aging">Aging</option>
              <option value="candidate">Candidate</option>
              <option value="stale">Stale</option>
              <option value="invalidated">Invalidated</option>
            </select>
          </div>

          <div>
            <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-zinc-500">Direction</div>
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value)}
              className="w-full border border-zinc-900 bg-[#080808] px-3 py-2 text-sm text-zinc-200 outline-none"
            >
              <option value="all">All</option>
              <option value="long">Long</option>
              <option value="short">Short</option>
              <option value="neutral">Neutral</option>
            </select>
          </div>

          <div>
            <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-zinc-500">Sector</div>
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="w-full border border-zinc-900 bg-[#080808] px-3 py-2 text-sm text-zinc-200 outline-none"
            >
              {sectors.map((sector) => (
                <option key={sector} value={sector}>
                  {sector === 'all' ? 'All' : sector}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-zinc-500">Minimum Score</div>
            <select
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-full border border-zinc-900 bg-[#080808] px-3 py-2 text-sm text-zinc-200 outline-none"
            >
              <option value={0}>0+</option>
              <option value={40}>40+</option>
              <option value={55}>55+</option>
              <option value={70}>70+</option>
              <option value={85}>85+</option>
            </select>
          </div>

          <div>
            <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-zinc-500">Sort By</div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full border border-zinc-900 bg-[#080808] px-3 py-2 text-sm text-zinc-200 outline-none"
            >
              <option value="priority">Priority</option>
              <option value="quality">Entry Quality</option>
              <option value="freshness">Freshness</option>
              <option value="age">Age</option>
            </select>
          </div>

          <div>
            <div className="mb-2 text-[11px] uppercase tracking-[0.22em] text-zinc-500">Alerts Only</div>
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
          right={<span className="text-xs uppercase tracking-[0.22em] text-zinc-500">{filteredSignals.length} visible</span>}
        >
          <div className="space-y-3">
            {filteredSignals.length ? filteredSignals.map((signal) => (
              <button
                key={signal.id}
                onClick={() => {
                  setSelected(signal.symbol)
                  setActive('explorer')
                }}
                className="w-full border border-zinc-900 bg-[#080808] p-4 text-left transition hover:border-zinc-700"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm text-zinc-100">{signal.asset}</div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-zinc-500">
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
                    <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Priority</div>
                    <div className="mt-1 text-sm text-zinc-100">{formatPercentile(signal.priorityScore)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Entry</div>
                    <div className="mt-1 text-sm text-zinc-100">{signal.conviction}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Freshness</div>
                    <div className="mt-1 text-sm text-zinc-100">{formatPercentile(signal.freshnessScore)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Age</div>
                    <div className="mt-1 text-sm text-zinc-100">{signal.ageWeeks}w</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">Regime</div>
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
                <div key={alert.id} className="border border-zinc-900 bg-[#080808] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm text-zinc-100">{alert.title}</div>
                      <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-zinc-500">
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
            right={<span className="text-xs uppercase tracking-[0.22em] text-zinc-500">reading signals</span>}
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
            right={<span className="text-xs uppercase tracking-[0.22em] text-zinc-500">phase one</span>}
          >
            <div className="space-y-3 text-sm leading-7 text-zinc-300">
              <div>This phase computes signal lifecycle directly from live positioning context without persistent backend history.</div>
              <div>Signal age is inferred from current percentile extremity rather than stored event timestamps.</div>
              <div className="border border-zinc-900 bg-zinc-950 p-3 text-zinc-400">
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
    </div>
  )
}


function UpdateDataView({ updateState, updateBusy, onRun }) {
  const { t } = useTranslation();
  const isRunning = updateState?.status === 'running'
  const statusTone = updateState?.status === 'success' ? 'text-emerald-400' : updateState?.status === 'error' ? 'text-rose-400' : updateState?.status === 'running' ? 'text-amber-400' : 'text-zinc-400'
  return (<div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]"><div className="space-y-4"><Panel title={t("panels.updateControl")}><div className="space-y-4"><div className="text-sm leading-7 text-zinc-300">Run the Python worker manually from the UI. This will download current CFTC data, compute metrics and upsert records into <span className="text-zinc-100">cot_analytics</span>.</div><div className="flex items-center gap-3"><button onClick={onRun} disabled={updateBusy || isRunning} className={cls('border px-4 py-3 text-sm uppercase tracking-[0.22em]', updateBusy || isRunning ? 'cursor-not-allowed border-zinc-800 text-zinc-600' : 'border-amber-400 text-amber-300 hover:bg-amber-400/10')}>{isRunning ? 'Worker Running...' : 'Run Worker'}</button><div className={cls('text-sm uppercase tracking-[0.2em]', statusTone)}>{updateState?.status || 'idle'}</div></div></div></Panel><Panel title="Worker Log"><pre className="max-h-[420px] overflow-auto whitespace-pre-wrap text-sm leading-6 text-zinc-300">{updateState?.log || 'No log output yet.'}</pre></Panel></div><div className="space-y-4"><Panel title="Run Status"><div className="space-y-3 text-sm text-zinc-300"><div className="flex justify-between gap-4"><span className="text-zinc-500">Status</span><span className={statusTone}>{updateState?.status || 'idle'}</span></div><div className="flex justify-between gap-4"><span className="text-zinc-500">Started</span><span>{updateState?.started_at || '—'}</span></div><div className="flex justify-between gap-4"><span className="text-zinc-500">Finished</span><span>{updateState?.finished_at || '—'}</span></div><div className="flex justify-between gap-4"><span className="text-zinc-500">Return Code</span><span>{updateState?.return_code ?? '—'}</span></div></div></Panel><Panel title="Errors"><div className="text-sm leading-7 text-zinc-300">{updateState?.error || 'No errors reported.'}</div></Panel></div></div>)
}

function Placeholder({ title }) { return (<Panel title={title}><div className="text-sm text-zinc-400">This tab is scaffolded. Live data is already connected for core COT views.</div></Panel>) }

function SettingsView({
  uiLanguage,
  aiLanguage,
  syncAiWithUi,
  onChangeUiLanguage,
  onChangeAiLanguage,
  onToggleSyncAiWithUi,
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

        <div>{t("settings.security.line1")}</div>
        <div>{t("settings.security.line2")}</div>

        <div className="border border-zinc-900 bg-zinc-950 p-3 text-zinc-400">
          {t("settings.security.next")}
        </div>
      </div>
    </Panel>
  );
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

    const [statusRes, heatmapRes, assetsRes, signalsRes, workspaceRes, seasonalityRes] = await Promise.all([
      fetch('/api/system/status'),
      fetch('/api/heatmap'),
      fetch('/api/assets'),
      fetch('/api/signals'),
      fetch('/api/workspace'),
      fetch('/api/seasonality'),
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
 
    setStatus(statusJson)
    setHeatmap(heatmapJson.sectors || {})
    setAssets(assetsJson.items || [])
    setSignals(signalsJson.items || [])
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
  useEffect(() => { fetchUpdateStatus(); const timer = setInterval(fetchUpdateStatus, 3000); return () => clearInterval(timer) }, [])
  useEffect(() => {
  let ignore = false;

  async function loadMacroFeeds() {
    try {
      setMacroFeedLoading(true);

      const [calendarRes, newsRes] = await Promise.all([
	   fetch("http://localhost:8001/api/economic-calendar"),
	   fetch("http://localhost:8001/api/market-news"),
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
    workspace: <Workspace heatmap={heatmap} workspaceData={workspaceData} setActive={setActive} setSelected={setSelected} />, 
    macro: <MacroView assets={assets} aiLanguage={appSettings.aiLanguage} />, 
	summary: <Summary assets={assets} setActive={setActive} setSelected={setSelected} />, 
	explorer: <Explorer assets={assets} selected={selected} setSelected={setSelected} aiLanguage={appSettings.aiLanguage} seasonalityData={seasonalityData} />,
	correlation: <CorrelationView assets={assets} />, seasonality: <SeasonalityView assets={assets} seasonalityData={seasonalityData} />, 
	signals: <SignalsView signals={signals} assets={assets} setActive={setActive} setSelected={setSelected} aiLanguage={appSettings.aiLanguage} seasonalityData={seasonalityData} />, 
	update: <UpdateDataView updateState={updateState} updateBusy={updateBusy} onRun={runUpdate} />, 
	settings: (
  <SettingsView
    uiLanguage={uiLanguage}
    aiLanguage={appSettings.aiLanguage}
    syncAiWithUi={appSettings.syncAiWithUi}
    onChangeUiLanguage={handleUiLanguageChange}
    onChangeAiLanguage={handleAiLanguageChange}
    onToggleSyncAiWithUi={handleSyncAiWithUiChange}
  />
), }[active]

  return (
    <div className="flex min-h-screen bg-[#050505] text-zinc-200">
      <Sidebar active={active} setActive={setActive} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
      <main className="flex min-h-screen flex-1 flex-col">
        <TopBar active={active} status={status} />
        <div className="flex-1 p-4 md:p-6">
          {loading ? <Panel title="Loading"><div className="text-sm text-zinc-400">Loading live dashboard data...</div></Panel> : error ? <Panel title={t("panels.errors")}><div className="text-sm text-rose-400">{error}</div></Panel> : view}
        </div>
      </main>
    </div>
  )
}
