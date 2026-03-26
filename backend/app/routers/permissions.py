"""Permission check endpoints — RBAC-aware UI support."""

from fastapi import APIRouter, Request
from pydantic import BaseModel

from app.services.k8s_rbac import check_permission

router = APIRouter(prefix="/api/permissions", tags=["permissions"])


class PermissionCheck(BaseModel):
    verb: str
    resource: str
    group: str = ""
    namespace: str | None = None


class BatchPermissionCheck(BaseModel):
    checks: list[PermissionCheck]


@router.post("/check")
async def check_single(body: PermissionCheck, request: Request) -> dict:
    """Check a single permission."""
    user_token = getattr(request.state, "user_token", None)
    return await check_permission(
        verb=body.verb,
        resource=body.resource,
        group=body.group,
        namespace=body.namespace,
        user_token=user_token,
    )


@router.post("/batch")
async def check_batch(body: BatchPermissionCheck, request: Request) -> dict:
    """Check multiple permissions in one call."""
    user_token = getattr(request.state, "user_token", None)
    results = []
    for check in body.checks:
        result = await check_permission(
            verb=check.verb,
            resource=check.resource,
            group=check.group,
            namespace=check.namespace,
            user_token=user_token,
        )
        results.append(result)
    return {"results": results}
