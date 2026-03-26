"""Tests for the Helm release service and endpoints."""

import base64
import gzip
import json
from unittest.mock import MagicMock, patch

from app.services.helm_releases import _decode_release, _release_summary


def _make_helm_secret(release_data: dict, name: str = "my-release", version: int = 1) -> MagicMock:
    """Create a mock K8s Secret that mimics a Helm release Secret."""
    raw_json = json.dumps(release_data).encode()
    compressed = gzip.compress(raw_json)
    helm_b64 = base64.b64encode(compressed)
    k8s_b64 = base64.b64encode(helm_b64).decode()

    secret = MagicMock()
    secret.metadata.name = f"sh.helm.release.v1.{name}.v{version}"
    secret.metadata.namespace = "default"
    secret.data = {"release": k8s_b64}
    return secret


SAMPLE_RELEASE = {
    "name": "my-release",
    "info": {
        "status": "deployed",
        "description": "Install complete",
        "first_deployed": "2026-01-01T00:00:00Z",
        "last_deployed": "2026-01-01T00:00:00Z",
    },
    "chart": {
        "metadata": {
            "name": "nginx",
            "version": "1.2.3",
            "appVersion": "1.25",
            "description": "A Helm chart for nginx",
        },
        "values": {"replicaCount": 1},
    },
    "config": {"replicaCount": 3},
    "version": 1,
    "namespace": "default",
}


class TestDecodeRelease:
    def test_decode_round_trip(self):
        """Encoding then decoding should return the original data."""
        raw_json = json.dumps(SAMPLE_RELEASE).encode()
        compressed = gzip.compress(raw_json)
        helm_b64 = base64.b64encode(compressed)
        k8s_b64 = base64.b64encode(helm_b64).decode()

        result = _decode_release(k8s_b64)
        assert result["name"] == "my-release"
        assert result["info"]["status"] == "deployed"
        assert result["chart"]["metadata"]["name"] == "nginx"
        assert result["config"]["replicaCount"] == 3

    def test_release_summary(self):
        """Summary should extract the expected fields."""
        summary = _release_summary(SAMPLE_RELEASE, "default")
        assert summary["name"] == "my-release"
        assert summary["namespace"] == "default"
        assert summary["chart"] == "nginx"
        assert summary["chartVersion"] == "1.2.3"
        assert summary["appVersion"] == "1.25"
        assert summary["status"] == "deployed"
        assert summary["revision"] == 1
        assert summary["deployedAt"] == "2026-01-01T00:00:00Z"
        assert summary["description"] == "Install complete"


class TestHelmEndpoints:
    @patch("app.config.settings.oauth_enabled", False)
    @patch("app.routers.helm.list_releases")
    def test_list_releases(self, mock_list):
        from fastapi.testclient import TestClient

        from app.main import app

        mock_list.return_value = [
            {"name": "my-release", "namespace": "default", "status": "deployed"}
        ]
        client = TestClient(app)
        response = client.get("/api/helm/releases")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "my-release"

    @patch("app.config.settings.oauth_enabled", False)
    @patch("app.routers.helm.get_release")
    def test_get_release(self, mock_get):
        from fastapi.testclient import TestClient

        from app.main import app

        mock_get.return_value = {
            "name": "my-release",
            "namespace": "default",
            "chart": "nginx",
            "status": "deployed",
            "values": {"replicaCount": 3},
        }
        client = TestClient(app)
        response = client.get("/api/helm/releases/default/my-release")
        assert response.status_code == 200
        data = response.json()
        assert data["chart"] == "nginx"
        assert data["values"]["replicaCount"] == 3

    @patch("app.config.settings.oauth_enabled", False)
    @patch("app.routers.helm.get_release")
    def test_get_release_not_found(self, mock_get):
        from fastapi.testclient import TestClient

        from app.main import app

        mock_get.side_effect = ValueError("Helm release 'missing' not found in namespace 'default'")
        client = TestClient(app)
        response = client.get("/api/helm/releases/default/missing")
        assert response.status_code == 404

    @patch("app.config.settings.oauth_enabled", False)
    @patch("app.routers.helm.get_release_history")
    def test_release_history(self, mock_history):
        from fastapi.testclient import TestClient

        from app.main import app

        mock_history.return_value = [
            {"name": "my-release", "revision": 2, "status": "deployed"},
            {"name": "my-release", "revision": 1, "status": "superseded"},
        ]
        client = TestClient(app)
        response = client.get("/api/helm/releases/default/my-release/history")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["revision"] == 2
