"""Reads ID / income documents and returns profile fields.

Primary engine: Gemini vision (handles Indian documents, Hindi text and PDFs well).
Fallback: Tesseract + regex, if pytesseract and the Tesseract program are installed.
"""

import io
import re
from datetime import datetime

from fastapi import HTTPException

from app.schemas.ocr import ExtractedFields, ExtractResponse
from app.services import llm

SYSTEM = """You read Indian identity and certificate documents and extract fields as JSON.

Return exactly:
{
  "documentType": "aadhaar" | "pan" | "income_certificate" | "caste_certificate" | "ration_card" | "unknown",
  "confidence": number between 0 and 1,
  "fields": {
    "name": string or null,
    "dateOfBirth": "YYYY-MM-DD" or null,
    "gender": "male" | "female" | "other" | null,
    "state": string or null (full state name),
    "district": string or null,
    "annualIncome": number or null (yearly income in rupees, from income certificates only),
    "category": "general" | "obc" | "sc" | "st" | "ews" | null (from caste certificates only),
    "idLast4": string or null (ONLY the last 4 digits of the ID number)
  }
}

Privacy: NEVER output a full Aadhaar, PAN or any full ID number. Only the last 4 characters in idLast4.
If a field is not clearly visible, use null. Do not guess."""


def _clean(fields: dict) -> ExtractedFields:
    f = {k: v for k, v in (fields or {}).items() if v not in (None, "", "null")}
    if "idLast4" in f:
        digits = re.sub(r"\W", "", str(f["idLast4"]))[-4:]
        f["idLast4"] = digits or None
    for key in ("gender", "category"):
        if key in f:
            f[key] = str(f[key]).lower()
    try:
        return ExtractedFields(**f)
    except Exception:
        # Drop any field the model got wrong rather than failing the whole request
        safe = {}
        for k, v in f.items():
            try:
                ExtractedFields(**{k: v})
                safe[k] = v
            except Exception:
                pass
        return ExtractedFields(**safe)


async def extract(data: bytes, mime_type: str) -> ExtractResponse:
    if llm.is_configured():
        result = await llm.generate_json(
            contents=[llm.image_part(data, mime_type), "Extract the fields from this document."],
            system=SYSTEM,
            temperature=0,
        )
        doc_type = result.get("documentType", "unknown")
        if doc_type not in ("aadhaar", "pan", "income_certificate", "caste_certificate", "ration_card"):
            doc_type = "unknown"
        return ExtractResponse(
            documentType=doc_type,
            fields=_clean(result.get("fields", {})),
            confidence=result.get("confidence"),
            engine="gemini",
        )

    return _extract_with_tesseract(data, mime_type)


# ---------------- offline fallback ----------------

DOB_PATTERNS = [
    r"(?:DOB|D\.O\.B|Date of Birth|जन्म तिथि)\s*[:/-]?\s*(\d{2})[/-](\d{2})[/-](\d{4})",
    r"\b(\d{2})[/-](\d{2})[/-](\d{4})\b",
]


def parse_text_fields(text: str) -> tuple[str, ExtractedFields]:
    """Best-effort parsing of OCR text. Pure function: easy to unit test."""
    t = text or ""
    fields: dict = {}

    for pat in DOB_PATTERNS:
        m = re.search(pat, t, re.IGNORECASE)
        if m:
            d, mo, y = m.groups()
            try:
                fields["dateOfBirth"] = datetime(int(y), int(mo), int(d)).strftime("%Y-%m-%d")
                break
            except ValueError:
                continue

    # No \b around Hindi words: Devanagari vowel signs aren't "word" characters for \b
    if re.search(r"\bFEMALE\b|महिला", t, re.IGNORECASE):
        fields["gender"] = "female"
    elif re.search(r"\bMALE\b|पुरुष", t, re.IGNORECASE):
        fields["gender"] = "male"

    aadhaar = re.search(r"\b\d{4}\s?\d{4}\s?(\d{4})\b", t)
    if aadhaar:
        fields["idLast4"] = aadhaar.group(1)

    income = re.search(r"(?:annual income|income)[^\d₹]{0,40}(?:Rs\.?|₹|INR)?\s*([\d,]{4,})", t, re.IGNORECASE)
    if income:
        fields["annualIncome"] = float(income.group(1).replace(",", ""))

    if re.search(r"income certificate|आय प्रमाण", t, re.IGNORECASE):
        doc_type = "income_certificate"
    elif aadhaar or re.search(r"aadhaar|आधार|unique identification", t, re.IGNORECASE):
        doc_type = "aadhaar"
    elif re.search(r"permanent account number|income tax department", t, re.IGNORECASE):
        doc_type = "pan"
    else:
        doc_type = "unknown"

    return doc_type, ExtractedFields(**fields)


def _extract_with_tesseract(data: bytes, mime_type: str) -> ExtractResponse:
    try:
        import pytesseract
        from PIL import Image
    except ImportError as e:
        raise HTTPException(
            status_code=503,
            detail="No OCR engine available: set GEMINI_API_KEY, or install pytesseract + Tesseract",
        ) from e

    if not mime_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Offline OCR supports images only")

    try:
        text = pytesseract.image_to_string(Image.open(io.BytesIO(data)), lang="eng+hin")
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Tesseract failed: {e}") from e

    doc_type, fields = parse_text_fields(text)
    return ExtractResponse(documentType=doc_type, fields=fields, confidence=None, engine="tesseract")
