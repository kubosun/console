from datetime import UTC, datetime

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check() -> dict:
    return {
        "status": "ok",
        "service": "kubosun-backend",
        "timestamp": datetime.now(UTC).isoformat(),
    }
