"""Session management — signed cookies for user authentication."""

import json
import time
from typing import Any

from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from app.config import settings

_serializer = URLSafeTimedSerializer(settings.session_secret)
COOKIE_NAME = "kubosun_session"


def create_session(
    user_info: dict[str, str],
    access_token: str,
    refresh_token: str | None = None,
    expires_in: int = 86400,
) -> str:
    """Create a signed session cookie value."""
    data = {
        "user": user_info,
        "token": access_token,
        "refresh_token": refresh_token or "",
        "expires_at": int(time.time()) + expires_in,
    }
    return _serializer.dumps(json.dumps(data))


def verify_session(cookie: str) -> dict[str, Any] | None:
    """Verify and decode a session cookie. Returns None if invalid."""
    try:
        raw = _serializer.loads(cookie, max_age=settings.session_max_age)
        data = json.loads(raw)
        # Check if token has expired
        if data.get("expires_at", 0) < time.time():
            return None
        return data
    except (BadSignature, SignatureExpired, json.JSONDecodeError):
        return None


def get_user_token(cookie: str) -> str | None:
    """Extract the K8s token from a session cookie."""
    session = verify_session(cookie)
    if session:
        return session.get("token")
    return None


def get_user_info(cookie: str) -> dict[str, str] | None:
    """Extract user info from a session cookie."""
    session = verify_session(cookie)
    if session:
        return session.get("user")
    return None
