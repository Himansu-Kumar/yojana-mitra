from fastapi import FastAPI

from app.routers import chat, ocr, planned
from app.services import llm

app = FastAPI(title="Yojana Mitra ML service", version="0.1.0")

# Called only by the Node server (server/src/clients/mlClient.js), never by browsers, so no CORS.
app.include_router(chat.router)
app.include_router(ocr.router)
app.include_router(planned.router)


@app.get("/health")
def health():
    return {"status": "ok", "llm": "configured" if llm.is_configured() else "missing GEMINI_API_KEY"}
