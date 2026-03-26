"""SSE watch endpoint — streams Kubernetes resource events to the frontend."""

import json
from collections.abc import AsyncGenerator

from fastapi import APIRouter, Query
from starlette.responses import StreamingResponse

from app.services.k8s_watch import watch_resources

router = APIRouter(prefix="/api/watch", tags=["watch"])


@router.get("/{group}/{version}/{plural}")
async def watch_resource_events(
    group: str,
    version: str,
    plural: str,
    namespace: str | None = Query(None),
) -> StreamingResponse:
    """Stream resource events via Server-Sent Events (SSE).

    URL pattern: /api/watch/{group}/{version}/{plural}?namespace=default
    For core API resources, use "core" as the group.
    """
    actual_group = "" if group == "core" else group

    async def event_stream() -> AsyncGenerator[str, None]:
        async for event in watch_resources(actual_group, version, plural, namespace):
            data = json.dumps(event, default=str)
            yield f"data: {data}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
