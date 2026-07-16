from __future__ import annotations

import asyncio
import os
from datetime import date, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from openai import OpenAI, RateLimitError
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.models import Application, Resume, Score, TailoredDoc, User
from backend.tailoring import TailoredAssets, tailor_with_openai

router = APIRouter(prefix="/applications", tags=["applications"])

JD_EXTRACTION_PROMPT = """Extract job metadata from a pasted job description.
Return null for company, role, or deadline when the text does not clearly say it.
Deadline must be an ISO date (YYYY-MM-DD). Use the current date only to resolve explicit relative dates.
"""


class ApplicationCreate(BaseModel):
    jd_text: str = Field(min_length=1)
    company: str | None = None
    role: str | None = None
    deadline: date | None = None


class ExtractedJobInfo(BaseModel):
    company: str | None = None
    role: str | None = None
    deadline: date | None = None


class ApplicationStatusUpdate(BaseModel):
    status: str = Field(min_length=1)


class ScoreAssets(BaseModel):
    relevance_score: int = Field(ge=0, le=100)
    matched_strengths: list[str] = Field(default_factory=list)
    drawbacks: list[str] = Field(default_factory=list)
    fix_suggestions: list[str] = Field(default_factory=list)


class ScoreResponse(ScoreAssets):
    id: UUID
    application_id: UUID
    resume_id: UUID


class ApplicationResponse(BaseModel):
    id: UUID
    user_id: UUID
    company: str
    role: str
    jd_text: str
    deadline: date | None
    status: str
    created_at: datetime


class TailoredDocResponse(TailoredAssets):
    id: UUID
    application_id: UUID
    created_at: datetime


def score_with_openai(resume_data: dict, jd_text: str) -> ScoreAssets:
    client = OpenAI()
    response = client.responses.parse(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        input=[
            {
                "role": "system",
                "content": "Score resume fit for the job description. Use only evidence present in the resume JSON.",
            },
            {"role": "user", "content": f"Resume JSON:\n{resume_data}\n\nJob description:\n{jd_text[:50000]}"},
        ],
        text_format=ScoreAssets,
    )
    return response.output_parsed


def extract_job_info_with_openai(jd_text: str) -> ExtractedJobInfo:
    client = OpenAI()
    response = client.responses.parse(
        model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
        input=[
            {
                "role": "system",
                "content": f"{JD_EXTRACTION_PROMPT}\nCurrent date: {date.today().isoformat()}",
            },
            {"role": "user", "content": jd_text[:50000]},
        ],
        text_format=ExtractedJobInfo,
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


def application_to_response(application: Application) -> ApplicationResponse:
    return ApplicationResponse(
        id=application.id,
        user_id=application.user_id,
        company=application.company,
        role=application.role,
        jd_text=application.jd_text,
        deadline=application.deadline,
        status=application.status,
        created_at=application.created_at,
    )


def tailored_doc_to_response(doc: TailoredDoc) -> TailoredDocResponse:
    return TailoredDocResponse(
        id=doc.id,
        application_id=doc.application_id,
        tailored_bullets=doc.tailored_bullets,
        cover_letter=doc.cover_letter,
        created_at=doc.created_at,
    )


def score_to_response(score: Score) -> ScoreResponse:
    return ScoreResponse(
        id=score.id,
        application_id=score.application_id,
        resume_id=score.resume_id,
        relevance_score=score.relevance_score,
        matched_strengths=score.matched_strengths,
        drawbacks=score.drawbacks,
        fix_suggestions=score.fix_suggestions,
    )


async def get_latest_resume(db: AsyncSession, user_id: UUID) -> Resume | None:
    return (
        await db.execute(
            select(Resume)
            .where(Resume.user_id == user_id)
            .order_by(Resume.created_at.desc())
        )
    ).scalars().first()


@router.get("", response_model=list[ApplicationResponse])
async def list_applications(db: AsyncSession = Depends(get_db)) -> list[ApplicationResponse]:
    applications = (await db.execute(select(Application).order_by(Application.created_at.desc()))).scalars().all()
    return [application_to_response(application) for application in applications]


@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_application(
    payload: ApplicationCreate,
    db: AsyncSession = Depends(get_db),
) -> ApplicationResponse:
    company = payload.company.strip() if payload.company else None
    role = payload.role.strip() if payload.role else None
    deadline = payload.deadline
    jd_text = payload.jd_text.strip()
    if not jd_text:
        raise HTTPException(status_code=422, detail="jd_text cannot be empty.")

    if not company or not role:
        try:
            extracted = await asyncio.to_thread(extract_job_info_with_openai, jd_text)
        except RateLimitError as exc:
            raise HTTPException(status_code=429, detail="OpenAI rate limit reached. Try again later.") from exc
        except Exception as exc:
            raise HTTPException(status_code=502, detail="OpenAI job description parsing failed.") from exc

        company = company or (extracted.company.strip() if extracted.company else None)
        role = role or (extracted.role.strip() if extracted.role else None)
        deadline = deadline or extracted.deadline

    if not company or not role:
        raise HTTPException(status_code=422, detail="Company and role are required or must be extractable from jd_text.")

    user = await get_or_create_test_user(db)
    application = Application(
        user_id=user.id,
        company=company,
        role=role,
        jd_text=jd_text,
        deadline=deadline,
        status="Applied",
    )
    db.add(application)
    await db.commit()
    await db.refresh(application)
    return application_to_response(application)


@router.patch("/{application_id}/status", response_model=ApplicationResponse)
async def update_application_status(
    application_id: UUID,
    payload: ApplicationStatusUpdate,
    db: AsyncSession = Depends(get_db),
) -> ApplicationResponse:
    application = (
        await db.execute(select(Application).where(Application.id == application_id))
    ).scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")

    application.status = payload.status.strip()
    await db.commit()
    await db.refresh(application)
    return application_to_response(application)


@router.post("/{application_id}/score", response_model=ScoreResponse, status_code=status.HTTP_201_CREATED)
async def score_application(
    application_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> ScoreResponse:
    application = (
        await db.execute(select(Application).where(Application.id == application_id))
    ).scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")

    resume = await get_latest_resume(db, application.user_id)
    if not resume:
        raise HTTPException(status_code=404, detail="No resume found for this application user.")

    try:
        assets = await asyncio.to_thread(score_with_openai, resume.structured_data, application.jd_text)
    except RateLimitError as exc:
        raise HTTPException(status_code=429, detail="OpenAI rate limit reached. Try again later.") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="OpenAI scoring failed.") from exc

    score_doc = (
        await db.execute(select(Score).where(Score.application_id == application.id))
    ).scalar_one_or_none()
    if score_doc:
        score_doc.resume_id = resume.id
        score_doc.relevance_score = assets.relevance_score
        score_doc.matched_strengths = assets.matched_strengths
        score_doc.drawbacks = assets.drawbacks
        score_doc.fix_suggestions = assets.fix_suggestions
    else:
        score_doc = Score(
            application_id=application.id,
            resume_id=resume.id,
            relevance_score=assets.relevance_score,
            matched_strengths=assets.matched_strengths,
            drawbacks=assets.drawbacks,
            fix_suggestions=assets.fix_suggestions,
        )
        db.add(score_doc)

    await db.commit()
    await db.refresh(score_doc)
    return score_to_response(score_doc)



def export_filename(application: Application) -> str:
    raw = f"applyiq-{application.company}-{application.role}".lower().replace(" ", "-")
    slug = "".join(char for char in raw if char.isalnum() or char in "-_").strip("-")
    return f"{slug or 'tailored-application'}.md"


def build_export_markdown(
    application: Application,
    resume: Resume | None,
    doc: TailoredDoc,
    score: Score | None,
) -> str:
    resume_name = (resume.structured_data or {}).get("name") if resume else None
    sections = [
        f"# {application.role} at {application.company}",
        f"Status: {application.status}",
    ]
    if resume_name:
        sections.append(f"Candidate: {resume_name}")
    if score:
        sections.extend([
            "",
            "## Match Score",
            f"{score.relevance_score}%",
            "",
            "### Matched Strengths",
            *[f"- {item}" for item in score.matched_strengths],
            "",
            "### Gaps",
            *[f"- {item}" for item in score.drawbacks],
            "",
            "### Optimization Suggestions",
            *[f"- {item}" for item in score.fix_suggestions],
        ])
    sections.extend([
        "",
        "## Tailored Resume Bullets",
        *[f"- {bullet}" for bullet in doc.tailored_bullets],
        "",
        "## Cover Letter",
        doc.cover_letter,
        "",
        "## Job Description",
        application.jd_text,
    ])
    return "\n".join(sections)


@router.get("/{application_id}/export")
async def export_application(
    application_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> Response:
    application = (
        await db.execute(select(Application).where(Application.id == application_id))
    ).scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")

    doc = (
        await db.execute(select(TailoredDoc).where(TailoredDoc.application_id == application.id))
    ).scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="No tailored document found for this application.")

    resume = await get_latest_resume(db, application.user_id)
    score = (
        await db.execute(select(Score).where(Score.application_id == application.id))
    ).scalar_one_or_none()
    return Response(
        content=build_export_markdown(application, resume, doc, score),
        media_type="text/markdown; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{export_filename(application)}"'},
    )

@router.post("/{application_id}/tailor", response_model=TailoredDocResponse, status_code=status.HTTP_201_CREATED)
async def tailor_application(
    application_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> TailoredDocResponse:
    application = (
        await db.execute(select(Application).where(Application.id == application_id))
    ).scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")

    resume = await get_latest_resume(db, application.user_id)
    if not resume:
        raise HTTPException(status_code=404, detail="No resume found for this application user.")

    try:
        assets = await asyncio.to_thread(tailor_with_openai, resume.structured_data, application.jd_text)
    except RateLimitError as exc:
        raise HTTPException(status_code=429, detail="OpenAI rate limit reached. Try again later.") from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail="OpenAI document tailoring failed.") from exc

    doc = (
        await db.execute(select(TailoredDoc).where(TailoredDoc.application_id == application.id))
    ).scalar_one_or_none()
    if doc:
        doc.tailored_bullets = assets.tailored_bullets
        doc.cover_letter = assets.cover_letter
    else:
        doc = TailoredDoc(
            application_id=application.id,
            tailored_bullets=assets.tailored_bullets,
            cover_letter=assets.cover_letter,
        )
        db.add(doc)

    await db.commit()
    await db.refresh(doc)
    return tailored_doc_to_response(doc)


