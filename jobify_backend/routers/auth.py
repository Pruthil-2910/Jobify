"""Authentication router: register, login, API-key management, and validation."""
from __future__ import annotations

from typing import Any, Dict

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException, status

from auth.dependencies import get_current_user, get_db_dep
from auth.jwt_handler import (
    create_access_token,
    encrypt_api_key,
    hash_password,
    verify_password,
)
from db import crud
from models.user import (
    APIKeyValidation,
    SetAPIKeyRequest,
    TokenResponse,
    UserLogin,
    UserRegister,
)

router = APIRouter(prefix="/auth", tags=["auth"])

_GEMINI_VALIDATE_URL = "https://generativelanguage.googleapis.com/v1beta/models"


@router.post("/register", response_model=TokenResponse)
def register(payload: UserRegister, conn: Any = Depends(get_db_dep)) -> TokenResponse:
    """Register a new user and return an access token."""
    existing = crud.get_user_by_email(conn, payload.email)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )
    hashed = hash_password(payload.password)
    user = crud.create_user(conn, email=payload.email, password_hash=hashed)
    user_id = user["id"] if isinstance(user, dict) else user
    token = create_access_token(user_id)
    return TokenResponse(access_token=token, token_type="bearer", user_id=user_id)


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, conn: Any = Depends(get_db_dep)) -> TokenResponse:
    """Authenticate via email + password and return an access token."""
    user = crud.get_user_by_email(conn, payload.email)
    if user is None or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = create_access_token(user["id"])
    return TokenResponse(access_token=token, token_type="bearer", user_id=user["id"])


@router.post("/set-api-key")
def set_api_key(
    payload: SetAPIKeyRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
    conn: Any = Depends(get_db_dep),
) -> Dict[str, str]:
    """Encrypt and persist the caller's third-party API key."""
    encrypted = encrypt_api_key(payload.gemini_key)
    crud.update_user_api_key(conn, current_user["id"], encrypted)
    return {"status": "ok"}


@router.get("/validate-key", response_model=APIKeyValidation)
async def validate_key(
    x_gemini_api_key: str = Header(..., alias="X-Gemini-API-Key"),
) -> APIKeyValidation:
    """Validate a Gemini API key by issuing a lightweight models list call."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                _GEMINI_VALIDATE_URL,
                params={"key": x_gemini_api_key},
            )
        return APIKeyValidation(valid=resp.status_code == 200)
    except httpx.HTTPError:
        return APIKeyValidation(valid=False)
