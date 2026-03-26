"""Authentication middleware — validates session cookies on API requests."""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.config import settings
from app.services.session import COOKIE_NAME, verify_session

# Paths that don't require authentication
PUBLIC_PATHS = {"/health", "/health/cluster", "/auth/login", "/auth/callback", "/auth/user"}
PUBLIC_PREFIXES = ("/auth/",)


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Skip auth entirely if OAuth is not enabled (dev mode)
        if not settings.oauth_enabled:
            request.state.user_token = None
            request.state.user_info = None
            return await call_next(request)

        path = request.url.path

        # Skip auth for public paths
        if path in PUBLIC_PATHS or any(path.startswith(p) for p in PUBLIC_PREFIXES):
            request.state.user_token = None
            request.state.user_info = None
            return await call_next(request)

        # Check session cookie
        cookie = request.cookies.get(COOKIE_NAME)
        if not cookie:
            return JSONResponse(
                status_code=401,
                content={"error": "Not authenticated"},
            )

        session = verify_session(cookie)
        if not session:
            return JSONResponse(
                status_code=401,
                content={"error": "Session expired"},
            )

        # Attach user context to request
        request.state.user_token = session.get("token")
        request.state.user_info = session.get("user")

        return await call_next(request)
