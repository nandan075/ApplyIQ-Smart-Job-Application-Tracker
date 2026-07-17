from __future__ import annotations

import asyncio
import os
from datetime import date, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth import get_current_user
from backend.database import get_db
from backend.models import Application, Resume, Score, TailoredDoc, User
from backend.tailoring import TailoredAssets, tailor_with_gemini
from backend.url_parser import extract_text_from_url
from backend.jd_extractor import extract_job_info, ExtractedJobInfo
from backend.scorer import score_resume_local, ScoreAssets

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


class ApplicationStatusUpdate(BaseModel):
    status: str = Field(min_length=1)


class ScoreResponse(ScoreAssets):
    id: UUID
    application_id: UUID
    resume_id: UUID


class ApplicationResponse(BaseModel):
    id: UUID
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





def application_to_response(application: Application) -> ApplicationResponse:
    return ApplicationResponse(
        id=application.id,
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
async def list_applications(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)) -> list[ApplicationResponse]:
    applications = (await db.execute(select(Application).where(Application.user_id == user.id).order_by(Application.created_at.desc()))).scalars().all()
    return [application_to_response(application) for application in applications]


@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_application(
    payload: ApplicationCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> ApplicationResponse:
    company = payload.company.strip() if payload.company else None
    role = payload.role.strip() if payload.role else None
    deadline = payload.deadline
    jd_text = payload.jd_text.strip()
    if not jd_text:
        raise HTTPException(status_code=422, detail="jd_text cannot be empty.")

    # URL detection
    is_url = jd_text.startswith("http://") or jd_text.startswith("https://")
    if is_url:
        try:
            fetched_text = await asyncio.to_thread(extract_text_from_url, jd_text)
            if fetched_text and len(fetched_text.strip()) > 50:
                jd_text = fetched_text
        except Exception:
            pass # Keep original URL as jd_text if fetching fails

    if not company or not role:
        try:
            extracted = await asyncio.to_thread(extract_job_info, jd_text)
        except Exception:
            extracted = None

        if extracted:
            company = company or (extracted.company.strip() if extracted.company else None)
            role = role or (extracted.role.strip() if extracted.role else None)
            deadline = deadline or extracted.deadline

    # Fallbacks if extraction failed (e.g. JS-heavy pages returning empty or generic HTML content)
    if not company or not role:
        orig_text = payload.jd_text.strip()
        if orig_text.startswith("http://") or orig_text.startswith("https://"):
            from urllib.parse import urlparse, parse_qs
            try:
                parsed_url = urlparse(orig_text)
                
                # Check for query params indicating the domain/company
                query_params = parse_qs(parsed_url.query)
                domain_param = query_params.get("domain")
                if domain_param:
                    company_name = domain_param[0].split(".")[0]
                else:
                    # Netloc might be microsoft.eightfold.ai or microsoft.com
                    parts = parsed_url.netloc.split(".")
                    if len(parts) >= 3 and parts[-2] == "eightfold":
                        company_name = parts[0]
                    elif len(parts) >= 2:
                        company_name = parts[-2]
                    else:
                        company_name = parts[0]
                
                if not company and company_name:
                    company = company_name.capitalize()
            except Exception:
                pass

        if not company:
            company = "Company"
        if not role:
            role = "Job Position"


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
    user: User = Depends(get_current_user),
) -> ApplicationResponse:
    application = (
        await db.execute(select(Application).where(Application.id == application_id, Application.user_id == user.id))
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
    user: User = Depends(get_current_user),
) -> ScoreResponse:
    application = (
        await db.execute(select(Application).where(Application.id == application_id, Application.user_id == user.id))
    ).scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")

    resume = await get_latest_resume(db, application.user_id)
    if not resume:
        raise HTTPException(status_code=404, detail="No resume found for this application user.")

    try:
        assets = await asyncio.to_thread(score_resume_local, resume.structured_data, application.jd_text)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="Resume scoring failed.") from exc

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
    user: User = Depends(get_current_user),
) -> Response:
    application = (
        await db.execute(select(Application).where(Application.id == application_id, Application.user_id == user.id))
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
    user: User = Depends(get_current_user),
) -> TailoredDocResponse:
    application = (
        await db.execute(select(Application).where(Application.id == application_id, Application.user_id == user.id))
    ).scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")

    resume = await get_latest_resume(db, application.user_id)
    if not resume:
        raise HTTPException(status_code=404, detail="No resume found for this application user.")

    try:
        assets = await asyncio.to_thread(tailor_with_gemini, resume.structured_data, application.jd_text)
    except Exception as exc:
        err_msg = str(exc)
        if "429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg or "quota" in err_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Gemini API rate limit exceeded. Please wait a few seconds and try again."
            )
        raise HTTPException(status_code=502, detail=f"Document tailoring failed: {exc}") from exc


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


