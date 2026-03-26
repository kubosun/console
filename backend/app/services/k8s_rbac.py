"""Kubernetes RBAC — permission checking via SelfSubjectAccessReview."""

from kubernetes.client import (
    ApiClient,
    AuthorizationV1Api,
    V1ResourceAttributes,
    V1SelfSubjectAccessReview,
)

from app.services.k8s_client import get_api_client


async def check_permission(
    verb: str,
    resource: str,
    group: str = "",
    namespace: str | None = None,
    user_token: str | None = None,
) -> dict[str, object]:
    """Check if the current user can perform an action on a resource."""
    api_client = get_api_client()

    # If user_token provided, create a client with that token
    if user_token:
        from kubernetes.client import Configuration

        cfg = Configuration()
        cfg.host = api_client.configuration.host
        cfg.api_key = {"authorization": f"Bearer {user_token}"}
        cfg.verify_ssl = api_client.configuration.verify_ssl
        cfg.ssl_ca_cert = api_client.configuration.ssl_ca_cert
        client = ApiClient(configuration=cfg)
    else:
        client = api_client

    auth_api = AuthorizationV1Api(client)
    attrs = V1ResourceAttributes(
        verb=verb,
        resource=resource,
        group=group if group else None,
        namespace=namespace,
    )
    review = V1SelfSubjectAccessReview(
        spec={"resourceAttributes": attrs},
    )
    result = auth_api.create_self_subject_access_review(review)
    return {
        "allowed": result.status.allowed,
        "reason": result.status.reason or "",
    }
