import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import GuideButton from "../components/GuideButton";
import { Panel, cls, flowColor, formatNumber, formatPercentile, normalizeSector, MomentumBadge } from "../App";

export default function Summary({ assets, setActive, setSelected, openGuide }) {
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
        <Panel key={sector} title={sector} right={<div className="flex justify-end">
      <GuideButton sectionKey="cot" openGuide={openGuide} />
    </div>}>  
          <div className="overflow-x-auto">
            <table className="min-w-[1200px] w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-zinc-950">
                <tr className="border-b border-zinc-800 text-[11px] uppercase tracking-[0.22em] text-blue-50">
                  <th rowSpan={2} className="sticky left-0 z-20 bg-zinc-950 px-3 py-3 text-left font-medium">
                    {t('ui.symbol')}
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
                      <th className="px-3 py-2 text-right">{t('ui.long')}</th>
                      <th className="px-3 py-2 text-right">{t('ui.short')}</th>
                      <th className="px-3 py-2 text-right">{t('ui.net')}</th>
                      <th className="px-3 py-2 text-right">{t('ui.index')}</th>
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
