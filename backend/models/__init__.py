"""Pydantic v2 model exports for the Jobify backend."""

from .job import (
    JobBase,
    JobFetchRequest,
    JobFetchResponse,
    JobResponse,
    JobSearchQuery,
)
from .resume import (
    ChatRequest,
    ChatResponse,
    Education,
    Experience,
    JDMatchRequest,
    JDMatchResponse,
    Project,
    ProjectIngestRequest,
    ProjectIngestResponse,
    Resume,
    Skill,
    TailoredResumeResponse,
)
from .user import (
    APIKeyValidation,
    SetAPIKeyRequest,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
)

__all__ = [
    # user
    "UserRegister",
    "UserLogin",
    "UserResponse",
    "TokenResponse",
    "SetAPIKeyRequest",
    "APIKeyValidation",
    # job
    "JobBase",
    "JobResponse",
    "JobSearchQuery",
    "JobFetchRequest",
    "JobFetchResponse",
    # resume
    "Education",
    "Experience",
    "Project",
    "Skill",
    "Resume",
    "TailoredResumeResponse",
    "JDMatchRequest",
    "JDMatchResponse",
    "ProjectIngestRequest",
    "ProjectIngestResponse",
    "ChatRequest",
    "ChatResponse",
]
