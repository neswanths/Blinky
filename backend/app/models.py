from sqlmodel import SQLModel, Field, Relationship
from sqlalchemy import Column, ForeignKey, Integer
from typing import Optional
from datetime import datetime


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    google_id: str = Field(index=True, unique=True)
    email: str = Field(index=True, unique=True)
    name: str = Field(default="")
    avatar_url: str = Field(default="")
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    domains: list["Domain"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class Domain(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    position: int = Field(default=0)
    user_id: int = Field(
        sa_column=Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    )
    user: "User" = Relationship(back_populates="domains")
    bookmarks: list["Bookmark"] = Relationship(
        back_populates="domain",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class Bookmark(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    url: str
    title: str
    position: int = Field(default=0)
    domain_id: int = Field(
        sa_column=Column(Integer, ForeignKey("domain.id", ondelete="CASCADE"), nullable=False)
    )
    domain: "Domain" = Relationship(back_populates="bookmarks")
