import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv(".env.local")
router = APIRouter()

class SummaryRequest(BaseModel):
    prompt: str

@router.post("/gpt/summary")
def gpt_summary(payload: SummaryRequest):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=400, detail="OPENAI_API_KEY is not set")

    client = OpenAI(api_key=api_key)

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.3,
        messages=[
            {"role": "system", "content": "You are a senior macro and COT analyst."},
            {"role": "user", "content": payload.prompt},
        ],
    )

    text = response.choices[0].message.content
    return {"text": text}