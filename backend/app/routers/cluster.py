"""Cluster summary endpoint — aggregated cluster health and resource counts."""

from datetime import UTC, datetime

from fastapi import APIRouter, Request
from kubernetes.client import ApiClient, Configuration, CoreV1Api, VersionApi

from app.services.k8s_client import get_api_client

router = APIRouter(prefix="/api/cluster", tags=["cluster"])


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


@router.get("/summary")
async def cluster_summary(request: Request) -> dict:
    """Return aggregated cluster health, resource counts, and recent events.

    Uses the user's OAuth token for RBAC enforcement — users only see
    what their permissions allow.
    """
    api_client = _get_client(request)
    core = CoreV1Api(api_client)

    # Cluster version (generally accessible to all authenticated users)
    try:
        version_api = VersionApi(api_client)
        version_info = version_api.get_code()
        cluster_info = {
            "version": version_info.git_version,
            "platform": version_info.platform,
        }
    except Exception:
        cluster_info = {"version": "unknown", "platform": "unknown"}

    # Node health
    try:
        nodes = core.list_node()
        node_count = len(nodes.items)
        ready_nodes = 0
        for node in nodes.items:
            for condition in node.status.conditions or []:
                if condition.type == "Ready" and condition.status == "True":
                    ready_nodes += 1
        node_health = {
            "total": node_count,
            "ready": ready_nodes,
            "notReady": node_count - ready_nodes,
        }
    except Exception:
        node_health = {"total": 0, "ready": 0, "notReady": 0}

    # Resource counts
    counts = {}
    for resource_type in ["pods", "deployments", "services", "namespaces"]:
        try:
            if resource_type == "deployments":
                resp = api_client.call_api(
                    "/apis/apps/v1/deployments",
                    "GET",
                    query_params=[("limit", 1)],
                    response_type="object",
                    auth_settings=["BearerToken"],
                )
            else:
                resp = api_client.call_api(
                    f"/api/v1/{resource_type}",
                    "GET",
                    query_params=[("limit", 1)],
                    response_type="object",
                    auth_settings=["BearerToken"],
                )
            data = resp[0]
            metadata = data.get("metadata", {})
            remaining = metadata.get("remainingItemCount", 0)
            item_count = len(data.get("items", []))
            counts[resource_type] = item_count + (remaining or 0)
        except Exception:
            counts[resource_type] = 0

    # Recent events (scoped to user's permissions)
    try:
        events = api_client.call_api(
            "/api/v1/events",
            "GET",
            query_params=[("limit", 20)],
            response_type="object",
            auth_settings=["BearerToken"],
        )
        event_items = events[0].get("items", [])
        recent_events = [
            {
                "type": e.get("type", "Normal"),
                "reason": e.get("reason", ""),
                "message": e.get("message", ""),
                "namespace": e.get("metadata", {}).get("namespace", ""),
                "involvedObject": (
                    f"{e.get('involvedObject', {}).get('kind', '')}"
                    f"/{e.get('involvedObject', {}).get('name', '')}"
                ),
                "lastTimestamp": e.get(
                    "lastTimestamp",
                    e.get("metadata", {}).get("creationTimestamp", ""),
                ),
                "count": e.get("count", 1),
            }
            for e in event_items
        ]
    except Exception:
        recent_events = []

    return {
        "cluster": cluster_info,
        "nodes": node_health,
        "counts": counts,
        "events": recent_events,
        "timestamp": datetime.now(UTC).isoformat(),
    }
