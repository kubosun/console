"""Health check endpoints."""

from datetime import UTC, datetime

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check() -> dict:
    return {
        "status": "ok",
        "service": "kubosun-backend",
        "timestamp": datetime.now(UTC).isoformat(),
    }


@router.get("/health/cluster")
async def cluster_health() -> dict:
    """Check Kubernetes cluster connectivity."""
    try:
        from app.services.k8s_client import get_version

        version_api = get_version()
        version_info = version_api.get_code()
        return {
            "status": "ok",
            "cluster": {
                "kubernetes_version": version_info.git_version,
                "platform": version_info.platform,
            },
            "timestamp": datetime.now(UTC).isoformat(),
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now(UTC).isoformat(),
        }
