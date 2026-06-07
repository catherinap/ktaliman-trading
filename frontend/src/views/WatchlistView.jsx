import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import CustomSelect from "../components/CustomSelect";
import { cls, flowColor, normalizeSector, translateFlowState } from "../App";

export default function WatchlistView({ assets, setActive, setSelected, aiLanguage = "en", watchlist, setWatchlist }) {
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
