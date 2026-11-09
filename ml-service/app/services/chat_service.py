"""RAG answer generation. Retrieval happens in the server; this service only writes the answer."""

import json

from app.schemas.chat import ChatRequest, ChatResponse
from app.services import llm

SYSTEM = """You are Yojana Mitra, a helpful guide to Indian government welfare schemes.

Rules:
- Use ONLY the schemes given in SCHEMES. If they don't answer the question, say so and suggest what to ask instead.
- Never invent amounts, dates, rules or websites.
- Each scheme includes the user's eligibility status and reason, computed by our rule engine. Trust it; don't re-judge eligibility.
- Write for someone with little formal education: short sentences, plain words, no jargon. Keep it under 150 words.
- Use simple bullet points ("• ") for lists.
- Always remind the user to apply only on the official portal, never through agents who ask for money.
- Reply in {language}.

Return JSON: {{"answer": "<text>", "citations": ["<slug of each scheme you mentioned>"]}}"""

LANGUAGE_NAMES = {"en": "simple English", "hi": "simple Hindi written in Devanagari script"}


async def answer(req: ChatRequest) -> ChatResponse:
    schemes = [s.model_dump(exclude_none=True) for s in req.schemes]
    history = "\n".join(f"{h.role}: {h.content}" for h in req.history[-6:])

    prompt = (
        f"USER PROFILE (facts only): {json.dumps(req.profile, ensure_ascii=False)}\n\n"
        f"SCHEMES: {json.dumps(schemes, ensure_ascii=False)}\n\n"
        f"CONVERSATION SO FAR:\n{history or '(none)'}\n\n"
        f"QUESTION: {req.message}"
    )

    data = await llm.generate_json(
        contents=[prompt],
        system=SYSTEM.format(language=LANGUAGE_NAMES[req.language]),
    )

    allowed = {s.slug for s in req.schemes}
    citations = [c for c in data.get("citations", []) if c in allowed]  # drop anything invented
    return ChatResponse(answer=str(data.get("answer", "")).strip(), citations=citations)
