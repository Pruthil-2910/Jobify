"""FastAPI dependencies for DB connections and authenticated user resolution."""
from __future__ import annotations

from typing import Any, Dict, Iterator

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError

from auth.jwt_handler import decode_token
from db import connection
from db import crud

oauth2_scheme = HTTPBearer()


def get_db_dep() -> Iterator[Any]:
    """Yield a SQLite connection, ensuring it is closed in `finally`."""
    conn = connection.get_connection()
    try:
        yield conn
    finally:
        try:
            conn.close()
        except Exception:
            pass


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme),
    conn: Any = Depends(get_db_dep),
) -> Dict[str, Any]:
    """Resolve the current authenticated user from a Bearer JWT.

    Raises 401 with `WWW-Authenticate: Bearer` on any decode/lookup failure.
    """
    creds_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(credentials.credentials)
        sub = payload.get("sub")
        if sub is None:
            raise creds_exception
        try:
            user_id = int(sub)
        except (TypeError, ValueError):
            raise creds_exception
    except JWTError:
        raise creds_exception

    user = crud.get_user_by_id(conn, user_id)
    if user is None:
        raise creds_exception
    return user
