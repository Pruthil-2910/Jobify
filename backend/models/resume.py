"""Resume, project ingestion, JD-matching, and chat Pydantic v2 models."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class Education(BaseModel):
    """A single education entry on a resume."""

    model_config = ConfigDict(str_strip_whitespace=True)

    institution: Optional[str] = Field(default=None, description="School or university name.")
    degree: Optional[str] = Field(default=None, description="Degree or program.")
    field_of_study: Optional[str] = Field(default=None, description="Field of study / major.")
    start_date: Optional[str] = Field(default=None, description="Start date (free-form).")
    end_date: Optional[str] = Field(default=None, description="End date (free-form).")
    gpa: Optional[str] = Field(default=None, description="GPA or grade.")


class Experience(BaseModel):
    """A single work experience entry on a resume."""

    model_config = ConfigDict(str_strip_whitespace=True)

    company: Optional[str] = Field(default=None, description="Employer name.")
    title: Optional[str] = Field(default=None, description="Job title held.")
    location: Optional[str] = Field(default=None, description="Location of the role.")
    start_date: Optional[str] = Field(default=None, description="Start date (free-form).")
    end_date: Optional[str] = Field(default=None, description="End date (free-form).")
    highlights: list[str] = Field(default_factory=list, description="Bullet-point achievements.")


class Project(BaseModel):
    """A single project entry on a resume."""

    model_config = ConfigDict(str_strip_whitespace=True)

    name: Optional[str] = Field(default=None, description="Project name.")
    description: Optional[str] = Field(default=None, description="Short project description.")
    url: Optional[str] = Field(default=None, description="Link to project repo or demo.")
    technologies: list[str] = Field(default_factory=list, description="Tech stack used.")
    highlights: list[str] = Field(default_factory=list, description="Notable achievements.")


class Skill(BaseModel):
    """A skill or skill category on a resume."""

    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(..., description="Skill name or category.")
    level: Optional[str] = Field(default=None, description="Proficiency level.")


class Resume(BaseModel):
    """Structured resume document."""

    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(..., description="Candidate's full name.")
    email: Optional[EmailStr] = Field(default=None, description="Contact email.")
    phone: Optional[str] = Field(default=None, description="Contact phone number.")
    summary: Optional[str] = Field(default=None, description="Professional summary statement.")
    education: list[Education] = Field(default_factory=list, description="Education history.")
    experience: list[Experience] = Field(default_factory=list, description="Work experience.")
    projects: list[Project] = Field(default_factory=list, description="Project portfolio.")
    skills: list[Skill] = Field(default_factory=list, description="Skill list.")


class TailoredResumeResponse(BaseModel):
    """A tailored resume produced for a particular job description."""

    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., description="Internal record ID.")
    jd_text: str = Field(..., description="Original job description text.")
    resume_json: dict[str, Any] = Field(..., description="Tailored resume as JSON.")
    created_at: datetime = Field(..., description="Creation timestamp (UTC).")


class JDMatchRequest(BaseModel):
    """Request to match the user's profile against a job description."""

    model_config = ConfigDict(str_strip_whitespace=True)

    jd_text: str = Field(..., min_length=20, description="Job description text to match against.")


class JDMatchResponse(BaseModel):
    """Match result containing top projects and gap analysis."""

    top_projects: list[dict[str, Any]] = Field(
        default_factory=list, description="Top-matching projects with scores."
    )
    gap_analysis: list[str] = Field(
        default_factory=list, description="Identified skill / experience gaps."
    )


class ProjectIngestRequest(BaseModel):
    """Request to ingest projects from a list of repository URLs."""

    urls: list[str] = Field(..., description="Project URLs (e.g., GitHub repos) to ingest.")


class ProjectIngestResponse(BaseModel):
    """Result of a project ingestion run."""

    ingested: int = Field(..., description="Number of projects successfully ingested.")
    failed: list[Any] = Field(
        default_factory=list, description="Entries that failed to ingest with error info."
    )


class ChatRequest(BaseModel):
    """User message sent to the assistant."""

    model_config = ConfigDict(str_strip_whitespace=True)

    message: str = Field(..., min_length=1, description="User's chat message.")


class ChatResponse(BaseModel):
    """Assistant reply with detected intent and any referenced jobs."""

    response: str = Field(..., description="Assistant's natural-language reply.")
    intent: str = Field(..., description="Classified intent of the user's message.")
    jobs_referenced: list[dict[str, Any]] = Field(
        default_factory=list, description="Jobs cited in the reply."
    )
