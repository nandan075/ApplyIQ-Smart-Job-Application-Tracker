from __future__ import annotations

import asyncio
import os
import time
from pathlib import Path
from uuid import UUID

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth import get_current_user, normalize_email, require_admin, verify_password, hash_password
from backend.database import get_db
from backend.models import User
from backend.email_service import send_login_notification

load_dotenv(Path(__file__).resolve().parents[2] / ".env")

router = APIRouter(prefix="/auth", tags=["authentication"])

MAX_FAILED_ATTEMPTS = 5
FAILED_ATTEMPT_WINDOW_SECONDS = 15 * 60
_failed_attempts: dict[str, list[float]] = {}


class GoogleSignInRequest(BaseModel):
    credential: str


class SignInRequest(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=8, max_length=256)


class SignUpRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=8, max_length=256)


class ProfileUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=254)
    job_title: str = Field(default="", max_length=120)
    bio: str = Field(default="", max_length=1000)


class PasswordUpdate(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=256)


class UserResponse(BaseModel):
    id: UUID
    name: str
    email: str
    role: str
    job_title: str
    bio: str


def _client_host(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _check_attempts(key: str) -> None:
    cutoff = time.monotonic() - FAILED_ATTEMPT_WINDOW_SECONDS
    attempts = [ts for ts in _failed_attempts.get(key, []) if ts >= cutoff]
    _failed_attempts[key] = attempts
    if len(attempts) >= MAX_FAILED_ATTEMPTS:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many failed attempts. Try again later.")


def _record_failed_attempt(key: str) -> None:
    _failed_attempts.setdefault(key, []).append(time.monotonic())


def _clear_failed_attempts(key: str) -> None:
    _failed_attempts.pop(key, None)


def _google_client_id() -> str:
    client_id = os.getenv("GOOGLE_CLIENT_ID") or os.getenv("VITE_GOOGLE_CLIENT_ID")
    if not client_id:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Google Sign-In is not configured.")
    return client_id


def user_to_response(user: User) -> UserResponse:
    return UserResponse(id=user.id, name=user.name, email=user.email, role=user.role, job_title=user.job_title, bio=user.bio)


@router.post("/signup", response_model=UserResponse)
async def sign_up(payload: SignUpRequest, request: Request, db: AsyncSession = Depends(get_db)) -> UserResponse:
    try:
        email = normalize_email(payload.email)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    existing = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered.")

    user = User(
        name=payload.name.strip(),
        email=email,
        password_hash=hash_password(payload.password),
        role="user"
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    request.session.clear()
    request.session["user_id"] = str(user.id)
    asyncio.create_task(send_login_notification(user.email, user.name or user.email))
    return user_to_response(user)


@router.post("/signin", response_model=UserResponse)
async def sign_in(payload: SignInRequest, request: Request, db: AsyncSession = Depends(get_db)) -> UserResponse:
    try:
        email = normalize_email(payload.email)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    attempt_key = f"signin:{_client_host(request)}:{email}"
    _check_attempts(attempt_key)
    user = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        _record_failed_attempt(attempt_key)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    _clear_failed_attempts(attempt_key)
    request.session.clear()
    request.session["user_id"] = str(user.id)
    asyncio.create_task(send_login_notification(user.email, user.name or user.email))
    return user_to_response(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(request: Request) -> None:
    request.session.clear()


@router.get("/me", response_model=UserResponse)
async def get_profile(user: User = Depends(get_current_user)) -> UserResponse:
    return user_to_response(user)


@router.patch("/me", response_model=UserResponse)
async def update_profile(payload: ProfileUpdate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> UserResponse:
    try:
        email = normalize_email(payload.email)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    existing = (await db.execute(select(User).where(User.email == email, User.id != user.id))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="That email address is already in use.")
    user.name = payload.name.strip()
    user.email = email
    user.job_title = payload.job_title.strip()
    user.bio = payload.bio.strip()
    await db.commit()
    await db.refresh(user)
    return user_to_response(user)


@router.get("/admin/users", response_model=list[UserResponse])
async def list_users(_: User = Depends(require_admin), db: AsyncSession = Depends(get_db)) -> list[UserResponse]:
    users = (await db.execute(select(User).order_by(User.created_at.desc()))).scalars().all()
    return [user_to_response(user) for user in users]


@router.post("/google", response_model=UserResponse)
async def google_sign_in(payload: GoogleSignInRequest, request: Request, db: AsyncSession = Depends(get_db)) -> UserResponse:
    expected_audience = _google_client_id()
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://oauth2.googleapis.com/tokeninfo",
            params={"id_token": payload.credential},
            timeout=10.0,
        )
        if response.status_code != 200:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google credentials.")
        id_info = response.json()

    verified = id_info.get("email_verified")
    if (
        id_info.get("aud") != expected_audience
        or id_info.get("iss") not in {"accounts.google.com", "https://accounts.google.com"}
        or verified not in {True, "true", "True", "1"}
    ):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google credentials.")

    email = id_info.get("email")
    name = id_info.get("name", "")

    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email not provided by Google.")

    try:
        email = normalize_email(email)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    user = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()

    if not user:
        user = User(
            name=name.strip() or email.split("@")[0],
            email=email,
            password_hash="",
            role="user"
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        asyncio.create_task(send_login_notification(user.email, user.name or user.email))

    request.session.clear()
    request.session["user_id"] = str(user.id)
    return user_to_response(user)


@router.post("/password", status_code=status.HTTP_200_OK)
async def update_password(
    payload: PasswordUpdate,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> dict[str, str]:
    attempt_key = f"password:{_client_host(request)}:{user.id}"
    _check_attempts(attempt_key)
    if not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Accounts registered via Google Sign-In do not have a password to update."
        )
    if not verify_password(payload.current_password, user.password_hash):
        _record_failed_attempt(attempt_key)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password."
        )
    _clear_failed_attempts(attempt_key)
    user.password_hash = hash_password(payload.new_password)
    await db.commit()
    return {"message": "Password updated successfully."}


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> None:
    await db.delete(user)
    await db.commit()
    request.session.clear()
