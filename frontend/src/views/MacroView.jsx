import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import AIAnalysisPanel from "../components/AIAnalysisPanel";
import GuideButton from "../components/GuideButton";
import SentimentPanel from "../components/SentimentPanel";
import {
  Panel, cls, flowColor, formatPercentile, findAssetsExact, translateFlowState,
  averagePercentile, MACRO_SLEEVES, MacroContextPanel,
  buildMacroNarrative, macroDispersionLabel, macroLabel, macroPhase, macroTone, macroVerdict,
} from "../App";

export default function MacroView({ assets, aiLanguage, openGuide }) {
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

