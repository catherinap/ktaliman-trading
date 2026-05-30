import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import Literal

load_dotenv(".env.local")
router = APIRouter()

class AIRequest(BaseModel):
    type: Literal["asset", "macro", "signals", "correlation", "seasonality"]
    language: Literal["en", "uk"] = "en"
    data: dict

def get_gemini_response(system: str, user: str) -> str:
    try:
        from groq import Groq
    except ImportError:
        raise HTTPException(status_code=500, detail="groq not installed. Run: pip install groq")
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=400, detail="GROQ_API_KEY is not set in .env.local")
    client = Groq(api_key=api_key)
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        temperature=0.25,
        max_tokens=700,
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ],
    )
    return response.choices[0].message.content.strip()

def fmt(v) -> str:
    if v is None: return "n/a"
    try: return f"{float(v):.1f}"
    except Exception: return str(v)

def fmt_num(v) -> str:
    if v is None: return "n/a"
    try: return f"{float(v):,.0f}"
    except Exception: return str(v)

def system_prompt(language: str) -> str:
    if language == "uk":
        return (
            "Ти старший макроекономічний аналітик та спеціаліст з COT звітів CFTC. "
            "Відповідай ВИКЛЮЧНО українською мовою. "
            "Використовуй природну фінансову термінологію. "
            "Будь конкретним, лаконічним та практично корисним для активного трейдера. "
            "Не повторюй вхідні дані — інтерпретуй їх. "
            "Форматуй заголовки жирним через **заголовок:**"
        )
    return (
        "You are a senior macro analyst specializing in CFTC COT reports. "
        "Respond in English only. "
        "Use natural financial terminology. "
        "Be specific, concise, and practically useful for an active trader. "
        "Do not repeat input data — interpret it. "
        "Format section headers in bold using **header:**"
    )

def asset_prompt(data: dict, language: str) -> str:
    name = data.get("name", "Unknown"); symbol = data.get("symbol", ""); sector = data.get("sector", "")
    cot_index = data.get("funds_percentile_3y"); flow_state = data.get("flow_state", "Neutral")
    funds_net = data.get("funds_net"); dealer_net = data.get("dealer_net")
    oi = data.get("open_interest"); am_net = data.get("asset_manager_net"); producer_net = data.get("producer_net")
    extra = ""
    if am_net is not None: extra += f"Asset Manager Net: {fmt_num(am_net)}\n"
    if producer_net is not None: extra += f"Producer/Merchant Net: {fmt_num(producer_net)}\n"
    contrarian_signal = data.get("contrarian_signal")
    contrarian_label  = data.get("contrarian_label")
    contrarian_note   = ""
    if contrarian_signal:
      contrarian_note = f"\nContrarian COT Read: {contrarian_signal} — {contrarian_label}"
      contrarian_note += f"\n(This means the crowd is crowded on one side — factor this into your risk assessment)"

    if language == "uk":
        return f"""Проаналізуй поточне COT позиціонування:
Актив: {name} ({symbol}) | Сектор: {sector}
COT Index (0=3-річний мінімум, 100=3-річний максимум): {fmt(cot_index)}
Flow State: {flow_state}
Funds/Leveraged Net: {fmt_num(funds_net)}
Dealer Net: {fmt_num(dealer_net)}
{extra}{contrarian_note}
Open Interest: {fmt_num(oi)}
Структуруй відповідь:
**Поточний стан:** що говорять цифри про інституційне позиціонування
**Контекст:** що це означає для цього активу прямо зараз
**На що дивитись:** конкретний тригер або подія наступного тижня
**Bias:** Bullish / Bearish / Neutral з коротким обгрунтуванням
Максимум 200 слів."""
    return f"""Analyze current COT positioning:
Asset: {name} ({symbol}) | Sector: {sector}
COT Index (0=3y low, 100=3y high): {fmt(cot_index)}
Flow State: {flow_state}
Funds/Leveraged Net: {fmt_num(funds_net)}
Dealer Net: {fmt_num(dealer_net)}
{extra}Open Interest: {fmt_num(oi)}
Structure your response:
**Current State:** what the numbers say about institutional positioning
**Context:** what this means for this asset right now
**What to Watch:** specific trigger or event for next week
**Bias:** Bullish / Bearish / Neutral with brief reasoning
Max 200 words."""

def macro_prompt(data: dict, language: str) -> str:
    def sleeve_str(assets):
        return ", ".join(f"{a.get('name')} [{fmt(a.get('funds_percentile_3y'))}]" for a in (assets or [])[:4])

    growth    = data.get("growth_score")
    inflation = data.get("inflation_score")
    grains    = data.get("grains_score")
    policy    = data.get("policy_score")
    composite = data.get("composite")

    # Sector rotation: find top and bottom sleeve
    scores = {"Growth": growth, "Inflation": inflation, "Grains": grains, "Policy": policy}
    valid = {k: v for k, v in scores.items() if v is not None}
    rotation_note = ""
    if len(valid) >= 2:
        top    = max(valid, key=valid.get)
        bottom = min(valid, key=valid.get)
        spread = valid[top] - valid[bottom]
        rotation_note = f"Sector rotation signal: funds favour {top} ({fmt(valid[top])}) over {bottom} ({fmt(valid[bottom])}), spread={fmt(spread)}"

    # Crypto context
    crypto_assets = data.get("crypto_assets", [])
    crypto_note = ""
    if crypto_assets:
        crypto_note = "Crypto positioning: " + ", ".join(
            f"{a.get('name')} [{fmt(a.get('funds_percentile_3y'))}]" for a in crypto_assets[:2]
        )

    if language == "uk":
        return f"""Проаналізуй поточний макро-режим на основі COT даних:
Growth (індекси): {fmt(growth)} | {sleeve_str(data.get('growth_assets', []))}
Inflation (метали/енергія): {fmt(inflation)} | {sleeve_str(data.get('inflation_assets', []))}
Grains (зерно/агро): {fmt(grains)} | {sleeve_str(data.get('grains_assets', []))}
Policy (FX): {fmt(policy)} | {sleeve_str(data.get('policy_assets', []))}
Composite: {fmt(composite)}
{rotation_note}
{crypto_note}
Шкала: 0=3-річний мінімум, 100=3-річний максимум
Структуруй відповідь:
**Режим:** назви поточний макро-режим одним словосполученням
**Ротація капіталу:** куди рухаються інституційні гроші між секторами
**Основний наратив:** 2-3 речення про загальну картину включаючи агро та крипто
**Ключовий ризик:** що може змінити поточний режим
Максимум 200 слів."""
    return f"""Analyze macro regime based on COT data:
Growth (indices): {fmt(growth)} | {sleeve_str(data.get('growth_assets', []))}
Inflation (metals/energy): {fmt(inflation)} | {sleeve_str(data.get('inflation_assets', []))}
Grains (agricultural): {fmt(grains)} | {sleeve_str(data.get('grains_assets', []))}
Policy (FX): {fmt(policy)} | {sleeve_str(data.get('policy_assets', []))}
Composite: {fmt(composite)}
{rotation_note}
{crypto_note}
Scale: 0=3-year low, 100=3-year high
Structure your response:
**Regime:** name current macro regime in one phrase
**Capital rotation:** where institutional money is moving between sectors
**Core narrative:** 2-3 sentences on the overall picture including agri and crypto signals
**Key risk:** what could shift the current regime
Max 200 words."""

def signals_prompt(data: dict, language: str) -> str:
    signals = data.get("signals", [])[:6]
    def signal_line(s):
        return (f"- {s.get('asset')} ({s.get('symbol')}): {str(s.get('direction','')).upper()}, "
                f"COT Index={fmt(s.get('percentile'))}, State={s.get('state')}, "
                f"Quality={fmt(s.get('entryQualityScore'))}, Sector={s.get('sector')}")
    lines = "\n".join(signal_line(s) for s in signals) if signals else "No signals available"
    if language == "uk":
        return f"""Проаналізуй топ COT сигнали поточного тижня:
{lines}
COT Index: 0=3-річний мінімум, 100=3-річний максимум
State: active=активний, aging=затухаючий, candidate=потребує підтвердження, stale=застарілий
Структуруй відповідь:
**Сигнал тижня:** найсильніший і чому
**Загальний bias:** Risk-On / Risk-Off / Mixed
**Крос-активне підтвердження:** які сигнали підсилюють один одного
**Застереження:** який сигнал найбільш ризикований
Максимум 180 слів."""
    return f"""Analyze top COT signals for the current week:
{lines}
COT Index: 0=3-year low, 100=3-year high
State: active=actionable now, aging=fading, candidate=needs confirmation, stale=outdated
Structure your response:
**Signal of the week:** strongest and why
**Overall bias:** Risk-On / Risk-Off / Mixed with reasoning
**Cross-asset confirmation:** which signals reinforce each other
**Caution:** which signal is most risky or needs additional confirmation
Max 180 words."""

def correlation_prompt(data: dict, language: str) -> str:
    avg_alignment = data.get("avg_alignment"); avg_distance = data.get("avg_distance")
    same_sector = data.get("same_sector_pairs", 0); cross_sector = data.get("cross_sector_pairs", 0)
    def pair_line(p):
        return (f"  {p.get('left')} [{fmt(p.get('leftPct'))}] ↔ {p.get('right')} [{fmt(p.get('rightPct'))}]"
                f" — {p.get('relationship')} (gap {fmt(p.get('distance'))})")
    aligned_lines = "\n".join(pair_line(p) for p in data.get("aligned_pairs", [])[:5])
    opposed_lines = "\n".join(pair_line(p) for p in data.get("opposed_pairs", [])[:5])
    if language == "uk":
        return f"""Проаналізуй крос-активне COT позиціонування:
Середнє узгодження: {fmt(avg_alignment)} | Середній розкид: {fmt(avg_distance)}
Пари в одному секторі: {same_sector} | Крос-секторні пари: {cross_sector}
Найбільш узгоджені пари: {aligned_lines or "немає даних"}
Найбільш протилежні пари: {opposed_lines or "немає даних"}
Структуруй відповідь:
**Синхронізація:** ринок узгоджений чи фрагментований
**Домінуючий наратив:** яка macro тема об'єднує найбільше активів
**Найкращий pair trade:** найсильніша протилежна пара та логіка
**Попередження:** де є прихований ризик
Максимум 180 слів."""
    return f"""Analyze cross-asset COT positioning alignment:
Average alignment: {fmt(avg_alignment)} | Average distance: {fmt(avg_distance)}
Same-sector pairs: {same_sector} | Cross-sector pairs: {cross_sector}
Most aligned pairs: {aligned_lines or "no data"}
Most opposed pairs: {opposed_lines or "no data"}
Structure your response:
**Overall synchronization:** is the market aligned or fragmented
**Dominant narrative:** which macro theme currently unites the most assets
**Best pair trade:** strongest opposed pair and the trade logic
**Warning:** where there is false correlation or hidden risk
Max 180 words."""

def seasonality_prompt(data: dict, language: str) -> str:
    current_month = data.get("current_month", "Unknown")
    supportive_count = data.get("supportive_count", 0)
    headwind_count = data.get("headwind_count", 0)
    total = data.get("total_assets", 0)
    def row_line(r):
        cot = r.get("cot_index")
        cot_str = f", COT={fmt(cot)}" if cot is not None else ""
        return f"  {r.get('name')} ({r.get('symbol')}): Seasonal={fmt(r.get('current'))}{cot_str}"
    top_lines    = "\n".join(row_line(r) for r in data.get("top_assets", [])[:6])
    bottom_lines = "\n".join(row_line(r) for r in data.get("bottom_assets", [])[:4])
    if language == "uk":
        return f"""Проаналізуй сезонні COT тенденції для {current_month}:
Підтримуючих (score>55): {supportive_count}/{total} | Зустрічний вітер (score<45): {headwind_count}/{total}
Топ tailwinds: {top_lines or "немає"}
Топ headwinds: {bottom_lines or "немає"}
Seasonal score: 0=мінімум, 100=максимум. COT=поточне позиціонування фондів.
Структуруй відповідь:
**Сезонний контекст:** загальна картина {current_month}
**Збіжності:** де seasonal та COT збігаються (найнадійніші setups)
**Суперечності:** де розходяться — обережність
**Висновок:** 1-2 активи з найсильнішим triple-confirm
Максимум 200 слів."""
    return f"""Analyze seasonal COT tendencies for {current_month}:
Supportive (score>55): {supportive_count}/{total} | Headwind (score<45): {headwind_count}/{total}
Top tailwinds: {top_lines or "no data"}
Top headwinds: {bottom_lines or "no data"}
Seasonal score: 0=min historical, 100=max. COT=current fund positioning.
Structure your response:
**Monthly context:** overall picture for {current_month}
**Confluences:** where seasonal and COT align (most reliable setups)
**Contradictions:** where they diverge — increased caution
**Takeaway:** 1-2 assets with strongest triple-confirm (COT + macro + seasonal)
Max 200 words."""

PROMPT_BUILDERS = {
    "asset":       asset_prompt,
    "macro":       macro_prompt,
    "signals":     signals_prompt,
    "correlation": correlation_prompt,
    "seasonality": seasonality_prompt,
}

@router.post("/gpt/ai-analysis")
def ai_analysis(payload: AIRequest):
    builder = PROMPT_BUILDERS.get(payload.type)
    if not builder:
        raise HTTPException(status_code=400, detail=f"Unknown analysis type: {payload.type}")
    try:
        text = get_gemini_response(
            system=system_prompt(payload.language),
            user=builder(payload.data, payload.language),
        )
        return {"ok": True, "text": text, "type": payload.type, "language": payload.language}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq error: {str(e)}")

@router.post("/gpt/translate")
async def translate_text(payload: dict):
    text = payload.get("text", "")
    target = payload.get("target", "uk")
    if not text.strip():
        return {"ok": False, "text": ""}
    lang_name = "Ukrainian" if target == "uk" else "English"
    try:
        result = get_gemini_response(
            system=f"You are a professional translator. Translate text to {lang_name}. Keep all formatting markers like **text**. Return only the translated text, nothing else.",
            user=text
        )
        return {"ok": True, "text": result}
    except Exception as e:
        return {"ok": False, "text": str(e)}