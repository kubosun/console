"""Monitoring proxy — forwards requests to Prometheus and AlertManager."""

import httpx

from app.config import settings
from app.services.k8s_client import get_k8s_config


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

    cfg = get_k8s_config()
    ssl_ca_cert = cfg.ssl_ca_cert or False
    if cfg.verify_ssl is False:
        ssl_ca_cert = False

    return base_url, headers, ssl_ca_cert


async def proxy_monitoring_request(
    target: str,
    method: str,
    path: str,
    query_params: str = "",
    user_token: str | None = None,
) -> httpx.Response:
    """Proxy an HTTP request to a monitoring service (Prometheus or AlertManager)."""
    base_url, auth_headers, ssl_ca_cert = _get_monitoring_client(target, user_token)
    url = f"{base_url}/{path}"
    if query_params:
        url = f"{url}?{query_params}"

    async with httpx.AsyncClient(verify=ssl_ca_cert, timeout=30.0) as client:
        response = await client.request(
            method=method,
            url=url,
            headers=auth_headers,
        )
        return response
