"""Job-related Pydantic v2 models for search, fetch, and response payloads."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class JobBase(BaseModel):
    """Common fields shared by job representations."""

    model_config = ConfigDict(str_strip_whitespace=True)

    title: str = Field(..., description="Job title.")
    company: Optional[str] = Field(default=None, description="Hiring company name.")
    location: Optional[str] = Field(default=None, description="Job location.")
    salary_min: Optional[float] = Field(default=None, description="Minimum salary (annualized).")
    salary_max: Optional[float] = Field(default=None, description="Maximum salary (annualized).")
    description: Optional[str] = Field(default=None, description="Full job description text.")


class JobResponse(JobBase):
    """Job record returned from the API, including persistence metadata."""

    model_config = ConfigDict(from_attributes=True, str_strip_whitespace=True)

    id: int = Field(..., description="Internal job ID.")
    external_id: Optional[str] = Field(default=None, description="External provider's job ID.")
    fetched_at: datetime = Field(..., description="Timestamp when this job was fetched (UTC).")
    category: Optional[str] = None
    contract_type: Optional[str] = None
    contract_time: Optional[str] = None
    posted_at: Optional[str] = None
    redirect_url: Optional[str] = None
    country: Optional[str] = None


class JobSearchQuery(BaseModel):
    """Query parameters for searching stored jobs."""

    model_config = ConfigDict(str_strip_whitespace=True)

    q: Optional[str] = Field(default=None, description="Free-text search query.")
    location: Optional[str] = Field(default=None, description="Location filter.")
    limit: int = Field(default=20, ge=1, le=100, description="Max results to return.")
    offset: int = Field(default=0, ge=0, description="Pagination offset.")


class JobFetchRequest(BaseModel):
    """Request to fetch new jobs from an external provider."""

    model_config = ConfigDict(str_strip_whitespace=True)

    query: str = Field(..., description="Search keywords for the external provider.")
    location: Optional[str] = Field(default=None, description="Optional location filter.")
    country: Optional[str] = Field(default="gb", description="ISO country code for Adzuna path.")
    results_per_page: int = Field(default=20, ge=1, le=100, description="Results per page.")
    max_days_old: Optional[int] = Field(default=None, ge=1, le=365, description="Only jobs posted in last N days.")
    category: Optional[str] = Field(default=None, description="Adzuna category filter.")


class JobFetchResponse(BaseModel):
    """Result summary from a job fetch operation."""

    fetched: int = Field(..., description="Number of jobs successfully fetched.")
    embedded: int = Field(..., description="Number of jobs successfully embedded.")
    errors: list[str] = Field(default_factory=list, description="Errors encountered during fetch.")
