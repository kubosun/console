"""Kubernetes operations exposed as Claude AI tools."""

from typing import Any

from kubernetes.client import ApiClient, Configuration

from app.services.k8s_client import get_api_client, get_core_v1


def _get_client(user_token: str | None = None) -> ApiClient:
    """Get an API client, optionally using a user's OAuth token."""
    if not user_token:
        return get_api_client()
    base_client = get_api_client()
    cfg = Configuration()
    cfg.host = base_client.configuration.host
    cfg.api_key = {"authorization": f"Bearer {user_token}"}
    cfg.verify_ssl = base_client.configuration.verify_ssl
    cfg.ssl_ca_cert = base_client.configuration.ssl_ca_cert
    return ApiClient(configuration=cfg)


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
    {
        "name": "list_helm_releases",
        "description": "List Helm releases with chart name, version, app version, and status.",
        "input_schema": {
            "type": "object",
            "properties": {
                "namespace": {
                    "type": "string",
                    "description": "Namespace to filter releases (optional, lists all if omitted)",
                },
            },
        },
    },
    {
        "name": "get_helm_release",
        "description": "Get detailed info about a Helm release including values, chart metadata, and status.",
        "input_schema": {
            "type": "object",
            "properties": {
                "name": {"type": "string", "description": "Release name"},
                "namespace": {"type": "string", "description": "Namespace of the release"},
            },
            "required": ["name", "namespace"],
        },
    },
    {
        "name": "helm_release_history",
        "description": "Get revision history for a Helm release showing all versions.",
        "input_schema": {
            "type": "object",
            "properties": {
                "name": {"type": "string", "description": "Release name"},
                "namespace": {"type": "string", "description": "Namespace of the release"},
            },
            "required": ["name", "namespace"],
        },
    },
    {
        "name": "uninstall_helm_release",
        "description": "Uninstall a Helm release by deleting its release Secrets. Use dry_run=true first to preview.",
        "input_schema": {
            "type": "object",
            "properties": {
                "name": {"type": "string", "description": "Release name"},
                "namespace": {"type": "string", "description": "Namespace of the release"},
                "dry_run": {
                    "type": "boolean",
                    "description": "If true (default), preview without deleting",
                    "default": True,
                },
            },
            "required": ["name", "namespace"],
        },
    },
    {
        "name": "install_helm_release",
        "description": "Install a Helm chart by creating Flux HelmRepository and HelmRelease CRs.",
        "input_schema": {
            "type": "object",
            "properties": {
                "name": {"type": "string", "description": "Release name"},
                "namespace": {"type": "string", "description": "Target namespace"},
                "repo_url": {
                    "type": "string",
                    "description": "Helm chart repository URL (e.g. https://charts.bitnami.com/bitnami)",
                },
                "chart": {"type": "string", "description": "Chart name (e.g. nginx)"},
                "version": {
                    "type": "string",
                    "description": "Chart version (optional, defaults to latest)",
                },
                "values": {
                    "type": "object",
                    "description": "User-supplied chart values (optional)",
                },
            },
            "required": ["name", "namespace", "repo_url", "chart"],
        },
    },
]


async def execute_tool(
    tool_name: str, tool_input: dict[str, Any], user_token: str | None = None
) -> str:
    """Execute a K8s tool and return the result as a string."""
    import json

    try:
        result = await _dispatch_tool(tool_name, tool_input, user_token)
        return json.dumps(result, default=str, indent=2)
    except Exception as e:
        return json.dumps({"error": str(e)})


async def _dispatch_tool(
    tool_name: str, tool_input: dict[str, Any], user_token: str | None = None
) -> Any:
    """Route tool calls to their implementations."""
    client = _get_client(user_token)
    if tool_name == "list_resources":
        return await _list_resources(tool_input["api_path"], client)
    elif tool_name == "get_resource":
        return await _get_resource(tool_input["api_path"], client)
    elif tool_name == "get_pod_logs":
        return await _get_pod_logs(client=client, **tool_input)
    elif tool_name == "apply_resource":
        return await _apply_resource(
            tool_input["manifest"], tool_input.get("dry_run", True), client
        )
    elif tool_name == "delete_resource":
        return await _delete_resource(
            tool_input["api_path"], tool_input.get("dry_run", True), client
        )
    elif tool_name == "get_events":
        return await _get_events(client=client, **tool_input)
    elif tool_name == "check_permissions":
        return await _check_permissions(user_token=user_token, **tool_input)
    elif tool_name == "list_namespaces":
        return await _list_namespaces(client)
    elif tool_name == "list_helm_releases":
        return await _list_helm_releases(tool_input.get("namespace"), user_token)
    elif tool_name == "get_helm_release":
        return await _get_helm_release(tool_input["name"], tool_input["namespace"], user_token)
    elif tool_name == "helm_release_history":
        return await _helm_release_history(tool_input["name"], tool_input["namespace"], user_token)
    elif tool_name == "uninstall_helm_release":
        return await _uninstall_helm_release(
            tool_input["name"], tool_input["namespace"], tool_input.get("dry_run", True), user_token
        )
    elif tool_name == "install_helm_release":
        return await _install_helm_release(
            tool_input["name"],
            tool_input["namespace"],
            tool_input["repo_url"],
            tool_input["chart"],
            tool_input.get("version"),
            tool_input.get("values"),
            user_token,
        )
    else:
        return {"error": f"Unknown tool: {tool_name}"}


async def _list_resources(api_path: str, api_client: ApiClient | None = None) -> dict:
    api_client = api_client or get_api_client()
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


async def _get_resource(api_path: str, api_client: ApiClient | None = None) -> dict:
    api_client = api_client or get_api_client()
    response = api_client.call_api(
        f"/{api_path}",
        "GET",
        response_type="object",
        auth_settings=["BearerToken"],
    )
    return response[0]


async def _get_pod_logs(
    name: str,
    namespace: str,
    container: str | None = None,
    tail_lines: int = 100,
    client: ApiClient | None = None,
) -> dict:
    from kubernetes import client as k8s_client

    core = k8s_client.CoreV1Api(client) if client else get_core_v1()
    kwargs: dict[str, Any] = {"tail_lines": tail_lines}
    if container:
        kwargs["container"] = container
    logs = core.read_namespaced_pod_log(name, namespace, **kwargs)
    return {"logs": logs}


async def _apply_resource(
    manifest: dict, dry_run: bool = True, api_client: ApiClient | None = None
) -> dict:
    api_client = api_client or get_api_client()
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


async def _delete_resource(
    api_path: str, dry_run: bool = True, api_client: ApiClient | None = None
) -> dict:
    api_client = api_client or get_api_client()
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


async def _get_events(
    namespace: str,
    involved_object: str | None = None,
    limit: int = 20,
    client: ApiClient | None = None,
) -> dict:
    from kubernetes import client as k8s_client

    core = k8s_client.CoreV1Api(client) if client else get_core_v1()
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
    verb: str,
    resource: str,
    group: str = "",
    namespace: str | None = None,
    user_token: str | None = None,
) -> dict:
    from app.services.k8s_rbac import check_permission

    return await check_permission(
        verb=verb, resource=resource, group=group, namespace=namespace, user_token=user_token
    )


async def _list_namespaces(api_client: ApiClient | None = None) -> dict:
    from kubernetes import client as k8s_client

    core = k8s_client.CoreV1Api(api_client) if api_client else get_core_v1()
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


# --- Helm tool implementations ---


async def _list_helm_releases(
    namespace: str | None = None, user_token: str | None = None
) -> dict:
    from app.services.helm_releases import list_releases

    releases = await list_releases(namespace=namespace, user_token=user_token)
    return {"count": len(releases), "releases": releases}


async def _get_helm_release(
    name: str, namespace: str, user_token: str | None = None
) -> dict:
    from app.services.helm_releases import get_release

    return await get_release(name, namespace, user_token=user_token)


async def _helm_release_history(
    name: str, namespace: str, user_token: str | None = None
) -> dict:
    from app.services.helm_releases import get_release_history

    revisions = await get_release_history(name, namespace, user_token=user_token)
    return {"count": len(revisions), "revisions": revisions}


async def _uninstall_helm_release(
    name: str, namespace: str, dry_run: bool = True, user_token: str | None = None
) -> dict:
    if dry_run:
        from app.services.helm_releases import get_release_history

        revisions = await get_release_history(name, namespace, user_token=user_token)
        return {
            "action": "would delete (dry-run)",
            "name": name,
            "namespace": namespace,
            "revisions": len(revisions),
        }

    from app.services.helm_releases import delete_release

    return await delete_release(name, namespace, user_token=user_token)


async def _install_helm_release(
    name: str,
    namespace: str,
    repo_url: str,
    chart: str,
    version: str | None = None,
    values: dict | None = None,
    user_token: str | None = None,
) -> dict:
    from app.services.helm_releases import create_release

    return await create_release(
        name=name,
        namespace=namespace,
        repo_url=repo_url,
        chart=chart,
        version=version,
        values=values,
        user_token=user_token,
    )
