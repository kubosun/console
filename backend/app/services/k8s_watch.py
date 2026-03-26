"""Kubernetes watch service — provides async generators for resource events."""

import asyncio
from collections.abc import AsyncGenerator
from typing import Any

from kubernetes import client

from app.services.k8s_client import get_api_client


async def watch_resources(
    group: str,
    version: str,
    plural: str,
    namespace: str | None = None,
) -> AsyncGenerator[dict[str, Any], None]:
    """Watch Kubernetes resources and yield events as dicts.

    Yields events like:
        {"type": "ADDED", "object": {...}}
        {"type": "MODIFIED", "object": {...}}
        {"type": "DELETED", "object": {...}}
    """
    api_client = get_api_client()

    # Determine the API path
    if group == "" or group == "core":
        if namespace:
            path = f"/api/{version}/namespaces/{namespace}/{plural}"
        else:
            path = f"/api/{version}/{plural}"
    else:
        path = (
            f"/apis/{group}/{version}/namespaces/{namespace}/{plural}"
            if namespace
            else f"/apis/{group}/{version}/{plural}"
        )

    # Use the raw API to watch any resource type
    try:
        # First, send the initial list as ADDED events
        response = api_client.call_api(
            path,
            "GET",
            query_params=[("limit", 500)],
            response_type="object",
            auth_settings=["BearerToken"],
        )
        data = response[0]
        resource_version = data.get("metadata", {}).get("resourceVersion", "0")

        for item in data.get("items", []):
            yield {"type": "ADDED", "object": _slim_resource(item)}

        # Then watch for changes
        watch_path = path
        query_params = [
            ("watch", "true"),
            ("resourceVersion", resource_version),
            ("timeoutSeconds", 300),
        ]

        # Run the blocking watch in a thread
        async for event in _async_watch(api_client, watch_path, query_params):
            yield event

    except Exception as e:
        yield {"type": "ERROR", "error": str(e)}


async def _async_watch(
    api_client: client.ApiClient,
    path: str,
    query_params: list[tuple[str, Any]],
) -> AsyncGenerator[dict[str, Any], None]:
    """Run the K8s watch in a thread and yield events asynchronously."""

    loop = asyncio.get_event_loop()

    def _blocking_watch():
        """Blocking watch that yields events."""
        cfg = api_client.configuration
        # Build URL
        url = cfg.host + path
        query_string = "&".join(f"{k}={v}" for k, v in query_params)
        full_url = f"{url}?{query_string}"

        # Make streaming request
        pool_manager = api_client.rest_client.pool_manager
        headers = {}
        if cfg.api_key and cfg.api_key.get("authorization"):
            headers["Authorization"] = cfg.api_key["authorization"]
        elif cfg.api_key and cfg.api_key.get("BearerToken"):
            headers["Authorization"] = f"Bearer {cfg.api_key['BearerToken']}"

        resp = pool_manager.request(
            "GET",
            full_url,
            headers=headers,
            preload_content=False,
        )

        import json

        buffer = ""
        for chunk in resp.stream(1024):
            buffer += chunk.decode("utf-8")
            while "\n" in buffer:
                line, buffer = buffer.split("\n", 1)
                line = line.strip()
                if not line:
                    continue
                try:
                    event = json.loads(line)
                    yield {
                        "type": event.get("type", "UNKNOWN"),
                        "object": _slim_resource(event.get("object", {})),
                    }
                except json.JSONDecodeError:
                    continue

    # Run in thread and yield via queue
    queue: asyncio.Queue[dict[str, Any] | None] = asyncio.Queue()

    def _producer():
        try:
            for event in _blocking_watch():
                loop.call_soon_threadsafe(queue.put_nowait, event)
        except Exception as e:
            loop.call_soon_threadsafe(queue.put_nowait, {"type": "ERROR", "error": str(e)})
        finally:
            loop.call_soon_threadsafe(queue.put_nowait, None)

    loop.run_in_executor(None, _producer)

    while True:
        event = await queue.get()
        if event is None:
            break
        yield event


def _slim_resource(resource: dict) -> dict:
    """Return a slimmed-down version of a K8s resource for the frontend."""
    metadata = resource.get("metadata", {})
    return {
        "apiVersion": resource.get("apiVersion", ""),
        "kind": resource.get("kind", ""),
        "metadata": {
            "name": metadata.get("name", ""),
            "namespace": metadata.get("namespace", ""),
            "uid": metadata.get("uid", ""),
            "resourceVersion": metadata.get("resourceVersion", ""),
            "creationTimestamp": metadata.get("creationTimestamp", ""),
            "labels": metadata.get("labels", {}),
            "annotations": {
                k: v
                for k, v in (metadata.get("annotations") or {}).items()
                if not k.startswith("kubectl.kubernetes.io/")
            },
        },
        "spec": resource.get("spec", {}),
        "status": resource.get("status", {}),
    }
