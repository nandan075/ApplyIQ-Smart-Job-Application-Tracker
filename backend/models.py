from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String, nullable=False, default="")
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False, default="")
    role: Mapped[str] = mapped_column(String, nullable=False, default="user")
    job_title: Mapped[str] = mapped_column(String, nullable=False, default="")
    bio: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    resumes: Mapped[list[Resume]] = relationship(back_populates="user")
    applications: Mapped[list[Application]] = relationship(back_populates="user")


class Resume(Base):
    __tablename__ = "resumes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    structured_data: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    file_url: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user: Mapped[User] = relationship(back_populates="resumes")
    scores: Mapped[list[Score]] = relationship(back_populates="resume")


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    company: Mapped[str] = mapped_column(String, nullable=False)
    role: Mapped[str] = mapped_column(String, nullable=False)
    jd_text: Mapped[str] = mapped_column(Text, nullable=False)
    deadline: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False, default="applied", server_default="applied")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user: Mapped[User] = relationship(back_populates="applications")
    score: Mapped[Score | None] = relationship(back_populates="application")
    tailored_doc: Mapped[TailoredDoc | None] = relationship(back_populates="application")


class Score(Base):
    __tablename__ = "scores"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("applications.id"), unique=True, nullable=False)
    resume_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("resumes.id"), nullable=False)
    relevance_score: Mapped[int] = mapped_column(Integer, nullable=False)
    matched_strengths: Mapped[list[Any]] = mapped_column(JSONB, nullable=False)
    drawbacks: Mapped[list[Any]] = mapped_column(JSONB, nullable=False)
    fix_suggestions: Mapped[list[Any]] = mapped_column(JSONB, nullable=False)

    application: Mapped[Application] = relationship(back_populates="score")
    resume: Mapped[Resume] = relationship(back_populates="scores")


class TailoredDoc(Base):
    __tablename__ = "tailored_docs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("applications.id"), unique=True, nullable=False)
    tailored_bullets: Mapped[list[Any]] = mapped_column(JSONB, nullable=False)
    cover_letter: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    application: Mapped[Application] = relationship(back_populates="tailored_doc")
