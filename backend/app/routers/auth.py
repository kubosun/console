"""OAuth2/OIDC authentication endpoints."""

import hashlib
import secrets

import httpx
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, RedirectResponse

from app.config import settings
from app.services.session import (
    COOKIE_NAME,
    create_session,
    get_user_info,
    get_user_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])

# In-memory state store for CSRF protection (use Redis in production)
_oauth_states: dict[str, bool] = {}


@router.get("/login")
async def login():
    """Redirect to OAuth provider's authorization page."""
    if not settings.oauth_enabled:
        return JSONResponse(
            status_code=400,
            content={"error": "OAuth is not enabled"},
        )

    state = secrets.token_urlsafe(32)
    _oauth_states[state] = True

    if settings.oauth_provider == "openshift":
        authorize_url = f"{settings.oauth_issuer_url}/oauth/authorize"
    else:
        # Generic OIDC — discover from well-known
        authorize_url = await _discover_endpoint("authorization_endpoint")

    params = {
        "response_type": "code",
        "client_id": settings.oauth_client_id,
        "redirect_uri": settings.oauth_redirect_uri,
        "scope": settings.oauth_scopes,
        "state": state,
    }
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return RedirectResponse(f"{authorize_url}?{query}")


@router.get("/callback")
async def callback(code: str, state: str):
    """Handle OAuth callback — exchange code for token, create session."""
    if not settings.oauth_enabled:
        return JSONResponse(status_code=400, content={"error": "OAuth not enabled"})

    # Verify state
    if state not in _oauth_states:
        return JSONResponse(status_code=400, content={"error": "Invalid state"})
    del _oauth_states[state]

    # Exchange code for token
    if settings.oauth_provider == "openshift":
        token_url = f"{settings.oauth_issuer_url}/oauth/token"
    else:
        token_url = await _discover_endpoint("token_endpoint")

    async with httpx.AsyncClient(verify=False) as client:
        token_resp = await client.post(
            token_url,
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": settings.oauth_redirect_uri,
                "client_id": settings.oauth_client_id,
                "client_secret": settings.oauth_client_secret,
            },
        )

    if token_resp.status_code != 200:
        return JSONResponse(
            status_code=400,
            content={"error": f"Token exchange failed: {token_resp.text}"},
        )

    token_data = token_resp.json()
    access_token = token_data.get("access_token", "")
    refresh_token = token_data.get("refresh_token", "")
    expires_in = token_data.get("expires_in", 86400)

    # Get user info
    user_info = await _get_user_info(access_token)

    # Create session cookie
    session_value = create_session(user_info, access_token, refresh_token, expires_in)

    response = RedirectResponse("/")
    response.set_cookie(
        key=COOKIE_NAME,
        value=session_value,
        httponly=True,
        samesite="lax",
        max_age=settings.session_max_age,
        secure=not settings.debug,
    )
    return response


@router.post("/logout")
async def logout(request: Request):
    """Revoke OAuth token and clear session cookie."""
    cookie = request.cookies.get(COOKIE_NAME)
    if cookie:
        token = get_user_token(cookie)
        if token and settings.oauth_provider == "openshift":
            # Delete the OAuthAccessToken to prevent auto-re-login
            url = f"{settings.k8s_api_server}/apis/oauth.openshift.io/v1/oauthaccesstokens/sha256~{_sha256(token)}"
            async with httpx.AsyncClient(verify=False) as client:
                await client.delete(
                    url,
                    headers={"Authorization": f"Bearer {token}"},
                )

    response = JSONResponse(content={"status": "logged out"})
    response.delete_cookie(
        COOKIE_NAME,
        httponly=True,
        samesite="lax",
        secure=not settings.debug,
    )
    return response


@router.get("/user")
async def get_current_user(request: Request):
    """Return current user info from session."""
    if not settings.oauth_enabled:
        return {"authenticated": False, "oauth_enabled": False}

    cookie = request.cookies.get(COOKIE_NAME)
    if not cookie:
        return JSONResponse(status_code=401, content={"error": "Not authenticated"})

    user = get_user_info(cookie)
    if not user:
        return JSONResponse(status_code=401, content={"error": "Session expired"})

    return {"authenticated": True, "user": user}


async def _get_user_info(access_token: str) -> dict[str, str]:
    """Fetch user info using the access token."""
    if settings.oauth_provider == "openshift":
        # OpenShift: query the User API (on the K8s API server, not OAuth server)
        url = f"{settings.k8s_api_server}/apis/user.openshift.io/v1/users/~"
        async with httpx.AsyncClient(verify=False) as client:
            resp = await client.get(url, headers={"Authorization": f"Bearer {access_token}"})
        if resp.status_code == 200:
            data = resp.json()
            return {
                "name": data.get("metadata", {}).get("name", "unknown"),
                "uid": data.get("metadata", {}).get("uid", ""),
                "email": data.get("metadata", {}).get("name", ""),
            }
    else:
        # Generic OIDC: use userinfo endpoint
        userinfo_url = await _discover_endpoint("userinfo_endpoint")
        async with httpx.AsyncClient(verify=False) as client:
            resp = await client.get(
                userinfo_url,
                headers={"Authorization": f"Bearer {access_token}"},
            )
        if resp.status_code == 200:
            data = resp.json()
            return {
                "name": data.get("preferred_username", data.get("sub", "unknown")),
                "uid": data.get("sub", ""),
                "email": data.get("email", ""),
            }

    return {"name": "unknown", "uid": "", "email": ""}


def _sha256(value: str) -> str:
    """Return the URL-safe base64-encoded SHA-256 hash (no padding)."""
    import base64

    digest = hashlib.sha256(value.encode()).digest()
    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode()


async def _discover_endpoint(key: str) -> str:
    """Discover OIDC endpoint from well-known configuration."""
    url = f"{settings.oauth_issuer_url}/.well-known/openid-configuration"
    async with httpx.AsyncClient(verify=False) as client:
        resp = await client.get(url)
    if resp.status_code == 200:
        return resp.json().get(key, "")
    return ""
