from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List

from app.auth import get_current_user
from app.database import get_session
from app.models import Bookmark, Domain, User
from app.schemas import BookmarkCreate, BookmarkMove, BookmarkResponse, BookmarkUpdate

router = APIRouter(prefix="/bookmarks", tags=["bookmarks"])


def _assert_bookmark_ownership(bookmark: Bookmark, current_user: User, session: Session):
    domain = session.get(Domain, bookmark.domain_id)
    if not domain or domain.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")


@router.post("", response_model=BookmarkResponse, status_code=201)
def add_bookmark(
    payload: BookmarkCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    domain = session.get(Domain, payload.domain_id)
    if not domain or domain.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Domain not found")

    # Position at end of this domain's bookmarks
    existing = session.exec(
        select(Bookmark).where(Bookmark.domain_id == payload.domain_id)
    ).all()
    max_pos = max((b.position for b in existing), default=-1) + 1

    bookmark = Bookmark(
        url=payload.url,
        title=payload.title,
        domain_id=payload.domain_id,
        position=max_pos,
    )
    session.add(bookmark)
    session.commit()
    session.refresh(bookmark)
    return bookmark


@router.patch("/{bookmark_id}", response_model=BookmarkResponse)
def update_bookmark(
    bookmark_id: int,
    payload: BookmarkUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    bookmark = session.get(Bookmark, bookmark_id)
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    _assert_bookmark_ownership(bookmark, current_user, session)

    if payload.title is not None:
        bookmark.title = payload.title
    session.add(bookmark)
    session.commit()
    session.refresh(bookmark)
    return bookmark


@router.patch("/{bookmark_id}/move", response_model=BookmarkResponse)
def move_bookmark(
    bookmark_id: int,
    payload: BookmarkMove,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Move a bookmark to a different domain and/or reorder it within the same domain.
    Used by the drag-and-drop feature on the frontend.
    """
    bookmark = session.get(Bookmark, bookmark_id)
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    _assert_bookmark_ownership(bookmark, current_user, session)

    new_domain = session.get(Domain, payload.domain_id)
    if not new_domain or new_domain.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Target domain not found")

    # Get all bookmarks in the target domain (excluding the moving bookmark)
    target_bookmarks = session.exec(
        select(Bookmark).where(
            Bookmark.domain_id == payload.domain_id,
            Bookmark.id != bookmark_id,
        )
    ).all()
    target_bookmarks.sort(key=lambda b: b.position)

    # Determine new position
    new_position = payload.position if payload.position is not None else len(target_bookmarks)
    new_position = max(0, min(new_position, len(target_bookmarks)))

    # Update the bookmark
    bookmark.domain_id = payload.domain_id
    bookmark.position = new_position

    # Re-number everything in target domain after insertion point
    for i, b in enumerate(target_bookmarks):
        if i >= new_position:
            b.position = i + 1
        else:
            b.position = i
        session.add(b)

    session.add(bookmark)
    session.commit()
    session.refresh(bookmark)
    return bookmark


@router.delete("/{bookmark_id}", status_code=204)
def delete_bookmark(
    bookmark_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    bookmark = session.get(Bookmark, bookmark_id)
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    _assert_bookmark_ownership(bookmark, current_user, session)
    session.delete(bookmark)
    session.commit()
