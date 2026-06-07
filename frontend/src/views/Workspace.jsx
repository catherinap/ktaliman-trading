import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import AIAnalysisPanel from "../components/AIAnalysisPanel";
import CustomSelect from "../components/CustomSelect";
import GuideButton from "../components/GuideButton";
import {
  cls, formatPercentile, findAssetsExact, translateFlowState,
  averagePercentile, buildSignalEngine, MACRO_SLEEVES, MacroContextPanel,
  macroLabel, macroTone, macroVerdict,
  formatEventDateTime, actualColor, categoryTone, alertImpactTone,
} from "../App";

export default function Workspace({workspaceData, setActive, setSelected, assets = [], aiLanguage = "en", openGuide, timezone = "Europe/Copenhagen" }) {
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
