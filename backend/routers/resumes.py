from __future__ import annotations

import asyncio
import os
from io import BytesIO
from pathlib import Path
from typing import Any

import pdfplumber
from docx import Document
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from openai import OpenAI, RateLimitError
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models import Resume, User

router = APIRouter(prefix="/resumes", tags=["resumes"])


class ContactInfo(BaseModel):
    email: str | None = None
    phone: str | None = None
    location: str | None = None
    linkedin: str | None = None
    github: str | None = None
    website: str | None = None


class SkillCategory(BaseModel):
    category: str
    skills: list[str] = Field(default_factory=list)


class ExperienceItem(BaseModel):
    company: str | None = None
    role: str | None = None
    dates: str | None = None
    bullets: list[str] = Field(default_factory=list)


class EducationItem(BaseModel):
    institution: str | None = None
    degree: str | None = None
    dates: str | None = None
    details: list[str] = Field(default_factory=list)


class ParsedResume(BaseModel):
    name: str | None = None
    contact_info: ContactInfo = Field(default_factory=ContactInfo)
    skills: list[SkillCategory] = Field(default_factory=list)
    experience: list[ExperienceItem] = Field(default_factory=list)
    education: list[EducationItem] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)


def clean_text(text: str) -> str:
    return "\n".join(line.strip() for line in text.splitlines() if line.strip())


def extract_pdf_text(data: bytes) -> str:
    with pdfplumber.open(BytesIO(data)) as pdf:
        return clean_text("\n".join(page.extract_text() or "" for page in pdf.pages))


def extract_docx_text(data: bytes) -> str:
    doc = Document(BytesIO(data))
    return clean_text("\n".join(paragraph.text for paragraph in doc.paragraphs))


def parse_resume_with_openai(text: str) -> ParsedResume:
    client = OpenAI()
    response = client.responses.parse(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        input=[
            {
                "role": "system",
                "content": "Extract resume data. Use nulls and empty arrays when data is missing.",
            },
            {"role": "user", "content": text[:50000]},
        ],
        text_format=ParsedResume,
    )
    return response.output_parsed


async def get_or_create_test_user(db: AsyncSession) -> User:
    email = "test@example.com"
    user = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if user:
        return user

    user = User(email=email)
    db.add(user)
    await db.flush()
    return user


def resume_to_json(resume: Resume) -> dict[str, Any]:
    return {
        "id": str(resume.id),
        "user_id": str(resume.user_id),
        "structured_data": resume.structured_data,
        "file_url": resume.file_url,
        "created_at": resume.created_at.isoformat(),
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_resume(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
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
        parsed = await asyncio.to_thread(parse_resume_with_openai, text)
    except RateLimitError as exc:
        raise HTTPException(status_code=429, detail="OpenAI rate limit reached. Try again later.") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="OpenAI resume parsing failed.") from exc

    user = await get_or_create_test_user(db)
    resume = Resume(user_id=user.id, structured_data=parsed.model_dump(), file_url=None)
    db.add(resume)
    await db.commit()
    await db.refresh(resume)
    return resume_to_json(resume)
