import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import Literal

load_dotenv(".env.local")
router = APIRouter()


# ─── Request schema ───────────────────────────────────────────────────────────

class AIRequest(BaseModel):
    type: Literal["asset", "macro", "signals"]
    language: Literal["en", "uk"] = "en"
    data: dict


# ─── Gemini client ────────────────────────────────────────────────────────────

def get_gemini_response(system: str, user: str) -> str:
    """
    Calls Groq API (free tier: 14,400 req/day, no credit card needed).
    Get your free key at: console.groq.com
    """
    try:
        from groq import Groq
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="groq not installed. Run: pip install groq"
        )

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=400,
            detail="GROQ_API_KEY is not set in .env.local. Get a free key at console.groq.com"
        )

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


# ─── Helpers ──────────────────────────────────────────────────────────────────

def fmt(v) -> str:
    if v is None:
        return "n/a"
    try:
        return f"{float(v):.1f}"
    except Exception:
        return str(v)


def fmt_num(v) -> str:
    if v is None:
        return "n/a"
    try:
        return f"{float(v):,.0f}"
    except Exception:
        return str(v)


# ─── System prompts ───────────────────────────────────────────────────────────

def system_prompt(language: str) -> str:
    if language == "uk":
        return (
            "Ти старший макроекономічний аналітик та спеціаліст з COT (Commitment of Traders) звітів CFTC. "
            "Відповідай ВИКЛЮЧНО українською мовою. "
            "Використовуй природну фінансову термінологію. "
            "Будь конкретним, лаконічним та практично корисним для активного трейдера. "
            "Не повторюй вхідні дані — інтерпретуй їх. "
            "Форматуй заголовки жирним через **заголовок:**"
        )
    return (
        "You are a senior macro analyst specializing in CFTC COT (Commitment of Traders) reports. "
        "Respond in English only. "
        "Use natural financial terminology. "
        "Be specific, concise, and practically useful for an active trader. "
        "Do not repeat input data — interpret it. "
        "Format section headers in bold using **header:**"
    )


# ─── User prompt builders ─────────────────────────────────────────────────────

def asset_prompt(data: dict, language: str) -> str:
    name         = data.get("name", "Unknown")
    symbol       = data.get("symbol", "")
    sector       = data.get("sector", "")
    cot_index    = data.get("funds_percentile_3y")
    flow_state   = data.get("flow_state", "Neutral")
    funds_net    = data.get("funds_net")
    dealer_net   = data.get("dealer_net")
    oi           = data.get("open_interest")
    am_net       = data.get("asset_manager_net")
    producer_net = data.get("producer_net")

    extra = ""
    if am_net is not None:
        extra += f"Asset Manager Net: {fmt_num(am_net)}\n"
    if producer_net is not None:
        extra += f"Producer/Merchant Net: {fmt_num(producer_net)}\n"

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
        return ", ".join(
            f"{a.get('name')} [{fmt(a.get('funds_percentile_3y'))}]"
            for a in (assets or [])[:4]
        )

    growth    = data.get("growth_score")
    inflation = data.get("inflation_score")
    policy    = data.get("policy_score")
    composite = data.get("composite")

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
        return (
            f"- {s.get('asset')} ({s.get('symbol')}): "
            f"{str(s.get('direction', '')).upper()}, "
            f"COT Index={fmt(s.get('percentile'))}, "
            f"State={s.get('state')}, "
            f"Quality={fmt(s.get('entryQualityScore'))}, "
            f"Sector={s.get('sector')}"
        )

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


# ─── Prompt registry ──────────────────────────────────────────────────────────

PROMPT_BUILDERS = {
    "asset":   asset_prompt,
    "macro":   macro_prompt,
    "signals": signals_prompt,
}


# ─── Main route ───────────────────────────────────────────────────────────────

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
        raise HTTPException(status_code=500, detail=f"Gemini error: {str(e)}")


# ─── Legacy endpoint (backward compatibility) ─────────────────────────────────

class SummaryRequest(BaseModel):
    prompt: str

@router.post("/gpt/summary")
def gpt_summary(payload: SummaryRequest):
    try:
        text = get_gemini_response(
            system="You are a senior macro and COT analyst.",
            user=payload.prompt,
        )
        return {"text": text}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
