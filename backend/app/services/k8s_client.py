"""Kubernetes client service — handles auth and provides API access."""

from functools import lru_cache

from kubernetes import client, config
from kubernetes.client import ApiClient, Configuration

from app.config import settings


def _load_k8s_config() -> Configuration:
    """Load Kubernetes configuration from kubeconfig or in-cluster."""
    if settings.k8s_in_cluster:
        config.load_incluster_config()
    else:
        config.load_kube_config(
            config_file=settings.kubeconfig_path,
        )
    return Configuration.get_default_copy()


@lru_cache
def get_k8s_config() -> Configuration:
    return _load_k8s_config()


def get_api_client() -> ApiClient:
    """Get a configured Kubernetes API client."""
    return ApiClient(configuration=get_k8s_config())


def get_core_v1() -> client.CoreV1Api:
    return client.CoreV1Api(get_api_client())


def get_apps_v1() -> client.AppsV1Api:
    return client.AppsV1Api(get_api_client())


def get_custom_objects() -> client.CustomObjectsApi:
    return client.CustomObjectsApi(get_api_client())


def get_discovery() -> client.ApisApi:
    return client.ApisApi(get_api_client())


def get_version() -> client.VersionApi:
    return client.VersionApi(get_api_client())


def get_auth() -> client.AuthorizationV1Api:
    return client.AuthorizationV1Api(get_api_client())
