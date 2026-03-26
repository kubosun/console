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

    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]

    model_config = {"env_prefix": "KUBOSUN_", "env_file": ".env.local"}


settings = Settings()
