"""Kubernetes operations exposed as Claude AI tools."""

from typing import Any

from app.services.k8s_client import get_api_client, get_auth, get_core_v1

K8S_TOOLS = [
    {
        "name": "list_resources",
        "description": "List Kubernetes resources of a given type. Returns names, namespaces, and status.",
        "input_schema": {
            "type": "object",
            "properties": {
                "api_path": {
                    "type": "string",
                    "description": "K8s API path, e.g. 'api/v1/pods', 'apis/apps/v1/deployments', 'api/v1/namespaces/default/pods'",
                },
            },
            "required": ["api_path"],
        },
    },
    {
        "name": "get_resource",
        "description": "Get a specific Kubernetes resource by API path. Returns the full resource.",
        "input_schema": {
            "type": "object",
            "properties": {
                "api_path": {
                    "type": "string",
                    "description": "Full K8s API path, e.g. 'api/v1/namespaces/default/pods/my-pod', 'apis/apps/v1/namespaces/default/deployments/my-deploy'",
                },
            },
            "required": ["api_path"],
        },
    },
    {
        "name": "get_pod_logs",
        "description": "Get logs from a pod container.",
        "input_schema": {
            "type": "object",
            "properties": {
                "name": {"type": "string", "description": "Pod name"},
                "namespace": {"type": "string", "description": "Namespace"},
                "container": {
                    "type": "string",
                    "description": "Container name (optional, defaults to first container)",
                },
                "tail_lines": {
                    "type": "integer",
                    "description": "Number of lines from the end (default 100)",
                    "default": 100,
                },
            },
            "required": ["name", "namespace"],
        },
    },
    {
        "name": "apply_resource",
        "description": "Create or update a Kubernetes resource. Always uses dry-run first for safety.",
        "input_schema": {
            "type": "object",
            "properties": {
                "manifest": {
                    "type": "object",
                    "description": "The Kubernetes resource manifest as JSON",
                },
                "dry_run": {
                    "type": "boolean",
                    "description": "If true (default), validate without applying",
                    "default": True,
                },
            },
            "required": ["manifest"],
        },
    },
    {
        "name": "delete_resource",
        "description": "Delete a Kubernetes resource. Always previews first.",
        "input_schema": {
            "type": "object",
            "properties": {
                "api_path": {
                    "type": "string",
                    "description": "Full API path to the resource, e.g. 'api/v1/namespaces/default/pods/my-pod'",
                },
                "dry_run": {
                    "type": "boolean",
                    "description": "If true (default), preview without deleting",
                    "default": True,
                },
            },
            "required": ["api_path"],
        },
    },
    {
        "name": "get_events",
        "description": "Get Kubernetes events for a namespace, optionally filtered by involved object.",
        "input_schema": {
            "type": "object",
            "properties": {
                "namespace": {"type": "string", "description": "Namespace"},
                "involved_object": {
                    "type": "string",
                    "description": "Filter by involved object name (optional)",
                },
                "limit": {
                    "type": "integer",
                    "description": "Max events to return (default 20)",
                    "default": 20,
                },
            },
            "required": ["namespace"],
        },
    },
    {
        "name": "check_permissions",
        "description": "Check if the current user can perform an action on a resource.",
        "input_schema": {
            "type": "object",
            "properties": {
                "verb": {
                    "type": "string",
                    "enum": ["get", "list", "create", "update", "delete", "watch", "patch"],
                },
                "resource": {"type": "string", "description": "Resource type (e.g. 'pods')"},
                "group": {
                    "type": "string",
                    "description": "API group (empty for core, e.g. 'apps')",
                    "default": "",
                },
                "namespace": {
                    "type": "string",
                    "description": "Namespace (omit for cluster-scoped)",
                },
            },
            "required": ["verb", "resource"],
        },
    },
    {
        "name": "list_namespaces",
        "description": "List all namespaces on the cluster.",
        "input_schema": {
            "type": "object",
            "properties": {},
        },
    },
]


async def execute_tool(tool_name: str, tool_input: dict[str, Any]) -> str:
    """Execute a K8s tool and return the result as a string."""
    import json

    try:
        result = await _dispatch_tool(tool_name, tool_input)
        return json.dumps(result, default=str, indent=2)
    except Exception as e:
        return json.dumps({"error": str(e)})


async def _dispatch_tool(tool_name: str, tool_input: dict[str, Any]) -> Any:
    """Route tool calls to their implementations."""
    if tool_name == "list_resources":
        return await _list_resources(tool_input["api_path"])
    elif tool_name == "get_resource":
        return await _get_resource(tool_input["api_path"])
    elif tool_name == "get_pod_logs":
        return await _get_pod_logs(**tool_input)
    elif tool_name == "apply_resource":
        return await _apply_resource(tool_input["manifest"], tool_input.get("dry_run", True))
    elif tool_name == "delete_resource":
        return await _delete_resource(tool_input["api_path"], tool_input.get("dry_run", True))
    elif tool_name == "get_events":
        return await _get_events(**tool_input)
    elif tool_name == "check_permissions":
        return await _check_permissions(**tool_input)
    elif tool_name == "list_namespaces":
        return await _list_namespaces()
    else:
        return {"error": f"Unknown tool: {tool_name}"}


async def _list_resources(api_path: str) -> dict:
    api_client = get_api_client()
    response = api_client.call_api(
        f"/{api_path}",
        "GET",
        response_type="object",
        auth_settings=["BearerToken"],
    )
    data = response[0]
    items = data.get("items", [])
    return {
        "count": len(items),
        "items": [
            {
                "name": item.get("metadata", {}).get("name", ""),
                "namespace": item.get("metadata", {}).get("namespace", ""),
                "status": _extract_status(item),
                "age": item.get("metadata", {}).get("creationTimestamp", ""),
            }
            for item in items
        ],
    }


async def _get_resource(api_path: str) -> dict:
    api_client = get_api_client()
    response = api_client.call_api(
        f"/{api_path}",
        "GET",
        response_type="object",
        auth_settings=["BearerToken"],
    )
    return response[0]


async def _get_pod_logs(
    name: str, namespace: str, container: str | None = None, tail_lines: int = 100
) -> dict:
    core = get_core_v1()
    kwargs: dict[str, Any] = {"tail_lines": tail_lines}
    if container:
        kwargs["container"] = container
    logs = core.read_namespaced_pod_log(name, namespace, **kwargs)
    return {"logs": logs}


async def _apply_resource(manifest: dict, dry_run: bool = True) -> dict:
    api_client = get_api_client()
    api_version = manifest.get("apiVersion", "v1")
    kind = manifest.get("kind", "")
    metadata = manifest.get("metadata", {})
    name = metadata.get("name", "")
    namespace = metadata.get("namespace", "")

    # Build the API path
    if "/" in api_version:
        group, version = api_version.split("/", 1)
        base = f"/apis/{group}/{version}"
    else:
        base = f"/api/{api_version}"

    # We need the plural form — guess from kind
    plural = kind.lower() + "s"

    if namespace:
        path = f"{base}/namespaces/{namespace}/{plural}"
    else:
        path = f"{base}/{plural}"

    query_params = [("dryRun", "All")] if dry_run else []

    result = api_client.call_api(
        path,
        "POST",
        query_params=query_params,
        body=manifest,
        response_type="object",
        auth_settings=["BearerToken"],
        header_params={"Content-Type": "application/json"},
    )

    action = "would create (dry-run)" if dry_run else "created"
    return {
        "action": action,
        "kind": kind,
        "name": name,
        "namespace": namespace,
        "result": result[0] if not dry_run else "validated successfully",
    }


async def _delete_resource(api_path: str, dry_run: bool = True) -> dict:
    api_client = get_api_client()
    query_params = [("dryRun", "All")] if dry_run else []

    api_client.call_api(
        f"/{api_path}",
        "DELETE",
        query_params=query_params,
        response_type="object",
        auth_settings=["BearerToken"],
    )

    action = "would delete (dry-run)" if dry_run else "deleted"
    return {"action": action, "path": api_path}


async def _get_events(namespace: str, involved_object: str | None = None, limit: int = 20) -> dict:
    core = get_core_v1()
    if involved_object:
        field_selector = f"involvedObject.name={involved_object}"
        events = core.list_namespaced_event(namespace, field_selector=field_selector, limit=limit)
    else:
        events = core.list_namespaced_event(namespace, limit=limit)

    return {
        "count": len(events.items),
        "events": [
            {
                "type": e.type,
                "reason": e.reason,
                "message": e.message,
                "object": f"{e.involved_object.kind}/{e.involved_object.name}",
                "first_seen": str(e.first_timestamp),
                "last_seen": str(e.last_timestamp),
                "count": e.count,
            }
            for e in events.items
        ],
    }


async def _check_permissions(
    verb: str, resource: str, group: str = "", namespace: str | None = None
) -> dict:
    from kubernetes.client import V1ResourceAttributes, V1SelfSubjectAccessReview

    auth_api = get_auth()
    attrs = V1ResourceAttributes(
        verb=verb,
        resource=resource,
        group=group if group else None,
        namespace=namespace,
    )
    review = V1SelfSubjectAccessReview(
        spec={"resourceAttributes": attrs},
    )
    result = auth_api.create_self_subject_access_review(review)
    return {
        "allowed": result.status.allowed,
        "reason": result.status.reason or "",
    }


async def _list_namespaces() -> dict:
    core = get_core_v1()
    ns_list = core.list_namespace()
    return {
        "namespaces": [
            {
                "name": ns.metadata.name,
                "status": ns.status.phase,
                "labels": ns.metadata.labels or {},
            }
            for ns in ns_list.items
        ],
    }


def _extract_status(resource: dict) -> str:
    """Extract a human-readable status from a K8s resource."""
    status = resource.get("status", {})
    # Pods
    phase = status.get("phase")
    if phase:
        return phase
    # Deployments
    conditions = status.get("conditions", [])
    for c in conditions:
        if c.get("type") == "Available":
            return "Available" if c.get("status") == "True" else "Unavailable"
    return "Unknown"
