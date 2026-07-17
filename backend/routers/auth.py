from __future__ import annotations

from uuid import UUID
import asyncio
import httpx

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth import get_current_user, normalize_email, require_admin, verify_password, hash_password
from backend.database import get_db
from backend.models import User
from backend.email_service import send_login_notification

router = APIRouter(prefix="/auth", tags=["authentication"])


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


class UserResponse(BaseModel):
    id: UUID
    name: str
    email: str
    role: str
    job_title: str
    bio: str


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
    
    # Fire-and-forget email notification
    asyncio.create_task(send_login_notification(user.email, user.name or user.email))
    
    return user_to_response(user)

@router.post("/signin", response_model=UserResponse)
async def sign_in(payload: SignInRequest, request: Request, db: AsyncSession = Depends(get_db)) -> UserResponse:
    try:
        email = normalize_email(payload.email)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    user = (await db.execute(select(User).where(User.email == email))).scalar_one_or_none()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")
    request.session.clear()
    request.session["user_id"] = str(user.id)
    
    # Fire-and-forget email notification
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
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://oauth2.googleapis.com/tokeninfo?id_token={payload.credential}",
            timeout=10.0
        )
        if response.status_code != 200:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google credentials.")
        id_info = response.json()

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

