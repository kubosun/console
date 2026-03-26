"""Kubernetes API proxy — forwards requests to the K8s API server."""

import httpx

from app.services.k8s_client import get_k8s_config

# Headers that should not be forwarded
HOP_BY_HOP_HEADERS = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
}


def _get_proxy_client(
    user_token: str | None = None,
) -> tuple[str, dict[str, str], str | bool]:
    """Get the K8s API server URL, auth headers, and CA cert path."""
    cfg = get_k8s_config()
    base_url = cfg.host
    headers: dict[str, str] = {}

    if user_token:
        # Per-user OAuth token (production mode)
        headers["Authorization"] = f"Bearer {user_token}"
    elif cfg.api_key and cfg.api_key.get("authorization"):
        headers["Authorization"] = cfg.api_key["authorization"]
    elif cfg.api_key and cfg.api_key.get("BearerToken"):
        headers["Authorization"] = f"Bearer {cfg.api_key['BearerToken']}"

    ssl_ca_cert = cfg.ssl_ca_cert or False
    if cfg.verify_ssl is False:
        ssl_ca_cert = False

    return base_url, headers, ssl_ca_cert


async def proxy_request(
    method: str,
    path: str,
    query_params: str = "",
    body: bytes | None = None,
    content_type: str | None = None,
    user_token: str | None = None,
) -> httpx.Response:
    """Proxy an HTTP request to the Kubernetes API server."""
    base_url, auth_headers, ssl_ca_cert = _get_proxy_client(user_token)
    url = f"{base_url}/{path}"
    if query_params:
        url = f"{url}?{query_params}"

    headers = {**auth_headers}
    if content_type:
        headers["Content-Type"] = content_type

    async with httpx.AsyncClient(verify=ssl_ca_cert, timeout=60.0) as client:
        response = await client.request(
            method=method,
            url=url,
            headers=headers,
            content=body,
        )
        return response
