from pydantic import BaseModel
from typing import List, Optional


# --- Auth ---

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    avatar_url: str
    created_at: str


# --- Domains ---

class DomainCreate(BaseModel):
    name: str


class DomainUpdate(BaseModel):
    name: str


class DomainMove(BaseModel):
    position: int


class BookmarkResponse(BaseModel):
    id: int
    url: str
    title: str
    position: int


class DomainResponse(BaseModel):
    id: int
    name: str
    position: int
    bookmarks: List[BookmarkResponse] = []


# --- Bookmarks ---

class BookmarkCreate(BaseModel):
    url: str
    title: str
    domain_id: int


class BookmarkUpdate(BaseModel):
    title: Optional[str] = None


class BookmarkMove(BaseModel):
    domain_id: int
    position: Optional[int] = None
