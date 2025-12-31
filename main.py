from dotenv import load_dotenv
load_dotenv()

from sqlmodel import SQLModel, Session, Relationship, Field, create_engine, select
from sqlalchemy import Column, ForeignKey, Integer
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager
from typing import List, Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import os

SECRET_KEY = os.environ.get("BLINKY_SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("BLINKY_SECRET_KEY is not set")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True, description="Unique ID of the User")
    email: str = Field(index=True, unique=True, description="Email of the user")
    hashed_password: str = Field(description="Hashed password of the user")
    created_at: str = Field(description="Date when user is created")
    domains: list["Domain"] = Relationship(back_populates="user", sa_relationship_kwargs={"cascade": "all, delete-orphan"})


class Domain(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    user_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
        )
    )
    user: "User" = Relationship(back_populates="domains")
    bookmarks: list["Bookmark"] = Relationship(
        back_populates="domain",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class Bookmark(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    url: str
    title: str
    domain_id: int = Field(
        sa_column=Column(
            Integer,
            ForeignKey("domain.id", ondelete="CASCADE"),
            nullable=False,
        )
    )
    domain: "Domain" = Relationship(back_populates="bookmarks")


# Pydantic Models
class Token(BaseModel):
    access_token: str
    token_type: str


class UserCreate(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    created_at: str


class DomainCreate(BaseModel):
    name: str = Field(min_length=1, max_length=50)


class DomainResponse(BaseModel):
    id: int
    name: str
    bookmarks: List["BookmarkResponse"] = []


class BookmarkCreate(BaseModel):
    url: str
    title: str
    domain_id: int


class BookmarkResponse(BaseModel):
    id: int
    url: str
    title: str


# Database setup
db_name = "blinky.db"
db_url = f"sqlite:///{db_name}"
connect_args = {"check_same_thread": False}
engine = create_engine(db_url, connect_args=connect_args)


def create_db_and_tables():
    SQLModel.metadata.create_all(engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    with engine.connect() as conn:
        conn.exec_driver_sql("PRAGMA foreign_keys=ON")
    yield


app = FastAPI(lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://127.0.0.1",
        "https://neswanths.github.io"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Auth Helper Functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == email)).first()
        if user is None:
            raise credentials_exception
    return user


# Routes
@app.get("/")
def read_root():
    return {"message": "Prototype API for Blinky-A bookmark manager"}


@app.post("/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == form_data.username)).first()
        if not user or not verify_password(form_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/users", response_model=UserResponse, status_code=201)
def create_user(user_data: UserCreate):
    with Session(engine) as session:
        # Check if user already exists
        existing_user = session.exec(select(User).where(User.email == user_data.email)).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        new_user = User(
            email=user_data.email,
            hashed_password=get_password_hash(user_data.password),
            created_at=datetime.utcnow().isoformat()
        )
        session.add(new_user)
        session.commit()
        session.refresh(new_user)
        
        # Return a proper response that matches UserResponse
        return {
            "id": new_user.id,
            "email": new_user.email,
            "created_at": new_user.created_at
        }


@app.get("/users/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user


# Domains
@app.post("/domains", response_model=DomainResponse, status_code=201)
def create_domain(domain: DomainCreate, current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        db_domain = Domain(name=domain.name, user_id=current_user.id)
        session.add(db_domain)
        session.commit()
        session.refresh(db_domain)
        
        # FIX: Create the response object manually while we are still in the session.
        # This tells FastAPI "Here is the exact data" so it doesn't try to touch the DB.
        return DomainResponse(
            id=db_domain.id, 
            name=db_domain.name, 
            bookmarks=[] # We know a new domain has no bookmarks
        )


@app.get("/domains", response_model=List[DomainResponse])
def get_domains(current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        user = session.get(User, current_user.id)
        # Return domains with their bookmarks
        result = []
        for domain in user.domains:
            domain_dict = {
                "id": domain.id,
                "name": domain.name,
                "bookmarks": [
                    {"id": b.id, "url": b.url, "title": b.title}
                    for b in domain.bookmarks
                ]
            }
            result.append(domain_dict)
        return result


@app.put("/domains/{domain_id}", response_model=DomainResponse)
def update_domain_name(
    domain_id: int, 
    new_name: str, 
    current_user: User = Depends(get_current_user)
):
    with Session(engine) as session:
        domain = session.get(Domain, domain_id)
        if not domain or domain.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Domain not found")
        
        domain.name = new_name
        session.commit()
        session.refresh(domain)
        return domain


@app.delete("/domains/{domain_id}", status_code=204)
def delete_domain(domain_id: int, current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        domain = session.get(Domain, domain_id)
        if not domain or domain.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Domain not found")
        
        session.delete(domain)
        session.commit()


# Bookmarks
@app.post("/bookmarks", response_model=BookmarkResponse, status_code=201)
def add_bookmark(bookmark: BookmarkCreate, current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        # Verify domain belongs to user
        domain = session.get(Domain, bookmark.domain_id)
        if not domain or domain.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Domain not found")
        
        db_bookmark = Bookmark(
            url=bookmark.url,
            title=bookmark.title,
            domain_id=bookmark.domain_id
        )
        session.add(db_bookmark)
        session.commit()
        session.refresh(db_bookmark)
        return db_bookmark


@app.get("/bookmarks/{domain_id}", response_model=List[BookmarkResponse])
def get_bookmarks(domain_id: int, current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        domain = session.get(Domain, domain_id)
        if not domain or domain.user_id != current_user.id:
            raise HTTPException(status_code=404, detail="Domain not found")
        return domain.bookmarks


@app.put("/bookmarks/{bookmark_id}", response_model=BookmarkResponse)
def change_bookmark_title(
    bookmark_id: int,
    new_title: str,
    current_user: User = Depends(get_current_user)
):
    with Session(engine) as session:
        bookmark = session.get(Bookmark, bookmark_id)
        if not bookmark:
            raise HTTPException(status_code=404, detail="Bookmark not found")
        
        # Verify ownership through domain
        domain = session.get(Domain, bookmark.domain_id)
        if not domain or domain.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        bookmark.title = new_title
        session.commit()
        session.refresh(bookmark)
        return bookmark


@app.delete("/bookmarks/{bookmark_id}", status_code=204)
def delete_bookmark(bookmark_id: int, current_user: User = Depends(get_current_user)):
    with Session(engine) as session:
        bookmark = session.get(Bookmark, bookmark_id)
        if not bookmark:
            raise HTTPException(status_code=404, detail="Bookmark not found")
        
        # Verify ownership through domain
        domain = session.get(Domain, bookmark.domain_id)
        if not domain or domain.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        session.delete(bookmark)
        session.commit()