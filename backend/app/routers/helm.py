"""Helm release REST endpoints."""

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app.services.helm_releases import (
    delete_release,
    get_release,
    get_release_history,
    list_releases,
)

router = APIRouter(prefix="/api/helm", tags=["helm"])


@router.get("/releases")
async def helm_list_releases(request: Request, namespace: str | None = None) -> list[dict]:
    """List all Helm releases, optionally filtered by namespace."""
    user_token = getattr(request.state, "user_token", None)
    releases = await list_releases(namespace=namespace, user_token=user_token)
    return releases


@router.get("/releases/{namespace}/{name}")
async def helm_get_release(namespace: str, name: str, request: Request) -> dict:
    """Get details of a specific Helm release."""
    user_token = getattr(request.state, "user_token", None)
    try:
        return await get_release(name, namespace, user_token=user_token)
    except ValueError as e:
        return JSONResponse(status_code=404, content={"error": str(e)})


@router.get("/releases/{namespace}/{name}/history")
async def helm_release_history(namespace: str, name: str, request: Request) -> list[dict]:
    """Get revision history for a Helm release."""
    user_token = getattr(request.state, "user_token", None)
    return await get_release_history(name, namespace, user_token=user_token)


@router.get("/releases/{namespace}/{name}/values")
async def helm_release_values(namespace: str, name: str, request: Request) -> dict:
    """Get user-supplied values for a Helm release."""
    user_token = getattr(request.state, "user_token", None)
    try:
        release = await get_release(name, namespace, user_token=user_token)
        return release.get("values", {})
    except ValueError as e:
        return JSONResponse(status_code=404, content={"error": str(e)})


@router.delete("/releases/{namespace}/{name}")
async def helm_delete_release(namespace: str, name: str, request: Request) -> dict:
    """Uninstall a Helm release by deleting its Secrets."""
    user_token = getattr(request.state, "user_token", None)
    return await delete_release(name, namespace, user_token=user_token)
