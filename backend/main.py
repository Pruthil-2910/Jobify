"""Jobify FastAPI application entry point.

Wires routers, middleware, lifespan-managed database initialisation, and
exposes a `/health` endpoint. Run with `python main.py` for local dev or
under any ASGI server (e.g. `uvicorn main:app`).
"""
from __future__ import annotations

import logging
import warnings
from contextlib import asynccontextmanager
from typing import AsyncIterator

# Silence third-party deprecation noise we can't fix at source.
# - langgraph: pending change to default `allowed_objects`
# - google.generativeai: legacy package warning (we now use google-genai, but
#   langchain-google-genai may still reach the old module transitively)
warnings.filterwarnings(
    "ignore",
    message=r".*allowed_objects.*",
)
warnings.filterwarnings(
    "ignore",
    message=r".*google\.generativeai.*",
    category=FutureWarning,
)

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from db.schema import init_db
from middleware.api_key import APIKeyMiddleware
from routers import ai, auth, chat, jd_match, jobs, projects, users

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("jobify")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Initialise database schema + start the daily Adzuna refresh scheduler."""
    logger.info("Jobify backend starting up")
    init_db()
    logger.info("Database schema initialised at %s", settings.DATABASE_PATH)

    scheduler_task = None
    if settings.JOB_SCHEDULER_ENABLED:
        try:
            from services.job_ingest import start_scheduler
            scheduler_task = start_scheduler(
                country=settings.JOB_SCHEDULER_COUNTRY,
                hour=settings.JOB_SCHEDULER_HOUR,
                minute=settings.JOB_SCHEDULER_MINUTE,
            )
            logger.info(
                "Daily Adzuna refresh scheduled at %02d:%02d local for country=%s",
                settings.JOB_SCHEDULER_HOUR,
                settings.JOB_SCHEDULER_MINUTE,
                settings.JOB_SCHEDULER_COUNTRY,
            )
        except Exception:  # noqa: BLE001
            logger.exception("Failed to start job scheduler — continuing without it")
    else:
        logger.info("Job scheduler disabled (JOB_SCHEDULER_ENABLED=false)")

    try:
        yield
    finally:
        if scheduler_task is not None:
            scheduler_task.cancel()
            try:
                await scheduler_task
            except Exception:  # noqa: BLE001
                pass
        logger.info("Jobify backend shutting down")


def create_app() -> FastAPI:
    """Application factory."""
    app = FastAPI(
        title="Jobify Backend",
        version="1.0.0",
        description="AI-powered job platform backend (FastAPI + LangGraph + Gemini).",
        lifespan=lifespan,
        redirect_slashes=False,  # 307 redirects drop Authorization on some clients
    )

    # CORS — permissive for development; tighten in production.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # API key gate for protected routes.
    app.add_middleware(APIKeyMiddleware)

    # Feature routers.
    app.include_router(auth.router)
    app.include_router(users.router)
    app.include_router(jobs.router)
    app.include_router(chat.router)
    app.include_router(jd_match.router)
    app.include_router(projects.router)
    app.include_router(ai.router)

    @app.get("/health", tags=["system"])
    async def health() -> dict[str, str]:
        """Liveness probe."""
        return {"status": "ok", "service": "jobify-backend"}

    return app


app = create_app()


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        workers=1,
        reload=False,
        log_level=settings.LOG_LEVEL.lower(),
    )
