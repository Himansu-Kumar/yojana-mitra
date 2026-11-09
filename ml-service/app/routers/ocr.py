from fastapi import APIRouter, File, HTTPException, UploadFile

from app.core.config import get_settings
from app.schemas.ocr import ExtractResponse
from app.services import ocr_service

router = APIRouter(prefix="/ocr", tags=["ocr"])

ALLOWED = {"image/jpeg", "image/png", "image/webp", "application/pdf"}


@router.post("/extract", response_model=ExtractResponse)
async def extract(file: UploadFile = File(...)) -> ExtractResponse:
    if file.content_type not in ALLOWED:
        raise HTTPException(status_code=400, detail="Upload a JPG, PNG, WEBP or PDF")
    data = await file.read()
    if len(data) > get_settings().max_upload_mb * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large")
    # Processed in memory only; nothing is stored.
    return await ocr_service.extract(data, file.content_type)
