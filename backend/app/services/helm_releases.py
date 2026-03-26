"""Helm release service — decodes Helm 3 releases from K8s Secrets."""

import base64
import gzip
import json
from typing import Any

from kubernetes import client as k8s_client
from kubernetes.client import ApiClient

from app.services.k8s_client import get_api_client


def _get_user_client(user_token: str | None = None) -> ApiClient:
    """Get an API client, optionally using a user's OAuth token."""
    if not user_token:
        return get_api_client()
    from kubernetes.client import Configuration

    base_client = get_api_client()
    cfg = Configuration()
    cfg.host = base_client.configuration.host
    cfg.api_key = {"authorization": f"Bearer {user_token}"}
    cfg.verify_ssl = base_client.configuration.verify_ssl
    cfg.ssl_ca_cert = base_client.configuration.ssl_ca_cert
    return ApiClient(configuration=cfg)


def _decode_release(secret_data: str) -> dict[str, Any]:
    """Decode a Helm release from its Secret data field.

    Helm stores releases as: base64(gzip(json))
    The Secret's .data.release is already base64-encoded by K8s, so the
    actual encoding is: k8s_base64(helm_base64(gzip(json))).
    """
    # Step 1: The K8s Secret .data values are base64-encoded — decode that
    raw = base64.b64decode(secret_data)
    # Step 2: Helm encodes the gzipped data as base64 again
    raw = base64.b64decode(raw)
    # Step 3: Decompress gzip
    raw = gzip.decompress(raw)
    # Step 4: Parse JSON
    return json.loads(raw)


def _release_summary(release: dict[str, Any], namespace: str) -> dict[str, Any]:
    """Extract a clean summary dict from a decoded Helm release."""
    info = release.get("info", {})
    chart_meta = release.get("chart", {}).get("metadata", {})
    return {
        "name": release.get("name", ""),
        "namespace": namespace,
        "chart": chart_meta.get("name", ""),
        "chartVersion": chart_meta.get("version", ""),
        "appVersion": chart_meta.get("appVersion", ""),
        "status": info.get("status", "unknown"),
        "revision": release.get("version", 0),
        "deployedAt": info.get("last_deployed", ""),
        "description": info.get("description", ""),
    }


async def list_releases(
    namespace: str | None = None,
    user_token: str | None = None,
) -> list[dict[str, Any]]:
    """List Helm releases by reading helm.sh/release.v1 Secrets."""
    api = k8s_client.CoreV1Api(_get_user_client(user_token))
    label_selector = "owner=helm"

    if namespace:
        secrets = api.list_namespaced_secret(namespace, label_selector=label_selector)
    else:
        secrets = api.list_secret_for_all_namespaces(label_selector=label_selector)

    # Group by release name, keep only the highest version per release
    latest: dict[str, dict[str, Any]] = {}
    for secret in secrets.items:
        try:
            release = _decode_release(secret.data.get("release", ""))
        except Exception:
            continue
        ns = secret.metadata.namespace or ""
        key = f"{ns}/{release.get('name', '')}"
        version = release.get("version", 0)
        if key not in latest or version > latest[key].get("revision", 0):
            latest[key] = _release_summary(release, ns)

    return list(latest.values())


async def get_release(
    name: str,
    namespace: str,
    user_token: str | None = None,
) -> dict[str, Any]:
    """Get the latest deployed Helm release by name."""
    api = k8s_client.CoreV1Api(_get_user_client(user_token))
    label_selector = f"owner=helm,name={name}"
    secrets = api.list_namespaced_secret(namespace, label_selector=label_selector)

    best: dict[str, Any] | None = None
    best_version = -1
    for secret in secrets.items:
        try:
            release = _decode_release(secret.data.get("release", ""))
        except Exception:
            continue
        version = release.get("version", 0)
        if version > best_version:
            best = release
            best_version = version

    if not best:
        raise ValueError(f"Helm release '{name}' not found in namespace '{namespace}'")

    summary = _release_summary(best, namespace)
    summary["values"] = best.get("config", {})
    return summary


async def get_release_history(
    name: str,
    namespace: str,
    user_token: str | None = None,
) -> list[dict[str, Any]]:
    """Get revision history for a Helm release."""
    api = k8s_client.CoreV1Api(_get_user_client(user_token))
    label_selector = f"owner=helm,name={name}"
    secrets = api.list_namespaced_secret(namespace, label_selector=label_selector)

    revisions: list[dict[str, Any]] = []
    for secret in secrets.items:
        try:
            release = _decode_release(secret.data.get("release", ""))
        except Exception:
            continue
        revisions.append(_release_summary(release, namespace))

    revisions.sort(key=lambda r: r["revision"], reverse=True)
    return revisions


async def delete_release(
    name: str,
    namespace: str,
    user_token: str | None = None,
) -> dict[str, str]:
    """Delete a Helm release by removing all its Secrets."""
    api = k8s_client.CoreV1Api(_get_user_client(user_token))
    label_selector = f"owner=helm,name={name}"
    secrets = api.list_namespaced_secret(namespace, label_selector=label_selector)

    deleted = 0
    for secret in secrets.items:
        api.delete_namespaced_secret(secret.metadata.name, namespace)
        deleted += 1

    return {
        "action": "deleted",
        "name": name,
        "namespace": namespace,
        "secrets_removed": str(deleted),
    }


def _sanitize_repo_name(url: str) -> str:
    """Derive a short repo name from a URL."""
    import re
    import urllib.parse

    parsed = urllib.parse.urlparse(url)
    host = parsed.hostname or "repo"
    path = parsed.path.strip("/").replace("/", "-") or host
    name = re.sub(r"[^a-z0-9-]", "-", path.lower()).strip("-")
    return name[:63] or "helm-repo"


async def ensure_helm_repository(
    repo_url: str,
    namespace: str,
    user_token: str | None = None,
) -> str:
    """Create a Flux HelmRepository if one doesn't exist for this URL.

    Returns the HelmRepository name.
    """
    client = _get_user_client(user_token)
    repo_name = _sanitize_repo_name(repo_url)

    # Check if it already exists
    try:
        client.call_api(
            f"/apis/source.toolkit.fluxcd.io/v1"
            f"/namespaces/{namespace}/helmrepositories/{repo_name}",
            "GET",
            response_type="object",
            auth_settings=["BearerToken"],
        )
        return repo_name
    except Exception:
        pass

    # Create it — detect OCI repos by URL scheme
    is_oci = repo_url.startswith("oci://")
    spec: dict[str, Any] = {"interval": "15m", "url": repo_url}
    if is_oci:
        spec["type"] = "oci"
    manifest = {
        "apiVersion": "source.toolkit.fluxcd.io/v1",
        "kind": "HelmRepository",
        "metadata": {"name": repo_name, "namespace": namespace},
        "spec": spec,
    }
    client.call_api(
        f"/apis/source.toolkit.fluxcd.io/v1"
        f"/namespaces/{namespace}/helmrepositories",
        "POST",
        body=manifest,
        response_type="object",
        auth_settings=["BearerToken"],
        header_params={"Content-Type": "application/json"},
    )
    return repo_name


async def create_release(
    name: str,
    namespace: str,
    repo_url: str,
    chart: str,
    version: str | None = None,
    values: dict[str, Any] | None = None,
    user_token: str | None = None,
) -> dict[str, Any]:
    """Create a Helm release via a Flux HelmRelease CR."""
    client = _get_user_client(user_token)

    # Ensure the HelmRepository exists
    repo_name = await ensure_helm_repository(
        repo_url, namespace, user_token
    )

    # Build the HelmRelease manifest
    chart_spec: dict[str, Any] = {
        "chart": chart,
        "sourceRef": {
            "kind": "HelmRepository",
            "name": repo_name,
        },
    }
    if version:
        chart_spec["version"] = version

    manifest: dict[str, Any] = {
        "apiVersion": "helm.toolkit.fluxcd.io/v2",
        "kind": "HelmRelease",
        "metadata": {"name": name, "namespace": namespace},
        "spec": {
            "interval": "15m",
            "chart": {"spec": chart_spec},
        },
    }
    if values:
        manifest["spec"]["values"] = values

    client.call_api(
        f"/apis/helm.toolkit.fluxcd.io/v2"
        f"/namespaces/{namespace}/helmreleases",
        "POST",
        body=manifest,
        response_type="object",
        auth_settings=["BearerToken"],
        header_params={"Content-Type": "application/json"},
    )

    return {
        "name": name,
        "namespace": namespace,
        "chart": chart,
        "chartVersion": version or "latest",
        "repoUrl": repo_url,
        "status": "installing",
    }
