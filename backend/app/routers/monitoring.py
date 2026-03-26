"""Monitoring endpoints — Prometheus and AlertManager proxy."""

from fastapi import APIRouter, HTTPException, Request
from starlette.responses import Response

from app.config import settings
from app.services.monitoring_proxy import proxy_monitoring_request

router = APIRouter(prefix="/api/monitoring", tags=["monitoring"])

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


@router.api_route("/prometheus/{path:path}", methods=["GET", "POST"])
async def prometheus_proxy(path: str, request: Request) -> Response:
    """Proxy requests to Prometheus/Thanos Querier."""
    if not settings.monitoring_enabled:
        raise HTTPException(status_code=503, detail="Monitoring is not enabled")

    user_token = getattr(request.state, "user_token", None)
    query_params = str(request.url.query)

    try:
        resp = await proxy_monitoring_request(
            target="prometheus",
            method=request.method,
            path=path,
            query_params=query_params,
            user_token=user_token,
        )
    except Exception as e:
        raise HTTPException(
            status_code=502, detail=f"Prometheus unreachable: {e}"
        ) from e

    headers = {
        k: v
        for k, v in resp.headers.items()
        if k.lower() not in HOP_BY_HOP_HEADERS
    }
    return Response(content=resp.content, status_code=resp.status_code, headers=headers)


@router.get("/alerts")
async def list_alerts(request: Request) -> dict:
    """Get active alerts from AlertManager."""
    if not settings.monitoring_enabled:
        raise HTTPException(status_code=503, detail="Monitoring is not enabled")

    user_token = getattr(request.state, "user_token", None)

    try:
        resp = await proxy_monitoring_request(
            target="alertmanager",
            method="GET",
            path="api/v2/alerts",
            query_params="filter=",
            user_token=user_token,
        )
    except Exception:
        return {"alerts": [], "error": "AlertManager unreachable"}

    if resp.status_code != 200:
        return {"alerts": [], "error": f"AlertManager returned {resp.status_code}"}

    import json

    raw_alerts = json.loads(resp.content)
    alerts = []
    for alert in raw_alerts:
        labels = alert.get("labels", {})
        annotations = alert.get("annotations", {})
        status = alert.get("status", {})
        alerts.append(
            {
                "name": labels.get("alertname", "Unknown"),
                "severity": labels.get("severity", "none"),
                "state": status.get("state", "active"),
                "summary": annotations.get("summary", ""),
                "description": annotations.get("description", ""),
                "startsAt": alert.get("startsAt", ""),
                "labels": labels,
                "namespace": labels.get("namespace", ""),
            }
        )

    return {"alerts": alerts, "count": len(alerts)}


@router.get("/alerts/count")
async def alert_counts(request: Request) -> dict:
    """Get alert counts grouped by severity."""
    result = await list_alerts(request)
    alerts = result.get("alerts", [])
    counts: dict[str, int] = {"critical": 0, "warning": 0, "info": 0, "none": 0}
    for alert in alerts:
        severity = alert.get("severity", "none")
        if severity in counts:
            counts[severity] += 1
        else:
            counts["none"] += 1
    return {"counts": counts, "total": len(alerts)}
