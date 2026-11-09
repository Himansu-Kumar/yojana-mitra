from fastapi import APIRouter

from app.schemas.chat import ChatRequest, ChatResponse
from app.services import chat_service

router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    return await chat_service.answer(req)
