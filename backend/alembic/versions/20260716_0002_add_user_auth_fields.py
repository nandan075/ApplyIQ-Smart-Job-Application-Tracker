"""add user authentication fields

Revision ID: 20260716_0002
Revises: 20260715_0001
Create Date: 2026-07-16
"""

from alembic import op
import sqlalchemy as sa

revision = "20260716_0002"
down_revision = "20260715_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("name", sa.String(), server_default="", nullable=False))
    op.add_column("users", sa.Column("password_hash", sa.String(), server_default="", nullable=False))
    op.add_column("users", sa.Column("role", sa.String(), server_default="user", nullable=False))
    op.add_column("users", sa.Column("job_title", sa.String(), server_default="", nullable=False))
    op.add_column("users", sa.Column("bio", sa.Text(), server_default="", nullable=False))


def downgrade() -> None:
    op.drop_column("users", "bio")
    op.drop_column("users", "job_title")
    op.drop_column("users", "role")
    op.drop_column("users", "password_hash")
    op.drop_column("users", "name")
