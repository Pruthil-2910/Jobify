"""JWT, password hashing, and Fernet API-key encryption utilities.

Provides helpers for:
  * bcrypt password hashing (passlib, rounds=12)
  * HS256 JWT access-token issuance / decoding
  * Symmetric encryption of third-party API keys via Fernet,
    with the key derived deterministically from settings.ENCRYPTION_SECRET.

Never logs raw secrets, tokens, or API keys.
"""
from __future__ import annotations

import base64
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any, Dict

from cryptography.fernet import Fernet
from jose import jwt
import bcrypt as _bcrypt

from config import settings


def _truncate(password: str) -> bytes:
    """bcrypt's input is capped at 72 bytes; truncate explicitly to avoid backend errors."""
    return password.encode("utf-8")[:72]


def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt (rounds=12)."""
    return _bcrypt.hashpw(_truncate(password), _bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a plaintext password against a previously stored bcrypt hash."""
    try:
        return _bcrypt.checkpw(_truncate(plain), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: Any) -> str:
    """Create a signed HS256 JWT with `sub=str(user_id)` and configured expiry."""
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload: Dict[str, Any] = {
        "sub": str(user_id),
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> Dict[str, Any]:
    """Decode and verify a JWT; raises `jose.JWTError` on invalid/expired tokens."""
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])


def _derive_fernet_key() -> bytes:
    """Derive a 32-byte url-safe base64 Fernet key from `settings.ENCRYPTION_SECRET`."""
    digest = hashlib.sha256(settings.ENCRYPTION_SECRET.encode()).digest()
    return base64.urlsafe_b64encode(digest)


def encrypt_api_key(key: str) -> str:
    """Encrypt a third-party API key (returns url-safe base64 ciphertext token)."""
    f = Fernet(_derive_fernet_key())
    return f.encrypt(key.encode()).decode()


def decrypt_api_key(encrypted: str) -> str:
    """Decrypt a previously encrypted API key produced by `encrypt_api_key`."""
    f = Fernet(_derive_fernet_key())
    return f.decrypt(encrypted.encode()).decode()
