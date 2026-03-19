import os
import httpx
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlmodel import Session, select

from app.auth import (
    GOOGLE_AUTH_URL, GOOGLE_TOKEN_URL, GOOGLE_USERINFO_URL,
    GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI,
    FRONTEND_URL, create_access_token, get_current_user,
)
from app.database import get_session
from app.models import User
from app.schemas import UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/google")
def google_login():
    """Redirect user to Google's OAuth consent screen."""
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
    }
    url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
    return RedirectResponse(url)


@router.get("/callback")
async def google_callback(code: str, session: Session = Depends(get_session)):
    """Exchange code for token, get user info, create/login user, return JWT."""
    async with httpx.AsyncClient() as client:
        # Exchange authorization code for tokens
        token_response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )
        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange code for token")

        tokens = token_response.json()
        access_token = tokens.get("access_token")

        # Fetch user info from Google
        userinfo_response = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if userinfo_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch user info from Google")

        google_user = userinfo_response.json()

    google_id = google_user.get("sub")
    email = google_user.get("email", "")
    name = google_user.get("name", "")
    avatar_url = google_user.get("picture", "")

    # Find or create user
    user = session.exec(select(User).where(User.google_id == google_id)).first()
    if not user:
        user = User(
            google_id=google_id,
            email=email,
            name=name,
            avatar_url=avatar_url,
        )
        session.add(user)
        session.commit()
        session.refresh(user)
    else:
        # Update profile info in case it changed
        user.name = name
        user.avatar_url = avatar_url
        session.add(user)
        session.commit()

    jwt_token = create_access_token(user.id, user.email)

    # Redirect to frontend with token in URL fragment (not query param for security)
    redirect_url = f"{FRONTEND_URL}/auth/callback?token={jwt_token}"
    return RedirectResponse(redirect_url)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Return info about the currently logged-in user."""
    return current_user
