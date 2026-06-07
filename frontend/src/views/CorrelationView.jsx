import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import AIAnalysisPanel from "../components/AIAnalysisPanel";
import GuideButton from "../components/GuideButton";
import { Panel, Metric, formatPercentile, findAssetsExact, CORRELATION_UNIVERSE, buildPositioningPairs, buildCorrelationNarrative } from "../App";

export default function CorrelationView({ assets, openGuide, aiLanguage = "en" }) {
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
