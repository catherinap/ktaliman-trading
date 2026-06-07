import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import AIAnalysisPanel from "../components/AIAnalysisPanel";
import GuideButton from "../components/GuideButton";
import { Panel, cls, normalizeSector, formatPercentile, translateFlowState, SEASONAL_MONTHS, seasonalCellTone, seasonalBiasTone, buildSeasonalityNarrative, MiniSparkline } from "../App";

export default function SeasonalityView({ assets, openGuide, seasonalityData = [], aiLanguage = "en", uiLanguage = "en" }) {
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
