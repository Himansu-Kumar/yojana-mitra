from typing import Literal

from pydantic import BaseModel, Field


class HistoryItem(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(max_length=4000)


class SchemeContext(BaseModel):
    """A scheme the server retrieved for this question, with the user's eligibility for it."""

    slug: str
    name: str
    description: str | None = None
    benefit: str | None = None
    documents: list[str] = []
    applyUrl: str | None = None
    eligibilityStatus: str | None = None
    eligibilityReason: str | None = None


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)
    language: Literal["en", "hi"] = "en"
    history: list[HistoryItem] = []
    profile: dict = {}  # non-identifying facts only (age, state, category...)
    schemes: list[SchemeContext] = []


class ChatResponse(BaseModel):
    answer: str
    citations: list[str] = []
