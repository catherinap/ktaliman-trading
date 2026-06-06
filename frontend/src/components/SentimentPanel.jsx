import React, { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"

// ── Fear & Greed semicircle gauge ──
function FearGreedGauge({ score, labelKey }) {
  const { t } = useTranslation()
  // score 0-100 → angle -90° (left) to +90° (right)
  const angle = (score / 100) * 180 - 90
  const cx = 130, cy = 130, r = 100

  // color zones along the arc
  const zones = [
    { from: 0,   to: 25,  color: "#f87171" },  // extreme fear
    { from: 25,  to: 40,  color: "#fb923c" },  // fear
    { from: 40,  to: 60,  color: "#facc15" },  // neutral
    { from: 60,  to: 75,  color: "#a3e635" },  // greed
    { from: 75,  to: 100, color: "#4ade80" },  // extreme greed
  ]

  const polar = (pct) => {
    const a = (pct / 100) * 180 - 180   // 0%→180°(left), 100%→0°(right)
    const rad = (a * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  const arcPath = (from, to) => {
    const s = polar(from), e = polar(to)
    const large = (to - from) > 50 ? 1 : 0
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`
  }

  // needle
  const needleRad = (angle - 90) * Math.PI / 180
  const nx = cx + (r - 18) * Math.cos(needleRad)
  const ny = cy + (r - 18) * Math.sin(needleRad)

  const labelText = {
    extreme_fear:  t("ui.fgExtremeFear"),
    fear:          t("ui.fgFear"),
    neutral:       t("ui.fgNeutral"),
    greed:         t("ui.fgGreed"),
    extreme_greed: t("ui.fgExtremeGreed"),
  }[labelKey] || ""

  const labelColor = {
    extreme_fear: "#f87171", fear: "#fb923c", neutral: "#facc15",
    greed: "#a3e635", extreme_greed: "#4ade80",
  }[labelKey] || "#e4e4e7"

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg viewBox="0 0 260 165" style={{ width: "100%", maxWidth: 280 }}>
        {zones.map((z, i) => (
            <path key={i} d={arcPath(z.from, z.to)} fill="none"
            stroke={z.color} strokeWidth="14" strokeLinecap="round" opacity="0.85" />
        ))}
        {/* needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny}
          stroke="#e4e4e7" strokeWidth="3" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="6" fill="#e4e4e7" />
        {/* score text */}
        <text x={cx} y={cy - 28} textAnchor="middle"
          style={{ fontSize: 30, fontWeight: 700, fill: labelColor }}>
          {score.toFixed(0)}
        </text>
      </svg>
      <div style={{
        fontSize: 13, fontWeight: 600, color: labelColor,
        textTransform: "uppercase", letterSpacing: "0.18em", marginTop: 4,
      }}>
        {labelText}
      </div>
    </div>
  )
}

// ── Velocity ↔ Stagnation balance bar ──
function VelocityStagnationBar({ velocity, stagnation }) {
  const { t } = useTranslation()
  // Position on the scale: velocity pulls right, stagnation pulls left.
  // Net position 0-100 where 100 = pure velocity, 0 = pure stagnation.
  const total = velocity + stagnation
  const pos = total > 0 ? (velocity / total) * 100 : 50

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.18em", color: "#94a3b8" }}>
          {t("ui.stagnation")} {stagnation.toFixed(0)}
        </span>
        <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.18em", color: "#60a5fa" }}>
          {t("ui.velocity")} {velocity.toFixed(0)}
        </span>
      </div>
      <div style={{
        position: "relative", height: 15, borderRadius: 5,
        background: "linear-gradient(90deg, #475569 0%, #1e293b 50%, #1e40af 100%)",
        border: "1px solid var(--accent-color)",
      }}>
        <div style={{
          position: "absolute", top: "50%", left: `${pos}%`,
          transform: "translate(-50%, -50%)",
          width: 15, height: 15, borderRadius: "50%",
          background: "#e4e4e7", border: "2px solid #050507",
          boxShadow: "0 0 8px rgba(96,165,250,0.6)",
        }} />
      </div>
      <div style={{ fontSize: 13, color: "#c1d2eb", marginTop: 10, lineHeight: 1.6 }}>
        {pos >= 60
          ? t("ui.velocityHighNote")
          : pos <= 40
          ? t("ui.stagnationHighNote")
          : t("ui.velocityBalancedNote")}
      </div>
    </div>
  )
}

export default function SentimentPanel() {
  const { t } = useTranslation()
  const uk = t("__lang__") === "uk"
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = React.useCallback(() => {
    setLoading(true)
    fetch("/api/sentiment")
      .then((r) => (r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`)))
      .then((j) => { if (j.ok) setData(j); else setError(j.message || "no data") })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  if (loading && !data) {
    return (
      <section className="default-bg title-border">
        <div className="px-4 py-3">
          <span className="text-[11px] uppercase tracking-[0.25em] text-slate-200">
            {t("ui.marketSentiment")}
          </span>
        </div>
        <div className="p-4 space-y-2">
          {[100, 70, 50].map((w, i) => (
            <div key={i} className="h-3 animate-pulse rounded bg-zinc-800" style={{ width: `${w}%` }} />
          ))}
        </div>
      </section>
    )
  }

  if (error || !data) {
    return (
      <section className="default-bg title-border">
        <div className="px-4 py-3">
          <span className="text-[11px] uppercase tracking-[0.25em] text-slate-200">
            {t("ui.marketSentiment")}
          </span>
        </div>
        <div className="px-4 py-4 text-sm text-zinc-600">
          {t("ui.noDataAvailable")}
        </div>
      </section>
    )
  }

  const fg = data.fear_greed
  const vel = data.velocity.score
  const stag = data.stagnation.score

  return (
    <section className="default-bg title-border">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full rounded-full-dot bg-sky-400" />
          <span className="text-[11px] uppercase tracking-[0.25em] text-slate-200">
            {t("ui.marketSentiment")}
          </span>
        </div>
        <button onClick={load}
          className="border border-zinc-800 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-200 hover:border-zinc-700 transition">
          {uk ? "Оновити" : "Refresh"}
        </button>
      </div>

      <div className="p-4 grid gap-6 md:grid-cols-2">
        {/* Fear & Greed */}
        <div className="small-panel-color p-4">
          <div className="text-[12px] uppercase tracking-[0.2em] text-slate-300 mb-1 text-center">
            {t("ui.fearGreed")}
          </div>
          <FearGreedGauge score={fg.score} labelKey={fg.label_key} />
          <div className="mt-2 text-[11px] text-zinc-400 leading-5">
            {uk
              ? `VIX ${fg.vix_value ?? "—"} · середня перцентиль ${fg.avg_percentile} · дисперсія ${fg.dispersion}`
              : `VIX ${fg.vix_value ?? "—"} · avg percentile ${fg.avg_percentile} · dispersion ${fg.dispersion}`}
          </div>
        </div>

        {/* Velocity ↔ Stagnation */}
        <div className="small-panel-color p-4 flex flex-col">
          <div className="text-[12px] uppercase tracking-[0.2em] text-slate-300 mb-1 text-center">
            {t("ui.velocityStagnation")}
          </div>
          <div className="flex-1 flex items-center">
            <VelocityStagnationBar velocity={vel} stagnation={stag} />
          </div>
          <div className="mt-1 text-[11px] text-zinc-400 leading-5">
            {uk
              ? `${data.stagnation.stagnant_count} з ${data.stagnation.total} активів застигли · ${data.velocity.accelerating_share}% прискорюються`
              : `${data.stagnation.stagnant_count} of ${data.stagnation.total} assets frozen · ${data.velocity.accelerating_share}% accelerating`}
          </div>
        </div>
      </div>
    </section>
  )
}