from __future__ import annotations

import asyncio
import os
from datetime import date

from sqlalchemy import select

from backend.auth import hash_password
from backend.database import AsyncSessionLocal
from backend.models import Application, Resume, Score, TailoredDoc, User

DEMO_EMAIL = "demo@applyiq.local"
DEMO_PASSWORD = os.getenv("DEMO_PASSWORD")

RESUME_DATA = {
    "name": "Alex Morgan",
    "contact_info": {
        "email": DEMO_EMAIL,
        "phone": "+1 555 0142",
        "location": "San Francisco, CA",
        "linkedin": "linkedin.com/in/alexmorgan",
        "github": "github.com/alexmorgan",
        "website": "alexmorgan.dev",
    },
    "skills": [
        {"category": "Languages", "skills": ["Python", "TypeScript", "SQL"]},
        {"category": "Backend", "skills": ["FastAPI", "PostgreSQL", "Redis", "REST APIs"]},
        {"category": "Frontend", "skills": ["React", "Vite", "Design Systems"]},
        {"category": "Cloud", "skills": ["AWS", "Docker", "CI/CD"]},
    ],
    "experience": [
        {
            "company": "Northstar Analytics",
            "role": "Software Engineer",
            "dates": "2022-2026",
            "bullets": [
                "Built FastAPI services that processed 2.4M monthly workflow events for customer success teams.",
                "Reduced dashboard load time by 38% by optimizing PostgreSQL queries and React data-fetching paths.",
                "Led migration from ad hoc scripts to Docker-based CI jobs, cutting release prep from hours to minutes.",
            ],
        },
        {
            "company": "BrightDesk",
            "role": "Product Engineer",
            "dates": "2019-2022",
            "bullets": [
                "Shipped onboarding experiments that increased activated accounts by 17% quarter over quarter.",
                "Partnered with product managers and designers to define roadmap tradeoffs for B2B workflow tools.",
                "Mentored three junior engineers through weekly code reviews and architecture pairing sessions.",
            ],
        },
    ],
    "education": [
        {"institution": "State University", "degree": "B.S. Computer Science", "dates": "2015-2019", "details": []}
    ],
    "certifications": ["AWS Certified Cloud Practitioner"],
}

JD_TEXT = """OrbitWorks is hiring a Senior Software Engineer to build React and FastAPI products for enterprise operations teams. The role requires Python, TypeScript, PostgreSQL, API design, cloud deployment, and a track record of partnering with product managers to improve measurable customer workflows."""

TAILORED_BULLETS = [
    "Built FastAPI services processing 2.4M monthly workflow events, directly matching OrbitWorks' need for scalable API design.",
    "Reduced React dashboard load time by 38% through PostgreSQL query optimization and frontend data-fetching improvements.",
    "Partnered with product managers and designers to ship B2B workflow tools and define roadmap tradeoffs for enterprise users.",
    "Led Docker-based CI improvements that shortened release preparation and strengthened cloud deployment readiness.",
]

COVER_LETTER = """Dear OrbitWorks Hiring Team,

I am excited about the Senior Software Engineer role because it sits at the intersection of React product development, FastAPI services, and measurable workflow improvement. At Northstar Analytics, I built FastAPI systems processing 2.4M monthly workflow events and improved React dashboard performance by 38% through PostgreSQL and frontend data-fetching optimization.

I would be glad to bring that combination of backend depth, product partnership, and delivery discipline to OrbitWorks as you build tools for enterprise operations teams.

Sincerely,
Alex Morgan"""


async def seed() -> None:
    if not DEMO_PASSWORD:
        raise RuntimeError("DEMO_PASSWORD must be set in backend/.env before seeding.")
    async with AsyncSessionLocal() as db:
        user = (await db.execute(select(User).where(User.email == DEMO_EMAIL))).scalar_one_or_none()
        if not user:
            user = User(name="Alex Morgan", email=DEMO_EMAIL, password_hash=hash_password(DEMO_PASSWORD), role="admin", job_title="Software Engineer", bio="Building thoughtful job applications with ApplyIQ.")
            db.add(user)
            await db.flush()
        else:
            user.password_hash = hash_password(DEMO_PASSWORD)

        resume = (
            await db.execute(select(Resume).where(Resume.user_id == user.id).order_by(Resume.created_at.desc()))
        ).scalars().first()
        if not resume:
            resume = Resume(user_id=user.id, structured_data=RESUME_DATA, file_url=None)
            db.add(resume)
            await db.flush()

        application = (
            await db.execute(
                select(Application).where(
                    Application.user_id == user.id,
                    Application.company == "OrbitWorks",
                    Application.role == "Senior Software Engineer",
                )
            )
        ).scalar_one_or_none()
        if not application:
            application = Application(
                user_id=user.id,
                company="OrbitWorks",
                role="Senior Software Engineer",
                jd_text=JD_TEXT,
                deadline=date(2026, 8, 15),
                status="Interviewing",
            )
            db.add(application)
            await db.flush()

        score = (
            await db.execute(select(Score).where(Score.application_id == application.id))
        ).scalar_one_or_none()
        if not score:
            db.add(
                Score(
                    application_id=application.id,
                    resume_id=resume.id,
                    relevance_score=88,
                    matched_strengths=[
                        "FastAPI, React, PostgreSQL, and Docker experience match the core stack.",
                        "Resume includes measurable workflow and dashboard performance outcomes.",
                        "Product partnership is explicit through roadmap and design collaboration bullets.",
                    ],
                    drawbacks=[
                        "AWS experience is present but could include deeper deployment ownership.",
                        "The base resume does not mention enterprise operations by name.",
                    ],
                    fix_suggestions=[
                        "Move API scale and dashboard performance bullets near the top of the resume.",
                        "Use the JD phrase 'enterprise workflow tools' only where backed by B2B workflow experience.",
                    ],
                )
            )

        tailored_doc = (
            await db.execute(select(TailoredDoc).where(TailoredDoc.application_id == application.id))
        ).scalar_one_or_none()
        if not tailored_doc:
            db.add(TailoredDoc(application_id=application.id, tailored_bullets=TAILORED_BULLETS, cover_letter=COVER_LETTER))

        await db.commit()
        print(f"Seeded demo data for {DEMO_EMAIL}")


if __name__ == "__main__":
    asyncio.run(seed())
