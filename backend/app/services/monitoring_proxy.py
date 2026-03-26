"""Monitoring proxy — forwards requests to Prometheus and AlertManager."""

import os

import httpx

from app.config import settings
from app.services.k8s_client import get_k8s_config

# OpenShift injects the service CA bundle here
SERVICE_CA_PATH = "/var/run/secrets/kubernetes.io/serviceaccount/service-ca.crt"
KUBE_CA_PATH = "/var/run/secrets/kubernetes.io/serviceaccount/ca.crt"


def _get_ssl_verify() -> str | bool:
    """Get the CA cert for monitoring services.

    OpenShift monitoring services use certs signed by the service-serving CA,
    which differs from the Kubernetes API CA. Try the service CA first, then
    the in-cluster CA, then the kubeconfig CA, and finally fall back to no
    verification.
    """
    if os.path.exists(SERVICE_CA_PATH):
        return SERVICE_CA_PATH
    if os.path.exists(KUBE_CA_PATH):
        return KUBE_CA_PATH
    cfg = get_k8s_config()
    if cfg.verify_ssl is False:
        return False
    return cfg.ssl_ca_cert or False


def _get_monitoring_client(
    target: str,
    user_token: str | None = None,
) -> tuple[str, dict[str, str], str | bool]:
    """Get the monitoring service URL, auth headers, and CA cert path."""
    if target == "prometheus":
        base_url = settings.prometheus_url
    elif target == "alertmanager":
        base_url = settings.alertmanager_url
    else:
        raise ValueError(f"Unknown monitoring target: {target}")

    headers: dict[str, str] = {}
    if user_token:
        headers["Authorization"] = f"Bearer {user_token}"

    ssl_verify = _get_ssl_verify()
    return base_url, headers, ssl_verify


async def proxy_monitoring_request(
    target: str,
    method: str,
    path: str,
    query_params: str = "",
    user_token: str | None = None,
) -> httpx.Response:
    """Proxy an HTTP request to a monitoring service (Prometheus or AlertManager)."""
    base_url, auth_headers, ssl_verify = _get_monitoring_client(target, user_token)
    url = f"{base_url}/{path}"
    if query_params:
        url = f"{url}?{query_params}"

    async with httpx.AsyncClient(verify=ssl_verify, timeout=30.0) as client:
        response = await client.request(
            method=method,
            url=url,
            headers=auth_headers,
        )
        return response
