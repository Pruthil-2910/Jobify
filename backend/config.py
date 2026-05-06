"""Application configuration via pydantic-settings.

Loads environment variables from a `.env` file and exposes a typed
`settings` singleton consumed across the Jobify backend.
"""
from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed application settings sourced from environment / .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # Security
    ENCRYPTION_SECRET: str = ""
    JWT_SECRET: str = ""
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 1440

    # External APIs
    ADZUNA_APP_ID: str = ""
    ADZUNA_APP_KEY: str = ""
    GEMINI_API_KEY: str = ""

    # Storage
    DATABASE_PATH: str = "jobify.db"

    # Runtime
    LOG_LEVEL: str = "INFO"
    API_KEY: str = ""

    # Daily Adzuna refresh scheduler
    JOB_SCHEDULER_ENABLED: bool = True
    JOB_SCHEDULER_COUNTRY: str = "in"   # ISO-2 (in / us / gb / de ...)
    JOB_SCHEDULER_HOUR: int = 2         # 24h local time
    JOB_SCHEDULER_MINUTE: int = 0
    JOB_SEED_TARGET: int = 5000         # max jobs to pull on initial seed
    JOB_SEED_MAX_DAYS_OLD: int = 60     # only seed jobs from the last N days
    JOB_REFRESH_DAYS: int = 1           # daily refresh window (last N days)


@lru_cache(maxsize=1)
def _load_settings() -> Settings:
    return Settings()


settings: Settings = _load_settings()
