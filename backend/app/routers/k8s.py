"""Kubernetes API proxy and resource endpoints."""

from fastapi import APIRouter, Request, Response

from app.services.k8s_proxy import proxy_request

router = APIRouter(prefix="/api/kubernetes", tags=["kubernetes"])


@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def kubernetes_proxy(path: str, request: Request) -> Response:
    """Proxy requests to the Kubernetes API server."""
    body = await request.body() if request.method in ("POST", "PUT", "PATCH") else None
    content_type = request.headers.get("content-type")
    user_token = getattr(request.state, "user_token", None)

    response = await proxy_request(
        method=request.method,
        path=path,
        query_params=str(request.query_params),
        body=body,
        content_type=content_type,
        user_token=user_token,
    )

    # Filter response headers
    excluded = {"transfer-encoding", "content-encoding", "content-length"}
    headers = {k: v for k, v in response.headers.items() if k.lower() not in excluded}

    return Response(
        content=response.content,
        status_code=response.status_code,
        headers=headers,
        media_type=response.headers.get("content-type"),
    )
