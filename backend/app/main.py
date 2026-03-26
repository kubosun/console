from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import ai, cluster, health, k8s, resources, watch

app = FastAPI(
    title="Kubosun Backend",
    description="AI-native Kubernetes console backend",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(k8s.router)
app.include_router(resources.router)
app.include_router(watch.router)
app.include_router(ai.router)
app.include_router(cluster.router)
