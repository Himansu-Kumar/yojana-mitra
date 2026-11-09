"""Thin wrapper around the Gemini API. Swap providers here without touching the routers."""

import json

from fastapi import HTTPException
from google import genai
from google.genai import types

from app.core.config import get_settings

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    settings = get_settings()
    if not settings.gemini_api_key:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY is not set in ml-service/.env")
    if _client is None:
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client


def is_configured() -> bool:
    return bool(get_settings().gemini_api_key)


async def generate_json(contents: list, system: str, temperature: float = 0.2) -> dict:
    """Calls the model and parses a JSON object from the reply."""
    client = _get_client()
    try:
        resp = await client.aio.models.generate_content(
            model=get_settings().gemini_model,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system,
                response_mime_type="application/json",
                temperature=temperature,
            ),
        )
    except Exception as e:  # network, quota, invalid key...
        raise HTTPException(status_code=502, detail=f"LLM request failed: {e}") from e

    try:
        return json.loads(resp.text or "{}")
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=502, detail="LLM returned invalid JSON") from e


def image_part(data: bytes, mime_type: str):
    return types.Part.from_bytes(data=data, mime_type=mime_type)
