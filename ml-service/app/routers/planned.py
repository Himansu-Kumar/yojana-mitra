"""Endpoints planned in the build guide. Each returns 501 until its step is built.
Move each into its own router file when you implement it."""

from fastapi import APIRouter, HTTPException

router = APIRouter(tags=["planned"])


def _planned(step: str):
    raise HTTPException(status_code=501, detail=f"Not built yet: {step} (see docs/build-guide.md)")


@router.post("/search/embed")
async def embed():
    """Step 4: multilingual sentence embeddings for semantic search."""
    _planned("Step 4, semantic search")


@router.post("/rules/extract")
async def extract_rules():
    """Step 5: LLM converts eligibility text into JSON rules for admin review."""
    _planned("Step 5, rule extractor")


@router.post("/scam/check")
async def scam_check():
    """Step 8: classify a message as genuine / suspicious."""
    _planned("Step 8, Scam Shield")


@router.post("/voice/stt")
async def speech_to_text():
    """Step 6: server-side speech-to-text (Whisper / Bhashini) for IVR and WhatsApp voice notes."""
    _planned("Step 6, speech-to-text")


@router.post("/voice/tts")
async def text_to_speech():
    """Step 6: server-side text-to-speech for IVR."""
    _planned("Step 6, text-to-speech")
