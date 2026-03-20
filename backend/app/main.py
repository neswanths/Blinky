from dotenv import load_dotenv
load_dotenv()

import asyncio
import logging
import os

import httpx
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel

from app.database import engine
from app.routers import auth, domains, bookmarks

logger = logging.getLogger(__name__)

async def render_keep_alive_task():
    """Background task to keep Render free tier alive."""
    url = os.getenv("RENDER_EXTERNAL_URL")
    if not url:
        logger.warning("RENDER_EXTERNAL_URL not set. Self-ping task disabled.")
        return

    # Ensure URL doesn't have a trailing slash
    ping_url = f"{url.rstrip('/')}/"
    
    logger.info(f"Starting keep-alive task. Pinging {ping_url} every 10 minutes.")
    
    # Render spins down after 15 minutes of inactivity
    interval = 10 * 60  
    
    # Wait initially before starting to ping
    await asyncio.sleep(10)
    
    async with httpx.AsyncClient() as client:
        while True:
            try:
                response = await client.get(ping_url, timeout=10.0)
                response.raise_for_status()
                logger.info(f"Keep-alive ping successful: {response.status_code}")
            except Exception as e:
                logger.warning(f"Keep-alive ping failed: {e}")
            
            # Sleep until next ping
            await asyncio.sleep(interval)


@asynccontextmanager
async def lifespan(app: FastAPI):
    SQLModel.metadata.create_all(engine)
    keep_alive_task = asyncio.create_task(render_keep_alive_task())
    yield
    keep_alive_task.cancel()
    try:
        await keep_alive_task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="Blinky API",
    description="Minimal bookmark manager — production API",
    version="1.0.0",
    lifespan=lifespan,
)

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "https://blinky-tau.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_origin_regex=r"chrome-extension://.*",  # Properly allows any Chrome extension origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(domains.router)
app.include_router(bookmarks.router)


@app.get("/", tags=["health"])
def root():
    return {"status": "ok", "app": "Blinky API", "version": "1.0.0"}
