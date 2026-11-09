from typing import Literal

from pydantic import BaseModel

DocumentType = Literal["aadhaar", "pan", "income_certificate", "caste_certificate", "ration_card", "unknown"]


class ExtractedFields(BaseModel):
    name: str | None = None
    dateOfBirth: str | None = None  # YYYY-MM-DD
    gender: Literal["male", "female", "other"] | None = None
    state: str | None = None
    district: str | None = None
    annualIncome: float | None = None
    category: Literal["general", "obc", "sc", "st", "ews"] | None = None
    idLast4: str | None = None  # never the full ID number


class ExtractResponse(BaseModel):
    documentType: DocumentType = "unknown"
    fields: ExtractedFields = ExtractedFields()
    confidence: float | None = None
    engine: str
