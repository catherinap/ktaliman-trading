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
        max_tokens=600,
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
    if language == "uk":
        return f"""Проаналізуй поточне COT позиціонування:
Актив: {name} ({symbol}) | Сектор: {sector}
COT Index (0=3-річний мінімум, 100=3-річний максимум): {fmt(cot_index)}
Flow State: {flow_state}
Funds/Leveraged Net: {fmt_num(funds_net)}
Dealer Net: {fmt_num(dealer_net)}
{extra}Open Interest: {fmt_num(oi)}
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
    growth = data.get("growth_score"); inflation = data.get("inflation_score")
    policy = data.get("policy_score"); composite = data.get("composite")
    if language == "uk":
        return f"""Проаналізуй поточний макро-режим на основі COT даних:
Growth (індекси): {fmt(growth)} | {sleeve_str(data.get('growth_assets', []))}
Inflation (метали/енергія): {fmt(inflation)} | {sleeve_str(data.get('inflation_assets', []))}
Policy (FX): {fmt(policy)} | {sleeve_str(data.get('policy_assets', []))}
Composite: {fmt(composite)}
Шкала: 0=3-річний мінімум, 100=3-річний максимум
Структуруй відповідь:
**Режим:** назви поточний макро-режим одним словосполученням
**Домінуючий sleeve:** який sleeve веде і чому це важливо для трейдера
**Основний наратив:** 2-3 речення про загальну картину
**Ключовий ризик:** що може змінити поточний режим
Максимум 180 слів."""
    return f"""Analyze macro regime based on COT data:
Growth (indices): {fmt(growth)} | {sleeve_str(data.get('growth_assets', []))}
Inflation (metals/energy): {fmt(inflation)} | {sleeve_str(data.get('inflation_assets', []))}
Policy (FX): {fmt(policy)} | {sleeve_str(data.get('policy_assets', []))}
Composite: {fmt(composite)}
Scale: 0=3-year low, 100=3-year high
Structure your response:
**Regime:** name current macro regime in one phrase
**Dominant sleeve:** which sleeve leads and why it matters for a trader
**Core narrative:** 2-3 sentences on the overall picture
**Key risk:** what could shift the current regime
Max 180 words."""

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
State: active=активний зараз, aging=затухаючий, candidate=потребує підтвердження, stale=застарілий
Структуруй відповідь:
**Сигнал тижня:** найсильніший і чому саме він
**Загальний bias:** Risk-On / Risk-Off / Mixed з обгрунтуванням
**Крос-активне підтвердження:** які сигнали підсилюють один одного
**Застереження:** який сигнал найбільш ризикований або вимагає додаткового підтвердження
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
Найбільш узгоджені пари (COT Index в дужках, шкала 0–100):
{aligned_lines or "немає даних"}
Найбільш протилежні пари (потенційні pair trades):
{opposed_lines or "немає даних"}
Структуруй відповідь:
**Загальна синхронізація:** ринок узгоджений чи фрагментований і що це означає
**Домінуючий наратив:** яка macro тема зараз об'єднує найбільше активів
**Найкращий pair trade:** найсильніша протилежна пара та логіка угоди
**Попередження:** де є хибна кореляція або прихований ризик
Максимум 180 слів."""
    return f"""Analyze cross-asset COT positioning alignment:
Average alignment: {fmt(avg_alignment)} | Average distance: {fmt(avg_distance)}
Same-sector pairs: {same_sector} | Cross-sector pairs: {cross_sector}
Most aligned pairs (COT Index in brackets, scale 0–100):
{aligned_lines or "no data"}
Most opposed pairs (potential pair trades):
{opposed_lines or "no data"}
Structure your response:
**Overall synchronization:** is the market aligned or fragmented and what it means
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
        cot_str = f", COT Index={fmt(cot)}" if cot is not None else ""
        return f"  {r.get('name')} ({r.get('symbol')}): Seasonal={fmt(r.get('current'))}{cot_str}"
    top_lines = "\n".join(row_line(r) for r in data.get("top_assets", [])[:6])
    bottom_lines = "\n".join(row_line(r) for r in data.get("bottom_assets", [])[:4])
    if language == "uk":
        return f"""Проаналізуй сезонні COT тенденції для поточного місяця:
Поточний місяць: {current_month}
Активів з підтримуючою сезонністю (seasonal score вище 55): {supportive_count} з {total}
Активів з несприятливою сезонністю (seasonal score нижче 45): {headwind_count} з {total}
Найсильніші сезонні попутні вітри цього місяця:
{top_lines or "немає даних"}
Найсильніші сезонні зустрічні вітри:
{bottom_lines or "немає даних"}
Seasonal score: 0=мінімальне history позиціонування, 100=максимальне. COT Index: поточне позиціонування фондів.
Структуруй відповідь:
**Сезонний контекст місяця:** загальна картина для {current_month}
**Збіжності:** де seasonal score та COT Index вказують в одному напрямку (найбільш надійні setup-и)
**Суперечності:** де seasonal та COT розходяться — підвищена обережність
**Практичний висновок:** 1-2 конкретних активи з найбільшим triple-confirm (COT + macro + seasonal)
Максимум 200 слів."""
    return f"""Analyze seasonal COT tendencies for the current month:
Current month: {current_month}
Assets with supportive seasonality (seasonal score above 55): {supportive_count} of {total}
Assets with seasonal headwind (seasonal score below 45): {headwind_count} of {total}
Strongest seasonal tailwinds this month:
{top_lines or "no data"}
Strongest seasonal headwinds:
{bottom_lines or "no data"}
Seasonal score: 0=minimum historical positioning, 100=maximum. COT Index: current fund positioning.
Structure your response:
**Monthly seasonal context:** overall picture for {current_month}
**Confluences:** where seasonal score and COT Index point the same direction (most reliable setups)
**Contradictions:** where seasonal and COT diverge — increased caution needed
**Practical takeaway:** 1-2 specific assets with the strongest triple-confirm (COT + macro + seasonal)
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

class SummaryRequest(BaseModel):
    prompt: str

@router.post("/gpt/summary")
def gpt_summary(payload: SummaryRequest):
    try:
        text = get_gemini_response(system="You are a senior macro and COT analyst.", user=payload.prompt)
        return {"text": text}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
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