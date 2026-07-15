"""initial schema

Revision ID: 20260715_0001
Revises:
Create Date: 2026-07-15
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "20260715_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_table(
        "applications",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("company", sa.String(), nullable=False),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column("jd_text", sa.Text(), nullable=False),
        sa.Column("deadline", sa.Date(), nullable=True),
        sa.Column("status", sa.String(), server_default="applied", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "resumes",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("structured_data", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("file_url", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "scores",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("application_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("resume_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("relevance_score", sa.Integer(), nullable=False),
        sa.Column("matched_strengths", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("drawbacks", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("fix_suggestions", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.ForeignKeyConstraint(["application_id"], ["applications.id"]),
        sa.ForeignKeyConstraint(["resume_id"], ["resumes.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("application_id"),
    )
    op.create_table(
        "tailored_docs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("application_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tailored_bullets", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("cover_letter", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["application_id"], ["applications.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("application_id"),
    )


def downgrade() -> None:
    op.drop_table("tailored_docs")
    op.drop_table("scores")
    op.drop_table("resumes")
    op.drop_table("applications")
    op.drop_table("users")
