from dotenv import load_dotenv
load_dotenv()

import os
from sqlmodel import create_engine, Session
from typing import Generator

DATABASE_URL = os.environ.get("DATABASE_URL", "")

# In local dev, fall back to SQLite so no Postgres install is needed
_is_sqlite = not DATABASE_URL or DATABASE_URL == "sqlite"
if _is_sqlite:
    DATABASE_URL = "sqlite:///./blinky.db"
    print("⚡ Using SQLite (local dev mode). Set DATABASE_URL for PostgreSQL.")
elif DATABASE_URL.startswith("postgres://"):
    # Fix for Supabase/Railway: 'postgres://' → 'postgresql://'
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if _is_sqlite else {}
engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
