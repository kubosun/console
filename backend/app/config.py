from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False

    # Kubernetes
    k8s_api_server: str = "https://kubernetes.default.svc"
    k8s_in_cluster: bool = False
    kubeconfig_path: str | None = None

    # AI
    anthropic_api_key: str = ""
    ai_model: str = "claude-sonnet-4-20250514"

    # Monitoring
    prometheus_url: str = "https://thanos-querier.openshift-monitoring.svc:9091"
    alertmanager_url: str = "https://alertmanager-main.openshift-monitoring.svc:9093"
    monitoring_enabled: bool = True

    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]

    # OAuth2/OIDC (optional — falls back to kubeconfig if not set)
    oauth_enabled: bool = False
    oauth_provider: str = "openshift"  # "openshift" or "oidc"
    oauth_client_id: str = ""
    oauth_client_secret: str = ""
    oauth_issuer_url: str = ""
    oauth_redirect_uri: str = "http://localhost:3000/auth/callback"
    oauth_scopes: str = "user:full"
    session_secret: str = "change-me-in-production"
    session_max_age: int = 86400  # 24 hours

    model_config = {"env_prefix": "KUBOSUN_", "env_file": ".env.local"}


settings = Settings()
