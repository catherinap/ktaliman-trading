import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import CustomSelect from "../components/CustomSelect";
import { cls, normalizeSector, MomentumBadge } from "../App";

export default function HistoricalDataView({ assets }) {
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
        <div className="flex flex-wrap gap-4 px-4 py-2.5 text-[10px] uppercase tracking-[0.16em] text-zinc-400">
          <span><span className="inline-block w-2.5 h-2.5 mr-1 bg-rose-700" />{t('ui.indexExtremeLong')}</span>
          <span><span className="inline-block w-2.5 h-2.5 mr-1 bg-emerald-700" />{t('ui.indexExtremeShort')}</span>
          <span><span className="inline-block w-2.5 h-2.5 mr-1 bg-amber-700" />{t('ui.sharpNetChange')}</span>
          <span><span className="inline-block w-2.5 h-2.5 mr-1 bg-violet-700" />{t('ui.netFlip')}</span>
          <span><span className="inline-block w-2.5 h-2.5 mr-1 bg-sky-700" />{t('ui.oiSpike')}</span>
          <span className="text-sky-600">{t('ui.rowTintDivergence')}</span>
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
