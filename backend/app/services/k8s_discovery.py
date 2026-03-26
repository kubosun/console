"""Kubernetes API discovery — enumerates available resource types on the cluster."""

import time
from typing import Any

from kubernetes import client

from app.services.k8s_client import get_api_client

_cache: dict[str, Any] = {}
_cache_timestamp: float = 0
CACHE_TTL_SECONDS = 300  # 5 minutes


def _discover_resources() -> dict[str, Any]:
    """Enumerate all API groups and resources on the cluster."""
    api_client = get_api_client()
    models: dict[str, Any] = {}

    # Core API (v1) — pods, services, configmaps, etc.
    core_v1 = client.CoreV1Api(api_client)
    core_resources = core_v1.get_api_resources()
    for r in core_resources.resources:
        # Skip subresources (contain /)
        if "/" in r.name:
            continue
        key = f"/v1/{r.kind}"
        models[key] = {
            "apiGroup": "",
            "apiVersion": "v1",
            "kind": r.kind,
            "plural": r.name,
            "singular": r.singular_name or r.kind.lower(),
            "namespaced": r.namespaced,
            "verbs": r.verbs or [],
            "shortNames": r.short_names or [],
        }

    # Group APIs (apps/v1, networking.k8s.io/v1, etc.)
    apis = client.ApisApi(api_client)
    groups = apis.get_api_versions()
    for group in groups.groups:
        preferred = group.preferred_version
        if not preferred:
            continue
        gv = preferred.group_version
        group_name = group.name
        version = preferred.version

        try:
            api_response = api_client.call_api(
                f"/apis/{gv}",
                "GET",
                response_type="object",
                auth_settings=["BearerToken"],
            )
            data = api_response[0]
            resources = data.get("resources", [])
        except Exception:
            continue

        for r in resources:
            name = r.get("name", "")
            # Skip subresources
            if "/" in name:
                continue
            kind = r.get("kind", "")
            key = f"{group_name}/{version}/{kind}"
            models[key] = {
                "apiGroup": group_name,
                "apiVersion": version,
                "kind": kind,
                "plural": name,
                "singular": r.get("singularName", kind.lower()),
                "namespaced": r.get("namespaced", False),
                "verbs": r.get("verbs", []),
                "shortNames": r.get("shortNames", []),
                "group": group_name,
                "version": version,
            }

    return models


def get_resource_models() -> dict[str, Any]:
    """Get resource models with caching."""
    global _cache, _cache_timestamp
    now = time.time()
    if _cache and (now - _cache_timestamp) < CACHE_TTL_SECONDS:
        return _cache
    _cache = _discover_resources()
    _cache_timestamp = now
    return _cache


def invalidate_cache() -> None:
    """Clear the resource model cache."""
    global _cache, _cache_timestamp
    _cache = {}
    _cache_timestamp = 0
