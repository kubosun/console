"""SSE watch endpoint — streams Kubernetes resource events to the frontend."""

import json
from collections.abc import AsyncGenerator

from fastapi import APIRouter, Query, Request
from starlette.responses import StreamingResponse

from app.services.k8s_proxy import proxy_request

router = APIRouter(prefix="/api/watch", tags=["watch"])


@router.get("/{group}/{version}/{plural}")
async def watch_resource_events(
    group: str,
    version: str,
    plural: str,
    request: Request,
    namespace: str | None = Query(None),
) -> StreamingResponse:
    """Stream resource events via Server-Sent Events (SSE).

    Uses the user's OAuth token for RBAC enforcement.
    URL pattern: /api/watch/{group}/{version}/{plural}?namespace=default
    For core API resources, use "core" as the group.
    """
    actual_group = "" if group == "core" else group
    user_token = getattr(request.state, "user_token", None)

    # Build K8s API path
    if actual_group:
        base = f"apis/{actual_group}/{version}"
    else:
        base = f"api/{version}"

    if namespace:
        path = f"{base}/namespaces/{namespace}/{plural}"
    else:
        path = f"{base}/{plural}"

    async def event_stream() -> AsyncGenerator[str, None]:
        # Use the proxy with user token for RBAC enforcement
        response = await proxy_request(
            method="GET",
            path=path,
            query_params="watch=true&timeoutSeconds=300",
            user_token=user_token,
        )

        # Stream the response
        for line in response.text.splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                event = json.loads(line)
                data = json.dumps(event, default=str)
                yield f"data: {data}\n\n"
            except json.JSONDecodeError:
                continue

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
