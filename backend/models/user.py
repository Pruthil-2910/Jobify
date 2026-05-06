"""User-related Pydantic v2 models for authentication and account management."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRegister(BaseModel):
    """Payload for registering a new user account."""

    model_config = ConfigDict(str_strip_whitespace=True)

    email: EmailStr = Field(..., description="User's email address (unique).")
    password: str = Field(..., min_length=8, description="Plaintext password (min 8 chars).")


class UserLogin(BaseModel):
    """Payload for logging in an existing user."""

    model_config = ConfigDict(str_strip_whitespace=True)

    email: EmailStr = Field(..., description="Registered email address.")
    password: str = Field(..., description="Plaintext password.")


class UserResponse(BaseModel):
    """Public-facing representation of a user account."""

    model_config = ConfigDict(from_attributes=True)

    id: int = Field(..., description="Internal user ID.")
    email: EmailStr = Field(..., description="User's email address.")
    has_resume: bool = Field(..., description="Whether the user has uploaded a resume.")
    has_api_key: bool = Field(..., description="Whether the user has set a Gemini API key.")
    created_at: datetime = Field(..., description="Account creation timestamp (UTC).")


class TokenResponse(BaseModel):
    """JWT access token returned after successful authentication."""

    model_config = ConfigDict(from_attributes=True)

    access_token: str = Field(..., description="Signed JWT access token.")
    token_type: str = Field(default="bearer", description="OAuth2 token type.")
    user_id: int = Field(..., description="Authenticated user's ID.")


class SetAPIKeyRequest(BaseModel):
    """Payload for storing a user's Gemini API key."""

    model_config = ConfigDict(str_strip_whitespace=True)

    gemini_key: str = Field(..., min_length=10, description="Google Gemini API key.")


class APIKeyValidation(BaseModel):
    """Result of validating a stored or supplied API key."""

    valid: bool = Field(..., description="Whether the API key is valid.")
