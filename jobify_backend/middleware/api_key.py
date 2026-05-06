from typing import Optional
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from starlette.types import ASGIApp


class APIKeyMiddleware(BaseHTTPMiddleware):
    """Resolves Gemini API key from header X-Gemini-API-Key, falling back to
    the authenticated user's encrypted DB record. Stores in request.state.gemini_key.
    Never logs key. Never raises on missing key — endpoints decide."""

    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(self, request: Request, call_next) -> Response:
        key: Optional[str] = request.headers.get("X-Gemini-API-Key")

        if not key:
            auth = request.headers.get("Authorization", "")
            if auth.startswith("Bearer "):
                token = auth[7:]
                try:
                    from auth.jwt_handler import decode_token, decrypt_api_key
                    from db.connection import get_connection
                    from db.crud import get_user_by_id
                    payload = decode_token(token)
                    user_id = int(payload.get("sub"))
                    conn = get_connection()
                    try:
                        user = get_user_by_id(conn, user_id)
                        if user and user.get("api_key_encrypted"):
                            key = decrypt_api_key(user["api_key_encrypted"])
                    finally:
                        conn.close()
                except Exception:
                    key = None

        request.state.gemini_key = key
        return await call_next(request)
