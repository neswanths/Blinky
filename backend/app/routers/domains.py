from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List

from app.auth import get_current_user
from app.database import get_session
from app.models import Domain, User, Bookmark
from app.schemas import DomainCreate, DomainUpdate, DomainResponse, BookmarkResponse

router = APIRouter(prefix="/domains", tags=["domains"])


def _domain_to_response(domain: Domain) -> DomainResponse:
    bookmarks = sorted(domain.bookmarks, key=lambda b: b.position)
    return DomainResponse(
        id=domain.id,
        name=domain.name,
        position=domain.position,
        bookmarks=[
            BookmarkResponse(id=b.id, url=b.url, title=b.title, position=b.position)
            for b in bookmarks
        ],
    )


@router.get("", response_model=List[DomainResponse])
def get_domains(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    user = session.get(User, current_user.id)
    domains = sorted(user.domains, key=lambda d: d.position)
    return [_domain_to_response(d) for d in domains]


@router.post("", response_model=DomainResponse, status_code=201)
def create_domain(
    payload: DomainCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    user = session.get(User, current_user.id)
    # Position at end
    max_pos = max((d.position for d in user.domains), default=-1) + 1
    domain = Domain(name=payload.name, user_id=current_user.id, position=max_pos)
    session.add(domain)
    session.commit()
    session.refresh(domain)
    return _domain_to_response(domain)


@router.patch("/{domain_id}", response_model=DomainResponse)
def update_domain(
    domain_id: int,
    payload: DomainUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    domain = session.get(Domain, domain_id)
    if not domain or domain.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Domain not found")
    domain.name = payload.name
    session.add(domain)
    session.commit()
    session.refresh(domain)
    return _domain_to_response(domain)


@router.delete("/{domain_id}", status_code=204)
def delete_domain(
    domain_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    domain = session.get(Domain, domain_id)
    if not domain or domain.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Domain not found")
    session.delete(domain)
    session.commit()
