"""Events endpoint — filtered Kubernetes events."""

from fastapi import APIRouter, Request
from kubernetes.client import ApiClient, Configuration, CoreV1Api

from app.services.k8s_client import get_api_client

router = APIRouter(prefix="/api/events", tags=["events"])


def _get_client(request: Request) -> ApiClient:
    """Get an API client using the user's token if available."""
    user_token = getattr(request.state, "user_token", None)
    if not user_token:
        return get_api_client()
    base = get_api_client()
    cfg = Configuration()
    cfg.host = base.configuration.host
    cfg.api_key = {"authorization": f"Bearer {user_token}"}
    cfg.verify_ssl = base.configuration.verify_ssl
    cfg.ssl_ca_cert = base.configuration.ssl_ca_cert
    return ApiClient(configuration=cfg)


@router.get("")
async def list_events(
    request: Request,
    namespace: str | None = None,
    type: str | None = None,
    involved_object_kind: str | None = None,
    involved_object_name: str | None = None,
    limit: int = 200,
) -> dict:
    """List Kubernetes events with optional filters."""
    api_client = _get_client(request)
    core = CoreV1Api(api_client)

    field_selectors = []
    if type:
        field_selectors.append(f"type={type}")
    if involved_object_kind:
        field_selectors.append(f"involvedObject.kind={involved_object_kind}")
    if involved_object_name:
        field_selectors.append(f"involvedObject.name={involved_object_name}")

    kwargs: dict = {"limit": limit}
    if field_selectors:
        kwargs["field_selector"] = ",".join(field_selectors)

    try:
        if namespace:
            event_list = core.list_namespaced_event(namespace, **kwargs)
        else:
            event_list = core.list_event_for_all_namespaces(**kwargs)
    except Exception:
        return {"events": [], "count": 0}

    events = [
        {
            "type": e.type or "Normal",
            "reason": e.reason or "",
            "message": e.message or "",
            "namespace": e.metadata.namespace or "",
            "involvedObject": {
                "kind": e.involved_object.kind if e.involved_object else "",
                "name": e.involved_object.name if e.involved_object else "",
            },
            "firstTimestamp": str(e.first_timestamp) if e.first_timestamp else "",
            "lastTimestamp": (
                str(e.last_timestamp)
                if e.last_timestamp
                else str(e.metadata.creation_timestamp)
            ),
            "count": e.count or 1,
            "source": e.source.component if e.source else "",
        }
        for e in event_list.items
    ]

    # Sort by lastTimestamp descending
    events.sort(key=lambda e: e["lastTimestamp"], reverse=True)

    return {"events": events, "count": len(events)}
