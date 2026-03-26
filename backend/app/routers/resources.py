"""API discovery and resource model registry."""

from fastapi import APIRouter

from app.services.k8s_discovery import get_resource_models

router = APIRouter(prefix="/api/resources", tags=["resources"])


@router.get("")
async def list_resource_models() -> dict:
    """Return all discovered API resource models from the cluster."""
    models = get_resource_models()
    return {
        "count": len(models),
        "models": models,
    }


@router.get("/{group}/{version}/{kind}")
async def get_resource_model(group: str, version: str, kind: str) -> dict:
    """Return a specific resource model by group/version/kind."""
    models = get_resource_models()
    # Core API group is represented as empty string
    lookup_group = "" if group == "core" else group
    key = f"{lookup_group}/{version}/{kind}"
    model = models.get(key)
    if model is None:
        return {"error": f"Resource model not found: {key}"}
    return model
