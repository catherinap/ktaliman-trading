/**
 * guideSections.js — encyclopedic content for the Platform Guide.
 *
 * This is DATA only (no React). It is imported by GuideView in App.jsx:
 *   import { GUIDE_SECTIONS } from "./data/guideSections"
 *
 * Each section: { key, icon, color, title:{en,uk}, summary:{en,uk}, blocks:[...] }
 * Each block:   { title:{en,uk}, content:{en,uk} }
 *
 * Content markup (parsed by renderGuideContent in App.jsx):
 *   [[BOLD_UPPER]]heading[[/]]   → bold uppercase sub-heading (whole paragraph)
 *   [[BOLD]]text[[/]]            → inline bold
 *   https://...                  → auto-rendered as a link
 *   blank line                   → paragraph break
 */

export const GUIDE_SECTIONS = [

    // ── 1. WORKSPACE ────────────────────────────────────────────────────────────
    {
        key: "workspace",
        icon: "⊞",
        color: "#60a5fa",
        title: {
            en: "Live Workspace",
            uk: "Робочий простір"
        },
        summary: {
            en: "Your weekly starting point. Everything that matters for decision-making on one screen — market mood, COT positioning, signals, news, and economic events.",
            uk: "Ваша щотижнева відправна точка. Все найважливіше для прийняття рішень на одному екрані — настрій ринку, позиціонування COT, сигнали, новини та економічні події."
        },
        blocks: [
            {
                title: {
                    en: "What this section gives you and how to use it",
                    uk: "Що дає цей розділ і як ним користуватися"
                },
                content: {
                    en: `Workspace is designed to be opened first every Monday morning, after the CFTC Commitments of Traders report has been published on Friday. In 10 minutes of reviewing this screen you should understand: what the macroeconomic mood is, where institutional money is positioned, which signals are currently active, and what economic events are coming this week.

[[BOLD_UPPER]]Recommended weekly routine[[/]]

First, look at the Macro Context block to understand whether the market is in a risk-on or risk-off mood. Second, review the Macro Regime block to see where the big money is positioned across three large groups of assets. Third, check the Top Active Signals to spot the highest-quality setups. Fourth, scan the COT Heatmap to compare all 25 assets at once. Fifth, look at the Economic Calendar to know which days require extra caution. Sixth, read through Market News to understand the narrative context.

Only after this full circle do you move to deeper sections — Asset Explorer for detailed analysis of a specific instrument, or Signals for a complete ranked list of all setups.

[[BOLD]]Useful link:[[/]] the official CFTC page about the Commitments of Traders report — https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm`,
                    uk: `Робочий простір створений для того, щоб ви відкривали його першим щопонеділка вранці, після того як у п'ятницю CFTC опублікувала звіт про зобов'язання трейдерів. За десять хвилин перегляду цього екрану ви маєте розуміти: який зараз макроекономічний настрій, де знаходяться позиції великих гравців, які сигнали зараз активні та які економічні події попереду на цьому тижні.

[[BOLD_UPPER]]Рекомендований щотижневий розпорядок[[/]]

Спочатку подивіться на блок Макроекономічний контекст, щоб зрозуміти, в якому настрої ринок — схильному до ризику чи такому, що ризику уникає. Потім перегляньте блок Макро режим, щоб побачити, де позиціоновані великі гроші по трьох великих групах активів. Третім кроком перевірте Топ активних сигналів. Четвертим — проскануйте Теплову карту звіту COT, щоб порівняти всі двадцять п'ять активів одночасно. П'ятим — подивіться Економічний календар. Шостим — прочитайте Ринкові новини.

Тільки після цього повного кола ви переходите до глибших розділів — Дослідник активів для детального аналізу конкретного інструмента, або Сигнали для повного ранжованого списку всіх торгових конфігурацій.

[[BOLD]]Корисне посилання:[[/]] офіційна сторінка CFTC про звіт про зобов'язання трейдерів — https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm`
                }
            },
            {
                title: {
                    en: "Macro Context: VIX, Yield Curve, Dollar Index, S&P 500",
                    uk: "Макроекономічний контекст: VIX, Крива дохідності, Індекс долара, S&P 500"
                },
                content: {
                    en: `Macro Context is four indicators that tell you what is happening in the broader market before you look at COT data. Think of it as checking the weather before getting dressed.

[[BOLD_UPPER]]VIX — the fear index[[/]]

VIX (Volatility Index) measures the expected volatility of the S&P 500 over the next 30 days. It is calculated by the Chicago Board Options Exchange based on options prices and is considered the main barometer of fear and complacency in the market.

When VIX is below 15, the market is calm and traders are complacent. This is a paradoxically dangerous moment for opening new long positions, because complacency historically precedes corrections. When VIX is between 15 and 20, this is a normal trading mode. When VIX rises into the range from 20 to 30, this signals growing anxiety and increased risks. When VIX exceeds 30, the market is in a state of fear — this is a classic risk-off mood when investors flee to defensive assets: gold, Japanese yen, US dollar, and government bonds.

[[BOLD]]Practical example:[[/]] VIX is at 28, the Dollar Index is strengthening, and the S&P 500 has fallen 3% over the week. This is a classic risk-off environment. If at the same time the COT report shows hedge funds actively buying gold, that signal is confirmed by the macroeconomic context and its probability of success increases significantly.

[[BOLD_UPPER]]Yield Curve — the relationship between two-year and 10-year bonds[[/]]

This indicator shows the difference between the yield on US 10-year Treasury bonds and two-year ones. It is historically one of the most reliable indicators of the economic cycle.

When the difference is positive, for example plus zero point five percent, this is a normal yield curve — the economy is growing. When the difference approaches zero, the curve is flattening — a warning of slowing growth. When the difference becomes negative, for example minus zero point 3%, this is called an inverted yield curve. Historically, inversion preceded every US recession over the last 50 years, usually with a lag of 12 to eighteen months.

[[BOLD]]Practical example:[[/]] The curve is inverted by minus zero point two percent, VIX is at 22, the S&P 500 is at all-time highs. This is a sign of overheating with underlying systemic risk. In such an environment, a COT signal for a long position in stock indices is much less reliable. On the contrary, a signal for shorting the S&P 500 gets significant additional macroeconomic support.

[[BOLD]]Useful link:[[/]] real-time yield curve data on the Federal Reserve of St. Louis website — https://fred.stlouisfed.org/series/T10Y2Y

[[BOLD_UPPER]]Dollar Index (DXY)[[/]]

This is the weighted value of the US dollar against a basket of six major currencies: euro, Japanese yen, British pound, Canadian dollar, Swedish krona, and Swiss franc. The euro has the largest weight at 57.6%.

When the Dollar Index strengthens, this puts pressure on gold, silver, oil, and other commodities priced in dollars. When the Dollar Index weakens, this creates favorable conditions for commodities and currencies trading against the dollar.

[[BOLD_UPPER]]S&P 500 as a thermometer of risk appetite[[/]]

This is the stock index of five hundred largest American companies, considered the main indicator of global risk appetite. If the S&P 500 is growing alongside a low VIX, hedge funds and institutional investors are buying risk. If the S&P 500 is falling and VIX is rising — this is a clear risk-off signal.`,
                    uk: `Макроекономічний контекст — це чотири показники, які говорять вам, що відбувається в широкому ринку до того, як ви подивитеся на дані звіту COT. Думайте про це як про перевірку погоди перед тим, як одягтися.

[[BOLD_UPPER]]VIX — індекс страху[[/]]

VIX (Volatility Index, Індекс волатильності) вимірює очікувану волатильність індексу S&P 500 на найближчі тридцять днів. Він розраховується Чиказькою опціонною біржею на основі цін опціонів і вважається головним барометром страху та самозаспокоєння на ринку.

Коли VIX нижче п'ятнадцяти, ринок спокійний і трейдери самозаспокоєні. Це парадоксально небезпечний момент для відкриття нових довгих позицій — самозаспокоєння історично передує корекціям. Коли VIX між п'ятнадцятьма та двадцятьма — це нормальний режим торгівлі. Коли VIX піднімається в діапазон від двадцяти до тридцяти — це сигнал зростаючої тривоги та підвищених ризиків. Коли VIX перевищує тридцять — ринок у стані страху, це класичний настрій уникнення ризику: інвестори тікають у захисні активи — золото, японська єна, долар США, державні облігації.

[[BOLD]]Практичний приклад:[[/]] VIX знаходиться на рівні двадцяти восьми, Індекс долара посилюється, S&P 500 за тиждень впав на три відсотки. Це класичне середовище уникнення ризику. Якщо при цьому звіт COT показує, що хедж-фонди активно купують золото, цей сигнал підтверджений макроекономічним контекстом і його ймовірність успіху суттєво зростає.

[[BOLD_UPPER]]Крива дохідності — співвідношення дворічних та десятирічних облігацій[[/]]

Цей показник демонструє різницю між дохідністю американських десятирічних державних облігацій та дворічних. Це один із найнадійніших індикаторів економічного циклу за всю сучасну фінансову історію.

Коли різниця позитивна, наприклад плюс нуль цілих п'ять десятих відсотка — це нормальна крива дохідності, економіка зростає. Коли різниця наближається до нуля — крива стає плоскою, попередження про уповільнення. Коли різниця стає від'ємною, наприклад мінус нуль цілих три десятих відсотка — це інверсія кривої дохідності. Інверсія передувала кожній рецесії в США за останні п'ятдесят років, зазвичай із затримкою дванадцять-вісімнадцять місяців.

[[BOLD]]Практичний приклад:[[/]] Крива інвертована на мінус нуль цілих дві десятих відсотка, VIX на рівні двадцяти двох, S&P 500 на історичних максимумах. Це ознака перегріву з підстилаючим системним ризиком. У такому середовищі сигнал COT на довгу позицію в фондових індексах значно менш надійний. Навпаки, сигнал на коротку позицію в S&P 500 отримує суттєву додаткову підтримку.

[[BOLD]]Корисне посилання:[[/]] дані кривої дохідності в реальному часі — https://fred.stlouisfed.org/series/T10Y2Y

[[BOLD_UPPER]]Індекс долара (DXY)[[/]]

Це зважена вартість долара США відносно кошика з шести основних валют: євро, японська єна, британський фунт, канадський долар, шведська крона та швейцарський франк. Євро має найбільшу вагу — п'ятдесят сім цілих шість десятих відсотка.

Коли Індекс долара посилюється, це чинить тиск на золото, срібло, нафту та інші сировинні товари, що оцінюються в доларах. Коли Індекс долара слабшає, це створює сприятливі умови для сировинних товарів і валют, що торгуються проти долара.

[[BOLD_UPPER]]S&P 500 як термометр апетиту до ризику[[/]]

Це фондовий індекс п'ятисот найбільших американських компаній, головний індикатор глобального апетиту до ризику. Якщо S&P 500 росте разом з низьким VIX — хедж-фонди та інституційні інвестори купують ризик. Якщо S&P 500 падає і VIX росте — це чіткий сигнал уникнення ризику.`
                }
            },
            {
                title: {
                    en: "Macro Context regimes explained: every label and what to do",
                    uk: "Режими Макро-контексту: кожна мітка та що з нею робити"
                },
                content: {
                    en: `The Macro Context panel on the Workspace and Macro tabs reads four live indicators — VIX, the yield curve, the Dollar Index, and the S&P 500 — and combines them into a single overall regime label. Below is the full dictionary of every regime and individual reading you will see, what it means, and how to treat it when trading.

[[BOLD_UPPER]]First, what is EM?[[/]]

EM stands for Emerging Markets — the financial markets of developing economies such as Brazil, India, Turkey, South Africa, Mexico, Indonesia, and many others. They are grouped together because they tend to behave similarly: they are higher-growth but higher-risk, and they are very sensitive to the US dollar.

Why the dollar matters so much for EM: many emerging-market governments and companies borrow money in US dollars. When the dollar strengthens, those debts become more expensive to repay in local currency, capital flees back to the safety of the United States, and EM assets fall. When the dollar weakens, the opposite happens — money flows into emerging markets seeking higher returns, and EM assets rise. This is why a strengthening Dollar Index is described as "bearish for commodities and emerging markets" — it drains money out of riskier corners of the world.

[[BOLD_UPPER]]The seven combined regime labels[[/]]

[[BOLD]]Risk-On Expansion[[/]] — VIX is low, the yield curve is healthy, the dollar is stable or weakening, and equities are rising. This is the friendliest environment for taking risk. Long positions across growth assets, commodities, and risk currencies have the wind at their back. Trade COT long signals with normal-to-full conviction.

[[BOLD]]Benign / Constructive[[/]] — conditions are generally supportive but not euphoric. A solid environment for selective long trades. Confirm each setup individually, but the macro backdrop is not fighting you.

[[BOLD]]Mixed / Transition[[/]] — the four indicators are sending conflicting messages, often because the market is shifting from one regime to another. This is a caution flag. Reduce position sizes, be highly selective, and wait for the picture to clarify before committing to broad directional bets.

[[BOLD]]Late Cycle / Contraction[[/]] — the yield curve is flattening, volatility is creeping up, and growth momentum is fading. Historically this regime appears in the mature phase of an economic expansion, before a downturn. Favor defensive assets, tighten risk, and be skeptical of aggressive long signals on growth assets.

[[BOLD]]Inversion Warning[[/]] — the yield curve has inverted (short-term rates above long-term rates). This is historically one of the most reliable recession signals, usually leading a downturn by twelve to eighteen months. It does not mean sell everything today, but it is a strong reason to be defensive, reduce leverage, and treat long signals on equities with extra skepticism.

[[BOLD]]Dollar Stress / EM Pressure[[/]] — the Dollar Index is strengthening sharply, which drains money out of emerging markets and pressures commodities. In this regime, be cautious with long positions in gold, silver, oil, and anything priced in dollars or tied to emerging markets. Conversely, this regime can support short setups on those same assets.

[[BOLD]]Risk-Off / Stress[[/]] — VIX is high, equities are falling, and money is fleeing to safety. This is a fear-driven environment. Defensive assets (US dollar, gold as a safe haven, government bonds, Japanese yen) are favored. Long signals on risk assets are fighting a strong headwind. However, extreme readings in this regime sometimes mark contrarian bottoms — when everyone has already sold, the selling pressure exhausts.

[[BOLD_UPPER]]The individual VIX readings[[/]]

[[BOLD]]Complacent[[/]] (VIX below ~15) — markets are calm to the point of carelessness. Paradoxically dangerous: low fear often precedes sharp reversals because everyone is already positioned for good times.
[[BOLD]]Calm[[/]] (VIX ~15-20) — normal, healthy conditions for trend-following.
[[BOLD]]Elevated[[/]] (VIX ~20-30) — uncertainty is rising. Reduce position size and watch for volatility spikes.
[[BOLD]]Fear[[/]] (VIX ~30-40) — risk-off mode dominates; defensive positioning is favored.
[[BOLD]]Extreme Fear[[/]] (VIX above ~40) — crisis territory. Contrarian long opportunities may begin to emerge as panic peaks.

[[BOLD_UPPER]]The individual yield-curve readings[[/]]

[[BOLD]]Steep[[/]] — long-term rates well above short-term; growth optimism, early-expansion cycle. Supportive of risk.
[[BOLD]]Normal[[/]] — a healthy positive slope; benign macro backdrop.
[[BOLD]]Flat[[/]] — the gap has nearly closed; a late-cycle warning. Watch for inversion.
[[BOLD]]Inverted[[/]] — short-term rates above long-term; the classic recession warning described above.

[[BOLD_UPPER]]The individual Dollar Index readings[[/]]

[[BOLD]]Strengthening[[/]] — bearish for commodities and emerging markets; money is rotating into the dollar.
[[BOLD]]Weakening[[/]] — supportive for gold, commodities, and emerging markets; money is leaving the dollar for higher returns.
[[BOLD]]Neutral[[/]] — no strong directional signal from the dollar right now.

[[BOLD_UPPER]]How to use all of this together[[/]]

The Macro Context regime is your weather report. It does not tell you which specific asset to trade — that is what the COT signals are for — but it tells you whether the overall conditions favor taking risk or protecting capital. The golden rule: when a COT signal agrees with the macro regime (for example, a long commodity signal during Risk-On Expansion with a weakening dollar), the setup is much stronger. When a COT signal fights the macro regime (a long commodity signal during Dollar Stress), reduce size or wait. Always read the regime first, then the individual signal.

[[BOLD]]Useful link:[[/]] background on risk-on / risk-off regimes — https://www.investopedia.com/terms/r/risk-on-risk-off.asp`,
                    uk: `Панель Макро-контексту на вкладках Робочий простір та Макро читає чотири живі індикатори — VIX, криву дохідності, Індекс долара та S&P 500 — і поєднує їх в єдину загальну мітку режиму. Нижче — повний словник кожного режиму та окремого показника, який ви побачите, що він означає і як до нього ставитися в торгівлі.

[[BOLD_UPPER]]Спершу — що таке EM (ринки, що розвиваються)?[[/]]

EM розшифровується як Emerging Markets — фінансові ринки країн, що розвиваються, таких як Бразилія, Індія, Туреччина, Південна Африка, Мексика, Індонезія та багато інших. Їх об'єднують у групу, бо вони поводяться схоже: вони мають вищі темпи зростання, але й вищий ризик, і вони дуже чутливі до долара США.

Чому долар так сильно впливає на ринки, що розвиваються: багато урядів та компаній цих країн позичають гроші в доларах США. Коли долар зміцнюється, ці борги стають дорожчими для повернення в місцевій валюті, капітал тікає назад у безпеку Сполучених Штатів, і активи цих ринків падають. Коли долар слабшає — відбувається протилежне: гроші течуть у ринки, що розвиваються, шукаючи вищої дохідності, і їхні активи зростають. Саме тому Індекс долара, що зміцнюється, описується як «ведмежий для сировини та ринків, що розвиваються» — він висмоктує гроші з ризикованіших куточків світу.

[[BOLD_UPPER]]Сім комбінованих міток режиму[[/]]

[[BOLD]]Risk-On Експансія[[/]] — VIX низький, крива дохідності здорова, долар стабільний або слабшає, акції зростають. Це найсприятливіше середовище для прийняття ризику. Довгі позиції по активах зростання, сировині та ризикових валютах мають вітер у спину. Торгуйте довгі сигнали COT з нормальною-до-повної переконаністю.

[[BOLD]]Сприятливий / Конструктивний[[/]] — умови загалом підтримуючі, але не ейфоричні. Надійне середовище для вибіркових довгих угод. Підтверджуйте кожну конфігурацію окремо, але макро-фон не працює проти вас.

[[BOLD]]Змішаний / Перехідний[[/]] — чотири індикатори надсилають суперечливі сигнали, часто тому, що ринок переходить з одного режиму в інший. Це прапор обережності. Зменшіть розміри позицій, будьте дуже вибірковими і зачекайте, поки картина проясниться, перш ніж робити широкі спрямовані ставки.

[[BOLD]]Пізній цикл / Стиснення[[/]] — крива дохідності стає плоскою, волатильність повзе вгору, моментум зростання згасає. Historically цей режим з'являється в зрілій фазі економічної експансії, перед спадом. Віддавайте перевагу захисним активам, підтягуйте ризик і будьте скептичними до агресивних довгих сигналів на активах зростання.

[[BOLD]]Попередження про інверсію[[/]] — крива дохідності інвертувалася (короткострокові ставки вище довгострокових). Historically це один з найнадійніших сигналів рецесії, який зазвичай випереджає спад на дванадцять-вісімнадцять місяців. Це не означає продавати все сьогодні, але це вагома причина бути захисним, зменшити кредитне плече і ставитися до довгих сигналів на акціях з додатковим скептицизмом.

[[BOLD]]Стрес долара / Тиск на ринки, що розвиваються[[/]] — Індекс долара різко зміцнюється, що висмоктує гроші з ринків, що розвиваються, і тисне на сировину. У цьому режимі будьте обережні з довгими позиціями в золоті, сріблі, нафті та всьому, що оцінюється в доларах або пов'язане з ринками, що розвиваються. Натомість цей режим може підтримувати короткі конфігурації на тих самих активах.

[[BOLD]]Risk-Off / Стрес[[/]] — VIX високий, акції падають, гроші тікають у безпеку. Це середовище, кероване страхом. Перевага захисним активам (долар США, золото як тиха гавань, державні облігації, японська єна). Довгі сигнали на ризикових активах борються із сильним зустрічним вітром. Однак екстремальні значення в цьому режимі іноді відмічають контраріанські дна — коли всі вже продали, тиск на продаж вичерпується.

[[BOLD_UPPER]]Окремі показники VIX[[/]]

[[BOLD]]Самозаспокоєння[[/]] (VIX нижче ~15) — ринки спокійні до безтурботності. Парадоксально небезпечно: низький страх часто передує різким розворотам, бо всі вже позиціоновані на хороші часи.
[[BOLD]]Спокій[[/]] (VIX ~15-20) — нормальні, здорові умови для слідування за трендом.
[[BOLD]]Підвищений[[/]] (VIX ~20-30) — невизначеність зростає. Зменшіть розмір позиції і стежте за стрибками волатильності.
[[BOLD]]Страх[[/]] (VIX ~30-40) — домінує режим уникнення ризику; перевага захисному позиціонуванню.
[[BOLD]]Екстремальний страх[[/]] (VIX вище ~40) — територія кризи. Контраріанські довгі можливості можуть почати з'являтися, коли паніка досягає піку.

[[BOLD_UPPER]]Окремі показники кривої дохідності[[/]]

[[BOLD]]Крута[[/]] — довгострокові ставки значно вище короткострокових; оптимізм зростання, рання фаза експансії. Підтримує ризик.
[[BOLD]]Нормальна[[/]] — здоровий позитивний нахил; сприятливий макро-фон.
[[BOLD]]Плоска[[/]] — розрив майже закрився; попередження пізнього циклу. Стежте за інверсією.
[[BOLD]]Інвертована[[/]] — короткострокові ставки вище довгострокових; класичне попередження про рецесію, описане вище.

[[BOLD_UPPER]]Окремі показники Індексу долара[[/]]

[[BOLD]]Зміцнюється[[/]] — ведмеже для сировини та ринків, що розвиваються; гроші ротуються в долар.
[[BOLD]]Слабшає[[/]] — підтримує золото, сировину та ринки, що розвиваються; гроші залишають долар заради вищої дохідності.
[[BOLD]]Нейтральний[[/]] — зараз немає сильного спрямованого сигналу від долара.

[[BOLD_UPPER]]Як використовувати все це разом[[/]]

Режим Макро-контексту — це ваш прогноз погоди. Він не говорить, який конкретний актив торгувати — для цього є сигнали COT — але він говорить, чи сприяють загальні умови прийняттю ризику чи захисту капіталу. Золоте правило: коли сигнал COT узгоджується з макро-режимом (наприклад, довгий сировинний сигнал під час Risk-On Експансії зі слабшаючим доларом), конфігурація набагато сильніша. Коли сигнал COT бореться з макро-режимом (довгий сировинний сигнал під час Стресу долара), зменшіть розмір або зачекайте. Завжди читайте спершу режим, потім окремий сигнал.

[[BOLD]]Корисне посилання:[[/]] довідка про режими схильності та уникнення ризику — https://www.investopedia.com/terms/r/risk-on-risk-off.asp`
                }
            },
            {
                title: {
                    en: "Macro Regime: Growth, Inflation, and Policy segments",
                    uk: "Макро режим: сегменти Зростання, Інфляція та Монетарна політика"
                },
                content: {
                    en: `Macro Regime takes COT positioning data across three groups of assets and calculates a composite score for each group. This gives you an x-ray of the entire market through the eyes of institutional money.

[[BOLD_UPPER]]Growth segment — equity indices[[/]]

Includes the S&P 500, Nasdaq 100, and Dow Jones Industrial Average. The composite score shows where hedge funds are positioned in stock index futures.

When the Growth score is above 65, hedge funds collectively believe in economic growth and are actively buying stock indices. This is a risk-on environment that supports long positions across most asset classes. When the score is below 35, hedge funds are exiting risk and expect a slowdown. In this environment, even good signals on individual instruments lose some of their value, because the macroeconomic backdrop does not support them.

[[BOLD_UPPER]]Inflation segment — commodities[[/]]

Includes gold, silver, copper, and crude oil. The composite score shows whether the inflation trade is currently active.

When the Inflation score is above 65, funds are actively buying inflation-sensitive assets, expecting either inflation growth or dollar weakening. When the score is below 35, the inflation trade is dying down — funds expect deflationary pressure or a strong dollar environment.

[[BOLD_UPPER]]Policy segment — currencies[[/]]

Includes the US dollar index, euro, Japanese yen, British pound, and Swiss franc. The composite score reflects expectations regarding the monetary policy of the Federal Reserve and other central banks.

When the Policy score is above 65, the dollar dominates and funds bet on Fed tightening. This is a hawkish environment that puts pressure on gold and risk assets. When the score is below 35, funds expect monetary easing, the dollar weakens — a dovish environment favorable for gold and risk assets.

[[BOLD_UPPER]]How to read the composite score[[/]]

The Composite is the average of three segments. For example: Growth is at 72, Inflation is at 68, Policy is at 30-one — the composite score is 57. Formally this is a neutral zone, but in reality there is a divergence: the inflation trade and growth are active, but Policy does not support them. This is a warning of possible instability and an internal contradiction within the macroeconomic regime.

[[BOLD]]Practical rule:[[/]] if all three segments are above 65 — this is a strong risk-on regime, the most favorable environment for aggressive trades. If all three are below 35 — strong risk-off, time for defensive positions. If the segments diverge significantly — be especially careful, the market is not synchronized.

[[BOLD]]Useful link:[[/]] Investopedia explanation of risk-on / risk-off regimes — https://www.investopedia.com/terms/r/risk-on-risk-off.asp`,
                    uk: `Макро режим бере дані позиціонування зі звіту COT по трьох групах активів і розраховує композитний показник для кожної групи. Це дає вам рентгенівський знімок усього ринку очима інституційних грошей.

[[BOLD_UPPER]]Сегмент Зростання — фондові індекси[[/]]

Включає S&P 500, Nasdaq 100 та Dow Jones Industrial Average. Композитний показник демонструє, де знаходяться позиції хедж-фондів у ф'ючерсах на фондові індекси.

Коли показник Зростання вище шістдесяти п'яти, хедж-фонди колективно вірять в економічне зростання і активно купують фондові індекси. Це сприятливе для ризику середовище. Коли показник нижче тридцяти п'яти, хедж-фонди виходять із ризику і очікують уповільнення. У цьому середовищі навіть хороші сигнали на окремих інструментах втрачають частину своєї цінності, бо макроекономічний фон їх не підтримує.

[[BOLD_UPPER]]Сегмент Інфляція — сировинні товари[[/]]

Включає золото, срібло, мідь та сиру нафту. Композитний показник демонструє, чи активний зараз інфляційний трейд.

Коли показник Інфляції вище шістдесяти п'яти, фонди активно купують активи, чутливі до інфляції, очікуючи або зростання інфляції, або послаблення долара. Коли показник нижче тридцяти п'яти, інфляційний трейд згасає — фонди очікують дефляційного тиску або сильного долара.

[[BOLD_UPPER]]Сегмент Монетарна політика — валюти[[/]]

Включає індекс долара США, євро, японську єну, британський фунт та швейцарський франк. Показник відображає очікування щодо монетарної політики Федерального резерву та інших центральних банків.

Коли показник Монетарної політики вище шістдесяти п'яти, домінує долар і фонди роблять ставку на жорсткішу монетарну політику. Це яструбине середовище, яке чинить тиск на золото та ризикові активи. Коли показник нижче тридцяти п'яти, фонди очікують пом'якшення — голубине середовище, сприятливе для золота та ризикових активів.

[[BOLD_UPPER]]Як читати композитний показник[[/]]

Композитний показник — це середнє значення трьох сегментів. Наприклад: Зростання на рівні сімдесяти двох, Інфляція на рівні шістдесяти восьми, Монетарна політика на рівні тридцяти одного — композитний показник дорівнює п'ятдесяти семи. Формально нейтральна зона, але насправді присутнє розходження: інфляційний трейд та зростання активні, але Монетарна політика їх не підтримує. Це попередження про можливу нестабільність всередині макроекономічного режиму.

[[BOLD]]Практичне правило:[[/]] якщо всі три сегменти вище шістдесяти п'яти — сильний режим схильності до ризику, найсприятливіше середовище для агресивних угод. Якщо всі три нижче тридцяти п'яти — сильний режим уникнення ризику, час захисних позицій. Якщо сегменти суттєво розходяться — будьте особливо обережні.

[[BOLD]]Корисне посилання:[[/]] пояснення режимів схильності та уникнення ризику — https://www.investopedia.com/terms/r/risk-on-risk-off.asp`
                }
            },
            {
                title: {
                    en: "Top Active Signals: how to read the six circles",
                    uk: "Топ активних сигналів: як читати шість кружечків"
                },
                content: {
                    en: `The six circles in the Top Active Signals block show assets with the best COT setup right now. This is a quick way to spot the most actionable opportunities without diving into details for every instrument.

[[BOLD_UPPER]]Color and arrow direction[[/]]

A green circle with an upward arrow means long bias — hedge funds are positioned for growth of this asset. A red circle with a downward arrow means short bias — hedge funds expect a decline. The color reflects only the direction, not the strength.

[[BOLD_UPPER]]The number inside — Priority Score from zero to 100[[/]]

This is a comprehensive assessment that combines four factors. Forty percent comes from the strength of COT positioning — how extreme it is relative to the three-year range. Twenty percent comes from the freshness of the signal — how recently it appeared. Twenty percent comes from seasonality — does the current calendar period historically support this direction? Twenty percent comes from the macroeconomic context — do the regime segments agree with the signal direction?

[[BOLD_UPPER]]Practical examples[[/]]

Gold shows a score of 84 with a green upward arrow. This means: hedge funds are near three-year highs in long positions (COT Index around 80-eight), seasonality supports the long direction, the Inflation segment of the macro regime is also bullish, and the signal appeared two to three weeks ago — relatively fresh. This is a high-conviction long setup that deserves serious attention.

The euro shows a score of 60-two with a red downward arrow. This means: hedge funds lean toward short positions but not extremely (COT Index around 28), the Policy segment of the macro regime does not fully support the bearish direction, and the freshness of the signal is moderate. This is a developing setup — worth monitoring but not yet time to act aggressively.

[[BOLD_UPPER]]How to interact[[/]]

Clicking any circle opens the full Asset Explorer for that instrument, where you will see detailed COT data, seasonality, AI commentary, and confirmation checklist. The circles are intended for quick scanning — the actual decision is always made in the Explorer.

[[BOLD]]Practical rule:[[/]] focus on assets with a Priority Score above 70. Scores from 70 to 84 are strong setups. Scores above 85 are rare high-conviction signals. Scores below 60 are developing configurations worth watching but not entering yet.`,
                    uk: `Шість кружечків у блоці Топ активних сигналів показують активи з найкращою конфігурацією за звітом COT прямо зараз. Це швидкий спосіб помітити найбільш дієві можливості без занурення в деталі кожного інструмента.

[[BOLD_UPPER]]Колір та напрямок стрілки[[/]]

Зелений кружечок зі стрілкою вгору означає бичачий ухил — хедж-фонди позиціоновані на зростання цього активу. Червоний кружечок зі стрілкою вниз означає ведмежий ухил — хедж-фонди очікують падіння. Колір відображає лише напрямок, а не силу сигналу.

[[BOLD_UPPER]]Число всередині — Оцінка пріоритету від нуля до ста[[/]]

Це комплексна оцінка, що поєднує чотири фактори. Сорок відсотків — сила позиціонування за звітом COT, наскільки воно екстремальне відносно трирічного діапазону. Двадцять відсотків — свіжість сигналу, як давно він з'явився. Двадцять відсотків — сезонність, чи підтримує поточний календарний період цей напрямок historically. Двадцять відсотків — макроекономічний контекст, чи узгоджуються сегменти режиму з напрямком сигналу.

[[BOLD_UPPER]]Практичні приклади[[/]]

Золото показує оцінку вісімдесят чотири із зеленою стрілкою вгору. Це означає: хедж-фонди знаходяться поблизу трирічних максимумів за довгими позиціями (Індекс COT близько вісімдесяти восьми), сезонність підтримує бичачий напрямок, сегмент Інфляції макроекономічного режиму також бичачий, а сигнал з'явився два-три тижні тому — відносно свіжий. Це конфігурація для довгої позиції з високою впевненістю, яка заслуговує на серйозну увагу.

Євро показує оцінку шістдесят два із червоною стрілкою вниз. Це означає: хедж-фонди схиляються до коротких позицій, але не екстремально (Індекс COT близько двадцяти восьми), сегмент Монетарної політики макрорежиму не повністю підтримує ведмежий напрямок, а свіжість сигналу помірна. Це конфігурація, що розвивається — варто спостерігати, але ще не час діяти агресивно.

[[BOLD_UPPER]]Як взаємодіяти[[/]]

Клік на будь-якому кружечку відкриває повний Дослідник активів для цього інструмента, де ви побачите детальні дані COT, сезонність, коментар штучного інтелекту та контрольний список підтвердження. Кружечки призначені для швидкого сканування — фактичне рішення завжди приймається в Дослідникові.

[[BOLD]]Практичне правило:[[/]] фокусуйтеся на активах з Оцінкою пріоритету вище сімдесяти. Оцінки від сімдесяти до вісімдесяти чотирьох — сильні конфігурації. Вище вісімдесяти п'яти — рідкісні сигнали з високою впевненістю. Нижче шістдесяти — конфігурації, що розвиваються, які варто спостерігати, але не входити в них.`
                }
            },
            {
                title: {
                    en: "COT Heatmap: a panoramic view of all 25 assets",
                    uk: "Теплова карта COT: панорамний огляд усіх двадцяти п'яти активів"
                },
                content: {
                    en: `The Heatmap lets you see the entire tracked universe in one panel. The goal is to understand the overall positioning picture in 10 seconds and spot interesting candidates for deeper analysis.

[[BOLD_UPPER]]Structure of each card[[/]]

Top left — the asset symbol. Top right — the weekly shift of the COT Index with an arrow, for example plus five point two means the COT Index grew by five point two points over the week. The large number in the center is the current COT Index value from zero to 100. The text at the bottom is the current flow state of the asset.

[[BOLD_UPPER]]Color logic of the frame[[/]]

A dark green frame means the COT Index is at or above 90 — this is a crowded long zone, dangerous because of the risk of forced position liquidation. A green frame means the COT Index is between 65 and 89 — a healthy bullish zone, the most reliable for long trades. A red frame means the COT Index is between 11 and 35 — a bearish zone, optimal for short positions. A dark red frame means the COT Index is at or below 10 — a crowded short zone with squeeze potential. A gray frame is the neutral zone between 35 and 65.

[[BOLD_UPPER]]How to scan effectively[[/]]

Move through the Heatmap from left to right by sectors. Look for assets where two conditions are simultaneously met: a brightly colored frame AND a directional arrow pointing the same way. For example, gold with a green frame and an upward arrow of plus five point two means hedge funds are actively adding long positions and are already in the bullish zone. This is a candidate worth opening in Explorer for further analysis.

[[BOLD_UPPER]]Extreme zones require special attention[[/]]

Assets with a COT Index above 90 or below 10 are at statistical extremes. Such positioning rarely lasts long. Either the trend continues with profit-taking, or a sharp reversal happens due to liquidation of crowded positions. Working with extreme zones always requires tighter risk control and smaller position sizes.

[[BOLD_UPPER]]Cross-sector patterns[[/]]

If most assets in the commodities sector simultaneously have green frames, this is a sign of a synchronized inflation trade. If currencies other than the dollar all turn red, this is dollar dominance. These cross-asset patterns are valuable signals about the overall market regime that you cannot see by looking at individual assets in isolation.`,
                    uk: `Теплова карта дозволяє побачити весь відстежуваний всесвіт активів в одній панелі. Мета — за десять секунд зрозуміти загальну картину позиціонування і помітити цікавих кандидатів для глибшого аналізу.

[[BOLD_UPPER]]Структура кожної картки[[/]]

Зверху ліворуч — символ активу. Зверху праворуч — тижневий зсув Індексу COT зі стрілкою, наприклад плюс п'ять цілих дві десятих означає, що Індекс COT виріс на п'ять цілих дві десятих пункту за тиждень. Велике число в центрі — поточне значення Індексу COT від нуля до ста. Текст знизу — поточний стан потоку активу.

[[BOLD_UPPER]]Кольорова логіка рамки[[/]]

Темно-зелена рамка означає Індекс COT на рівні дев'яноста або вище — зона перенасиченого лонгу, небезпечна через ризик примусового закриття позицій. Зелена рамка — Індекс COT між шістдесятьма п'ятьма та вісімдесятьма дев'ятьма — здорова бичача зона, найнадійніша для довгих угод. Червона рамка — Індекс COT між одинадцятьма та тридцятьма п'ятьма — ведмежа зона, оптимальна для коротких позицій. Темно-червона рамка — Індекс COT на рівні десяти або нижче — зона перенасиченого шорту з потенціалом сквізу. Сіра рамка — нейтральна зона між тридцятьма п'ятьма та шістдесятьма п'ятьма.

[[BOLD_UPPER]]Як ефективно сканувати[[/]]

Переглядайте Теплову карту зліва направо по секторах. Шукайте активи, де одночасно виконуються дві умови: яскраво забарвлена рамка І стрілка напрямку вказує в той самий бік. Наприклад, золото з зеленою рамкою і стрілкою вгору на плюс п'ять цілих дві десятих — хедж-фонди активно додають довгі позиції і вже знаходяться в бичачій зоні. Це кандидат, якого варто відкрити в Дослідникові для подальшого аналізу.

[[BOLD_UPPER]]Екстремальні зони вимагають особливої уваги[[/]]

Активи з Індексом COT вище дев'яноста або нижче десяти знаходяться на статистичних екстремумах. Таке позиціонування рідко триває довго. Або тренд продовжиться з фіксацією прибутку, або відбудеться різкий розворот через примусове закриття скупчених позицій. Робота з екстремальними зонами завжди вимагає жорсткішого контролю ризиків і менших розмірів позицій.

[[BOLD_UPPER]]Міжсекторні патерни[[/]]

Якщо більшість активів у сировинному секторі одночасно мають зелені рамки — це ознака синхронізованого інфляційного трейду. Якщо валюти крім долара всі стають червоними — це домінування долара. Такі крос-активні патерни є цінними сигналами про загальний режим ринку, які неможливо побачити, дивлячись на окремі активи ізольовано.`
                }
            },
            {
                title: {
                    en: "Economic Calendar and Market News",
                    uk: "Економічний календар та Ринкові новини"
                },
                content: {
                    en: `These two blocks provide context that cannot be extracted from COT data alone. The COT report shows where the money is positioned, but the calendar and news tell you what is happening right now and what can move the market in the coming days.

[[BOLD_UPPER]]Economic Calendar[[/]]

Shows upcoming releases of macroeconomic data and central bank decisions for the next two weeks. Events are marked by importance — high, medium, and low.

High-importance events are highlighted with a red border. These are the most market-moving releases: Federal Reserve interest rate decisions, European Central Bank decisions, nonfarm payrolls, unemployment rate, Consumer Price Index, Producer Price Index, Gross Domestic Product, and key business activity indices.

[[BOLD_UPPER]]How to use the calendar with COT signals[[/]]

Suppose you found a strong long signal for gold on Monday with a Priority Score of 85. You check the calendar and see that on Wednesday the Federal Reserve is announcing its interest rate decision. This is a serious factor of uncertainty. The wise approach is either to wait for the announcement and enter afterward, or to enter with a reduced position size. The signal will still be there after the announcement, but the risk around a Federal Reserve decision can destroy even the highest-quality setup.

[[BOLD_UPPER]]Calendar filters[[/]]

You can filter by importance level — only high, only medium, or all events. You can also filter by country — United States, European Union, United Kingdom, Japan, Canada, Australia, and others. For most traders the most relevant events are those of the United States and the eurozone, but if you trade the British pound or Japanese yen — filter by the corresponding countries.

[[BOLD_UPPER]]Market News[[/]]

Aggregates news from official sources — the Federal Reserve System, the European Central Bank, the CFTC, the Bureau of Labor Statistics, Reuters, ForexLive, and others. High-importance news items are highlighted with a red border, the source is shown in blue.

[[BOLD_UPPER]]Why official sources matter[[/]]

Social networks and analytical aggregators often distort or editorialize news. The original press release from the Federal Reserve gives you the exact wording, which can differ radically from secondary headlines. Reading news directly from the source develops your independent judgment and reduces vulnerability to manipulation and misinformation.

[[BOLD]]Useful link:[[/]] Federal Reserve publication schedule — https://www.federalreserve.gov/newsevents/calendar.htm`,
                    uk: `Ці два блоки дають контекст, який неможливо здобути з даних COT окремо. Звіт COT показує, де позиціоновані гроші, але календар і новини розповідають вам, що відбувається прямо зараз і що може зрушити ринок у найближчі дні.

[[BOLD_UPPER]]Економічний календар[[/]]

Показує майбутні релізи макроекономічних даних та рішення центральних банків на найближчі два тижні. Події позначені за важливістю — висока, середня та низька.

Події з високою важливістю виділені червоною рамкою. Це релізи, які найбільше рухають ринок: рішення Федерального резерву щодо процентної ставки, рішення Європейського центрального банку, дані про кількість робочих місць поза сільським господарством, рівень безробіття, Індекс споживчих цін, Індекс цін виробників, Валовий внутрішній продукт та ключові індекси ділової активності.

[[BOLD_UPPER]]Як використовувати календар разом із сигналами COT[[/]]

Припустимо, ви знайшли сильний сигнал на довгу позицію в золоті в понеділок з Оцінкою пріоритету вісімдесят п'ять. Перевіряєте календар і бачите, що в середу Федеральний резерв оголошує рішення щодо процентної ставки. Це серйозний фактор невизначеності. Розумний підхід — або зачекати на оголошення і увійти після нього, або увійти зі зменшеним розміром позиції. Сигнал нікуди не дінеться після оголошення, а ризик навколо рішення Федерального резерву може зруйнувати навіть найякіснішу конфігурацію.

[[BOLD_UPPER]]Фільтри календаря[[/]]

Ви можете фільтрувати за рівнем важливості — тільки висока, тільки середня або всі події. Також можна фільтрувати за країнами — Сполучені Штати Америки, Європейський Союз, Велика Британія, Японія, Канада, Австралія та інші. Для більшості трейдерів найбільш релевантні події Сполучених Штатів та єврозони, але якщо ви торгуєте британським фунтом або японською єною — відфільтруйте за відповідними країнами.

[[BOLD_UPPER]]Ринкові новини[[/]]

Агрегують новини з офіційних джерел — Федерального резерву, Європейського центрального банку, Комісії з торгівлі товарними ф'ючерсами США, Бюро статистики праці, Reuters, ForexLive та інших. Новини з високою важливістю виділені червоною рамкою, джерело позначено синім кольором.

[[BOLD_UPPER]]Чому важливі офіційні джерела[[/]]

Соціальні мережі та аналітичні агрегатори часто спотворюють або інтерпретують новини. Першоджерело прес-релізу Федерального резерву дає вам точне формулювання, яке може кардинально відрізнятися від вторинних заголовків. Читання новин безпосередньо з першоджерела розвиває самостійне судження і знижує вразливість до маніпуляцій.

[[BOLD]]Корисне посилання:[[/]] графік публікацій Федерального резерву — https://www.federalreserve.gov/newsevents/calendar.htm`
                }
            }
        ]
    },

    // ── 2. COT SUMMARY ──────────────────────────────────────────────────────────
    {
        key: "cot",
        icon: "≡",
        color: "#a78bfa",
        title: {
            en: "COT Summary",
            uk: "Зведення COT"
        },
        summary: {
            en: "The complete positioning table. Understanding who stands where in the futures market is the foundation of every analysis on this platform.",
            uk: "Повна таблиця позиціонування. Розуміння того, хто де стоїть на ф'ючерсному ринку, є основою кожного аналізу на цій платформі."
        },
        blocks: [
            {
                title: {
                    en: "What the COT report is and where the data comes from",
                    uk: "Що таке звіт COT і звідки беруться дані"
                },
                content: {
                    en: `The CFTC — Commodity Futures Trading Commission, the American regulator of derivatives markets — requires all large market participants to report their futures positions every week. This data is compiled into the Commitments of Traders report and published publicly.

[[BOLD_UPPER]]Publication schedule[[/]]

The report is published every Friday at 3:30 PM Eastern Time and contains data as of Tuesday of the same week. This means there is a lag of approximately three and a half days between reality and publication. By the time you read the report on Friday evening, the data inside reflects Tuesday's close.

[[BOLD_UPPER]]Two types of reports[[/]]

The TFF report, which stands for Traders in Financial Futures, covers financial futures: currency pairs, stock indices, VIX volatility index, US Treasury bonds, and cryptocurrencies. The Disaggregated report covers commodity futures: gold, silver, copper, crude oil, natural gas, grains, soft commodities like coffee and cocoa. The platform automatically determines which report type to use for each asset.

[[BOLD_UPPER]]Why this data matters[[/]]

The COT report is one of the few publicly available sources that shows you what institutional money is actually doing — not what analysts are saying or what headlines claim, but actual positions held by the largest players in the market. This is the closest thing to seeing the cards of the biggest players at the table.

[[BOLD]]Useful link:[[/]] official CFTC COT report archive and explanation — https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm`,
                    uk: `CFTC — Комісія з торгівлі товарними ф'ючерсами, американський регулятор ринків деривативів — зобов'язує всіх великих учасників ринку щотижня звітувати про свої позиції у ф'ючерсах. Ці дані збираються у звіт про зобов'язання трейдерів і публікуються у відкритому доступі.

[[BOLD_UPPER]]Графік публікацій[[/]]

Звіт публікується щоп'ятниці о 15:30 за східним часом США і містить дані станом на вівторок того ж тижня. Це означає, що між реальністю і публікацією існує лаг приблизно три з половиною дні. На момент, коли ви читаєте звіт у п'ятницю ввечері, дані всередині відображають закриття вівторка.

[[BOLD_UPPER]]Два типи звітів[[/]]

Звіт TFF, що розшифровується як Трейдери у фінансових ф'ючерсах, охоплює фінансові ф'ючерси: валютні пари, фондові індекси, індекс волатильності VIX, казначейські облігації США та криптовалюти. Деталізований звіт охоплює товарні ф'ючерси: золото, срібло, мідь, сиру нафту, природний газ, зернові, м'які товари як кава та какао. Платформа автоматично визначає, який тип звіту використовувати для кожного активу.

[[BOLD_UPPER]]Чому ці дані важливі[[/]]

Звіт COT — одне з небагатьох загальнодоступних джерел, яке показує вам, що інституційні гроші насправді роблять — не те, що кажуть аналітики або стверджують заголовки, а реальні позиції, які тримають найбільші гравці на ринку. Це найближче до того, щоб побачити карти найбільших гравців за столом.

[[BOLD]]Корисне посилання:[[/]] офіційний архів звітів COT та пояснення від CFTC — https://www.cftc.gov/MarketReports/CommitmentsofTraders/index.htm`
                }
            },
            {
                title: {
                    en: "Who is who: Leveraged Funds, Asset Managers, Dealers, and Producers",
                    uk: "Хто є хто: Хедж-фонди з плечем, Керуючі активами, Дилери та Виробники"
                },
                content: {
                    en: `Understanding the different trader categories is essential before reading any COT data. Each group has a different motivation for holding positions.

[[BOLD_UPPER]]Leveraged Funds (hedge funds and CTAs)[[/]]

This is the "smart money" — speculative players who take directional bets using leverage. Commodity Trading Advisors, also known as CTAs, are systematic trend-following funds that use algorithms. Together with hedge funds, they form the most closely watched group in the COT report.

When they aggressively buy — the trend is confirmed. When they are at the peak of a long position — the market is crowded, reversal risk is elevated. When they are at the peak of a short position — there is squeeze potential if they are wrong. Their positioning is the primary signal source on this platform.

[[BOLD_UPPER]]Asset Managers (pension funds and long-only funds)[[/]]

Slower and more conservative than Leveraged Funds. They represent the long-term macro view of the world's largest institutional money — pension funds, sovereign wealth funds, insurance companies. They do not trade frequently, but when they shift positioning, it reflects a fundamental change in view. When both Asset Managers and Leveraged Funds are simultaneously in long positions — this is a strong confluence of institutional conviction.

[[BOLD_UPPER]]Dealers and Intermediaries (large banks)[[/]]

Banks are typically on the opposite side of Leveraged Funds — they hedge client flows and market-make. If Dealers are massively short while Leveraged Funds are massively long, and the price starts falling, Leveraged Funds may be forced to liquidate their longs, accelerating the move. Dealers' positioning is informative primarily as a counterbalance to hedge fund positioning.

[[BOLD_UPPER]]Producers and Merchants (in Disaggregated reports only)[[/]]

Oil companies, mining companies, grain farmers — they hedge their future production. An oil producer who plans to sell oil in six months will hedge by selling futures today, regardless of their directional view on price. This means Producers are almost always in a net short position in commodity futures — and this is completely normal, not a bearish signal. Never interpret Producer short positions as a market signal.

[[BOLD_UPPER]]Managed Money (in Disaggregated reports)[[/]]

This is the equivalent of Leveraged Funds for commodity markets — the speculative directional money. All the same rules apply: their positioning is the primary signal source for gold, silver, oil, and other commodities.

[[BOLD]]Useful link:[[/]] detailed CFTC explanation of each trader category — https://www.cftc.gov/idc/groups/public/@commitmentsoftraders/documents/file/tfmexplanatorynotes.pdf`,
                    uk: `Розуміння різних категорій трейдерів є необхідним перш ніж читати будь-які дані COT. Кожна група має різну мотивацію для утримання позицій.

[[BOLD_UPPER]]Хедж-фонди з плечем (хедж-фонди та CTA)[[/]]

Це "розумні гроші" — спекулятивні гравці, які роблять спрямовані ставки з використанням кредитного плеча. Радники з торгівлі товарними активами, також відомі як CTA, — це систематичні фонди слідування за трендом, що використовують алгоритми. Разом із хедж-фондами вони формують групу, за якою найуважніше стежать при читанні звіту COT.

Коли вони агресивно купують — тренд підтверджується. Коли вони знаходяться на піку довгої позиції — ринок перенасичений, ризик розвороту підвищений. Коли вони на піку короткої позиції — є потенціал для сквізу, якщо вони помиляються. Їхнє позиціонування є основним джерелом сигналів на цій платформі.

[[BOLD_UPPER]]Керуючі активами (пенсійні фонди та фонди тільки з довгими позиціями)[[/]]

Повільніші та консервативніші за хедж-фонди з плечем. Вони представляють довгостроковий макроекономічний погляд найбільших інституційних грошей світу — пенсійних фондів, суверенних фондів добробуту, страхових компаній. Вони не торгують часто, але коли вони змінюють позиціонування, це відображає фундаментальну зміну погляду. Коли одночасно і Керуючі активами, і Хедж-фонди з плечем знаходяться в довгих позиціях — це сильне збіжіння інституційної переконаності.

[[BOLD_UPPER]]Дилери та посередники (великі банки)[[/]]

Банки зазвичай знаходяться на протилежній стороні від Хедж-фондів з плечем — вони хеджують клієнтські потоки та виступають маркет-мейкерами. Якщо Дилери масово тримають короткі позиції, поки Хедж-фонди масово тримають довгі, і ціна починає падати, Хедж-фонди можуть бути змушені закрити свої довгі позиції, прискорюючи рух. Позиціонування Дилерів є інформативним насамперед як противага позиціонуванню хедж-фондів.

[[BOLD_UPPER]]Виробники та торговці (тільки в Деталізованих звітах)[[/]]

Нафтові компанії, гірничодобувні підприємства, фермери, що вирощують зернові — вони хеджують своє майбутнє виробництво. Нафтова компанія, яка планує продати нафту через шість місяців, захеджується, продаючи ф'ючерси сьогодні, незалежно від свого бачення напрямку ціни. Це означає, що Виробники майже завжди знаходяться в нетто-короткій позиції у товарних ф'ючерсах — і це абсолютно нормально, не ведмежий сигнал. Ніколи не інтерпретуйте короткі позиції Виробників як ринковий сигнал.

[[BOLD_UPPER]]Кошти під управлінням (в Деталізованих звітах)[[/]]

Це еквівалент Хедж-фондів з плечем для товарних ринків — спекулятивні спрямовані гроші. Застосовуються всі ті самі правила: їхнє позиціонування є основним джерелом сигналів для золота, срібла, нафти та інших сировинних товарів.

[[BOLD]]Корисне посилання:[[/]] детальне пояснення від CFTC про кожну категорію трейдерів — https://www.cftc.gov/idc/groups/public/@commitmentsoftraders/documents/file/tfmexplanatorynotes.pdf`
                }
            },
            {
                title: {
                    en: "COT Index from zero to 100: the most important number",
                    uk: "Індекс COT від нуля до ста: найважливіше число"
                },
                content: {
                    en: `The COT Index is a normalization of the net position of Leveraged Funds (or Managed Money for commodities) over the past 156 weeks, which equals three years.

[[BOLD_UPPER]]The formula[[/]]

COT Index equals the net position now minus the minimum over three years, divided by the maximum over three years minus the minimum over three years, multiplied by 100.

[[BOLD_UPPER]]What the result means[[/]]

A value of 100 means funds hold the largest long position of the past three years. A value of zero means funds hold the largest short position of the past three years. A value of 50 means funds are exactly in the middle of their three-year range — completely neutral.

[[BOLD_UPPER]]Key zones and their meaning[[/]]

A COT Index of 90 or above is a crowded long zone. Funds are at cycle highs. Even minor negative news can trigger a liquidation cascade where forced selling accelerates the price decline. A COT Index between 65 and 89 is the bullish zone. This is the best area for trend-following long positions — funds are clearly positioned long but not yet at dangerous extremes. A COT Index between 35 and 64 is the neutral zone. Additional confirmation from macro, seasonality, or momentum is required before taking action. A COT Index between 11 and 34 is the bearish zone. Optimal area for short bias — funds lean short but there is still room before an extreme. A COT Index of 10 or below is a crowded short zone. Squeeze potential is elevated. Do not add short positions here.

[[BOLD_UPPER]]Practical example with real numbers[[/]]

Gold net position right now: plus 100 and 45 thousand contracts. Minimum over three years: minus 25 thousand contracts. Maximum over three years: plus 100 and 85 thousand contracts.

The calculation: 100 and 45 thousand minus the negative 25 thousand equals 170 thousand. One hundred and 85 thousand minus the negative 25 thousand equals 210 thousand. One hundred and 70 thousand divided by 210 thousand multiplied by 100 equals 81.

Conclusion: Gold is in the bullish zone at 81. Funds are clearly positioned long but have not reached the extreme crowded zone above 90. This is a healthy long setup with room for further accumulation before danger.

[[BOLD]]Useful link:[[/]] Investopedia explanation of how COT data is used in trading — https://www.investopedia.com/terms/c/cot.asp`,
                    uk: `Індекс COT — це нормалізація нетто-позиції Хедж-фондів з плечем (або Коштів під управлінням для сировинних товарів) за останні сто п'ятдесят шість тижнів, що дорівнює трьом рокам.

[[BOLD_UPPER]]Формула[[/]]

Індекс COT дорівнює нетто-позиції зараз мінус мінімум за три роки, поділеному на максимум за три роки мінус мінімум за три роки, помноженому на сто.

[[BOLD_UPPER]]Що означає результат[[/]]

Значення сто означає, що фонди тримають найбільшу довгу позицію за останні три роки. Значення нуль означає, що фонди тримають найбільшу коротку позицію за останні три роки. Значення п'ятдесят означає, що фонди знаходяться рівно посередині свого трирічного діапазону — повністю нейтрально.

[[BOLD_UPPER]]Ключові зони та їх значення[[/]]

Індекс COT на рівні дев'яноста або вище — зона перенасиченого лонгу. Фонди знаходяться на циклічних максимумах. Навіть незначні негативні новини можуть спровокувати каскад примусового закриття позицій, де вимушені продажі прискорюють падіння ціни. Індекс COT між шістдесятьма п'ятьма та вісімдесятьма дев'ятьма — бичача зона. Це найкраща область для довгих позицій за трендом — фонди чітко позиціоновані в лонг, але ще не на небезпечних екстремумах. Індекс COT між тридцятьма п'ятьма та шістдесятьма чотирма — нейтральна зона. Потрібне додаткове підтвердження з боку макро, сезонності або моментуму. Індекс COT між одинадцятьма та тридцятьма чотирма — ведмежа зона. Оптимальна область для ведмежого ухилу — фонди схиляються до коротких позицій, але є ще простір до екстремуму. Індекс COT на рівні десяти або нижче — зона перенасиченого шорту. Потенціал для сквізу підвищений. Не додавайте короткі позиції тут.

[[BOLD_UPPER]]Практичний приклад із реальними числами[[/]]

Нетто-позиція золота зараз: плюс сто сорок п'ять тисяч контрактів. Мінімум за три роки: мінус двадцять п'ять тисяч контрактів. Максимум за три роки: плюс сто вісімдесят п'ять тисяч контрактів.

Розрахунок: сто сорок п'ять тисяч мінус негативні двадцять п'ять тисяч дорівнює сто сімдесят тисяч. Сто вісімдесят п'ять тисяч мінус негативні двадцять п'ять тисяч дорівнює двісті десять тисяч. Сто сімдесят тисяч поділити на двісті десять тисяч помножити на сто дорівнює вісімдесяти одному.

Висновок: золото знаходиться в бичачій зоні на рівні вісімдесяти одного. Фонди чітко позиціоновані в лонг, але ще не досягли екстремальної зони перенасиченості вище дев'яноста. Це здорова конфігурація для довгої позиції з простором для подальшого накопичення перед небезпечною зоною.

[[BOLD]]Корисне посилання:[[/]] пояснення Investopedia про те, як дані COT використовуються в торгівлі — https://www.investopedia.com/terms/c/cot.asp`
                }
            },
            {
                title: {
                    en: "Momentum: Direction, weekly change, averages, and acceleration",
                    uk: "Моментум: напрямок, тижнева зміна, середні значення та прискорення"
                },
                content: {
                    en: `Knowing the current COT Index level is important, but knowing the direction and speed of change is equally important. An asset at COT Index 68 moving upward rapidly is a very different setup from one at 68 moving downward.

[[BOLD_UPPER]]Direction arrows[[/]]

An upward arrow means the COT Index has been rising over the last four weeks — a net upward trend in positioning. A downward arrow means the COT Index has been falling. A horizontal arrow means the COT Index has been flat — neither building nor reducing positions.

[[BOLD_UPPER]]Week-over-Week change[[/]]

This is how many index points the COT Index moved in the most recent weekly report. A value of plus eight point three means funds aggressively added long exposure in a single week — this is a strong momentum signal. A value of minus two point one is a modest reduction — profit taking or a beginning of reversal? Context from the other momentum indicators helps determine which.

[[BOLD_UPPER]]Three-week and eight-week averages[[/]]

The three-week average is the short-term momentum gauge. The eight-week average is the medium-term trend. When the three-week average is above the eight-week average, the short-term momentum is stronger than the medium-term trend — a classic crossover signal of an accelerating move. When the three-week average is below the eight-week average, the recent momentum is weakening relative to the established trend.

[[BOLD_UPPER]]Versus Trend (COT Index minus eight-week average)[[/]]

This number tells you whether the current reading is above or below the recent trend. A positive value means the current COT Index is above the medium-term trend — positioning is stretching higher than recent history. A negative value means positioning is pulling back below the trend.

[[BOLD_UPPER]]Acceleration[[/]]

The acceleration state describes the speed of change. Accelerating means the rate of movement is increasing — funds are entering or exiting positions at a growing pace. Decelerating means the rate of movement is slowing down — watch for a potential stall or reversal. Stable means a consistent pace of positioning change.

[[BOLD_UPPER]]Practical example reading all five together[[/]]

COT Index is at 75. Week-over-week change is plus six point two. Three-week average is 70. Eight-week average is 60-two. Acceleration state is accelerating.

Reading: the asset is in the bullish zone, funds added strongly this week, the short-term average is above the medium-term average confirming the upward crossover, and the pace is increasing. This is a high-quality momentum-confirmed long setup.`,
                    uk: `Знати поточний рівень Індексу COT важливо, але знати напрямок і швидкість зміни так само важливо. Актив на рівні Індексу COT шістдесят вісім, що швидко рухається вгору, — це дуже відмінна конфігурація від того, що знаходиться на шістдесяти восьми та рухається вниз.

[[BOLD_UPPER]]Стрілки напрямку[[/]]

Стрілка вгору означає, що Індекс COT зростав протягом останніх чотирьох тижнів — загальний висхідний тренд у позиціонуванні. Стрілка вниз означає, що Індекс COT падав. Горизонтальна стрілка означає, що Індекс COT був стабільним — фонди ні нарощували, ні скорочували позиції.

[[BOLD_UPPER]]Тижнева зміна[[/]]

Це кількість пунктів індексу, на яку змінився Індекс COT у найновішому тижневому звіті. Значення плюс вісім цілих три десятих означає, що фонди агресивно додали довгі позиції за один тиждень — це сильний сигнал моментуму. Значення мінус дві цілих одна десята — скромне скорочення, фіксація прибутку чи початок розвороту? Контекст від інших показників моментуму допомагає визначити, що саме відбувається.

[[BOLD_UPPER]]Трьох- та восьмитижневі середні значення[[/]]

Трьохтижневе середнє є короткостроковим датчиком моментуму. Восьмитижневе середнє — середньостроковий тренд. Коли трьохтижневе середнє вище восьмитижневого, короткостроковий моментум сильніший за середньостроковий тренд — класичний сигнал перетину, що свідчить про прискорення руху. Коли трьохтижневе середнє нижче восьмитижневого, недавній моментум слабшає відносно встановленого тренду.

[[BOLD_UPPER]]Порівняно з трендом (Індекс COT мінус восьмитижневе середнє)[[/]]

Це число показує, чи знаходиться поточне значення вище або нижче недавнього тренду. Позитивне значення означає, що поточний Індекс COT вище середньострокового тренду — позиціонування розтягується вище недавньої історії. Від'ємне значення означає, що позиціонування відкочується нижче тренду.

[[BOLD_UPPER]]Прискорення[[/]]

Стан прискорення описує швидкість зміни. Прискорення означає, що темп руху збільшується — фонди входять або виходять з позицій із зростаючою швидкістю. Уповільнення означає, що темп руху сповільнюється — слідкуйте за можливою зупинкою або розворотом. Стабільний означає рівномірний темп зміни позиціонування.

[[BOLD_UPPER]]Практичний приклад читання всіх п'яти показників разом[[/]]

Індекс COT знаходиться на рівні сімдесяти п'яти. Тижнева зміна плюс шість цілих дві десятих. Трьохтижневе середнє сімдесят. Восьмитижневе середнє шістдесят два. Стан прискорення — прискорення.

Читання: актив знаходиться в бичачій зоні, фонди сильно додали на цьому тижні, короткострокове середнє вище середньострокового, що підтверджує висхідний перетин, а темп зростає. Це якісна конфігурація для довгої позиції, підтверджена моментумом.`
                }
            },
            {
                title: {
                    en: "Flow State: what the five states mean",
                    uk: "Стан потоку: що означають п'ять станів"
                },
                content: {
                    en: `Flow State is a qualitative label that summarizes the overall positioning regime of an asset in a single phrase. It is derived from the combination of the COT Index level and the direction of recent momentum.

[[BOLD_UPPER]]Long Extreme[[/]]

The COT Index is at or above 90. Funds hold historically maximum long exposure. This is the most dangerous zone for new long entries — the crowd is fully positioned and any negative catalyst can trigger a cascade of forced liquidations. If you are already in a profitable long position, tighten your stop loss significantly.

[[BOLD_UPPER]]Accumulation[[/]]

The COT Index is in the range from 65 to 89 and is moving upward or flat. Funds are actively building long positions. This is the most reliable zone for long trades — enough institutional conviction to sustain the move, but not yet at the extreme where reversal risk spikes.

[[BOLD_UPPER]]Neutral[[/]]

The COT Index is between 35 and 64. Funds have no strong directional conviction. The market is balanced and lacks a clear COT edge. In this state, technical analysis and macroeconomic context become more important since the COT signal alone is insufficient.

[[BOLD_UPPER]]Distribution[[/]]

The COT Index is in the range from 11 to 34 and is moving downward or flat. Funds are actively building short positions or unwinding longs. This is the most reliable zone for short trades — the mirror image of Accumulation. Rallies in this state are selling opportunities.

[[BOLD_UPPER]]Short Extreme[[/]]

The COT Index is at or below 10. Funds hold historically maximum short exposure. Squeeze potential is elevated — if the price moves against funds, they may be forced to cover shorts rapidly, creating a sharp upward move. Do not add new shorts here. This is potentially the setup for a long reversal trade if combined with macro and seasonality confirmation.`,
                    uk: `Стан потоку — це якісна мітка, яка узагальнює загальний режим позиціонування активу в одній фразі. Вона виводиться з поєднання рівня Індексу COT та напрямку недавнього моментуму.

[[BOLD_UPPER]]Екстремум лонгу[[/]]

Індекс COT знаходиться на рівні дев'яноста або вище. Фонди тримають історично максимальні довгі позиції. Це найнебезпечніша зона для нових довгих входів — натовп повністю позиціонований, і будь-який негативний каталізатор може спровокувати каскад примусових ліквідацій. Якщо ви вже знаходитеся в прибутковій довгій позиції, суттєво підтягніть стоп-лосс.

[[BOLD_UPPER]]Накопичення[[/]]

Індекс COT знаходиться в діапазоні від шістдесяти п'яти до вісімдесяти дев'яти і рухається вгору або є стабільним. Фонди активно нарощують довгі позиції. Це найнадійніша зона для довгих угод — достатньо інституційної переконаності для підтримки руху, але ще не на екстремумі, де ризик розвороту різко зростає.

[[BOLD_UPPER]]Нейтральний[[/]]

Індекс COT знаходиться між тридцятьма п'ятьма та шістдесятьма чотирма. Фонди не мають сильної спрямованої переконаності. Ринок збалансований і не має чіткої переваги за звітом COT. У цьому стані технічний аналіз та макроекономічний контекст стають важливішими, оскільки сигналу COT самого по собі недостатньо.

[[BOLD_UPPER]]Розподіл[[/]]

Індекс COT знаходиться в діапазоні від одинадцяти до тридцяти чотирьох і рухається вниз або є стабільним. Фонди активно нарощують короткі позиції або розгортають довгі. Це найнадійніша зона для коротких угод — дзеркальне відображення Накопичення. Ралі в цьому стані є можливостями для продажу.

[[BOLD_UPPER]]Екстремум шорту[[/]]

Індекс COT знаходиться на рівні десяти або нижче. Фонди тримають історично максимальні короткі позиції. Потенціал для сквізу підвищений — якщо ціна рухається проти фондів, вони можуть бути змушені швидко закрити короткі позиції, створюючи різкий рух вгору. Не додавайте нові короткі позиції тут. Це потенційно конфігурація для довгої позиції на розворот, якщо вона поєднується з підтвердженням від макро та сезонності.`
                }
            }
        ]
    },

    // ── 3. ASSET EXPLORER ───────────────────────────────────────────────────────
    {
        key: "explorer",
        icon: "◈",
        color: "#f59e0b",
        title: {
            en: "Asset Explorer",
            uk: "Дослідник активів"
        },
        summary: {
            en: "Deep dive into a single asset: positioning breakdown, momentum analysis, AI commentary, confirmation checklist, and seasonal curve.",
            uk: "Глибоке занурення в один актив: розбір позиціонування, аналіз моментуму, коментар штучного інтелекту, контрольний список підтвердження та сезонна крива."
        },
        blocks: [
            {
                title: {
                    en: "Setup Analysis: Setup Bias, Conviction, and Crowding",
                    uk: "Аналіз конфігурації: ухил конфігурації, переконаність та перенасиченість"
                },
                content: {
                    en: `The Setup Analysis block at the top of the Explorer gives you three numbers that together tell you the quality and risk profile of the current COT setup for this asset.

[[BOLD_UPPER]]Setup Bias — the directional label[[/]]

Long Extreme means the COT Index is at or above 90 — the largest long position in three years. Bullish Context means the COT Index is between 65 and 89 — funds lean long but not at dangerous extremes. Balanced means the COT Index is between 35 and 64 — no clear directional edge. Bearish Context means the COT Index is between 11 and 34 — funds lean short. Short Extreme means the COT Index is at or below 10 — the largest short position in three years.

[[BOLD_UPPER]]Conviction Score from zero to 100[[/]]

This measures how far the current positioning is from the neutral zone at 50. The formula is: the absolute value of the COT Index minus 50, multiplied by two.

A COT Index of 85 gives a Conviction Score of 70. A COT Index of 97 gives a Conviction Score of 94. A COT Index of 48 gives a Conviction Score of four — almost no conviction in either direction.

[[BOLD_UPPER]]Crowding — risk from overextension[[/]]

Extreme Crowding means the COT Index is at or above 90 or at or below 10. This is a warning: the crowd is fully positioned, and the risk of a sharp reversal from forced liquidation is at its highest. Elevated Crowding means the COT Index is between 75 and 89 or between 11 and 25 — caution, but not yet at the most dangerous extreme. Moderate Crowding means the COT Index is between 25 and 75 — normal operating zone with reasonable risk.

[[BOLD_UPPER]]How to combine the three numbers[[/]]

The ideal entry setup has: high Conviction (above 60), Moderate Crowding (the COT Index is not in the extreme zone), and a Setup Bias that matches your trade direction. When Conviction is high but Crowding is Extreme — you are late. The crowd is already in. Wait for the COT Index to pull back from the extreme before entering, or reduce your position size significantly.`,
                    uk: `Блок аналізу конфігурації у верхній частині Дослідника дає вам три числа, які разом розповідають про якість та профіль ризику поточної конфігурації COT для цього активу.

[[BOLD_UPPER]]Ухил конфігурації — спрямована мітка[[/]]

Екстремум лонгу означає, що Індекс COT знаходиться на рівні дев'яноста або вище — найбільша довга позиція за три роки. Бичачий контекст означає, що Індекс COT між шістдесятьма п'ятьма та вісімдесятьма дев'ятьма — фонди схиляються до лонгу, але не на небезпечних екстремумах. Збалансований означає, що Індекс COT між тридцятьма п'ятьма та шістдесятьма чотирма — немає чіткої спрямованої переваги. Ведмежий контекст означає, що Індекс COT між одинадцятьма та тридцятьма чотирма — фонди схиляються до шорту. Екстремум шорту означає, що Індекс COT на рівні десяти або нижче — найбільша коротка позиція за три роки.

[[BOLD_UPPER]]Оцінка переконаності від нуля до ста[[/]]

Це вимірює, наскільки далеко поточне позиціонування від нейтральної зони на рівні п'ятдесяти. Формула: абсолютне значення Індексу COT мінус п'ятдесят, помножене на два.

Індекс COT вісімдесят п'ять дає Оцінку переконаності сімдесят. Індекс COT дев'яносто сім дає Оцінку переконаності дев'яносто чотири. Індекс COT сорок вісім дає Оцінку переконаності чотири — майже жодної переконаності в жодному напрямку.

[[BOLD_UPPER]]Перенасиченість — ризик від перерозтягнення[[/]]

Екстремальна перенасиченість означає, що Індекс COT на рівні дев'яноста або вище, або на рівні десяти або нижче. Це попередження: натовп повністю позиціонований, і ризик різкого розвороту від примусової ліквідації є найвищим. Підвищена перенасиченість означає Індекс COT між сімдесятьма п'ятьма та вісімдесятьма дев'ятьма або між одинадцятьма та двадцятьма п'ятьма — обережність, але ще не на найнебезпечнішому екстремумі. Помірна перенасиченість означає Індекс COT між двадцятьма п'ятьма та сімдесятьма п'ятьма — нормальна операційна зона з розумним ризиком.

[[BOLD_UPPER]]Як поєднувати три числа[[/]]

Ідеальна конфігурація входу має: високу Переконаність (вище шістдесяти), Помірну перенасиченість (Індекс COT не знаходиться в екстремальній зоні) та Ухил конфігурації, що відповідає напрямку вашої угоди. Коли Переконаність висока, але Перенасиченість екстремальна — ви запізнилися. Натовп вже всередині. Зачекайте, поки Індекс COT відкотиться від екстремуму перед входом, або суттєво зменшіть розмір позиції.`
                }
            },
            {
                title: {
                    en: "Contextual Interpretation: reading the auto-generated analysis",
                    uk: "Контекстна інтерпретація: читання автоматично згенерованого аналізу"
                },
                content: {
                    en: `The Contextual Interpretation text is generated automatically from real COT numbers for this specific asset — it is not a generic template. Every sentence reflects actual current data.

[[BOLD_UPPER]]Structure of the text[[/]]

The first block describes the current positioning regime: whether funds are in a crowded long, constructive long, neutral, bearish, or crowded short state. It also explains what this means for trade direction — for example, whether rallies are buying or selling opportunities.

The second block covers momentum context. Is the move accelerating or decelerating? How many index points did funds add or remove this week? Is the short-term average above or below the long-term average, and what does the crossover relationship tell us?

[[BOLD_UPPER]]How to read a bearish example[[/]]

WTI Oil, COT Index at 23: the text would read something like — bearish positioning confirmed, funds lean short without being at extremes, the backdrop supports selling rallies rather than buying dips. The move is decelerating — watch for a potential stall. This week funds reduced exposure modestly. The short-term average is slightly above the medium-term average, suggesting the downtrend may be losing momentum.

Reading this: the short bias is valid, but the deceleration signal warns against chasing new shorts aggressively. The correct approach is to wait for a rally into resistance and then look for a short entry there, rather than selling into a falling market.

[[BOLD_UPPER]]How to read a bullish example[[/]]

Silver, COT Index at 78: the text would read — accumulation phase confirmed, funds actively building long exposure. The move is accelerating — momentum is strengthening. Short-term average crossed above medium-term average this week, confirming trend strength. No crowding risk yet.

Reading this: active accumulation with accelerating momentum and no crowding danger. This is exactly the setup to focus on.

The Contextual Interpretation should always be read together with the Confirmation Checklist and the Seasonal Curve to form a complete picture before making any trading decision.`,
                    uk: `Текст контекстної інтерпретації генерується автоматично з реальних даних COT для цього конкретного активу — це не загальний шаблон. Кожне речення відображає фактичні поточні дані.

[[BOLD_UPPER]]Структура тексту[[/]]

Перший блок описує поточний режим позиціонування: чи перебувають фонди в стані перенасиченого лонгу, конструктивного лонгу, нейтральному, ведмежому чи в стані перенасиченого шорту. Він також пояснює, що це означає для напрямку торгівлі — наприклад, чи є ралі можливостями для купівлі або продажу.

Другий блок охоплює контекст моментуму. Чи прискорюється або сповільнюється рух? Скільки пунктів індексу фонди додали або прибрали цього тижня? Чи знаходиться короткострокове середнє вище або нижче довгострокового, і що говорить нам співвідношення перетину?

[[BOLD_UPPER]]Як читати ведмежий приклад[[/]]

Нафта WTI, Індекс COT на рівні двадцяти трьох: текст читатиметься приблизно так — ведмежа позиція підтверджена, фонди схиляються до коротких позицій, не перебуваючи на екстремумах, фон підтримує продаж на ралі, а не купівлю на зниженнях. Рух сповільнюється — слідкуйте за можливою зупинкою. Цього тижня фонди скромно скоротили позиції. Короткострокове середнє трохи вище середньострокового, що свідчить про можливу втрату імпульсу низхідного тренду.

Читання цього: ведмежий ухил є дійсним, але сигнал уповільнення застерігає від агресивного переслідування нових коротких позицій. Правильний підхід — чекати на ралі до рівня опору і там шукати короткий вхід, а не продавати на ринку, що падає.

[[BOLD_UPPER]]Як читати бичачий приклад[[/]]

Срібло, Індекс COT на рівні сімдесяти восьми: текст читатиметься — фаза накопичення підтверджена, фонди активно нарощують довгі позиції. Рух прискорюється — моментум посилюється. Короткострокове середнє перетнуло середньострокове вгору цього тижня, підтверджуючи силу тренду. Ризику перенасиченості поки що немає.

Читання цього: активне накопичення з прискоренням моментуму і без небезпеки перенасиченості. Це саме та конфігурація, на яку варто звернути увагу.

Контекстну інтерпретацію завжди слід читати разом із Контрольним списком підтвердження та Сезонною кривою, щоб сформувати повну картину перед прийняттям будь-якого торгового рішення.`
                }
            },
            {
                title: {
                    en: "Confirmation Checklist: four conditions for a quality signal",
                    uk: "Контрольний список підтвердження: чотири умови якісного сигналу"
                },
                content: {
                    en: `The Confirmation Checklist evaluates four independent conditions for the current asset. Each condition either passes or fails. Together they give you a quick quality score for the setup.

[[BOLD_UPPER]]Condition one: COT regime agrees with bias[[/]]

For a long signal: the COT Index must be at or above 65. For a short signal: the COT Index must be at or below 35. If the COT Index is in the neutral zone between 35 and 65, this condition fails — the positioning does not yet provide sufficient directional confirmation.

[[BOLD_UPPER]]Condition two: flow state is directional[[/]]

The Flow State must not be Neutral. It should be Accumulation or Long Extreme for long setups, and Distribution or Short Extreme for short setups. A Neutral flow state means the positioning has no clear direction and the signal lacks conviction.

[[BOLD_UPPER]]Condition three: not in the most crowded zone[[/]]

The COT Index must be between 11 and 89, meaning not in the extreme crowded zones. If the COT Index is above 89 or below 11, this condition fails — the crowding risk is too high to enter a new position with full size.

[[BOLD_UPPER]]Condition four: momentum confirms direction[[/]]

The acceleration state must be accelerating. A decelerating or stable momentum does not provide this confirmation. The move must be gaining speed, meaning funds are entering positions at an increasing rate.

[[BOLD_UPPER]]How to use the checklist[[/]]

All four conditions passing — this is an ideal setup, the highest quality you will find. Three of four conditions passing — this is a strong setup worth trading with standard position size. Two conditions passing — this is a developing setup. Watch it but reduce position size significantly if you choose to trade. One or zero conditions passing — skip this trade. Wait for a better entry.

[[BOLD_UPPER]]Practical example[[/]]

Silver: COT Index is at 78 (condition one passes, above 65). Flow State is Accumulation (condition two passes). COT Index is not in the extreme zone (condition three passes). Acceleration state is accelerating (condition four passes). Result: four out of four — this is a high-quality long setup.`,
                    uk: `Контрольний список підтвердження оцінює чотири незалежні умови для поточного активу. Кожна умова або проходить, або ні. Разом вони дають вам швидку оцінку якості конфігурації.

[[BOLD_UPPER]]Умова перша: режим COT узгоджується з ухилом[[/]]

Для сигналу на довгу позицію: Індекс COT повинен знаходитися на рівні шістдесяти п'яти або вище. Для сигналу на коротку позицію: Індекс COT повинен знаходитися на рівні тридцяти п'яти або нижче. Якщо Індекс COT знаходиться в нейтральній зоні між тридцятьма п'ятьма та шістдесятьма п'ятьма, ця умова не проходить — позиціонування ще не забезпечує достатнього спрямованого підтвердження.

[[BOLD_UPPER]]Умова друга: стан потоку є спрямованим[[/]]

Стан потоку не повинен бути Нейтральним. Для конфігурацій довгих позицій він повинен бути Накопиченням або Екстремумом лонгу, а для конфігурацій коротких позицій — Розподілом або Екстремумом шорту. Нейтральний стан потоку означає, що позиціонування не має чіткого напрямку і сигнал позбавлений переконаності.

[[BOLD_UPPER]]Умова третя: не в найбільш перенасиченій зоні[[/]]

Індекс COT повинен знаходитися між одинадцятьма та вісімдесятьма дев'ятьма, тобто не в екстремальних зонах перенасиченості. Якщо Індекс COT вище вісімдесяти дев'яти або нижче одинадцяти, ця умова не проходить — ризик перенасиченості занадто високий, щоб входити в нову позицію з повним розміром.

[[BOLD_UPPER]]Умова четверта: моментум підтверджує напрямок[[/]]

Стан прискорення повинен бути «прискорення». Уповільнення або стабільний моментум не забезпечують цього підтвердження. Рух повинен набирати швидкість, тобто фонди входять у позиції з зростаючою швидкістю.

[[BOLD_UPPER]]Як використовувати контрольний список[[/]]

Всі чотири умови проходять — це ідеальна конфігурація, найвища якість, яку ви знайдете. Три з чотирьох умов проходять — це сильна конфігурація, яку варто торгувати зі стандартним розміром позиції. Дві умови проходять — це конфігурація, що розвивається. Спостерігайте за нею, але суттєво зменшіть розмір позиції, якщо вирішите торгувати. Одна або нуль умов проходять — пропустіть цю угоду. Зачекайте на кращий вхід.

[[BOLD_UPPER]]Практичний приклад[[/]]

Срібло: Індекс COT на рівні сімдесяти восьми (перша умова проходить, вище шістдесяти п'яти). Стан потоку — Накопичення (друга умова проходить). Індекс COT не знаходиться в екстремальній зоні (третя умова проходить). Стан прискорення — прискорення (четверта умова проходить). Результат: чотири з чотирьох — це якісна конфігурація для довгої позиції.`
                }
            },
            {
                title: {
                    en: "Seasonal Curve: using historical positioning patterns",
                    uk: "Сезонна крива: використання історичних патернів позиціонування"
                },
                content: {
                    en: `The Seasonal Curve shows the average COT Index for each calendar month based on the last five years of data. It is your third filter after COT positioning and macroeconomic context.

[[BOLD_UPPER]]What seasonality does and does not do[[/]]

Seasonality does not predict price. It does not guarantee any market movement. What it does is show you a statistical tendency — in which months have funds historically been positioned bullish or bearish for this specific asset. It provides a calendar tailwind or headwind for your COT signal.

[[BOLD_UPPER]]How to read the grid[[/]]

Green cells in the seasonal curve mean that in this month, funds have historically maintained bullish positioning. Red cells mean funds have historically leaned bearish. The brighter the color, the stronger the historical tendency. The cell highlighted with a yellow border is the current month.

[[BOLD_UPPER]]Practical example with gold in November[[/]]

Suppose the five-year average COT Index for gold in November across the last five years was: 80-two in 2020, 71 in 2021, 64 in 2022, 78 in 2023, and 85 in 2024. The five-year average is 76 — a clearly green cell. This means that statistically, November has been a favorable period for bullish positioning in gold. It does not mean gold will rise in November this year, but it means the seasonal wind is blowing behind your back if you hold a long position.

[[BOLD_UPPER]]Three scenarios for combining seasonality with COT[[/]]

First scenario — all three aligned: the COT Index is at 74 (bullish), the macroeconomic context is supportive, and the seasonal score for the current month is also bullish. High conviction — this is the best possible moment for entering a long position.

Second scenario — COT and macro aligned but seasonality against: the COT Index is at 71, macro is supportive, but the seasonal score for the current month is red (historically bearish for this asset). The signal exists but there is a calendar headwind. The wise approach is to reduce position size or wait for the beginning of a more favorable seasonal window in the next month.

Third scenario — COT is bullish but both macro and seasonality are against: the COT Index is at 68, but macro is in defensive mode and seasonality is also red. Skip this trade. When three independent filters all disagree, the probability of a successful outcome falls significantly.

[[BOLD_UPPER]]Using seasonality for exits[[/]]

If you are already in a profitable long position and the seasonal curve shows that the current month is the last green month before several red months — this is a strong signal to take profits or tighten your stop loss, even if the COT Index is still in the bullish zone.`,
                    uk: `Сезонна крива показує середній Індекс COT для кожного календарного місяця на основі даних за останні п'ять років. Це ваш третій фільтр після позиціонування COT та макроекономічного контексту.

[[BOLD_UPPER]]Що сезонність робить і що не робить[[/]]

Сезонність не передбачає ціну. Вона не гарантує жодного ринкового руху. Те, що вона робить — показує статистичну тенденцію: в які місяці фонди historically утримували бичаче або ведмеже позиціонування для цього конкретного активу. Вона забезпечує календарний попутний або зустрічний вітер для вашого сигналу COT.

[[BOLD_UPPER]]Як читати сітку[[/]]

Зелені клітинки в сезонній кривій означають, що в цьому місяці фонди historically утримували бичаче позиціонування. Червоні клітинки означають, що фонди historically схилялися до ведмежого. Чим яскравіший колір, тим сильніша historical тенденція. Клітинка, виділена жовтою рамкою, — це поточний місяць.

[[BOLD_UPPER]]Практичний приклад із золотом у листопаді[[/]]

Припустимо, п'ятирічне середнє значення Індексу COT для золота в листопаді за останні п'ять років було: вісімдесят два в 2020, сімдесят один в 2021, шістдесят чотири в 2022, сімдесят вісім в 2023 і вісімдесят п'ять в 2024. П'ятирічне середнє дорівнює сімдесяти шести — чітко зелена клітинка. Це означає, що статистично листопад був сприятливим періодом для бичачого позиціонування в золоті. Це не означає, що золото зросте в листопаді цього року, але це означає, що сезонний вітер дме вам у спину, якщо ви тримаєте довгу позицію.

[[BOLD_UPPER]]Три сценарії поєднання сезонності з COT[[/]]

Перший сценарій — всі три узгоджені: Індекс COT на рівні сімдесяти чотирьох (бичачий), макроекономічний контекст сприятливий, і сезонний показник поточного місяця також бичачий. Висока впевненість — це найкращий можливий момент для входу в довгу позицію.

Другий сценарій — COT і макро узгоджені, але сезонність проти: Індекс COT на рівні сімдесяти одного, макро сприятливий, але сезонний показник поточного місяця червоний (historically ведмежий для цього активу). Сигнал існує, але є календарний зустрічний вітер. Розумний підхід — зменшити розмір позиції або зачекати на початок більш сприятливого сезонного вікна наступного місяця.

Третій сценарій — COT бичачий, але і макро, і сезонність проти: Індекс COT на рівні шістдесяти восьми, але макро в захисному режимі і сезонність теж червона. Пропустіть цю угоду. Коли три незалежні фільтри всі не погоджуються, ймовірність успішного результату суттєво падає.

[[BOLD_UPPER]]Використання сезонності для виходів[[/]]

Якщо ви вже знаходитеся в прибутковій довгій позиції і сезонна крива показує, що поточний місяць є останнім зеленим місяцем перед кількома червоними місяцями — це сильний сигнал для фіксації прибутку або підтягування стоп-лоссу, навіть якщо Індекс COT ще знаходиться в бичачій зоні.`
                }
            },
            {
                title: {
                    en: "Contrarian COT Reading for Equity Indices",
                    uk: "Контраріанське читання COT для фондових індексів"
                },
                content: {
                    en: `[[BOLD_UPPER]]Why equity indices need a different interpretation[[/]]

For commodities and currencies, large speculators (hedge funds and CTAs) are generally considered smart money — they tend to be right about the direction of the trend. Following their positioning directly makes sense: if funds are long, the trend is up.

For equity indices (S&P 500, Nasdaq, Dow Jones, Russell 2000) the logic is different. Speculators on equity futures tend to be momentum-driven and often get caught at extremes. When everyone has already gone short, who is left to sell? This is the foundation of the contrarian approach.

[[BOLD_UPPER]]The direct approach versus the contrarian approach[[/]]

[[BOLD]]Direct COT approach[[/]] asks: what are funds doing right now? If they are short (COT Index below 35), the signal is bearish. This works well for trending markets and for commodities.

[[BOLD]]Contrarian COT approach[[/]] asks: what does this positioning extreme tell us about the future? If speculators are at a 3-year short extreme on equities, they have already positioned for a decline. Most of the bearish move may already be priced in. Any positive catalyst — better earnings, a Fed pivot, geopolitical resolution — can trigger a sharp short squeeze because so many people need to cover simultaneously.

[[BOLD_UPPER]]The four contrarian zones for equity indices[[/]]

[[BOLD]]COT Index 0 to 15 — Capitulation / Bottom zone[[/]]
Speculators are near a 3-year short extreme. This historically marks capitulation — the point where fear has peaked and smart institutional money begins quietly buying. This does not mean buy immediately, but it does mean stop adding shorts and start watching for a reversal catalyst such as a failed breakdown, a bullish price pattern, or a positive macro surprise.

[[BOLD]]COT Index 15 to 35 — Accumulation zone[[/]]
Speculators are heavily short but not at an extreme. The direct signal is bearish, but the contrarian reading is that accumulation is likely underway. Risk is asymmetric — the downside from adding new shorts here is limited because the crowd is already positioned for it.

[[BOLD]]COT Index 65 to 85 — Distribution zone[[/]]
Speculators are heavily long but not yet at an extreme. The direct signal is bullish, but the contrarian reading flags that the easy money may have already been made. New long entries here carry elevated risk of being caught in a distribution phase.

[[BOLD]]COT Index 85 to 100 — Euphoria / Top zone[[/]]
Speculators are near a 3-year long extreme. This historically marks euphoria — the point where optimism has peaked and institutional money begins quietly selling. Do not chase new longs. Watch for a reversal catalyst such as a failed breakout, bearish price pattern, or negative macro surprise.

[[BOLD_UPPER]]How to use both readings together[[/]]

The platform shows both the direct COT signal and the contrarian read side by side in the Asset Explorer when you are viewing an equity index. The correct approach is:

When direct and contrarian agree — for example, COT Index at 70 (direct: bullish, contrarian: distribution watch) — the direct signal is valid but carry elevated risk awareness. When they strongly disagree — COT Index at 10 (direct: active short signal, contrarian: capitulation bullish) — this is a high-alert contrarian setup. Do not blindly follow the direct signal. Wait for price confirmation before acting in either direction.

[[BOLD_UPPER]]Practical example — S&P 500 at COT Index 30[[/]]

Direct reading: funds are short, COT below 35, bearish signal active. Trend-following traders might short rallies.

Contrarian reading: speculators are in the accumulation zone. If you are already short from higher prices, consider tightening your stop. If you are looking for a new entry, the risk-reward of a fresh short is poor — too many people are already short. Instead, watch for a catalyst that triggers covering and a sharp bounce, and position for that potential squeeze.

[[BOLD_UPPER]]Important limitation[[/]]

The contrarian approach is not a reversal signal by itself. COT at an extreme can stay extreme for several more weeks before reversing. Always combine with price action confirmation, macro context, and seasonal data. A COT extreme is a warning, not a trigger.`,

                    uk: `[[BOLD_UPPER]]Чому фондові індекси потребують іншої інтерпретації[[/]]

Для сировини та валют великі спекулянти (хедж-фонди та CTA) вважаються так званими «розумними грошима» — вони, як правило, правильно визначають напрям тренду. Пряме слідування їхньому позиціонуванню має сенс: якщо фонди в лонгу, тренд зростаючий.

Для фондових індексів (S&P 500, Nasdaq, Dow Jones, Russell 2000) логіка інша. Спекулянти на ф'ючерсах на індекси, як правило, орієнтовані на моментум і часто потрапляють у пастку на екстремумах. Коли всі вже зайшли в шорт, хто залишився продавати? Це і є основа контраріанського підходу.

[[BOLD_UPPER]]Прямий підхід проти контраріанського[[/]]

[[BOLD]]Прямий COT підхід[[/]] запитує: що роблять фонди прямо зараз? Якщо вони в шорті (COT Index нижче 35), сигнал ведмежий. Це добре працює для трендових ринків і для сировини.

[[BOLD]]Контраріанський COT підхід[[/]] запитує: що цей екстремум позиціонування говорить нам про майбутнє? Якщо спекулянти на 3-річному шортовому екстремумі на акціях, вони вже позиціонувалися на падіння. Більша частина ведмежого руху може вже бути в ціні. Будь-який позитивний каталізатор може спровокувати різкий шорт-сквіз.

[[BOLD_UPPER]]Чотири контраріанські зони для фондових індексів[[/]]

[[BOLD]]COT Index 0–15 — Капітуляція / Дно[[/]]
Спекулянти біля 3-річного шортового екстремуму. Це historically відмічає капітуляцію — момент коли страх досяг піку і інституційні гроші починають тихо купувати. Це не означає купувати негайно, але означає — припинити нарощувати шорти і спостерігати за каталізатором розвороту.

[[BOLD]]COT Index 15–35 — Зона накопичення[[/]]
Спекулянти сильно в шорті, але не на екстремумі. Прямий сигнал ведмежий, але контраріанське читання вказує на те, що накопичення вже йде. Асиметрія ризику — потенціал зниження від нових шортів тут обмежений, бо натовп вже позиціонований на це.

[[BOLD]]COT Index 65–85 — Зона розподілу[[/]]
Спекулянти сильно в лонгу, але не на екстремумі. Прямий сигнал бичачий, але контраріанське читання попереджає, що легкі гроші вже зроблені. Нові лонги тут несуть підвищений ризик.

[[BOLD]]COT Index 85–100 — Ейфорія / Вершина[[/]]
Спекулянти біля 3-річного лонгового екстремуму. Не женіться за новими лонгами. Спостерігайте за каталізатором розвороту.

[[BOLD_UPPER]]Як використовувати обидва читання разом[[/]]

Платформа показує і прямий COT сигнал, і контраріанське читання поруч у Asset Explorer для фондових індексів.

Коли прямий і контраріанський сигнали збігаються — прямий сигнал дійсний але з підвищеною обережністю. Коли вони сильно розходяться — COT Index 10 (прямий: активний шорт, контраріанський: капітуляція/бичачий) — це сигнал високої уваги. Не слідуйте сліпо прямому сигналу. Чекайте цінового підтвердження.

[[BOLD_UPPER]]Практичний приклад — S&P 500 при COT Index 30[[/]]

Пряме читання: фонди в шорті, COT нижче 35, активний ведмежий сигнал.

Контраріанське читання: спекулянти в зоні накопичення. Якщо ви вже в шорті з вищих цін — підтягніть стоп. Якщо шукаєте нову точку входу — ризик-прибуток нового шорту поганий, занадто багато людей вже в шорті. Натомість спостерігайте за каталізатором, який викличе покриття і різкий відскок.

[[BOLD_UPPER]]Важливе обмеження[[/]]

Контраріанський підхід — це не сигнал розвороту сам по собі. COT на екстремумі може залишатися там ще кілька тижнів. Завжди комбінуйте з підтвердженням цінової дії, макро контекстом і сезонними даними. Екстремум COT — це попередження, а не тригер.`
                }
            }
        ]
    },

    // ── 4. SIGNALS ──────────────────────────────────────────────────────────────
    {
        key: "signals",
        icon: "⚡",
        color: "#f87171",
        title: {
            en: "Signals",
            uk: "Сигнали"
        },
        summary: {
            en: "A ranked list of all active COT signals with quality scores, lifecycle stage, and entry assessment. Your shortlist of the best current opportunities.",
            uk: "Ранжований список усіх активних сигналів COT з оцінками якості, стадією життєвого циклу та оцінкою входу. Ваш короткий список найкращих поточних можливостей."
        },
        blocks: [
            {
                title: {
                    en: "Signal lifecycle: from Candidate to Invalidated",
                    uk: "Життєвий цикл сигналу: від Кандидата до Анульованого"
                },
                content: {
                    en: `Every signal on this platform passes through five defined states. Understanding which state a signal is in determines whether you should be watching it, entering it, managing it, or exiting.

[[BOLD_UPPER]]Candidate[[/]]

The COT Index is moving in the right direction but has not yet reached the threshold to become an active signal. The Entry Quality score is below 40. This is a signal to watch, not to trade. Add it to your watchlist and revisit it the following Friday when the new COT data is published.

[[BOLD_UPPER]]Active[[/]]

The COT Index has crossed above 65 (for a long signal) or below 35 (for a short signal), and the Entry Quality score is at or above 40. This signal is live and tradeable. Confirm with macro context and seasonality before entering.

[[BOLD_UPPER]]Aging[[/]]

The signal has been in the Active state for four or more weeks. The freshness component of the scoring has started to decay. This does not mean the signal is wrong — some of the strongest trends persist for 10 or 12 weeks — but the edge is no longer as fresh as it was at week one. If you are already in a position, tighten your stop loss. If you are considering a new entry, reduce your position size.

[[BOLD_UPPER]]Stale[[/]]

The signal has been active long enough that the entry edge has largely disappeared. The risk-to-reward of entering now is significantly worse than it was at the beginning of the signal. If you are already in a position from earlier, reassess whether the original thesis still holds or whether the signal has simply aged out without delivering.

[[BOLD_UPPER]]Invalidated[[/]]

The COT Index has moved decisively in the opposite direction, or the Entry Quality score has fallen below the minimum threshold. The signal is no longer valid. If you hold a position based on this signal, it is time to exit or the market has already stopped you out.

[[BOLD_UPPER]]Practical example following a complete lifecycle[[/]]

Week one: Gold COT Index reaches 68, Entry Quality is 55. Status becomes Active. You enter a long position.

Week three: Gold COT Index is at 74, Entry Quality is 60-two. Status remains Active. You hold and trail your stop.

Week five: Gold COT Index is at 71, Entry Quality is 48. Status becomes Aging. You tighten your stop loss significantly to protect most of the profit.

Week seven: Gold COT Index falls back to 58, Entry Quality is 32. Status becomes Stale. Your tightened stop has been triggered and you exit the trade with most of the profit captured.`,
                    uk: `Кожен сигнал на цій платформі проходить через п'ять визначених станів. Розуміння того, в якому стані знаходиться сигнал, визначає, чи слід вам за ним спостерігати, входити в нього, управляти ним або виходити.

[[BOLD_UPPER]]Кандидат[[/]]

Індекс COT рухається в правильному напрямку, але ще не досяг порогу, щоб стати активним сигналом. Оцінка якості входу нижче сорока. Це сигнал для спостереження, а не для торгівлі. Додайте його до свого списку спостереження і перегляньте наступної п'ятниці, коли будуть опубліковані нові дані COT.

[[BOLD_UPPER]]Активний[[/]]

Індекс COT перетнув рівень шістдесяти п'яти вгору (для сигналу на довгу позицію) або рівень тридцяти п'яти вниз (для сигналу на коротку позицію), і Оцінка якості входу знаходиться на рівні сорока або вище. Цей сигнал живий і придатний для торгівлі. Підтвердіть за допомогою макроекономічного контексту та сезонності перед входом.

[[BOLD_UPPER]]Старіючий[[/]]

Сигнал знаходиться в активному стані чотири або більше тижнів. Компонент свіжості в оцінці почав знижуватися. Це не означає, що сигнал неправильний — деякі з найсильніших трендів тривають десять або дванадцять тижнів — але перевага вже не така свіжа, як на першому тижні. Якщо ви вже знаходитеся в позиції, підтягніть стоп-лосс. Якщо ви розглядаєте новий вхід, зменшіть розмір позиції.

[[BOLD_UPPER]]Застарілий[[/]]

Сигнал був активним досить довго, щоб перевага входу в основному зникла. Співвідношення ризику до потенційного прибутку від входу зараз значно гірше, ніж воно було на початку сигналу. Якщо ви вже знаходитеся в позиції з раніше, переоцініть, чи первісна теза ще актуальна, або сигнал просто вичерпав себе, не реалізувавшись.

[[BOLD_UPPER]]Анульований[[/]]

Індекс COT рішуче рухнувся в протилежному напрямку, або Оцінка якості входу впала нижче мінімального порогу. Сигнал більше не є дійсним. Якщо ви тримаєте позицію на основі цього сигналу, час виходити, або ринок вже спрацював ваш стоп.

[[BOLD_UPPER]]Практичний приклад повного життєвого циклу[[/]]

Тиждень перший: Індекс COT золота досягає шістдесяти восьми, Оцінка якості входу п'ятдесят п'ять. Статус стає Активним. Ви входите в довгу позицію.

Тиждень третій: Індекс COT золота на рівні сімдесяти чотирьох, Оцінка якості входу шістдесят два. Статус залишається Активним. Ви тримаєте позицію і підтягуєте стоп.

Тиждень п'ятий: Індекс COT золота на рівні сімдесяти одного, Оцінка якості входу сорок вісім. Статус стає Старіючим. Ви суттєво підтягуєте стоп-лосс, щоб захистити більшу частину прибутку.

Тиждень сьомий: Індекс COT золота падає назад до п'ятдесяти восьми, Оцінка якості входу тридцять два. Статус стає Застарілим. Ваш підтягнутий стоп спрацьовує і ви виходите з угоди, зафіксувавши більшу частину прибутку.`
                }
            },
            {
                title: {
                    en: "Priority Score and Entry Quality: how the scores are calculated",
                    uk: "Оцінка пріоритету та Якість входу: як розраховуються оцінки"
                },
                content: {
                    en: `There are two distinct scores for every signal. Understanding the difference between them helps you know when to act and when to wait.

[[BOLD_UPPER]]Entry Quality Score from zero to 100[[/]]

This score answers the question: how good is the entry opportunity right now? It is composed of four weighted factors.

Forty percent comes from positioning strength — how far the COT Index is into the directional zone. A COT Index of 90 gives maximum points here; a COT Index of 66 gives minimal points.

Twenty percent comes from the flow state regime — whether the flow state is strongly directional (Accumulation or Distribution scores high) or neutral (scores zero).

Twenty percent comes from seasonality — whether the seasonal curve for the current month supports the signal direction.

Twenty percent comes from macroeconomic alignment — whether the relevant macro segment (Growth for indices, Inflation for commodities, Policy for currencies) is positioned in the same direction as the signal.

[[BOLD_UPPER]]Priority Score from zero to 100[[/]]

This score answers the question: how should this signal be ranked relative to all others? It uses Entry Quality as its foundation but also incorporates signal freshness and overall trend strength.

Fifty-five percent comes from Entry Quality. Twenty percent comes from freshness — a signal that appeared two weeks ago scores higher than one that appeared 10 weeks ago. Fifteen percent comes from directional strength, meaning how consistently the COT has moved in the signal direction over the past eight weeks. Ten percent comes from regime alignment, a broader macro confirmation.

[[BOLD_UPPER]]Practical reading of the scores[[/]]

A Priority Score of 85 or above paired with an Entry Quality of 70 or above means: this is among the best setups currently available in the entire universe of tracked assets. Rare, but actionable with confidence.

A Priority Score between 70 and 84 with an Entry Quality between 50 and 69 means: a strong signal worth trading with standard position size, pending confirmation from your own technical analysis for the entry point.

A Priority Score between 55 and 69 means: a developing signal. Reduce position size if trading and set tighter parameters. Do not trade with full conviction.

A Priority Score below 55: skip. The COT edge is insufficient to justify the trade risk.`,
                    uk: `Для кожного сигналу існують дві окремі оцінки. Розуміння різниці між ними допомагає вам знати, коли діяти, а коли чекати.

[[BOLD_UPPER]]Оцінка якості входу від нуля до ста[[/]]

Ця оцінка відповідає на питання: наскільки хороша можливість входу прямо зараз? Вона складається з чотирьох зважених факторів.

Сорок відсотків — від сили позиціонування, наскільки далеко Індекс COT знаходиться в спрямованій зоні. Індекс COT дев'яносто дає максимальні бали тут; Індекс COT шістдесят шість дає мінімальні бали.

Двадцять відсотків — від режиму стану потоку, чи є стан потоку чітко спрямованим (Накопичення або Розподіл отримує високий бал) або нейтральним (отримує нуль).

Двадцять відсотків — від сезонності, чи підтримує сезонна крива поточного місяця напрямок сигналу.

Двадцять відсотків — від макроекономічного узгодження, чи відповідний макро сегмент (Зростання для індексів, Інфляція для сировинних товарів, Монетарна політика для валют) позиціонований в тому ж напрямку, що й сигнал.

[[BOLD_UPPER]]Оцінка пріоритету від нуля до ста[[/]]

Ця оцінка відповідає на питання: як цей сигнал повинен бути ранжований відносно всіх інших? Вона використовує Якість входу як основу, але також враховує свіжість сигналу та загальну силу тренду.

П'ятдесят п'ять відсотків — від Якості входу. Двадцять відсотків — від свіжості, сигнал, що з'явився два тижні тому, отримує вищий бал, ніж той, що з'явився десять тижнів тому. П'ятнадцять відсотків — від спрямованої сили, тобто наскільки послідовно COT рухався в напрямку сигналу протягом останніх восьми тижнів. Десять відсотків — від узгодження режиму, ширшого макро підтвердження.

[[BOLD_UPPER]]Практичне читання оцінок[[/]]

Оцінка пріоритету вісімдесят п'ять або вище в парі з Якістю входу сімдесят або вище означає: це одна з найкращих конфігурацій, доступних в даний момент у всьому всесвіті відстежуваних активів. Рідкість, але придатна для впевнених дій.

Оцінка пріоритету між сімдесятьма та вісімдесятьма чотирма з Якістю входу між п'ятдесятьма та шістдесятьма дев'ятьма означає: сильний сигнал, який варто торгувати зі стандартним розміром позиції, очікуючи підтвердження від вашого власного технічного аналізу для точки входу.

Оцінка пріоритету між п'ятдесятьма п'ятьма та шістдесятьма дев'ятьма означає: конфігурація, що розвивається. Зменшіть розмір позиції при торгівлі та встановіть жорсткіші параметри. Не торгуйте з повною переконаністю.

Оцінка пріоритету нижче п'ятдесяти п'яти: пропустіть. Перевага COT недостатня для виправдання торгового ризику.`
                }
            },
            {
                title: {
                    en: "Signal History: learning from completed signals",
                    uk: "Історія сигналів: навчання на завершених сигналах"
                },
                content: {
                    en: `The Signal History tab stores the record of all past signals — both those that are still active and those that have already been closed. This is one of the most valuable educational tools on the platform.

[[BOLD_UPPER]]Weeks Active[[/]]

This shows how many weeks each signal remained in an active or aging state. The average productive signal lasts four to eight weeks. A signal that lasts 12 or more weeks usually means either an exceptionally strong institutional trend, or a signal that stalled without delivering meaningful movement. Reviewing week counts across many past signals will help you build intuition about typical signal durations for each asset.

[[BOLD_UPPER]]Peak Score versus Current Score[[/]]

The Peak Score is the highest Priority Score the signal reached during its lifetime. The Current Score is today's value. When the Current Score is significantly below the Peak Score, the signal is weakening. The further the Current Score falls from the Peak, the higher the probability that the signal has exhausted itself. This divergence is an early warning to tighten risk management.

[[BOLD_UPPER]]Eight-week sparkline chart[[/]]

The sparkline is a small chart showing the COT Index movement over the past eight weeks. A rising line means growing institutional conviction in the signal direction. A falling line means the COT is retreating. A flat line means the positioning has stalled. Learning to read sparklines quickly lets you assess momentum at a glance before opening the full Asset Explorer.

[[BOLD_UPPER]]First Seen, Active date, and Closed date[[/]]

First Seen is when the signal first appeared as a Candidate — when the COT Index first started moving in the relevant direction. Active date is when it crossed the threshold and became tradeable. Closed date is when the signal was invalidated or became stale.

The gap between First Seen and Active tells you how long the setup took to develop — a signal that moved quickly from Candidate to Active often has stronger momentum than one that took four weeks to reach the threshold.

[[BOLD_UPPER]]How to use Signal History for learning[[/]]

Every week after reviewing the current signals, spend five minutes going through the Signal History for your most-watched assets. Find signals that were recently Active and compare the COT movement with what you know about price movements during that period. Over time this builds pattern recognition — you will start to see which types of setups tend to precede strong sustained moves and which ones tend to stall or reverse quickly.`,
                    uk: `Вкладка Історії сигналів зберігає запис усіх минулих сигналів — як тих, що ще активні, так і тих, що вже закриті. Це один з найцінніших навчальних інструментів на платформі.

[[BOLD_UPPER]]Кількість активних тижнів[[/]]

Це показує, скільки тижнів кожен сигнал залишався в активному або старіючому стані. Середній продуктивний сигнал триває від чотирьох до восьми тижнів. Сигнал, який триває дванадцять або більше тижнів, зазвичай означає або виключно сильний інституційний тренд, або сигнал, який застряг без значущого руху. Перегляд кількості тижнів по багатьох минулих сигналах допоможе вам виробити інтуїцію щодо типових тривалостей сигналів для кожного активу.

[[BOLD_UPPER]]Пікова оцінка проти поточної оцінки[[/]]

Пікова оцінка — це найвища Оцінка пріоритету, якої сигнал досяг за своє існування. Поточна оцінка — це сьогоднішнє значення. Коли поточна оцінка значно нижче пікової, сигнал слабшає. Чим далі поточна оцінка падає від пікової, тим вища ймовірність того, що сигнал вичерпав себе. Це розходження є раннім попередженням для підтягування управління ризиком.

[[BOLD_UPPER]]Восьмитижневий спарклайн-графік[[/]]

Спарклайн — це невеликий графік, що показує рух Індексу COT за останні вісім тижнів. Висхідна лінія означає зростаючу інституційну переконаність у напрямку сигналу. Спадна лінія означає, що COT відступає. Пряма лінія означає, що позиціонування застряло. Навчившись швидко читати спарклайни, ви зможете оцінювати моментум з першого погляду перед відкриттям повного Дослідника активів.

[[BOLD_UPPER]]Дата першого появи, дата активації та дата закриття[[/]]

Дата першого появи — це коли сигнал вперше з'явився як Кандидат, тобто коли Індекс COT вперше почав рухатися у відповідному напрямку. Дата активації — це коли він перетнув поріг і став придатним для торгівлі. Дата закриття — це коли сигнал був анульований або застарів.

Проміжок між першою появою та активацією розповідає вам, скільки часу знадобилося конфігурації для розвитку — сигнал, який швидко перейшов від Кандидата до Активного, часто має сильніший моментум, ніж той, якому знадобилося чотири тижні для досягнення порогу.

[[BOLD_UPPER]]Як використовувати Історію сигналів для навчання[[/]]

Кожного тижня після перегляду поточних сигналів витрачайте п'ять хвилин на перегляд Історії сигналів для активів, за якими ви найбільш уважно стежите. Знаходьте сигнали, які нещодавно були Активними, і порівнюйте рух COT з тим, що ви знаєте про рухи ціни протягом того ж часу. Поступово це формує розпізнавання патернів — ви почнете бачити, які типи конфігурацій мають тенденцію передувати сильним стійким рухам, а які мають тенденцію стопоритися або швидко розвертатися.`
                }
            },
            {
                title: {
                    en: "Sharp Changes, Crowded Warnings, and Assets In Play",
                    uk: "Різкі зміни, Попередження про переповнення та Активи в грі"
                },
                content: {
                    en: `Below the ranked signal list, the Signals tab surfaces three special panels that highlight specific situations worth your attention. Each answers a different question about where the action is right now.

[[BOLD_UPPER]]Sharp Position Changes[[/]]

This panel flags assets where the COT Index moved unusually fast in the most recent week — a large week-over-week change relative to the asset's own recent behavior. The threshold for "sharp" is a weekly move of roughly six index points or more, which is well above the typical weekly drift for most assets.

A sharp surge (large positive move) means funds aggressively added exposure in a single week — a strong momentum signal that often marks the early, most powerful phase of a new trend. A sharp liquidation (large negative move) means funds aggressively cut exposure — this can mark either the start of a reversal or a panic exit. Sharp changes are valuable because they are early. They catch the move before it becomes obvious in the ranked list. But they are also noisier — a sharp change needs confirmation from the broader COT regime before you act.

[[BOLD_UPPER]]Why the six-point WoW threshold matters[[/]]

The week-over-week change of six points or more is a deliberately chosen threshold. Most assets, in most weeks, move only one to three index points. A move of six or more is roughly double the normal weekly drift — statistically unusual enough to signal that something has changed in institutional behavior, but not so rare that you would only see it once a year. Think of it as the line between background noise and a genuine shift in conviction. When you see a WoW change at or above six points, institutional money did something deliberate that week.

[[BOLD_UPPER]]Crowded Warnings[[/]]

This panel flags assets sitting in the extreme zones — a COT Index at or above 90 (crowded long) or at or below 10 (crowded short). The label shows how many assets are currently at an extreme.

Crowded warnings are risk alerts, not entry signals. An asset in crowded long is dangerous to buy — the crowd is fully positioned and the risk of a liquidation cascade is high. An asset in crowded short carries squeeze risk. The value of this panel is defensive: it tells you which assets to be careful with, which positions to protect with tighter stops, and which extremes might be setting up for a contrarian reversal.

[[BOLD_UPPER]]Assets In Play[[/]]

This panel is the curated shortlist — the assets where something genuinely actionable is happening right now. For each asset it shows a brief why (the reason it made the list), an action (what to consider doing), and a risk (the main thing that could go wrong). It combines signals, sharp changes, and positioning quality into a single human-readable summary.

Assets In Play is designed to be the fastest path from opening the platform to knowing where to focus. If you only have two minutes, read this panel. But remember it is a starting point, not a decision — always open the full Asset Explorer for any asset before committing to a trade.

[[BOLD_UPPER]]How the three panels work together[[/]]

Read them in sequence. Sharp Changes tells you what just moved. Crowded Warnings tells you what to avoid or protect. Assets In Play synthesizes both into a focused shortlist. Together they turn the full universe of assets into a handful of situations actually worth your analytical time this week.`,
                    uk: `Під ранжованим списком сигналів вкладка Сигнали показує три спеціальні панелі, що висвітлюють конкретні ситуації, варті вашої уваги. Кожна відповідає на різне питання про те, де зараз відбувається дія.

[[BOLD_UPPER]]Різкі зміни позицій[[/]]

Ця панель відмічає активи, де Індекс COT зрушив незвично швидко в найновішому тижні — велика тижнева зміна відносно власної недавньої поведінки активу. Поріг для «різкої» зміни — це тижневий рух приблизно шість пунктів індексу або більше, що значно вище за типовий тижневий дрейф для більшості активів.

Різкий стрибок (великий позитивний рух) означає, що фонди агресивно додали позиції за один тиждень — сильний сигнал моментуму, який часто відмічає ранню, найпотужнішу фазу нового тренду. Різка ліквідація (великий негативний рух) означає, що фонди агресивно скоротили позиції — це може відмічати або початок розвороту, або панічний вихід. Різкі зміни цінні, бо вони ранні. Вони ловлять рух до того, як він стане очевидним у ранжованому списку. Але вони також більш шумні — різка зміна потребує підтвердження від ширшого режиму COT, перш ніж ви дієте.

[[BOLD_UPPER]]Чому поріг тижневої зміни в шість пунктів важливий[[/]]

Тижнева зміна в шість пунктів або більше — це навмисно обраний поріг. Більшість активів, у більшості тижнів, рухаються лише на один-три пункти індексу. Рух у шість або більше — це приблизно подвійний нормальний тижневий дрейф, статистично достатньо незвичний, щоб сигналізувати, що щось змінилося в інституційній поведінці, але не настільки рідкісний, щоб ви бачили його лише раз на рік. Думайте про це як про межу між фоновим шумом та справжнім зсувом переконаності. Коли ви бачите тижневу зміну на рівні шести пунктів або вище, інституційні гроші зробили щось навмисне того тижня.

[[BOLD_UPPER]]Попередження про переповнення[[/]]

Ця панель відмічає активи, що сидять в екстремальних зонах — Індекс COT на рівні дев'яноста або вище (переповнений лонг) або на рівні десяти або нижче (переповнений шорт). Мітка показує, скільки активів наразі знаходяться на екстремумі.

Попередження про переповнення — це сповіщення про ризик, а не сигнали входу. Актив у переповненому лонгу небезпечно купувати — натовп повністю позиціонований, і ризик каскаду ліквідацій високий. Актив у переповненому шорті несе ризик сквізу. Цінність цієї панелі захисна: вона говорить вам, з якими активами бути обережними, які позиції захистити жорсткішими стопами, і які екстремуми можуть налаштовуватися на контраріанський розворот.

[[BOLD_UPPER]]Активи в грі[[/]]

Ця панель — кураторський короткий список, активи, де прямо зараз відбувається щось справді дієве. Для кожного активу вона показує коротке «чому» (причина, чому він потрапив до списку), «дію» (що варто розглянути) та «ризик» (головне, що може піти не так). Вона поєднує сигнали, різкі зміни та якість позиціонування в єдине читабельне зведення.

Активи в грі створені, щоб бути найшвидшим шляхом від відкриття платформи до розуміння, на чому зосередитися. Якщо у вас є лише дві хвилини, прочитайте цю панель. Але пам'ятайте, що це відправна точка, а не рішення — завжди відкривайте повний Дослідник активів для будь-якого активу перед тим, як зобов'язатися до угоди.

[[BOLD_UPPER]]Як три панелі працюють разом[[/]]

Читайте їх послідовно. Різкі зміни говорять вам, що щойно зрушило. Попередження про переповнення говорять, чого уникати або що захищати. Активи в грі синтезують обидва в зосереджений короткий список. Разом вони перетворюють весь всесвіт активів на декілька ситуацій, справді вартих вашого аналітичного часу цього тижня.`
                }
            },
        ]
    },

    // ── 5. MACRO REGIME ─────────────────────────────────────────────────────────
    {
        key: "macro",
        icon: "◎",
        color: "#34d399",
        title: {
            en: "Macro Regime",
            uk: "Макро режим"
        },
        summary: {
            en: "Deep analysis of three institutional segments and their composite picture. The framework for understanding what the entire market is pricing in right now.",
            uk: "Глибокий аналіз трьох інституційних сегментів та їх зведена картина. Основа для розуміння того, що зараз закладає в ціни весь ринок."
        },
        blocks: [
            {
                title: {
                    en: "Reading the three segments and the Composite",
                    uk: "Читання трьох сегментів та Композитного показника"
                },
                content: {
                    en: `The Macro Regime section gives you a bird's-eye view of institutional positioning across the three major thematic groups of assets. Each segment has its own score from zero to 100, and together they form the Composite score.

[[BOLD_UPPER]]Growth segment in detail[[/]]

The Growth segment tracks the S&P 500, Nasdaq 100, and Dow Jones Industrial Average. These are the three most liquid and widely held equity futures in the world. When hedge funds and leveraged traders are net long these instruments, they are expressing a view that corporate earnings will grow, the economy will expand, and risk-taking will be rewarded.

A Growth score above 65 means that the majority of the tracked equity futures are in the bullish positioning zone. This historically correlates with a period of rising equity markets and expanding risk appetite across other asset classes. A Growth score below 35 means institutional money has rotated out of equity risk. Historically this has preceded or accompanied equity corrections and a broader risk-off mood.

[[BOLD_UPPER]]Inflation segment in detail[[/]]

The Inflation segment tracks gold, silver, copper, and crude oil. These four assets together capture the inflation trade in its full breadth. Gold and silver are monetary inflation hedges. Copper is the industrial metal most sensitive to global growth expectations and is sometimes called "Doctor Copper" because of its historical reliability as an economic indicator. Crude oil captures both energy inflation and global demand expectations.

When all four are simultaneously in the bullish positioning zone — this is the strongest possible inflation trade signal. It means institutional money across multiple asset types is simultaneously betting on rising prices, a weaker dollar, or both. When copper is bullish but gold is not, this signals growth-driven commodity demand rather than monetary inflation. When gold is bullish but copper is not, this signals defensive monetary hedging rather than growth expectations.

[[BOLD_UPPER]]Grains segment in detail[[/]]

The Grains segment tracks corn, soybeans, and wheat. This segment was added after the rest of the framework and captures a part of the market driven by forces the other three segments miss — weather, harvest cycles, global food demand, and geopolitics around major exporting regions. Grains often move on their own clock, which is exactly why they are valuable: they can offer opportunities when equities, metals, and currencies are all quiet or aligned.

When the Grains score is above 65, funds are positioned for rising agricultural prices — often driven by supply concerns such as drought, export disruptions, or strong global demand. When the score is below 35, funds expect ample supply and softening prices. Because grains are strongly seasonal (planting, growing, and harvest windows repeat every year), the Grains segment is especially powerful when read together with the Seasonality section.

[[BOLD_UPPER]]Policy segment in detail[[/]]

The Policy segment tracks the US dollar index futures, euro, Japanese yen, British pound, and Swiss franc. Together these five instruments capture the global view on monetary policy divergence between the major central banks.

When the dollar-denominated instruments push the Policy score above 65, funds are positioned for Federal Reserve hawkishness — higher interest rates, tighter financial conditions. This creates headwinds for gold, emerging market currencies, and risk assets. When the non-dollar currencies push the Policy score below 35, funds expect dollar weakness — dovish Federal Reserve, rate cuts, quantitative easing. This creates tailwinds for gold, commodities, and risk assets.

[[BOLD_UPPER]]The Composite and what it means[[/]]

The Composite score is the simple average of the segment scores (Growth, Inflation, Grains, and Policy). But more important than the number itself is the internal consistency of the three segments. Three segments all above 65 (Composite above 65) means the entire institutional universe is aligned in a risk-on, inflation-accepting, policy-supportive direction — the most powerful macro backdrop for aggressive trading. Three segments all below 35 (Composite below 35) means the opposite — a broad institutional retreat from risk.

When segments diverge, the Composite number loses meaning. A Composite of 50 that comes from Growth at 70, Inflation at 65, and Policy at 15 is very different from a Composite of 50 that comes from all three segments near 50. The first case has a real internal tension that often resolves with volatility. The second case is genuinely balanced.`,
                    uk: `Розділ Макроекономічного режиму дає вам погляд з висоти пташиного польоту на інституційне позиціонування по трьох основних тематичних групах активів. Кожен сегмент має власну оцінку від нуля до ста, і разом вони формують Композитну оцінку.

[[BOLD_UPPER]]Сегмент Зростання детально[[/]]

Сегмент Зростання відстежує S&P 500, Nasdaq 100 та Dow Jones Industrial Average. Це три найбільш ліквідні та широко утримувані ф'ючерси на акціонерний капітал у світі. Коли хедж-фонди та трейдери з кредитним плечем мають нетто-довгі позиції в цих інструментах, вони висловлюють погляд, що корпоративні прибутки зростатимуть, економіка розширюватиметься і прийняття ризику буде винагороджуватись.

Оцінка Зростання вище шістдесяти п'яти означає, що більшість відстежуваних ф'ючерсів на акціонерний капітал знаходяться в зоні бичачого позиціонування. Historically це корелює з періодом зростання ринків акцій і розширення апетиту до ризику в інших класах активів. Оцінка Зростання нижче тридцяти п'яти означає, що інституційні гроші вийшли з акціонерного ризику. Historically це передувало або супроводжувало корекції акцій та ширший настрій уникнення ризику.

[[BOLD_UPPER]]Сегмент Інфляція детально[[/]]

Сегмент Інфляція відстежує золото, срібло, мідь та сиру нафту. Ці чотири активи разом охоплюють інфляційний трейд у всій його широті. Золото та срібло є монетарними інфляційними хеджами. Мідь є промисловим металом, найбільш чутливим до глобальних очікувань зростання, і іноді її називають "Доктор Мідь" через її historical надійність як економічного індикатора. Сира нафта охоплює як енергетичну інфляцію, так і очікування глобального попиту.

Коли всі четверо одночасно знаходяться в зоні бичачого позиціонування — це найсильніший можливий сигнал інфляційного трейду. Це означає, що інституційні гроші по кількох типах активів одночасно роблять ставку на зростання цін, ослаблення долара або й те, і інше. Коли мідь бичача, але золото ні, це сигналізує про попит на сировинні товари, пов'язаний із зростанням, а не про монетарну інфляцію. Коли золото бичаче, але мідь ні, це сигналізує про захисне монетарне хеджування, а не про очікування зростання.

[[BOLD_UPPER]]Сегмент Зерно детально[[/]]

Сегмент Зерно відстежує кукурудзу, сою та пшеницю. Цей сегмент було додано після решти каркасу, і він охоплює частину ринку, керовану силами, які три інші сегменти пропускають — погода, цикли врожаю, глобальний попит на продовольство та геополітика навколо основних регіонів-експортерів. Зернові часто рухаються за власним годинником, і саме тому вони цінні: вони можуть пропонувати можливості, коли акції, метали та валюти всі спокійні або узгоджені.

Коли показник Зерна вище шістдесяти п'яти, фонди позиціоновані на зростання цін на сільгосппродукцію — часто через занепокоєння щодо пропозиції, як-от посуха, перебої експорту або сильний глобальний попит. Коли показник нижче тридцяти п'яти, фонди очікують достатньої пропозиції та пом'якшення цін. Оскільки зернові сильно сезонні (вікна посіву, росту та збору врожаю повторюються щороку), сегмент Зерно особливо потужний, коли читається разом із розділом Сезонність.

[[BOLD_UPPER]]Сегмент Монетарна політика детально[[/]]

Сегмент Монетарна політика відстежує ф'ючерси на індекс долара США, євро, японську єну, британський фунт та швейцарський франк. Разом ці п'ять інструментів охоплюють глобальний погляд на розбіжність монетарної політики між основними центральними банками.

Коли інструменти, деноміновані в доларах, штовхають оцінку Монетарної політики вище шістдесяти п'яти, фонди позиціоновані на яструбиність Федерального резерву — вищі процентні ставки, жорсткіші фінансові умови. Це створює зустрічні вітри для золота, валют країн, що розвиваються, та ризикових активів. Коли валюти, відмінні від долара, штовхають оцінку Монетарної політики нижче тридцяти п'яти, фонди очікують слабкість долара — голубиний Федеральний резерв, зниження ставок, кількісне пом'якшення. Це створює попутні вітри для золота, сировинних товарів та ризикових активів.

[[BOLD_UPPER]]Композитний показник і що він означає[[/]]

Композитний показник — це просте середнє сегментних оцінок (Зростання, Інфляція, Зерно та Монетарна політика). Але важливіше за саме число є внутрішня узгодженість трьох сегментів. Три сегменти, всі вище шістдесяти п'яти (Композитний вище шістдесяти п'яти), означає, що весь інституційний всесвіт узгоджений у спрямованому до ризику, інфляційно-прийнятному, підтримуваному політикою напрямку — найпотужніший макроекономічний фон для агресивної торгівлі. Три сегменти, всі нижче тридцяти п'яти (Композитний нижче тридцяти п'яти) означає протилежне — широкий інституційний відступ від ризику.

Коли сегменти розходяться, число Композитного показника втрачає значення. Композитний рівень п'ятдесяти, що утворюється від Зростання на сімдесяти, Інфляції на шістдесяти п'яти та Монетарної політики на п'ятнадцяти, дуже відрізняється від Композитного рівня п'ятдесяти, що утворюється від всіх трьох сегментів поблизу п'ятдесяти. Перший випадок має реальну внутрішню напруженість, яка часто вирішується волатильністю. Другий випадок є по-справжньому збалансованим.`
                }
            },
            {
                title: {
                    en: "Segment Dispersion and Macro Phase",
                    uk: "Розкид між сегментами та Макроекономічна фаза"
                },
                content: {
                    en: `Segment Dispersion measures how far apart the three segment scores are from each other. It is the difference between the highest and lowest segment scores.

[[BOLD_UPPER]]Why dispersion matters more than the average[[/]]

Imagine Growth is at 72, Inflation is at 68, and Policy is at 60-seven. The Dispersion is five — extremely low. All three segments are telling the same story: broad institutional risk-on. This is a high-conviction macro environment where COT signals across all three thematic groups should be treated with increased confidence.

Now imagine Growth is at 75, Inflation is at 30, and Policy is at 71. The Dispersion is 45 — very high. Growth and Policy say one thing, but Inflation says the opposite. An equity long makes sense, a commodities long does not. A macro-divergent environment like this requires you to be asset-specific, not directionally global.

[[BOLD_UPPER]]Practical rule for dispersion levels[[/]]

When Dispersion is below 15 — the macro message is unified and clear. You can trade themes broadly and treat all supporting signals in the same direction as high-confidence. When Dispersion is between 15 and 35 — moderate divergence exists. Be selective about which segment's signals you act on. When Dispersion is above 35 — the macro environment is contradictory. Reduce overall risk, trade smaller sizes, and only act on the strongest individual signals where the specific segment aligns with the trade.

[[BOLD_UPPER]]Macro Phase — the five regime states[[/]]

The Macro Phase label translates the Composite score into a qualitative description of the current market environment.

Strong Risk-On means the Composite score is at or above 80. This is the most favorable environment for aggressive long positions across growth assets, inflation assets, and momentum trades. Historical periods with this reading tend to be characterized by trending markets with relatively low volatility.

Constructive means the Composite score is between 65 and 70-nine. A bullish environment with some limitations. Most signals can be acted upon but with normal position sizing.

Balanced means the Composite score is between 35 and 64. A neutral environment requiring case-by-case analysis. Do not make directional bets based purely on macro — look for the specific assets with strong individual COT setups.

Defensive means the Composite score is between 20 and 34. The macro backdrop is unfavorable for aggressive risk-taking. Reduce position sizes across all trades and focus on the highest-quality setups only.

Strong Defensive means the Composite score is below 20. The broadest institutional retreat from risk. In historical precedent, this reading has appeared near major market dislocations. Trade defensively, protect capital first.`,
                    uk: `Розкид між сегментами вимірює, наскільки далеко три сегментні оцінки відстоять одна від одної. Це різниця між найвищою та найнижчою сегментними оцінками.

[[BOLD_UPPER]]Чому розкид важливіший за середнє[[/]]

Уявіть, що Зростання на рівні сімдесяти двох, Інфляція на рівні шістдесяти восьми, і Монетарна політика на рівні шістдесяти семи. Розкид дорівнює п'яти — надзвичайно низький. Всі три сегменти розповідають одну й ту саму історію: широкий інституційний апетит до ризику. Це макроекономічне середовище з високою впевненістю, де сигнали COT по всіх трьох тематичних групах слід розглядати з підвищеною довірою.

Тепер уявіть, що Зростання на рівні сімдесяти п'яти, Інфляція на рівні тридцяти, і Монетарна політика на рівні сімдесяти одного. Розкид дорівнює сорока п'яти — дуже високий. Зростання та Монетарна політика говорять одне, але Інфляція говорить протилежне. Довга позиція в акціях має сенс, довга позиція в сировинних товарах — ні. Макро-дивергентне середовище, як це, вимагає від вас бути специфічними щодо активів, а не глобально спрямованими.

[[BOLD_UPPER]]Практичне правило для рівнів розкиду[[/]]

Коли Розкид нижче п'ятнадцяти — макроекономічне повідомлення єдине та чітке. Ви можете торгувати темами широко і розглядати всі підтримуючі сигнали в одному напрямку як такі з високою впевненістю. Коли Розкид між п'ятнадцятьма та тридцятьма п'ятьма — існує помірна дивергенція. Будьте вибірковими щодо того, за сигналами якого сегменту ви дієте. Коли Розкид вище тридцяти п'яти — макроекономічне середовище суперечливе. Зменшіть загальний ризик, торгуйте меншими розмірами і дійте лише за найсильнішими індивідуальними сигналами, де конкретний сегмент узгоджується з угодою.

[[BOLD_UPPER]]Макроекономічна фаза — п'ять режимних станів[[/]]

Мітка Макроекономічної фази перетворює Композитну оцінку на якісний опис поточного ринкового середовища.

Сильна схильність до ризику означає, що Композитна оцінка знаходиться на рівні вісімдесяти або вище. Це найсприятливіше середовище для агресивних довгих позицій по активах зростання, інфляційних активах та угодах за моментумом. Historically такі показники характеризуються трендовими ринками з відносно низькою волатильністю.

Конструктивний означає Композитну оцінку між шістдесятьма п'ятьма та сімдесятьма дев'ятьма. Бичаче середовище з певними обмеженнями. Більшість сигналів можна виконувати, але зі стандартним розміром позиції.

Збалансований означає Композитну оцінку між тридцятьма п'ятьма та шістдесятьма чотирма. Нейтральне середовище, що вимагає аналізу в кожному конкретному випадку. Не робіть спрямованих ставок, ґрунтуючись виключно на макро — шукайте конкретні активи з сильними індивідуальними конфігураціями COT.

Захисний означає Композитну оцінку між двадцятьма та тридцятьма чотирма. Макроекономічний фон несприятливий для агресивного прийняття ризику. Зменшіть розміри позицій по всіх угодах і зосередьтеся лише на конфігураціях найвищої якості.

Сильно захисний означає Композитну оцінку нижче двадцяти. Найширший інституційний відступ від ризику. В historical прецеденті цей показник з'являвся поблизу великих ринкових дислокацій. Торгуйте захисно, захист капіталу перш за все.`
                }
            },
            {
                title: {
                    en: "Fear & Greed: the emotional temperature of the market",
                    uk: "Страх і Жадібність: емоційна температура ринку"
                },
                content: {
                    en: `The Fear & Greed gauge is a single number from zero to 100 that summarizes the overall emotional state of the market. Zero means extreme fear — panic, everyone selling, defensive positioning everywhere. One hundred means extreme greed — euphoria, everyone crowded into longs, complacency at its peak.

[[BOLD_UPPER]]Important: this is a COT-based version, not the CNN index[[/]]

You may have seen the famous CNN Fear & Greed Index. This is not that. The CNN version is built from stock-market internals like the put-call ratio and junk bond demand. This platform builds its own version from the data it specializes in — COT positioning combined with macro context. It answers a more specific question: based on how institutional money is positioned and what the macro backdrop looks like, how greedy or fearful is the market right now? Treat it as a COT-flavored mood reading, not as the CNN index.

[[BOLD_UPPER]]The four components and their weights[[/]]

The score blends four ingredients. The largest weight, 45%, comes from amplified positioning — the average COT Index across all assets, amplified by crowding. When most assets are positioned long and the dispersion between them is low (everyone agrees), this pushes toward greed. When most are positioned short with low dispersion, it pushes toward fear.

Thirty percent comes from VIX, inverted. A low VIX (calm markets) reads as greed; a high VIX (fearful markets) reads as fear. A VIX of 10 maps toward greed, a VIX of 40 maps toward fear.

Fifteen percent comes from the Dollar Index momentum. A strengthening dollar is a risk-off, fear-driven signal — money fleeing to safety. A weakening dollar reads as greed and risk appetite.

The final 10% comes from raw positioning level without amplification, as a stabilizer.

[[BOLD_UPPER]]How to read the five zones[[/]]

[[BOLD]]Extreme Fear (0 to 25)[[/]] — the market is in panic. Historically, these moments have often been near major bottoms, because when everyone has already sold and positioned defensively, there is little selling pressure left. This is a contrarian's hunting ground — not a signal to buy blindly, but a signal to start looking for reversal setups.

[[BOLD]]Fear (25 to 40)[[/]] — caution dominates, positioning is defensive. Good environment to look for quality long setups at a discount, but confirm with individual COT signals.

[[BOLD]]Neutral (40 to 60)[[/]] — the market is balanced. No strong emotional edge in either direction. Trade individual setups on their own merits.

[[BOLD]]Greed (60 to 75)[[/]] — optimism dominates, money is flowing into risk. Trends can run, but start watching for crowding in individual assets.

[[BOLD]]Extreme Greed (75 to 100)[[/]] — euphoria. Historically these moments have often been near major tops, because when everyone is already long, there are few buyers left to push prices higher. This is a warning to tighten risk, take some profits, and avoid chasing new longs.

[[BOLD_UPPER]]How to use it in practice[[/]]

Fear & Greed is a context filter, not a trade trigger. Its best use is as a sanity check against your individual COT signals. If you find a strong long signal on gold while the Fear & Greed gauge shows Extreme Greed at 85, ask yourself whether you are late to a crowded trade. Conversely, a strong long signal that appears during Extreme Fear has the wind of contrarian opportunity behind it.

[[BOLD]]Useful link:[[/]] background on how sentiment extremes work as contrarian indicators — https://www.investopedia.com/terms/c/contrarian.asp`,
                    uk: `Шкала Страху і Жадібності — це єдине число від нуля до ста, яке узагальнює загальний емоційний стан ринку. Нуль означає екстремальний страх — паніка, всі продають, скрізь захисне позиціонування. Сто означає екстремальну жадібність — ейфорія, всі скупчені в довгих позиціях, самозаспокоєння на піку.

[[BOLD_UPPER]]Важливо: це версія на основі COT, а не індекс CNN[[/]]

Можливо, ви бачили знаменитий Індекс страху і жадібності від CNN. Це не він. Версія CNN побудована з внутрішніх показників фондового ринку, таких як співвідношення пут-кол опціонів та попит на сміттєві облігації. Ця платформа будує власну версію з даних, на яких спеціалізується — позиціонування COT у поєднанні з макро контекстом. Вона відповідає на більш конкретне питання: на основі того, як позиціоновані інституційні гроші і який макроекономічний фон, наскільки жадібним або наляканим є ринок прямо зараз? Сприймайте це як читання настрою в стилі COT, а не як індекс CNN.

[[BOLD_UPPER]]Чотири компоненти та їх ваги[[/]]

Оцінка поєднує чотири інгредієнти. Найбільша вага, сорок п'ять відсотків, припадає на підсилене позиціонування — середній Індекс COT по всіх активах, підсилений скупченістю. Коли більшість активів позиціоновані в лонг і дисперсія між ними низька (всі погоджуються), це штовхає до жадібності. Коли більшість позиціоновані в шорт з низькою дисперсією, це штовхає до страху.

Тридцять відсотків припадає на VIX, інвертований. Низький VIX (спокійні ринки) читається як жадібність; високий VIX (налякані ринки) читається як страх. VIX десять відображається до жадібності, VIX сорок — до страху.

П'ятнадцять відсотків припадає на моментум Індексу долара. Долар, що зміцнюється, є сигналом уникнення ризику, керованим страхом — гроші тікають у безпеку. Долар, що слабшає, читається як жадібність та апетит до ризику.

Останні десять відсотків припадають на сирий рівень позиціонування без підсилення, як стабілізатор.

[[BOLD_UPPER]]Як читати п'ять зон[[/]]

[[BOLD]]Екстремальний страх (0 до 25)[[/]] — ринок у паніці. Historically ці моменти часто були поблизу великих днів, бо коли всі вже продали і позиціонувалися захисно, тиску на продаж залишається мало. Це мисливські угіддя контраріанця — не сигнал купувати наосліп, а сигнал почати шукати конфігурації для розвороту.

[[BOLD]]Страх (25 до 40)[[/]] — домінує обережність, позиціонування захисне. Хороше середовище, щоб шукати якісні конфігурації для довгих позицій зі знижкою, але підтверджуйте окремими сигналами COT.

[[BOLD]]Нейтрально (40 до 60)[[/]] — ринок збалансований. Немає сильної емоційної переваги в жодному напрямку. Торгуйте окремі конфігурації за їхніми власними достоїнствами.

[[BOLD]]Жадібність (60 до 75)[[/]] — домінує оптимізм, гроші течуть у ризик. Тренди можуть розвиватися, але починайте стежити за скупченістю в окремих активах.

[[BOLD]]Екстремальна жадібність (75 до 100)[[/]] — ейфорія. Historically ці моменти часто були поблизу великих вершин, бо коли всі вже в лонгу, залишається мало покупців, щоб штовхати ціни вище. Це попередження підтягнути ризик, зафіксувати частину прибутку та уникати гонитви за новими лонгами.

[[BOLD_UPPER]]Як використовувати на практиці[[/]]

Страх і Жадібність — це фільтр контексту, а не тригер угоди. Найкраще використовувати його як перевірку здорового глузду проти ваших окремих сигналів COT. Якщо ви знаходите сильний сигнал на довгу позицію в золоті, поки шкала Страху і Жадібності показує Екстремальну жадібність на рівні вісімдесяти п'яти, запитайте себе, чи не запізнилися ви до скупченої угоди. Навпаки, сильний сигнал на довгу позицію, що з'являється під час Екстремального страху, має за собою вітер контраріанської можливості.

[[BOLD]]Корисне посилання:[[/]] довідка про те, як екстремуми настрою працюють як контраріанські індикатори — https://www.investopedia.com/terms/c/contrarian.asp`
                }
            },
            {
                title: {
                    en: "Velocity and Stagnation: the speed of the market",
                    uk: "Швидкість та Стагнація: швидкість ринку"
                },
                content: {
                    en: `Velocity and Stagnation are two ends of a single scale that measures how fast institutional positioning is changing across the whole market. They are opposites — when one is high, the other is low — which is why the platform shows them on one balance bar with a slider that leans toward whichever force is stronger.

[[BOLD_UPPER]]Velocity — positioning is moving fast[[/]]

Velocity measures the average speed of change in COT positioning across all assets. It is built mostly from the average absolute week-over-week change in the COT Index — how many points, up or down, the typical asset moved this week — combined with the share of assets that are accelerating.

A high Velocity reading means institutional money is actively repositioning. Funds are entering and exiting in size, trends are forming or reversing, and conviction is building across the market. High velocity environments are where the strongest directional moves are born. When Velocity is high and a COT signal aligns with the direction of movement, the signal has momentum behind it.

[[BOLD_UPPER]]Stagnation — positioning is frozen[[/]]

Stagnation measures the share of assets where positioning is barely moving — small weekly change AND the three-week average close to the eight-week average. In other words, the share of the market that is sitting still.

A high Stagnation reading means the market is waiting. Funds are not committing in either direction. This often happens before major macro events — a Federal Reserve decision, a key data release, an election — when institutional money holds its breath. Paradoxically, high stagnation often precedes a large move: the longer the coiling, the sharper the eventual break. Think of it as the quiet before the storm.

[[BOLD_UPPER]]Reading the balance bar[[/]]

The slider sits on a scale from pure Stagnation on the left to pure Velocity on the right. When the dot leans right, the market is in motion — trends are active and tradeable. When the dot leans left, the market is frozen — be patient, reduce activity, and prepare for the eventual breakout rather than forcing trades into a still market. When the dot sits near the center, positioning is shifting at a moderate, healthy pace.

[[BOLD_UPPER]]How to use velocity and stagnation together with the rest of the platform[[/]]

These two metrics set your overall tempo. In a high-velocity environment, COT signals are more likely to deliver follow-through, so you can trade them with normal conviction. In a high-stagnation environment, even good-looking signals may go nowhere for weeks — so reduce position sizes, be more selective, and treat the stagnation as a warning that a catalyst is needed before the market commits.

[[BOLD]]Practical example:[[/]] Velocity is at 65, Stagnation is at 12, and the slider leans clearly right. The market is actively repositioning. You find a long signal on copper with a Priority Score of 78. The high-velocity backdrop supports acting on it — institutional money is in motion and momentum is on your side. Now imagine the opposite: Stagnation is at 55, Velocity is at 20, the slider leans left. The same copper signal exists, but the frozen backdrop suggests it may stall. Reduce size and wait for a catalyst, or for velocity to pick up, before committing fully.`,
                    uk: `Швидкість та Стагнація — це два кінці єдиної шкали, яка вимірює, наскільки швидко змінюється інституційне позиціонування по всьому ринку. Вони є протилежностями — коли одне високе, інше низьке — саме тому платформа показує їх на одній шкалі балансу з повзунком, що нахиляється до тієї сили, яка сильніша.

[[BOLD_UPPER]]Швидкість — позиціонування рухається швидко[[/]]

Швидкість вимірює середню швидкість зміни позиціонування COT по всіх активах. Вона побудована переважно з середньої абсолютної тижневої зміни Індексу COT — на скільки пунктів, вгору чи вниз, типовий актив зрушив цього тижня — у поєднанні з часткою активів, що прискорюються.

Високе значення Швидкості означає, що інституційні гроші активно перепозиціонуються. Фонди входять і виходять у великих обсягах, тренди формуються або розвертаються, і переконаність наростає по всьому ринку. Середовища високої швидкості — це місце, де народжуються найсильніші спрямовані рухи. Коли Швидкість висока і сигнал COT узгоджується з напрямком руху, сигнал має за собою моментум.

[[BOLD_UPPER]]Стагнація — позиціонування застигло[[/]]

Стагнація вимірює частку активів, де позиціонування майже не рухається — мала тижнева зміна І трьохтижневе середнє близьке до восьмитижневого. Іншими словами, частка ринку, що сидить нерухомо.

Високе значення Стагнації означає, що ринок чекає. Фонди не зобов'язуються в жодному напрямку. Це часто відбувається перед великими макро подіями — рішенням Федерального резерву, ключовим релізом даних, виборами — коли інституційні гроші затамовують подих. Парадоксально, висока стагнація часто передує великому руху: чим довше стискання, тим різкіший майбутній прорив. Думайте про це як про затишшя перед бурею.

[[BOLD_UPPER]]Читання шкали балансу[[/]]

Повзунок розташований на шкалі від чистої Стагнації ліворуч до чистої Швидкості праворуч. Коли точка нахиляється праворуч, ринок у русі — тренди активні та придатні для торгівлі. Коли точка нахиляється ліворуч, ринок застиг — будьте терплячими, зменшіть активність і готуйтеся до майбутнього прориву, а не змушуйте угоди на нерухомому ринку. Коли точка сидить біля центру, позиціонування зміщується помірним, здоровим темпом.

[[BOLD_UPPER]]Як використовувати швидкість і стагнацію разом з рештою платформи[[/]]

Ці дві метрики задають ваш загальний темп. У середовищі високої швидкості сигнали COT з більшою ймовірністю дають продовження, тому ви можете торгувати їх із нормальною переконаністю. У середовищі високої стагнації навіть хороші на вигляд сигнали можуть нікуди не зрушити тижнями — тому зменшіть розміри позицій, будьте вибірковішими і сприймайте стагнацію як попередження, що потрібен каталізатор, перш ніж ринок зобов'яжеться.

[[BOLD]]Практичний приклад:[[/]] Швидкість на рівні шістдесяти п'яти, Стагнація на рівні дванадцяти, і повзунок чітко нахиляється праворуч. Ринок активно перепозиціонується. Ви знаходите сигнал на довгу позицію в міді з Оцінкою пріоритету сімдесят вісім. Фон високої швидкості підтримує дію — інституційні гроші в русі і моментум на вашому боці. Тепер уявіть протилежне: Стагнація на рівні п'ятдесяти п'яти, Швидкість на рівні двадцяти, повзунок нахиляється ліворуч. Той самий сигнал міді існує, але застиглий фон свідчить, що він може застрягнути. Зменшіть розмір і зачекайте на каталізатор або на пожвавлення швидкості, перш ніж повністю зобов'язуватися.`
                }
            }
        ]
    },

    // ── 6. CORRELATION ──────────────────────────────────────────────────────────
    {
        key: "correlation",
        icon: "⇄",
        color: "#86efac",
        title: {
            en: "Correlation",
            uk: "Кореляція"
        },
        summary: {
            en: "Which assets are positioned similarly and what that means for your trades. Cross-asset COT alignment analysis.",
            uk: "Які активи позиціоновані схожим чином і що це означає для ваших угод. Аналіз крос-активного узгодження COT."
        },
        blocks: [
            {
                title: {
                    en: "What correlation means here — and what it does not",
                    uk: "Що означає кореляція тут — і що вона не означає"
                },
                content: {
                    en: `The correlation shown on this platform is not statistical price correlation. This is a critical distinction to understand before using this section.

[[BOLD_UPPER]]Price correlation versus COT positioning alignment[[/]]

Traditional price correlation asks: when asset A moves up by 1%, how much does asset B tend to move? This is calculated from price history. Gold and silver have a high statistical price correlation — they tend to move in the same direction most of the time.

The correlation on this platform asks a different question: how similar is the current COT positioning level of asset A compared to asset B? If gold has a COT Index of 78 and silver has a COT Index of 75, their positioning is highly aligned — institutional money is simultaneously bullish on both. If gold has a COT Index of 78 and natural gas has a COT Index of 22, their positioning is opposed — institutional money is bullish on gold and bearish on natural gas at the same time.

[[BOLD_UPPER]]Why this distinction matters[[/]]

Two assets can have high price correlation but opposed COT positioning. If gold and silver typically move together in price but right now hedge funds are aggressively long gold and bearish on silver, this positioning divergence is meaningful — it suggests funds see a different near-term dynamic for each metal despite their normal price relationship.

Conversely, two assets that do not normally move together in price can have highly aligned COT positioning if they share a common macro theme at this moment. The Dollar Index and Japanese yen futures might have opposed COT positioning simultaneously — not because of price correlation, but because the macro trade driving both is dollar strength versus yen weakness.

[[BOLD_UPPER]]Highly Aligned pairs[[/]]

When two assets have a COT Index gap of less than 12 points, they are Highly Aligned. Institutional money is positioned similarly on both. They are telling the same macro story. When one gives a COT signal, the other serves as confirmation. If you find a strong long signal on copper and see that gold is also Highly Aligned in the same direction, the copper signal has additional institutional support.

[[BOLD_UPPER]]Opposed pairs and their trading relevance[[/]]

When two assets have a COT Index gap of more than 50 points, they are in Opposed positioning. One is in or near the bullish zone while the other is in or near the bearish zone. This creates a potential pair trade: simultaneously long the bullish asset and short the bearish asset. The pair trade is particularly powerful when the two assets share a natural economic relationship — for example, long gold and short the US dollar, or long copper and short natural gas.

[[BOLD]]Useful link:[[/]] explanation of how institutional positioning flows between related assets — https://www.investopedia.com/terms/i/intermarket-analysis.asp`,
                    uk: `Кореляція, показана на цій платформі, не є статистичною кореляцією цін. Це критичне розрізнення, яке слід зрозуміти перед використанням цього розділу.

[[BOLD_UPPER]]Кореляція цін проти узгодження позиціонування COT[[/]]

Традиційна кореляція цін запитує: коли актив A рухається вгору на один відсоток, наскільки зазвичай рухається актив B? Це розраховується з цінової history. Золото та срібло мають високу статистичну кореляцію цін — вони, як правило, рухаються в одному напрямку більшість часу.

Кореляція на цій платформі задає інше питання: наскільки схожий поточний рівень позиціонування COT активу A в порівнянні з активом B? Якщо золото має Індекс COT сімдесят вісім, а срібло має Індекс COT сімдесят п'ять, їхнє позиціонування є дуже узгодженим — інституційні гроші одночасно бичачі до обох. Якщо золото має Індекс COT сімдесят вісім, а природний газ має Індекс COT двадцять два, їхнє позиціонування є протилежним — інституційні гроші бичачі до золота і ведмежі до природного газу одночасно.

[[BOLD_UPPER]]Чому це розрізнення важливе[[/]]

Два активи можуть мати високу кореляцію цін, але протилежне позиціонування COT. Якщо золото та срібло зазвичай рухаються разом у ціні, але зараз хедж-фонди агресивно тримають довгі позиції по золоту і є ведмежими до срібла, це розходження позиціонування є значущим — воно свідчить про те, що фонди бачать різну короткострокову динаміку для кожного металу, незважаючи на їхні нормальні цінові відносини.

Навпаки, два активи, які зазвичай не рухаються разом у ціні, можуть мати дуже узгоджене позиціонування COT, якщо вони ділять спільну макро тему в даний момент. Ф'ючерси на Індекс долара та японської єни можуть мати протилежне позиціонування COT одночасно — не через кореляцію цін, а тому що макро трейд, що рухає обома, — це сила долара проти слабкості єни.

[[BOLD_UPPER]]Дуже узгоджені пари[[/]]

Коли два активи мають розрив Індексу COT менше дванадцяти пунктів, вони є Дуже узгодженими. Інституційні гроші позиціоновані схожим чином до обох. Вони розповідають одну й ту саму макро історію. Коли один дає сигнал COT, інший служить підтвердженням. Якщо ви знайдете сильний сигнал на довгу позицію в міді і побачите, що золото також є Дуже узгодженим в тому ж напрямку, сигнал міді має додаткову інституційну підтримку.

[[BOLD_UPPER]]Протилежні пари та їх торгова значимість[[/]]

Коли два активи мають розрив Індексу COT більше п'ятдесяти пунктів, вони знаходяться в Протилежному позиціонуванні. Один знаходиться в або поблизу бичачої зони, тоді як інший знаходиться в або поблизу ведмежої зони. Це створює потенційну парну угоду: одночасно довга позиція в бичачому активі та коротка позиція в ведмежому активі. Парна угода є особливо потужною, коли два активи ділять природний економічний взаємозв'язок — наприклад, довга позиція в золоті та коротка позиція в доларі США, або довга позиція в міді та коротка позиція в природному газі.

[[BOLD]]Корисне посилання:[[/]] пояснення того, як інституційні потоки позиціонування рухаються між пов'язаними активами — https://www.investopedia.com/terms/i/intermarket-analysis.asp`
                }
            },
            {
                title: {
                    en: "Average Alignment and how to use cross-asset patterns",
                    uk: "Середнє узгодження та як використовувати крос-активні патерни"
                },
                content: {
                    en: `The Average Alignment Score shows the overall degree of synchronization across all tracked assets. It is calculated as the average closeness of all pairwise COT Index comparisons across the full universe.

[[BOLD_UPPER]]What high alignment tells you[[/]]

When the Average Alignment Score is above 70, most assets in the universe are positioned similarly. The market is synchronized around one or two dominant themes. This makes trading simpler in one sense — the macro story is clear and consistent. But it also means that when the dominant theme reverses, many assets will reverse simultaneously, so individual position sizing should reflect this systemic risk.

[[BOLD_UPPER]]What low alignment tells you[[/]]

When the Average Alignment Score is below 40, the market is fragmented. Different asset classes are telling contradictory stories. Growth assets may be bullish while inflation assets are bearish. Currencies may be giving opposite signals. In this environment, do not try to trade a broad market theme — instead, focus on the specific individual assets with the clearest and strongest COT setups, regardless of whether they fit a coherent macro narrative.

[[BOLD_UPPER]]Top Aligned Pairs — strongest confluences[[/]]

The list of Top Aligned Pairs shows which specific pairs of assets currently have the most similar COT positioning. These pairs represent the strongest confluences available in the market right now. If both assets in a top-aligned pair are in the bullish zone, and you have a long signal on one of them, the alignment with the other provides additional validation. If you are already in a position on one asset, a top-aligned partner in the same direction gives you confidence to hold.

[[BOLD_UPPER]]Top Opposed Pairs — potential pair trades[[/]]

The list of Top Opposed Pairs shows which specific pairs currently have the most divergent COT positioning. These are your best candidate pair trades. The most reliable pair trades combine a top-opposed positioning relationship with a natural economic connection between the two assets.

Classic examples from the platform: gold long paired with dollar short when their positioning is opposed, because the economic inverse relationship between gold and the dollar makes the institutional divergence more meaningful. Copper long paired with natural gas short when commodity positioning diverges along growth-versus-supply lines.

[[BOLD_UPPER]]Important limitation to remember[[/]]

COT alignment does not tell you when or how much the price will move. It tells you the direction of institutional conviction. You still need technical analysis for entry timing, and risk management for position sizing. The correlation analysis is a filter and a validation tool, not a standalone trading system.`,
                    uk: `Оцінка середнього узгодження показує загальний ступінь синхронізації по всіх відстежуваних активах. Вона розраховується як середня близькість усіх парних порівнянь Індексу COT по всьому всесвіту.

[[BOLD_UPPER]]Що говорить вам висока узгодженість[[/]]

Коли Оцінка середнього узгодження вище сімдесяти, більшість активів у всесвіті позиціоновані схожим чином. Ринок синхронізований навколо однієї або двох домінантних тем. Це спрощує торгівлю в одному сенсі — макро історія є чіткою та послідовною. Але це також означає, що коли домінантна тема розвертається, багато активів розвернуться одночасно, тому розміри окремих позицій повинні відображати цей системний ризик.

[[BOLD_UPPER]]Що говорить вам низька узгодженість[[/]]

Коли Оцінка середнього узгодження нижче сорока, ринок є фрагментованим. Різні класи активів розповідають суперечливі історії. Активи зростання можуть бути бичачими, поки інфляційні активи є ведмежими. Валюти можуть давати протилежні сигнали. У цьому середовищі не намагайтеся торгувати широкою ринковою темою — натомість зосередьтеся на конкретних індивідуальних активах з найчіткішими та найсильнішими конфігураціями COT, незалежно від того, чи вписуються вони в послідовний макро наратив.

[[BOLD_UPPER]]Топ узгоджених пар — найсильніші збіжності[[/]]

Список Топ узгоджених пар показує, які конкретні пари активів наразі мають найбільш схоже позиціонування COT. Ці пари представляють найсильніші збіжності, доступні на ринку прямо зараз. Якщо обидва активи у топ-узгодженій парі знаходяться в бичачій зоні, і у вас є сигнал на довгу позицію по одному з них, узгодженість з іншим забезпечує додаткову валідацію. Якщо ви вже знаходитеся в позиції по одному активу, партнер у тому ж напрямку з топ-узгодженості дає вам впевненість тримати.

[[BOLD_UPPER]]Топ протилежних пар — потенційні парні угоди[[/]]

Список Топ протилежних пар показує, які конкретні пари наразі мають найбільш розбіжне позиціонування COT. Це ваші найкращі кандидати для парних угод. Найнадійніші парні угоди поєднують відносини протилежного позиціонування з природним економічним зв'язком між двома активами.

Класичні приклади з платформи: довга позиція в золоті в парі з короткою позицією в доларі, коли їхнє позиціонування є протилежним, тому що економічна зворотна залежність між золотом і доларом робить інституційне розходження більш значущим. Довга позиція в міді в парі з короткою позицією в природному газі, коли позиціонування сировинних товарів розходиться по лінії зростання та пропозиції.

[[BOLD_UPPER]]Важливе обмеження, яке слід пам'ятати[[/]]

Узгодженість COT не говорить вам, коли або наскільки зміниться ціна. Вона говорить вам про напрямок інституційної переконаності. Вам все одно потрібен технічний аналіз для визначення часу входу та управління ризиком для розміру позиції. Аналіз кореляції є фільтром і інструментом валідації, а не самостійною торговою системою.`
                }
            }
        ]
    },

    // ── 7. SEASONALITY ──────────────────────────────────────────────────────────
    {
        key: "seasonality",
        icon: "◷",
        color: "#67e8f9",
        title: {
            en: "Seasonality",
            uk: "Сезонність"
        },
        summary: {
            en: "Calendar-based statistical tendencies in COT positioning based on a five-year average. Your third filter after COT and macro — never the first.",
            uk: "Календарні статистичні тенденції в позиціонуванні COT на основі п'ятирічного середнього. Ваш третій фільтр після COT та макро — ніколи не перший."
        },
        blocks: [
            {
                title: {
                    en: "How seasonality is calculated and why it is useful",
                    uk: "Як розраховується сезонність і чому вона корисна"
                },
                content: {
                    en: `For each asset and each calendar month, the platform calculates the average COT Index value over the last five years for that specific month. The result is a 12-cell grid showing the typical institutional positioning tendency for each month of the year.

[[BOLD_UPPER]]The calculation step by step[[/]]

Take gold in November as an example. The platform looks at the COT Index reading for gold during November across the last five years: in 2020 the average November COT Index was 80-two, in 2021 it was 71, in 2022 it was 64, in 2023 it was 78, and in 2024 it was 85. The five-year average is 76.

A result of 76 means that statistically, in November, hedge funds have historically been in a bullish positioning zone for gold. The seasonal grid shows this as a green cell.

[[BOLD_UPPER]]What the colors mean[[/]]

Green cells indicate months where the five-year average COT Index is above 60 — historically favorable positioning for long trades. Brighter green indicates stronger historical tendency. Red cells indicate months where the five-year average COT Index is below 40 — historically unfavorable for long trades and supportive of short positioning. The yellow-bordered cell is the current month.

[[BOLD_UPPER]]Seasonal Breadth[[/]]

Seasonal Breadth is the percentage of all tracked assets that currently have a supportive seasonal window — meaning their current month falls in a green zone. When Breadth is above 60 percent, the overall calendar context is favorable. Most assets are in historically positive seasonal windows, providing a general tailwind for long positions. When Breadth is below 30%, the calendar is working against the majority of assets. This does not mean you cannot trade, but it is an additional headwind that should be factored into position sizing and risk management.

[[BOLD_UPPER]]What seasonality cannot tell you[[/]]

Seasonality is a statistical average of historical positioning. It does not know about this year's specific Federal Reserve policy, this year's geopolitical events, or this year's supply disruptions. An asset with a historically red November can still deliver a strong bullish COT signal in November if the fundamental or macro conditions are unusual. Seasonality is a headwind or tailwind, not a wall.

[[BOLD]]Useful link:[[/]] explanation of seasonal patterns in commodity markets — https://www.cmegroup.com/education/courses/introduction-to-futures/understanding-seasonal-tendencies.html`,
                    uk: `Для кожного активу та кожного календарного місяця платформа розраховує середнє значення Індексу COT за останні п'ять років для цього конкретного місяця. Результатом є сітка з дванадцяти клітинок, що показує типову інституційну тенденцію позиціонування для кожного місяця року.

[[BOLD_UPPER]]Розрахунок крок за кроком[[/]]

Візьмемо золото у листопаді як приклад. Платформа дивиться на значення Індексу COT для золота в листопаді за останні п'ять років: у 2020 році середній листопадовий Індекс COT становив вісімдесят два, у 2021 — сімдесят один, у 2022 — шістдесят чотири, у 2023 — сімдесят вісім, і у 2024 — вісімдесят п'ять. П'ятирічне середнє дорівнює сімдесяти шести.

Результат сімдесят шість означає, що статистично в листопаді хедж-фонди historically знаходилися в бичачій зоні позиціонування для золота. Сезонна сітка показує це як зелену клітинку.

[[BOLD_UPPER]]Що означають кольори[[/]]

Зелені клітинки вказують на місяці, де п'ятирічне середнє значення Індексу COT перевищує шістдесят — historically сприятливе позиціонування для довгих угод. Яскравіший зелений вказує на сильнішу historical тенденцію. Червоні клітинки вказують на місяці, де п'ятирічне середнє значення Індексу COT нижче сорока — historically несприятливе для довгих угод та таке, що підтримує коротке позиціонування. Клітинка з жовтою рамкою є поточним місяцем.

[[BOLD_UPPER]]Сезонний охват[[/]]

Сезонний охват — це відсоток усіх відстежуваних активів, які наразі мають сприятливе сезонне вікно, тобто їхній поточний місяць припадає на зелену зону. Коли Охват вище шістдесяти відсотків, загальний календарний контекст є сприятливим. Більшість активів знаходиться в historically позитивних сезонних вікнах, забезпечуючи загальний попутний вітер для довгих позицій. Коли Охват нижче тридцяти відсотків, календар працює проти більшості активів. Це не означає, що ви не можете торгувати, але це додатковий зустрічний вітер, який слід враховувати при розмірі позиції та управлінні ризиком.

[[BOLD_UPPER]]Що сезонність не може вам розповісти[[/]]

Сезонність є статистичним середнім historical позиціонування. Вона не знає про цьогорічну конкретну політику Федерального резерву, цьогорічні геополітичні події або цьогорічні перебої в постачанні. Актив з historically червоним листопадом все одно може дати сильний бичачий сигнал COT у листопаді, якщо фундаментальні або макроекономічні умови є незвичними. Сезонність — це зустрічний або попутний вітер, а не стіна.

[[BOLD]]Корисне посилання:[[/]] пояснення сезонних патернів на товарних ринках — https://www.cmegroup.com/education/courses/introduction-to-futures/understanding-seasonal-tendencies.html`
                }
            },
            {
                title: {
                    en: "Three scenarios: how to combine seasonality with COT and macro",
                    uk: "Три сценарії: як поєднувати сезонність з COT та макро"
                },
                content: {
                    en: `Seasonality is most powerful when used as a third filter that either reinforces or tempers the conclusion you have already reached from the COT and macro analysis.

[[BOLD_UPPER]]Scenario one — all three aligned (ideal setup)[[/]]

The COT Index is at 74 and in the Accumulation flow state, confirming a bullish setup. The relevant macro segment (for example, the Inflation segment for gold) is above 65, providing macro confirmation. The seasonal score for the current month is 76 (green cell), indicating a historically favorable calendar window.

All three independent filters agree. This is the highest-confidence scenario. Position size can be at its maximum within your risk parameters. Entry can be taken when technical analysis provides a suitable level.

[[BOLD_UPPER]]Scenario two — COT and macro agree but seasonality is against[[/]]

The COT Index is at 71, the macro context is supportive, but the seasonal score for the current month is 28 (red cell) — historically this month has been bearish for this asset.

The signal exists and is valid, but there is a calendar headwind. Two approaches make sense here. First: reduce your position size to half of what you would normally use, to reflect the lower historical probability. Second: wait for the beginning of the next calendar month if that month transitions to a green zone — the signal may still be active and you enter with a seasonality tailwind instead of a headwind. Do not abandon a quality COT signal purely due to seasonality, but do respect the friction it introduces.

[[BOLD_UPPER]]Scenario three — COT is bullish but both macro and seasonality are against[[/]]

The COT Index is at 68, suggesting a possible long setup, but the macro regime is in Defensive mode (Composite below 35) and the seasonal score is also red at 22. Two out of three filters are against the trade.

Skip this trade entirely. When two independent filters simultaneously contradict a COT signal, the probability of a successful outcome falls significantly. The COT setup may be real, but the timing is wrong. Wait for either the macro environment to improve or the seasonal window to turn favorable before acting.

[[BOLD_UPPER]]Using seasonality to time exits[[/]]

Seasonality is not only useful for entries — it can also help you decide when to exit a profitable position.

Suppose you are holding a profitable long position in an asset. The COT Index is still at 70, confirming the long setup is intact. But the seasonal curve shows that the current month is the last green month before two consecutive red months. This is a strong signal to take profits on most of the position or to tighten your stop loss significantly. Even if the COT signal remains technically active, the declining seasonal probability over the next two months creates asymmetric risk — the time-weighted expected value of holding shifts in favor of taking money off the table.

[[BOLD_UPPER]]The golden rule of seasonality[[/]]

Never use seasonality as your primary reason to enter a trade. It must always be the third confirmation after COT positioning and macroeconomic context. A green seasonal cell alone, without a supportive COT regime and macro alignment, is not a tradeable signal. Seasonality tells you the wind direction — you still need the engine of COT and the navigation of macro to make the journey worthwhile.`,
                    uk: `Сезонність є найбільш потужною, коли використовується як третій фільтр, який або підсилює, або пом'якшує висновок, до якого ви вже дійшли з аналізу COT та макро.

[[BOLD_UPPER]]Сценарій перший — всі три узгоджені (ідеальна конфігурація)[[/]]

Індекс COT знаходиться на рівні сімдесяти чотирьох і перебуває в стані потоку Накопичення, підтверджуючи бичачу конфігурацію. Відповідний макро сегмент (наприклад, сегмент Інфляції для золота) знаходиться вище шістдесяти п'яти, забезпечуючи макро підтвердження. Сезонний показник поточного місяця становить сімдесят шість (зелена клітинка), вказуючи на historically сприятливе календарне вікно.

Всі три незалежні фільтри погоджуються. Це сценарій найвищої впевненості. Розмір позиції може бути максимальним в рамках ваших параметрів ризику. Вхід можна здійснювати, коли технічний аналіз надає підходящий рівень.

[[BOLD_UPPER]]Сценарій другий — COT і макро погоджуються, але сезонність проти[[/]]

Індекс COT на рівні сімдесяти одного, макро контекст сприятливий, але сезонний показник поточного місяця становить двадцять вісім (червона клітинка) — historically цей місяць був ведмежим для цього активу.

Сигнал існує і є дійсним, але є календарний зустрічний вітер. Тут мають сенс два підходи. Перший: зменшіть розмір позиції до половини від того, що ви зазвичай використовуєте, щоб відобразити нижчу historical ймовірність. Другий: зачекайте на початок наступного календарного місяця, якщо цей місяць переходить у зелену зону — сигнал може бути ще активним і ви входите з попутним вітром сезонності замість зустрічного. Не відмовляйтеся від якісного сигналу COT виключно через сезонність, але поважайте тертя, яке вона вносить.

[[BOLD_UPPER]]Сценарій третій — COT бичачий, але і макро, і сезонність проти[[/]]

Індекс COT на рівні шістдесяти восьми, що припускає можливу конфігурацію для довгої позиції, але макро режим знаходиться в Захисному режимі (Композитний нижче тридцяти п'яти) і сезонний показник також червоний на рівні двадцяти двох. Два з трьох фільтрів проти угоди.

Повністю пропустіть цю угоду. Коли два незалежні фільтри одночасно суперечать сигналу COT, ймовірність успішного результату суттєво падає. Конфігурація COT може бути реальною, але час є неправильним. Зачекайте, поки або макро середовище покращиться, або сезонне вікно стане сприятливим перед тим, як діяти.

[[BOLD_UPPER]]Використання сезонності для визначення часу виходів[[/]]

Сезонність корисна не лише для входів — вона також може допомогти вам вирішити, коли виходити з прибуткової позиції.

Припустимо, ви тримаєте прибуткову довгу позицію в активі. Індекс COT все ще на рівні сімдесяти, підтверджуючи, що конфігурація для довгої позиції є незмінною. Але сезонна крива показує, що поточний місяць є останнім зеленим місяцем перед двома послідовними червоними місяцями. Це сильний сигнал для фіксації прибутку по більшій частині позиції або для суттєвого підтягування стоп-лоссу. Навіть якщо сигнал COT залишається технічно активним, падіння сезонної ймовірності протягом наступних двох місяців створює асиметричний ризик — зважена за часом очікувана цінність утримання зміщується на користь зняття грошей зі столу.

[[BOLD_UPPER]]Золоте правило сезонності[[/]]

Ніколи не використовуйте сезонність як вашу основну причину для входу в угоду. Вона завжди повинна бути третім підтвердженням після позиціонування COT та макроекономічного контексту. Зелена сезонна клітинка сама по собі, без підтримуючого режиму COT та макро узгодження, не є придатним для торгівлі сигналом. Сезонність говорить вам напрямок вітру — вам все одно потрібен двигун COT та навігація макро, щоб подорож мала сенс.`
                }
            },
            {
                title: {
                    en: "Triple-Confirm Setups: when seasonal, COT, and flow align",
                    uk: "Потрійне підтвердження: коли сезонність, COT та потік збігаються"
                },
                content: {
                    en: `The Triple-Confirm Spotlight finds assets where three independent filters are simultaneously confirmed — this is the strongest possible seasonal signal on the platform.

[[BOLD_UPPER]]The three conditions[[/]]

[[BOLD]]Seasonal score of 60 or above[[/]] means that in the current calendar month, the five-year average COT Index for this asset is in the bullish zone. The seasonal wind is blowing in your direction.

[[BOLD]]COT Index of 65 or above (for long) or 35 or below (for short)[[/]] means that hedge funds are currently positioned in the same direction that seasonal history suggests. Institutional money and calendar are aligned.

[[BOLD]]Flow state is directional[[/]] means the flow state is not Neutral — it is either Accumulation, Distribution, Long Extreme, or Short Extreme. This confirms that the current positioning is actively moving, not stalling.

[[BOLD_UPPER]]Why all three together matter[[/]]

Each filter alone is insufficient. A strong seasonal score without COT confirmation means the calendar says one thing but institutional money says another — high risk. A strong COT signal without seasonal support means you are trading against the historical calendar tendency — reduced probability. Only when all three agree do you have a statistically meaningful edge.

[[BOLD_UPPER]]How to use the sparkline[[/]]

Each Triple-Confirm card shows a 12-month sparkline of average COT positioning across five years. The current month is highlighted with a vertical amber marker. Look at the shape of the curve around the highlighted month — if the curve peaks here and declines in the following months, this may be the optimal entry window before seasonal tailwind fades.

[[BOLD_UPPER]]What to do when no setups are shown[[/]]

When the Triple-Confirm panel shows no setups, it also shows the closest candidates with checkmarks indicating which conditions each asset has met and which it has not. This tells you exactly what is missing — for example, a strong seasonal score but no COT confirmation means the setup is developing and worth monitoring for next week's COT report.

[[BOLD_UPPER]]Practical rule[[/]]

A Triple-Confirm setup is not a trade signal by itself. It is the highest-quality filter output the platform can generate. Confirm entry timing with price action or technical analysis, and manage risk as you would with any setup.`,

                    uk: `Spotlight потрійного підтвердження знаходить активи, де три незалежні фільтри підтверджені одночасно — це найсильніший можливий сезонний сигнал на платформі.

[[BOLD_UPPER]]Три умови[[/]]

[[BOLD]]Сезонний показник шістдесят або вище[[/]] означає, що в поточному календарному місяці п'ятирічний середній Індекс COT для цього активу знаходиться в бичачій зоні. Сезонний вітер дує у вашому напрямку.

[[BOLD]]Індекс COT шістдесят п'ять або вище (для лонгу) або тридцять п'ять або нижче (для шорту)[[/]] означає, що хедж-фонди зараз позиціоновані в тому ж напрямку, який підказує сезонна historical. Інституційні гроші та календар узгоджені.

[[BOLD]]Стан потоку є спрямованим[[/]] означає, що стан потоку не є Нейтральним — він знаходиться в стані Накопичення, Розподілу, Екстремуму лонгу або Екстремуму шорту. Це підтверджує, що поточне позиціонування активно рухається, а не застряло.

[[BOLD_UPPER]]Чому всі три разом важливі[[/]]

Кожен фільтр окремо недостатній. Сильний сезонний показник без підтвердження COT означає, що календар каже одне, а інституційні гроші — інше, це підвищений ризик. Сильний сигнал COT без сезонної підтримки означає, що ви торгуєте проти historical календарної тенденції, знижена ймовірність. Тільки коли всі три погоджуються, у вас є статистично значуща перевага.

[[BOLD_UPPER]]Як використовувати спарклайн[[/]]

Кожна картка потрійного підтвердження показує дванадцятимісячний спарклайн середнього COT позиціонування за п'ять років. Поточний місяць виділений вертикальним янтарним маркером. Подивіться на форму кривої навколо виділеного місяця — якщо крива тут досягає піку і знижується в наступних місяцях, це може бути оптимальне вікно входу до того, як сезонний попутний вітер згасне.

[[BOLD_UPPER]]Що робити коли немає сетапів[[/]]

Коли панель потрійного підтвердження не показує сетапів, вона також показує найближчих кандидатів з позначками, які умови кожен актив виконав, а які ні. Це точно говорить вам чого не вистачає — наприклад, сильний сезонний показник, але немає підтвердження COT означає, що сетап розвивається і варто відстежувати в наступному тижневому звіті COT.

[[BOLD_UPPER]]Практичне правило[[/]]

Сетап потрійного підтвердження сам по собі не є торговим сигналом. Це найякісніший фільтр, який може згенерувати платформа. Підтвердіть момент входу за допомогою цінової дії або технічного аналізу та керуйте ризиком так само, як і з будь-яким іншим сетапом.`
                }
            }
        ]
    }
]