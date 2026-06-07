import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Download } from "lucide-react";
import AIAnalysisPanel from "../components/AIAnalysisPanel";
import GuideButton from "../components/GuideButton";
import {
  Panel, Metric, cls, flowColor, formatNumber, formatPercentile, normalizeSector,
  translateFlowState, regimeLabel, signalLabel, SEASONAL_MONTHS,
  MiniSparkline, MomentumBadge, BiasBar, GaugeArc, AssetPDFReport,
} from "../App";

function renderNarrative(text) {
  if (!text) return null
  return text.split('\n').map((line, i) => {
    if (!line.trim()) return <div key={i} className="h-2" />
    const match = line.match(/^\*\*(.+?):\*\*\s*(.*)/)
    if (match) {
      return (
        <div key={i} className="mb-3">
          <div style={{ fontSize: '10px', letterSpacing: '0.2em', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>
            {match[1]}
          </div>
          {match[2] && (
            <div className="text-sm leading-6 text-zinc-300">{match[2]}</div>
          )}
        </div>
      )
    }
    const parts = line.split(/(\*\*[^*]+\*\*)/g)
    const hasBold = parts.some(p => p.startsWith('**') && p.endsWith('**'))
    if (hasBold) {
      return (
        <div key={i} className="text-sm leading-6 text-zinc-300 mb-1">
          {parts.map((part, j) =>
            part.startsWith('**') && part.endsWith('**')
              ? <strong key={j} style={{ color: '#e2e8f0', fontWeight: 600 }}>{part.slice(2, -2)}</strong>
              : <span key={j}>{part}</span>
          )}
        </div>
      )
    }
    return <div key={i} className="text-sm leading-6 text-zinc-300 mb-1">{line}</div>
  })
}

export default function Explorer({ assets, selected, setSelected, aiLanguage, openGuide, seasonalityData = [] }) {
  const { t } = useTranslation();
  // Порядок активів у панелі вибору: спочатку валюти, потім крипто, потім індекси, далі решта
  const orderedAssets = useMemo(() => {
    const ORDER = { Currencies: 0, Crypto: 1, Indices: 2 }
    const rank = (a) => {
      if (a.symbol === 'EUR') return -1   // EUR завжди найперший
      return ORDER[normalizeSector(a.sector)] ?? 99
    }
    return [...assets].sort((a, b) => rank(a) - rank(b))
  }, [assets])
  const tAccel = (a) =>
    a === 'accelerating' ? t('ui.accelerating') :
    a === 'decelerating' ? t('ui.decelerating') :
    a === 'stable' ? t('ui.stable') : a
  const tCrowding = (c) =>
    c === 'Extreme' ? t('ui.crowdingExtreme') :
    c === 'Elevated' ? t('ui.crowdingElevated') :
        c === 'Moderate' ? t('ui.crowdingModerate') : c
  const tBias = (b) =>
  b === 'Long Extreme'    ? t('ui.biasLongExtreme') :
  b === 'Bullish Context' ? t('ui.biasBullishContext') :
  b === 'Short Extreme'   ? t('ui.biasShortExtreme') :
  b === 'Bearish Context' ? t('ui.biasBearishContext') :
  b === 'Balanced'        ? t('ui.biasBalanced') : b

  const asset = assets.find((a) => a.symbol === selected)
    || assets.find((a) => a.symbol === 'EUR')
    || assets[0];

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

  // ── Asset narrative engine ────────────────────────────────────────────────
  const profile = useMemo(() => {
    if (!asset) return null;

    const pct   = Number(asset.funds_percentile_3y);
    const safe  = Number.isNaN(pct) ? 50 : pct;
    const wow   = asset.funds_index_wow_change;
    const dir   = asset.funds_index_direction;
    const mom   = asset.funds_index_momentum;
    const accel = asset.funds_index_acceleration;
    const avg3w = asset.funds_index_3w_avg;
    const avg8w = asset.funds_index_8w_avg;
    const flow  = asset.flow_state || "Neutral";
    const name  = asset.name;
    const sym = asset.symbol;
    const sector = asset?.sector || '';

    const conviction = Math.abs(safe - 50) * 2;

    const crowding =
      safe >= 90 || safe <= 10 ? "Extreme" :
      safe >= 75 || safe <= 25 ? "Elevated" : "Moderate";

    const uk = t && t('__lang__') === 'uk'
    // How confident is the contrarian signal for each sector (high / medium / low)
    // High = speculators tend to be WRONG at extremes here → fade them
    // Low  = speculators tend to be RIGHT → follow them
    const contrarianConfidence = (() => {
        if (['IDX'].includes(sector))                          return 'high'
        if (['FX'].includes(sector))                           return 'high'
        if (['METALS'].includes(sector) && ['XAU','XAG'].includes(sym)) return 'medium'
        if (['METALS'].includes(sector))                       return 'low'
        if (['COMMODITIES','GRAINS','SFT','SOFTS'].includes(sector))    return 'low'
        if (['CRYPTO'].includes(sector))                       return 'low'
        return 'low'
    })()
 
    const contrarianRead = (() => {
      if (contrarianConfidence === 'low') return null
      const C = {
        bull: '#4ade80', bear: '#f87171', watch: '#fbbf24',
        highConf:   uk ? 'Висока впевненість'  : 'High Confidence',
        medConf:    uk ? 'Середня впевненість' : 'Medium Confidence',
        sigBull:    uk ? 'КОНТРАРІАНСЬКИЙ БИЧАЧИЙ'  : 'CONTRARIAN BULLISH',
        sigBear:    uk ? 'КОНТРАРІАНСЬКИЙ ВЕДМЕЖИЙ' : 'CONTRARIAN BEARISH',
        sigWatch:   uk ? 'КОНТРАРІАНСЬКА УВАГА'      : 'CONTRARIAN WATCH',
      }
 
      // ── EQUITY INDICES ──
      if (sector === 'IDX') {
        if (safe <= 15) return {
          signal: C.sigBull, color: C.bull, confidence: C.highConf,
          label: uk ? 'Капітуляція — можливе дно' : 'Capitulation — possible bottom',
          simple: uk
            ? `Майже всі вже в шорті. Коли ринок настільки переповнений шортами, продавати майже нікому. Одна хороша новина — і всі ці шорти кинуться покривати одночасно, різко штовхаючи ціну вгору. Це не сигнал на купівлю, але це сигнал "припинити додавати шорти".`
            : `Almost everyone is already short. When a market is this crowded on the short side, there is almost nobody left to sell. One piece of good news and all those shorts need to cover at once, pushing prices up sharply. This is not a buy signal, but it IS a "stop adding shorts" signal.`,
          action: uk
            ? `Що робити: Якщо ви в шорті — зафіксуйте частину прибутку і підтягніть стоп. Якщо думали шортити — зачекайте. Ризик потрапити в сквіз високий.`
            : `What to do: If you are short, consider taking some profit and tightening your stop. If you were thinking of going short, wait. The risk of being caught in a squeeze is high here.`,
        }
        if (safe <= 35) return {
          signal: C.sigWatch, color: C.watch, confidence: C.medConf,
          label: uk ? 'Зона накопичення' : 'Accumulation zone',
          simple: uk
            ? `Фонди сильно в шорті по цьому індексу. "Легкий шорт" вже переповнений — багато хто його тримає. Контраріанська логіка каже: обережно з додаванням шортів, бо багато хто вийде одночасно, якщо щось піде не так для ведмедів.`
            : `Funds are heavily short on this index. The "easy short" trade is crowded. The contrarian logic says be careful adding more shorts here, because many people will need to exit at the same time if anything goes wrong for the bears.`,
          action: uk
            ? `Що робити: Наявні шорти прийнятні, але підтягніть стопи. Нові шорти тут мають погане співвідношення ризик/прибуток.`
            : `What to do: Existing shorts are fine but tighten stops. New short entries here have poor risk-reward.`,
        }
        if (safe >= 85) return {
          signal: C.sigBear, color: C.bear, confidence: C.highConf,
          label: uk ? 'Ейфорія — можлива вершина' : 'Euphoria — possible top',
          simple: uk
            ? `Майже всі вже в лонгу. Коли ринок настільки переповнений лонгами, потрібно все менше хороших новин щоб триматися — і будь-яке розчарування викликає різке падіння, коли всі намагаються вийти одночасно. Це не сигнал на продаж, але сигнал "припинити додавати лонги".`
            : `Almost everyone is already long. When a market is this crowded on the long side, it takes less good news to keep it going, and any disappointment causes a sharp drop as everyone tries to exit at once. This is not a sell signal, but it IS a "stop adding longs" signal.`,
          action: uk
            ? `Що робити: Якщо ви в лонгу — зафіксуйте частину прибутку і підтягніть стоп. Якщо думали купувати — зачекайте.`
            : `What to do: If you are long, take some profit and tighten your stop. If you were thinking of going long, wait.`,
        }
        if (safe >= 65) return {
          signal: C.sigWatch, color: C.watch, confidence: C.medConf,
          label: uk ? 'Зона розподілу' : 'Distribution zone',
          simple: uk
            ? `Фонди сильно в лонгу. Тренд вгору і прямий COT це підтверджує. Але контраріанська лінза каже: легкі гроші вже зроблено — угода стає переповненою. Нові лонги звідси несуть більше ризику.`
            : `Funds are heavily long. The trend is up and direct COT confirms it. But the contrarian lens says the easy money has been made — the trade is getting crowded.`,
          action: uk
            ? `Що робити: Прямий сигнал ще бичачий — але якщо ви вже в лонгу, не час агресивно додавати. Захищайте прибуток.`
            : `What to do: The direct signal is still bullish, but if you are already long, this is not the time to add aggressively. Protect profits.`,
        }
        return null
      }
 
      // ── FX ──
      if (sector === 'FX') {
        if (safe <= 15) return {
          signal: C.sigBull, color: C.bull, confidence: C.highConf,
          label: uk ? 'Екстремальний шорт — ризик сквізу' : 'Extreme short — squeeze risk',
          simple: uk
            ? `Валютні спекулянти відомі тим, що помиляються на екстремумах. Зараз вони екстремально в шорті по цій валюті — ведмежа угода на максимальній потужності. У FX такий рівень односторонності — один з найнадійніших сигналів розвороту в COT-аналізі.`
            : `Currency speculators are famous for getting it wrong at extremes. Right now they are extremely short this currency. In FX, this level of one-sided positioning is one of the most reliable reversal signals in COT analysis.`,
          action: uk
            ? `Що робити: Не додавайте нові шорти. Стежте за будь-яким каталізатором, що може спровокувати шорт-сквіз.`
            : `What to do: Do not add new short positions. Watch for any catalyst that could trigger a short squeeze.`,
        }
        if (safe <= 35) return {
          signal: C.sigWatch, color: C.watch, confidence: C.medConf,
          label: uk ? 'Ведмеже, але переповнюється' : 'Bearish but getting crowded',
          simple: uk
            ? `Спекулянти в шорті по цій валюті. У FX, коли шорт-сторона переповнюється, розвороти бувають швидкі й різкі. Ви ще не на екстремумі, але рухаєтесь туди.`
            : `Speculators are short this currency. In FX markets, when the short side gets crowded, reversals can be fast and sharp. You are not at an extreme yet but moving there.`,
          action: uk
            ? `Що робити: Шорти прийнятні, але керуйте ними активно. Будьте готові швидко вийти, якщо ціна почне відновлюватися.`
            : `What to do: Short positions are valid but manage them actively. Be ready to exit quickly if the price starts to recover.`,
        }
        if (safe >= 85) return {
          signal: C.sigBear, color: C.bear, confidence: C.highConf,
          label: uk ? 'Екстремальний лонг — ризик розвороту' : 'Extreme long — reversal risk',
          simple: uk
            ? `Валютні спекулянти екстремально в лонгу. В історії FX такий рівень односторонньої бичачості позначає одні з найкращих можливостей для розвороту. Усі, хто хотів бути в лонгу, вже там.`
            : `Currency speculators are extremely long. In FX history, this level of one-sided bullish positioning marks some of the best reversal opportunities. Everyone who wants to be long is already long.`,
          action: uk
            ? `Що робити: Не женіться за новими лонгами. Стежте за каталізатором фіксації прибутку. Це зона високого ризику для нових лонгів.`
            : `What to do: Do not chase new long positions. Watch for a catalyst that triggers profit-taking. This is a high-risk zone for new longs.`,
        }
        if (safe >= 65) return {
          signal: C.sigWatch, color: C.watch, confidence: C.medConf,
          label: uk ? 'Бичаче, але переповнюється' : 'Bullish but getting crowded',
          simple: uk
            ? `Спекулянти в лонгу по цій валюті. Тренд з вами — але FX-натовп схильний засиджуватися. Ви ще не на небезпечному екстремумі, але моментум-лонги починають накопичуватися.`
            : `Speculators are long this currency. The trend is with you, but FX crowds tend to overstay their welcome. You are not at a dangerous extreme yet.`,
          action: uk
            ? `Що робити: Лонги прийнятні. Стежте за ознаками виснаження — якщо ціна перестає реагувати на хороші новини, це попередження.`
            : `What to do: Long positions are valid. Watch for signs of exhaustion — if the price stops responding to good news, that is a warning.`,
        }
        return null
      }
 
      // ── PRECIOUS METALS ──
      if (sector === 'METALS' && ['XAU', 'XAG'].includes(sym)) {
        if (safe <= 15) return {
          signal: C.sigWatch, color: C.watch, confidence: C.medConf,
          label: uk ? 'Фонди незвично в шорті по золоту/сріблу' : 'Funds unusually short on Gold/Silver',
          simple: uk
            ? `Фонди рідко бувають настільки в шорті по золоту і сріблу. Коли так стається, зазвичай це означає, що ринок побитий і страх високий. Історично екстремальні шорт-позиції фондів у дорогоцінних металах передували значним відновленням.`
            : `Gold and Silver funds are rarely this short. When they are, it usually means the market has been beaten up and fear is high. Historically, extreme fund short positions in precious metals have preceded significant recoveries.`,
          action: uk
            ? `Що робити: Оцініть макро-картину — якщо є причина для попиту на захисні активи, це може бути хороша зона входу. Уникайте нових шортів.`
            : `What to do: Evaluate the macro picture. If there is any reason for safe-haven demand, this could be a good entry zone. Avoid adding new shorts.`,
        }
        if (safe >= 85) return {
          signal: C.sigWatch, color: C.watch, confidence: C.medConf,
          label: uk ? 'Фонди дуже в лонгу — переповнена угода' : 'Funds very long — crowded trade',
          simple: uk
            ? `Золото і срібло зараз сильно в руках фондів. Тренд був сильним, але коли дорогоцінні метали настільки переповнені лонгами, корекції бувають різкими — бо всі виходять одночасно при зміні настрою.`
            : `Gold and Silver are heavily owned by funds right now. The trend has been strong, but when precious metals are this crowded on the long side, corrections tend to be sharp.`,
          action: uk
            ? `Що робити: Якщо ви в лонгу — час зафіксувати частину прибутку і підтягнути стопи. Нові лонги несуть вищий ризик купівлі біля короткострокової вершини.`
            : `What to do: If you are long, this is a good time to take partial profit and tighten stops. New long entries here carry higher risk.`,
        }
        return null
      }
 
      return null
    })()
      
    const setupBias =
      safe >= 90 ? "Long Extreme" :
      safe >= 65 ? "Bullish Context" :
      safe <= 10 ? "Short Extreme" :
      safe <= 35 ? "Bearish Context" : "Balanced";

    const wowAbs = wow != null ? Math.abs(wow).toFixed(1) : null;
 
    let momentumLine = "";
    if (wow != null && wowAbs !== null) {
      if (uk) {
        const wowDir = wow > 0 ? "наростили" : "скоротили";
        const wowSize = Math.abs(wow) >= 10 ? "різко" : Math.abs(wow) >= 5 ? "помітно" : "помірно";
        momentumLine = `Цього тижня фонди ${wowDir} експозицію ${wowSize} (${wow > 0 ? "+" : ""}${wow.toFixed(1)} пунктів індексу).`;
      } else {
        const wowDir = wow > 0 ? "added" : "reduced";
        const wowSize = Math.abs(wow) >= 10 ? "sharply" : Math.abs(wow) >= 5 ? "meaningfully" : "modestly";
        momentumLine = `This week funds ${wowDir} exposure ${wowSize} (${wow > 0 ? "+" : ""}${wow.toFixed(1)} index points).`;
      }
    }
 
    const trendLine = accel === "accelerating"
      ? (uk ? "Рух прискорюється — інституційна впевненість зростає." : "The move is accelerating — institutional conviction is growing.")
      : accel === "decelerating"
      ? (uk ? "Рух уповільнюється — стежте за можливим застоєм або розворотом." : "The move is decelerating — watch for a potential stall or reversal.")
      : accel === "stable"
      ? (uk ? "Темп зміни позиціонування стабільний." : "The pace of positioning change is stable.")
      : "";
 
    const avgLine = avg3w != null && avg8w != null
      ? (uk
          ? `Короткострокове середнє (3т: ${avg3w.toFixed(1)}) ${avg3w > avg8w ? "вище" : "нижче"} середньострокового (8т: ${avg8w.toFixed(1)}) — ${avg3w > avg8w ? "тренд посилюється" : "моментум слабшає"}.`
          : `Short-term average (3w: ${avg3w.toFixed(1)}) is ${avg3w > avg8w ? "above" : "below"} the medium-term average (8w: ${avg8w.toFixed(1)}) — ${avg3w > avg8w ? "strengthening trend" : "weakening momentum"}.`)
      : "";
 
    let setupSummary = "";
    if (safe >= 90) {
      setupSummary = uk
        ? `${name} на 3-річному екстремумі позиціонування — фонди тримають найбільшу лонг-позицію циклу на рівні ${safe.toFixed(0)}.`
        : `${name} is at a 3-year positioning extreme — funds hold their largest long position of the cycle at ${safe.toFixed(0)}.`;
    } else if (safe >= 65) {
      setupSummary = uk
        ? `${name} впевнено в бичачій зоні позиціонування на рівні ${safe.toFixed(0)} за 3-річною шкалою.`
        : `${name} sits firmly in the bullish positioning zone at ${safe.toFixed(0)} on the 3-year scale.`;
    } else if (safe <= 10) {
      setupSummary = uk
        ? `${name} на 3-річному шорт-екстремумі (${safe.toFixed(0)}). Фонди настільки ведмежі, як не були роками.`
        : `${name} is at a 3-year short extreme (${safe.toFixed(0)}). Funds are as bearish as they have been in years.`;
    } else if (safe <= 35) {
      setupSummary = uk
        ? `${name} у ведмежій зоні позиціонування на рівні ${safe.toFixed(0)}. Фонди тримають чистий шорт-нахил.`
        : `${name} is in a bearish positioning zone at ${safe.toFixed(0)}. Funds hold a net short bias.`;
    } else {
      setupSummary = uk
        ? `${name} у нейтральній зоні на рівні ${safe.toFixed(0)} — ні переконливо лонг, ні шорт.`
        : `${name} sits in a neutral zone at ${safe.toFixed(0)} — neither convincingly long nor short.`;
    }
 
    let contextualInterpretation = "";
    if (safe >= 90) {
      contextualInterpretation += uk
        ? `**Переповнений лонг.** Фонди на максимумах циклу. Ризик асиметричний — потенціал зростання обмежений, тоді як ризик зниження від примусової ліквідації реальний. `
        : `**Crowded long.** Funds are at cycle highs. The risk here is asymmetric — upside is limited while downside from forced liquidation is real. `;
    } else if (safe >= 65) {
      contextualInterpretation += uk
        ? `**Конструктивне позиціонування.** Це оптимальна зона для трендових угод. Фонди явно в лонгу, але ще не досягли переповненого екстремуму. `
        : `**Constructive positioning.** This is the sweet spot for trend trades. Funds are clearly positioned long but haven't reached the crowded extreme. `;
    } else if (safe <= 10) {
      contextualInterpretation += uk
        ? `**Переповнений шорт.** Ринок сильно позиціонований на зниження. Ризик повернення до середнього підвищений — будь-який позитивний каталізатор може спричинити різкий сквіз. `
        : `**Crowded short.** The market is heavily positioned for downside. Mean-reversion risk is elevated — any positive catalyst could spark a sharp squeeze. `;
    } else if (safe <= 35) {
      contextualInterpretation += uk
        ? `**Ведмеже позиціонування.** Фонди в шорті нижче порогу 35.`
        : `**Bearish positioning.** Funds are positioned short below the 35 threshold.`;
    } else {
      contextualInterpretation += uk
        ? `**Нейтральна зона.** Саме лише позиціонування не дає напрямкової переваги. Перед дією потрібна впевненість з інших джерел. `
        : `**Neutral zone.** Positioning alone provides no directional edge. Conviction from other sources is needed before acting. `;
    }
    if (trendLine) contextualInterpretation += `${trendLine} `;
    if (momentumLine) contextualInterpretation += `${momentumLine} `;
    if (avgLine) contextualInterpretation += `\n\n${avgLine}`;
 
    let gptCommentary = "";
    if (safe >= 90) {
      gptCommentary = uk
        ? `**Перевага позиціонування:** Немає для нового лонгу — ризик зміщений вниз звідси.\n\n**Підхід до угоди:** Уникайте нових лонгів. Розгляньте скорочення наявних позицій або тісні стопи.\n\n**Ключовий рівень:** Падіння COT Index нижче 75 сигналізуватиме, що натовп починає виходити.`
        : `**Positioning edge:** None from a fresh long entry — risk is skewed to the downside from here.\n\n**Trade approach:** Avoid new longs. Consider lightening existing positions or using tight stops.\n\n**Key level to watch:** A COT Index drop below 75 would signal the crowd is starting to exit.`;
    } else if (safe >= 65) {
      gptCommentary = uk
        ? `**Перевага позиціонування:** Лонг-нахил підтверджено — використовуйте слабкість як можливість.\n\n**Підхід до угоди:** Купуйте просідання в межах тренду. Тримайте стопи нижче недавніх мінімумів.\n\n**Ключовий рівень:** Стежте, щоб COT Index тримався вище 65 — падіння нижче змінить нахил.`
        : `**Positioning edge:** Long bias is confirmed — use weakness as an opportunity.\n\n**Trade approach:** Buy dips within the trend. Keep stops below recent swing lows.\n\n**Key level to watch:** Watch for COT Index to sustain above 65 — a drop below would shift the bias.`;
    } else if (safe <= 10) {
      gptCommentary = uk
        ? `**Перевага позиціонування:** Потенціал сквізу високий — обережно з новими шортами.\n\n**Підхід до угоди:** Уникайте додавання шортів. Стежте за каталізатором, що може змусити покривати.\n\n**Ключовий рівень:** Перетин COT Index вище 15 буде раннім підтвердженням формування сквізу.`
        : `**Positioning edge:** Squeeze potential is high — be cautious on fresh shorts.\n\n**Trade approach:** Avoid adding shorts. Watch for any catalyst that could force covering.\n\n**Key level to watch:** A COT Index cross above 15 would be early confirmation of a squeeze forming.`;
    } else if (safe <= 35) {
      gptCommentary = uk
        ? `**Перевага позиціонування:** Ведмежий нахил підтримується — ралі є можливостями для продажу.\n\n**Підхід до угоди:** Фейдьте силу, а не женіться за пробоєм. Шортіть у відскоки.\n\n**Ключовий рівень:** Якщо COT повернеться вище 45, ведмежа теза суттєво слабшає.`
        : `**Positioning edge:** Bearish bias is supported — rallies are selling opportunities.\n\n**Trade approach:** Fade strength rather than chasing breakdown. Short into bounces.\n\n**Key level to watch:** If COT rises back above 45, the bearish thesis weakens considerably.`;
    } else {
      gptCommentary = uk
        ? `**Перевага позиціонування:** Немає — нейтральне позиціонування означає, що ні бики, ні ведмеді не мають інституційної підтримки.\n\n**Підхід до угоди:** Чекайте напрямкового пробою вище 65 або нижче 35 перед входом.\n\n**Ключовий рівень:** Стійкий рух до будь-якої екстремальної зони сформує новий сетап.`
        : `**Positioning edge:** None — neutral positioning means neither bulls nor bears have institutional backing.\n\n**Trade approach:** Wait for a directional break above 65 or below 35 before committing.\n\n**Key level to watch:** A sustained move to either extreme zone would establish a new setup.`;
    }
 
    const checklist = [
      { label: uk ? "COT режим узгоджений з нахилом" : "COT regime agrees with bias",  pass: safe >= 65 || safe <= 35 },
      { label: uk ? "Flow state напрямковий"         : "Flow state is directional",     pass: flow !== "Neutral" },
      { label: uk ? "Не в найпереповненішій зоні"    : "Not in the most crowded zone",  pass: safe < 90 && safe > 10 },
      { label: uk ? "Моментум підтверджує напрям"    : "Momentum confirms direction",   pass: accel === "accelerating" },
    ];

    return {
      pct: safe, conviction, crowding, setupBias,
      setupSummary, contextualInterpretation, gptCommentary, checklist, contrarianRead,  
    };
  }, [asset]);

  const sparkProfile = useMemo(() => {
    if (!asset) return []
    const real = seasonalityData.find((s) => s.symbol === asset.symbol)
    if (real && Array.isArray(real.values) && real.values.length === 12) {
      return real.values
    }
    return []
  }, [asset, seasonalityData, t])

  if (!asset || !profile) {
    return (
      <Panel title={t("panels.assetExplorer")}>
        <div className="text-sm text-zinc-400">{t('ui.noAssetData')}</div>
      </Panel>
    );
  }

  const handleExportPDF = () => {
    const existing = document.querySelectorAll("#asset-pdf-report")
    existing.forEach((el, i) => { if (i > 0) el.remove() })
    const el = document.getElementById("asset-pdf-report")
    if (el) el.style.display = "block"
    setTimeout(() => {
      window.print()
      setTimeout(() => { if (el) el.style.display = "none" }, 500)
    }, 100)
  }

  return (
    <div className="space-y-4">
      {/* Hidden PDF report */}
      <AssetPDFReport
        asset={asset}
        profile={profile}
        sparkProfile={sparkProfile}
        seasonalityData={seasonalityData}
      />

      {/* ── HEADER PANEL — compact tab bar + asset title ── */}
      <Panel
        title={t("panels.assetExplorer")}
        right={
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 border border-zinc-800 small-panel-color px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition"
            >
              <Download size={11} />
              {t('ui.exportPdf')}
            </button>
            <GuideButton sectionKey="explorer" openGuide={openGuide} />
          </div>
        }
      >
        {/* Compact asset selector */}
        <div className="mb-3 -mx-1 flex flex-wrap gap-1">
          {orderedAssets.map((a) => {
            const isActive = a.symbol === asset.symbol
            const pct = Number(a.funds_percentile_3y)
            const dotColor = pct >= 65 ? '#4ade80' : pct <= 35 ? '#f87171' : '#94a3b8'
            return (
              <button
                key={a.symbol}
                onClick={() => setSelected(a.symbol)}
                style={{
                  padding: '3px 9px',
                  fontSize: '10px',
                  fontWeight: isActive ? 700 : 400,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  border: isActive
                    ? `1px solid rgba(96,165,250,0.6)`
                    : '1px solid rgba(255,255,255,0.07)',
                  background: isActive ? 'rgba(96,165,250,0.12)' : 'transparent',
                  color: isActive ? '#93c5fd' : 'rgba(148,163,184,0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <span style={{
                  width: '5px', height: '5px', borderRadius: '50%',
                  background: dotColor, flexShrink: 0,
                  boxShadow: isActive ? `0 0 5px ${dotColor}` : 'none',
                }} />
                {a.symbol}
              </button>
            )
          })}
        </div>

        {/* Asset title row */}
        <div className="pt-2">
          <div>
            <div className="text-xl font-semibold text-zinc-100">{asset.name}</div>
          </div>
        </div>
      </Panel>

      {/* ── MAIN GRID ── */}
      <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">

        {/* ── LEFT COLUMN ── */}
        <div className="space-y-4">

          {/* Metrics row */}
          <div className="grid gap-3 md:grid-cols-4 metric-card">
            <Metric label={t('ui.fundsNet')}     value={formatNumber(asset.funds_net)} />
            <Metric label={t('ui.dealerNet')}    value={formatNumber(asset.dealer_net)} />
            <Metric label={t('ui.openInterest')} value={formatNumber(asset.open_interest)} />
            <Metric label={t('ui.flowState')} value={translateFlowState(asset.flow_state || 'Neutral', t)} />
          </div>

          {/* Momentum bar */}
          <div className="small-panel-color px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="text-[11px] uppercase tracking-[0.22em] text-slate-200">{t('ui.momentum')}</span>
              <MomentumBadge asset={asset} size="md" />
              <div className="flex items-center gap-6 text-[12px] text-slate-200">
                {asset.funds_index_3w_avg != null && (
                  <span>3w avg: <span className={flowColor(asset.funds_index_3w_avg)}>
                    {asset.funds_index_3w_avg.toFixed(1)}
                  </span></span>
                )}
                {asset.funds_index_8w_avg != null && (
                  <span>8w avg: <span className={flowColor(asset.funds_index_8w_avg)}>
                    {asset.funds_index_8w_avg.toFixed(1)}
                  </span></span>
                )}
                {asset.funds_index_momentum != null && (
                  <span>{t('ui.vsTrend')} <span className={
                    asset.funds_index_momentum > 0 ? "text-emerald-400" :
                    asset.funds_index_momentum < 0 ? "text-rose-400" : "text-zinc-400"
                  }>
                    {asset.funds_index_momentum > 0 ? "+" : ""}
                    {asset.funds_index_momentum.toFixed(1)}
                  </span></span>
                )}
                {asset.funds_index_acceleration && (
                  <span className={
                    asset.funds_index_acceleration === "accelerating" ? "text-emerald-400" :
                    asset.funds_index_acceleration === "decelerating" ? "text-rose-400" :
                    "text-slate-200"
                  }>
                    {tAccel(asset.funds_index_acceleration)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Gauge + Bias Bar — combined */}
          <Panel title={t("panels.setupBiasGauge")}>
            <div className="grid gap-4 md:grid-cols-2 items-center">
              {/* Gauge with glow */}
              <div className="flex flex-col items-center">
                <div style={{
                  filter: profile.pct >= 65
                    ? 'drop-shadow(0 0 8px rgba(74,222,128,0.4))'
                    : profile.pct <= 35
                    ? 'drop-shadow(0 0 8px rgba(248,113,113,0.4))'
                    : 'none',
                }}>
                  <GaugeArc value={profile.pct} />
                </div>
                <div className="mt-1 text-center text-sm font-medium text-zinc-200">
                  {tBias(profile.setupBias)}
                </div>
                <div className="text-center text-[10px] uppercase tracking-[0.18em] text-zinc-500 mt-0.5">
                  {regimeLabel(profile.pct, t)} · {signalLabel(profile.pct, t)}
                </div>
                <div className="flex justify-between gap-2 text-[10px] uppercase">
                  <span className="text-zinc-500">{t('ui.conviction')} {formatPercentile(profile.conviction)}</span>
                  {' · '}
                  <span className="text-zinc-500">{t('ui.crowding')} {tCrowding(profile.crowding)}</span></div>
              </div>

              {/* Bias bar + summary */}
              <div className="space-y-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-slate-200 mb-1">
                  {t('ui.positioningBias')}
                </div>
                <BiasBar value={profile.pct} />
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.15em] text-zinc-500">
                  <span>{t('ui.defensive')}</span>
                  <span className={flowColor(profile.pct)}>{formatPercentile(profile.pct)}</span>
                  <span>{t('ui.constructive')}</span>
                </div>
                <div className="p-3 text-xs text-blue-400 small-panel-color mt-2">
                  {profile.setupSummary}
                </div>
              </div>
            </div>
          </Panel>

          {/* Contextual Interpretation + GPT Commentary */}
          <div className="grid gap-3 xl:grid-cols-2">
            <Panel title={t("panels.contextualInterpretation")}>
              <div className="space-y-1">
                {renderNarrative(profile.contextualInterpretation)}
              </div>
            </Panel>
            <Panel title={t("panels.gptCommentaryLayer")}>
              <div className="space-y-1">
                {renderNarrative(profile.gptCommentary)}
              </div>
            </Panel>
          </div>

          {/* Seasonal Curve */}
          <Panel
            title={t("panels.assetCharts")}
            right={<span className="text-[10px] uppercase tracking-[0.22em] text-slate-200">{t('ui.seasonalContext')}</span>}
          >
            <div className="p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-200 mb-3">
                {t('ui.seasonalCurve')}
              </div>
              {sparkProfile.length === 12 ? (
                <>
                  <MiniSparkline values={sparkProfile} positive={profile.pct >= 55} />
                  <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                    <span>{t('months.Jan')}</span>
                    <span className="text-blue-400">{t(`months.${SEASONAL_MONTHS[new Date().getMonth()]}`)}</span>
                    <span>{t('months.Dec')}</span>
                  </div>
                  <div className="mt-3 text-xs leading-5 text-zinc-400">
                    {t('ui.avgMonthlyCotDesc')}
                  </div>
                </>
              ) : (
                <div className="text-sm text-zinc-600">
                  Seasonal data not yet available for this asset.
                </div>
              )}
            </div>
          </Panel>

        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="space-y-4">

          <AIAnalysisPanel
            type="asset"
            data={{
              ...asset,
              contrarian_signal:     profile.contrarianRead?.signal || null,
              contrarian_label:      profile.contrarianRead?.label || null,
              contrarian_confidence: profile.contrarianRead?.confidence || null,
            }}
            aiLanguage={aiLanguage}
            title={t('ui.aiAssetAnalysis')}
          />
                    
          {/* Confirmation Checklist — with box-shadow on dots */}
          <Panel title={t("panels.confirmationChecklist")}>
            <div className="space-y-2">
              {profile.checklist.map((item, idx) => (
                <div
                  key={`${item.label}-${idx}`}
                  className="flex items-start gap-3 small-panel-color p-3"
                >
                  <div
                    className={cls(
                      "mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full",
                      item.pass ? "bg-emerald-400" : "bg-rose-400/60"
                    )}
                    style={{
                      boxShadow: item.pass
                        ? '0 0 8px rgba(74,222,128,0.6), 0 0 2px rgba(74,222,128,0.9)'
                        : '0 0 6px rgba(248,113,113,0.3)',
                    }}
                  />
                  <div>
                    <div className="text-sm text-zinc-100">{item.label}</div>
                    <div className={cls(
                      "mt-0.5 text-[10px] uppercase tracking-[0.18em]",
                      item.pass ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {item.pass ? t('ui.confirmed') : t('ui.notMet')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

                    {/* Contrarian Read — тільки для equity indices */}
{profile.contrarianRead && (
  <div className="default-bg">
    <div className="flex items-center border-b px-4 py-3 justify-between" style={{ borderColor: 'var(--panels-border)'}}>
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-1.5 rounded-full rounded-full-dot bg-blue-400"></div>
        <div className="text-[11px] uppercase tracking-[0.22em]">
        {t('ui.contrarianCotRead')}
        </div>
      </div>
      <span style={{
        fontSize: '10px', padding: '1px 6px', borderRadius: '3px',
        textTransform: 'uppercase', letterSpacing: '0.1em',
        color: '#94a3b8', background: 'rgba(148,163,184,0.08)',
        border: '1px solid rgba(148,163,184,0.15)',
      }}>
        {profile.contrarianRead.confidence}
      </span>
    </div>         
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3">
      <span style={{
        padding: '2px 10px', borderRadius: '3px', flexShrink: 0,
        fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: profile.contrarianRead.color,
        background: `${profile.contrarianRead.color}12`,
        border: `1px solid ${profile.contrarianRead.color}30`,
      }}>
        {profile.contrarianRead.signal}
      </span>
      <span style={{ fontSize: '12px', color: profile.contrarianRead.color, fontWeight: 600 }}>
        {profile.contrarianRead.label}
      </span>
    </div>
    <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.7', marginBottom: '10px' }}>
      {profile.contrarianRead.simple}
    </div>
    <div style={{
      fontSize: '12px', color: '#60a5fa', lineHeight: '1.65',
      padding: '8px 12px', background: 'var(--small-panel-color)',
      border: '1px solid var(--accent-color)', borderRadius: '6px',
    }}>
      {profile.contrarianRead.action}
    </div>
    <div className="mt-2 pt-3 flex items-center gap-2">
      <div style={{ fontSize: '11px', color: '#b7d5ff' }}>
        {t('ui.directCot')} <span style={{ color: profile.pct >= 65 ? '#4ade80' : profile.pct <= 35 ? '#f87171' : '#94a3b8', fontWeight: 600 }}>
          {profile.setupBias} ({profile.pct.toFixed(0)})
        </span>
      </div>
    </div>
    </div>
  </div>
)}

          {/* Sector Peers */}
          <Panel title={t("panels.sectorPeers")}>
            <div className="space-y-2">
              {sectorPeers.length ? (
                sectorPeers.map((peer) => (
                  <button
                    key={peer.symbol}
                    onClick={() => setSelected(peer.symbol)}
                    className="w-full small-panel-color p-3 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-zinc-100">{peer.name}</div>
                      <div className={cls("text-sm font-medium", flowColor(peer.funds_percentile_3y))}>
                        {formatPercentile(peer.funds_percentile_3y)}
                      </div>
                    </div>
                    <div className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-slate-300">
                      {signalLabel(peer.funds_percentile_3y, t)}
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-sm text-slate-300">{t('ui.noPeerAssets')}</div>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
