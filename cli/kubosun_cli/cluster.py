"""OpenShift cluster operations — wrappers around oc CLI."""

import json
import subprocess
import sys
import time

from rich.console import Console

console = Console()


def run_oc(args: list[str], capture: bool = True, check: bool = True) -> str:
    """Run an oc command and return stdout."""
    cmd = ["oc", *args]
    try:
        result = subprocess.run(
            cmd,
            capture_output=capture,
            text=True,
            check=check,
        )
        return result.stdout.strip() if capture else ""
    except subprocess.CalledProcessError as e:
        if capture:
            console.print(f"[red]Error:[/red] {e.stderr.strip()}")
        raise
    except FileNotFoundError:
        console.print("[red]Error:[/red] 'oc' command not found. Install the OpenShift CLI first.")
        sys.exit(1)


def check_login() -> str:
    """Verify oc login and return current user."""
    try:
        user = run_oc(["whoami"])
        return user
    except subprocess.CalledProcessError:
        console.print("[yellow]Not logged in.[/yellow] Run: oc login <server> --username <user>")
        sys.exit(1)


def get_api_server() -> str:
    """Get the current API server URL."""
    return run_oc(["whoami", "--show-server"])


def get_apps_domain() -> str:
    """Get the cluster's apps domain for routes."""
    try:
        ingress = run_oc([
            "get", "ingresses.config.openshift.io", "cluster",
            "-o", "jsonpath={.spec.domain}",
        ])
        return ingress
    except subprocess.CalledProcessError:
        server = get_api_server()
        # Guess from API server: api.xxx → apps.xxx
        return server.replace("https://api.", "apps.").rstrip("/").split(":")[0]


def namespace_exists(namespace: str) -> bool:
    """Check if a namespace/project exists."""
    try:
        run_oc(["get", "project", namespace])
        return True
    except subprocess.CalledProcessError:
        return False


def apply_manifest(yaml_content: str) -> None:
    """Apply a YAML manifest via stdin."""
    subprocess.run(
        ["oc", "apply", "-f", "-"],
        input=yaml_content,
        text=True,
        check=True,
        capture_output=True,
    )


def wait_for_build(name: str, namespace: str, timeout: int = 600) -> bool:
    """Wait for an OpenShift build to complete. Returns True if successful."""
    start = time.time()
    while time.time() - start < timeout:
        try:
            phase = run_oc([
                "get", "build", name, "-n", namespace,
                "-o", "jsonpath={.status.phase}",
            ])
            if phase == "Complete":
                return True
            if phase == "Failed":
                return False
        except subprocess.CalledProcessError:
            pass
        time.sleep(5)
    return False


def get_latest_build(buildconfig: str, namespace: str) -> str:
    """Get the name of the most recent build for a BuildConfig."""
    return run_oc([
        "get", "builds", "-n", namespace,
        "-l", f"buildconfig={buildconfig}",
        "--sort-by=.metadata.creationTimestamp",
        "-o", "jsonpath={.items[-1].metadata.name}",
    ])


def get_route_host(name: str, namespace: str) -> str:
    """Get the hostname of a route."""
    return run_oc([
        "get", "route", name, "-n", namespace,
        "-o", "jsonpath={.spec.host}",
    ])


def resource_exists(kind: str, name: str, namespace: str | None = None) -> bool:
    """Check if a resource exists."""
    args = ["get", kind, name]
    if namespace:
        args.extend(["-n", namespace])
    try:
        run_oc(args)
        return True
    except subprocess.CalledProcessError:
        return False


def delete_resource(kind: str, name: str, namespace: str | None = None) -> bool:
    """Delete a resource, returning True if deleted, False if not found."""
    args = ["delete", kind, name, "--ignore-not-found"]
    if namespace:
        args.extend(["-n", namespace])
    try:
        output = run_oc(args)
        return "deleted" in output.lower()
    except subprocess.CalledProcessError:
        return False


def get_cluster_info() -> dict:
    """Get cluster metadata: version, platform, region, topology, nodes."""
    info: dict = {}

    # API server
    try:
        info["api_server"] = get_api_server().replace("https://", "")
    except Exception:
        info["api_server"] = "unknown"

    # OpenShift version
    try:
        info["version"] = run_oc([
            "get", "clusterversion", "version",
            "-o", "jsonpath={.status.desired.version}",
        ])
    except Exception:
        info["version"] = ""

    # Infrastructure: platform, region, topology
    try:
        infra_json = run_oc(["get", "infrastructure", "cluster", "-o", "json"])
        infra = json.loads(infra_json)
        status = infra.get("status", {})
        info["platform"] = status.get("platform", "")
        topology = status.get("controlPlaneTopology", "")
        info["topology"] = "ROSA" if topology == "External" else topology
        platform_status = status.get("platformStatus", {})
        for cloud in ["aws", "gcp", "azure"]:
            region = platform_status.get(cloud, {}).get("region", "")
            if region:
                info["region"] = region
                break
        if "region" not in info:
            info["region"] = ""
    except Exception:
        info["platform"] = ""
        info["region"] = ""
        info["topology"] = ""

    # Node count
    try:
        nodes_output = run_oc(["get", "nodes", "--no-headers"])
        info["node_count"] = len(nodes_output.strip().splitlines()) if nodes_output.strip() else 0
    except Exception:
        info["node_count"] = 0

    # Console URL
    try:
        info["console_url"] = run_oc([
            "get", "console", "cluster",
            "-o", "jsonpath={.status.consoleURL}",
        ])
    except Exception:
        info["console_url"] = ""

    return info


def get_all_namespaces() -> list[str]:
    """Get all namespace names on the cluster."""
    output = run_oc(["get", "namespaces", "-o", "jsonpath={.items[*].metadata.name}"])
    return output.split() if output else []


def add_role_to_user(username: str, role: str, namespace: str) -> None:
    """Grant a role to a user in a namespace."""
    run_oc(["adm", "policy", "add-role-to-user", role, username, "-n", namespace])


def remove_role_from_user(username: str, role: str, namespace: str) -> None:
    """Remove a role from a user in a namespace."""
    run_oc(["adm", "policy", "remove-role-from-user", role, username, "-n", namespace], check=False)


def get_user_role_bindings(username: str) -> list[dict]:
    """Find all RoleBindings for a user across all namespaces."""
    output = run_oc([
        "get", "rolebindings", "--all-namespaces",
        "-o", "json",
    ])
    data = json.loads(output)
    bindings = []
    for rb in data.get("items", []):
        subjects = rb.get("subjects", [])
        for s in subjects:
            if s.get("kind") == "User" and s.get("name") == username:
                bindings.append({
                    "namespace": rb["metadata"]["namespace"],
                    "role": rb["roleRef"]["name"],
                    "binding": rb["metadata"]["name"],
                })
    return bindings


def get_pods(namespace: str) -> list[dict]:
    """Get pod status in a namespace."""
    output = run_oc([
        "get", "pods", "-n", namespace,
        "-l", "app",
        "-o", "json",
    ])
    data = json.loads(output)
    return [
        {
            "name": pod["metadata"]["name"],
            "status": pod["status"]["phase"],
            "ready": all(
                c.get("ready", False)
                for c in pod.get("status", {}).get("containerStatuses", [])
            ),
            "restarts": sum(
                c.get("restartCount", 0)
                for c in pod.get("status", {}).get("containerStatuses", [])
            ),
        }
        for pod in data.get("items", [])
    ]
