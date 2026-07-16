from __future__ import annotations

import asyncio
import os
from io import BytesIO
from pathlib import Path
from typing import Any

import pdfplumber
from docx import Document
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth import get_current_user
from backend.database import get_db
from backend.models import Resume, User
from backend.resume_parser import parse_resume_local

router = APIRouter(prefix="/resumes", tags=["resumes"])


# Local parser used instead of Pydantic models here


def clean_text(text: str) -> str:
    return "\n".join(line.strip() for line in text.splitlines() if line.strip())


def extract_pdf_text(data: bytes) -> str:
    with pdfplumber.open(BytesIO(data)) as pdf:
        return clean_text("\n".join(page.extract_text() or "" for page in pdf.pages))


def extract_docx_text(data: bytes) -> str:
    doc = Document(BytesIO(data))
    return clean_text("\n".join(paragraph.text for paragraph in doc.paragraphs))


# Deleted openai parser function




def resume_to_json(resume: Resume) -> dict[str, Any]:
    return {
        "id": str(resume.id),
        "structured_data": resume.structured_data,
        "file_url": resume.file_url,
        "created_at": resume.created_at.isoformat(),
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_resume(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict[str, Any]:
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in {".pdf", ".docx"}:
        raise HTTPException(status_code=400, detail="Only .pdf and .docx files are supported.")

    data = await file.read()
    try:
        text = extract_pdf_text(data) if suffix == ".pdf" else extract_docx_text(data)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Could not parse resume file.") from exc

    if not text:
        raise HTTPException(status_code=400, detail="Resume file did not contain readable text.")

    try:
        parsed = await asyncio.to_thread(parse_resume_local, text)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Resume parsing failed.") from exc

    resume = Resume(user_id=user.id, structured_data=parsed.model_dump(), file_url=None)
    db.add(resume)
    await db.commit()
    await db.refresh(resume)
    return resume_to_json(resume)


@router.get("/latest")
async def get_latest_user_resume(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> dict[str, Any] | None:
    resume = (
        await db.execute(
            select(Resume)
            .where(Resume.user_id == user.id)
            .order_by(Resume.created_at.desc())
        )
    ).scalars().first()
    if not resume:
        return None
    return resume_to_json(resume)

