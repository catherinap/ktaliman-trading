import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import AIAnalysisPanel from "../components/AIAnalysisPanel";
import CustomSelect from "../components/CustomSelect";
import GuideButton from "../components/GuideButton";
import {
  Panel, Metric, cls, flowColor, formatPercentile, normalizeSector, findAssetsExact,
  translateFlowState, signalLabel, stateLabel, stateTone, directionLabel, directionTone,
  inferSignalAgeWeeks, averagePercentile, buildSignalEngine, MACRO_SLEEVES,
} from "../App";

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

export default function SignalsView({ assets, setActive, setSelected, aiLanguage, openGuide,seasonalityData = [] }) {
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

          <div className="mt-4 grid gap-3 md:grid-cols-5 signal-metric-grid">
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

          <div className="mt-4 grid gap-2 md:grid-cols-4 text-xs signal-tag-grid">
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
