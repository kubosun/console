"""Kubosun CLI — deploy and manage Kubosun Console on OpenShift clusters."""

import subprocess
from typing import Optional

import typer
from rich.console import Console
from rich.table import Table

from kubosun_cli import cluster, manifests

app = typer.Typer(
    name="kubosun",
    help="Deploy and manage Kubosun Console on OpenShift clusters.",
    no_args_is_help=True,
)
console = Console()

REPO_URL = "https://github.com/kubosun/console.git"
REGISTRY = "image-registry.openshift-image-registry.svc:5000"


@app.command()
def setup(
    namespace: str = typer.Option("kubosun", help="Target namespace"),
    anthropic_key: Optional[str] = typer.Option(None, help="Anthropic API key", prompt="Anthropic API key"),
    repo_url: str = typer.Option(REPO_URL, help="Git repo URL for BuildConfigs"),
):
    """First-time setup: create namespace, builds, deployments, and route."""

    # 1. Check login
    user = cluster.check_login()
    api_server = cluster.get_api_server()
    console.print(f"Logged in as [bold]{user}[/bold] on [bold]{api_server}[/bold]")

    # 2. Get cluster domain for OAuth
    apps_domain = cluster.get_apps_domain()
    oauth_host = api_server.replace("https://api.", "oauth.").rstrip("/")
    route_host = f"kubosun-{namespace}.{apps_domain}"
    route_url = f"https://{route_host}"
    console.print(f"Apps domain: [cyan]{apps_domain}[/cyan]")
    console.print(f"Expected URL: [cyan]{route_url}[/cyan]")

    # 3. Create namespace
    with console.status("Creating namespace..."):
        if not cluster.namespace_exists(namespace):
            cluster.run_oc(["new-project", namespace])
            console.print(f"[green]Created[/green] project {namespace}")
        else:
            cluster.run_oc(["project", namespace])
            console.print(f"Using existing project {namespace}")

    # 4. Create OAuthClient
    with console.status("Creating OAuthClient..."):
        oauth_yaml = manifests.oauth_client(f"{route_url}/auth/callback")
        # Extract the secret from the generated YAML
        oauth_secret = ""
        for line in oauth_yaml.split("\n"):
            if line.startswith("secret:"):
                oauth_secret = line.split(":", 1)[1].strip()
        cluster.apply_manifest(oauth_yaml)
        console.print("[green]Created[/green] OAuthClient")

    # 5. Create secrets
    with console.status("Creating secrets..."):
        secret_yaml = manifests.k8s_secret(
            namespace=namespace,
            anthropic_key=anthropic_key,
            oauth_issuer=oauth_host,
            oauth_client_secret=oauth_secret,
        )
        cluster.apply_manifest(secret_yaml)
        console.print("[green]Created[/green] secrets")

    # 6. Create ImageStreams
    with console.status("Creating ImageStreams..."):
        cluster.apply_manifest(manifests.image_streams(namespace))
        console.print("[green]Created[/green] ImageStreams")

    # 7. Create BuildConfigs
    with console.status("Creating BuildConfigs..."):
        cluster.apply_manifest(manifests.build_configs(namespace, repo_url))
        console.print("[green]Created[/green] BuildConfigs")

    # 8. Trigger builds
    console.print("\n[bold]Building images...[/bold]")
    cluster.run_oc(["start-build", "kubosun-backend", "-n", namespace])
    cluster.run_oc(["start-build", "kubosun-frontend", "-n", namespace])

    with console.status("Waiting for backend build..."):
        be_build = cluster.get_latest_build("kubosun-backend", namespace)
        if not cluster.wait_for_build(be_build, namespace):
            console.print("[red]Backend build failed![/red]")
            raise typer.Exit(1)
    console.print("[green]Backend build complete[/green]")

    with console.status("Waiting for frontend build..."):
        fe_build = cluster.get_latest_build("kubosun-frontend", namespace)
        if not cluster.wait_for_build(fe_build, namespace):
            console.print("[red]Frontend build failed![/red]")
            raise typer.Exit(1)
    console.print("[green]Frontend build complete[/green]")

    # 9. Create deployments + services + route
    with console.status("Creating deployments..."):
        cors_origin = route_url
        cluster.apply_manifest(
            manifests.deployments(namespace, REGISTRY, cors_origin)
        )
        cluster.apply_manifest(manifests.services_and_route(namespace))
        console.print("[green]Created[/green] deployments, services, and route")

    # 10. Grant RBAC
    with console.status("Granting RBAC..."):
        try:
            cluster.run_oc([
                "adm", "policy", "add-cluster-role-to-user", "cluster-reader",
                f"system:serviceaccount:{namespace}:kubosun",
            ])
        except subprocess.CalledProcessError:
            console.print("[yellow]Warning:[/yellow] Could not grant cluster-reader (may need admin)")

    # 11. Update OAuthClient redirect URI with actual route
    actual_host = cluster.get_route_host("kubosun", namespace)
    actual_url = f"https://{actual_host}"
    with console.status("Updating OAuth redirect URI..."):
        cluster.run_oc([
            "patch", "oauthclient", "kubosun-console",
            "--type", "merge",
            "-p", f'{{"redirectURIs":["{actual_url}/auth/callback"]}}',
        ])
        # Update secret with correct redirect URI
        cluster.run_oc([
            "patch", "secret", "kubosun-secrets", "-n", namespace,
            "--type", "merge",
            "-p", f'{{"stringData":{{"KUBOSUN_OAUTH_REDIRECT_URI":"{actual_url}/auth/callback"}}}}',
        ])
        # Restart backend to pick up new secret
        cluster.run_oc(["rollout", "restart", "deployment", "kubosun-backend", "-n", namespace])

    # 12. Done!
    console.print()
    console.print("[bold green]Setup complete![/bold green]")
    console.print(f"Console URL: [bold cyan]{actual_url}[/bold cyan]")
    console.print(f"Log in with your OpenShift credentials.")


@app.command()
def deploy(
    namespace: str = typer.Option("kubosun", help="Target namespace"),
):
    """Deploy latest code — trigger builds and restart deployments."""

    user = cluster.check_login()
    console.print(f"Logged in as [bold]{user}[/bold]")
    cluster.run_oc(["project", namespace])

    # Trigger builds
    console.print("[bold]Triggering builds...[/bold]")
    cluster.run_oc(["start-build", "kubosun-backend", "-n", namespace])
    cluster.run_oc(["start-build", "kubosun-frontend", "-n", namespace])

    # Wait for builds
    with console.status("Waiting for backend build..."):
        be_build = cluster.get_latest_build("kubosun-backend", namespace)
        if not cluster.wait_for_build(be_build, namespace):
            console.print("[red]Backend build failed![/red]")
            raise typer.Exit(1)
    console.print("[green]Backend build complete[/green]")

    with console.status("Waiting for frontend build..."):
        fe_build = cluster.get_latest_build("kubosun-frontend", namespace)
        if not cluster.wait_for_build(fe_build, namespace):
            console.print("[red]Frontend build failed![/red]")
            raise typer.Exit(1)
    console.print("[green]Frontend build complete[/green]")

    # Restart deployments
    with console.status("Restarting deployments..."):
        cluster.run_oc([
            "rollout", "restart", "deployment",
            "kubosun-backend", "kubosun-frontend",
            "-n", namespace,
        ])

    # Wait for rollout
    with console.status("Waiting for rollout..."):
        cluster.run_oc(["rollout", "status", "deployment/kubosun-backend", "-n", namespace])
        cluster.run_oc(["rollout", "status", "deployment/kubosun-frontend", "-n", namespace])

    route_host = cluster.get_route_host("kubosun", namespace)
    console.print()
    console.print("[bold green]Deploy complete![/bold green]")
    console.print(f"Console URL: [bold cyan]https://{route_host}[/bold cyan]")


@app.command()
def status(
    namespace: str = typer.Option("kubosun", help="Target namespace"),
):
    """Check deployment status — pods, builds, route, health."""

    user = cluster.check_login()
    console.print(f"Logged in as [bold]{user}[/bold]\n")

    # Route
    try:
        route_host = cluster.get_route_host("kubosun", namespace)
        console.print(f"URL: [bold cyan]https://{route_host}[/bold cyan]")
    except subprocess.CalledProcessError:
        console.print("[yellow]No route found[/yellow]")
        route_host = None

    # Pods
    console.print()
    pods = cluster.get_pods(namespace)
    if pods:
        table = Table(title="Pods")
        table.add_column("Name")
        table.add_column("Status")
        table.add_column("Ready")
        table.add_column("Restarts")
        for pod in pods:
            status_color = "green" if pod["status"] == "Running" else "yellow"
            ready_str = "Yes" if pod["ready"] else "No"
            table.add_row(
                pod["name"],
                f"[{status_color}]{pod['status']}[/{status_color}]",
                ready_str,
                str(pod["restarts"]),
            )
        console.print(table)
    else:
        console.print("[yellow]No pods found[/yellow]")

    # Health check
    if route_host:
        console.print()
        try:
            import urllib.request
            url = f"https://{route_host}/api/health"
            req = urllib.request.Request(url)
            import ssl
            ctx = ssl.create_default_context()
            ctx.check_hostname = False
            ctx.verify_mode = ssl.CERT_NONE
            with urllib.request.urlopen(req, context=ctx, timeout=5) as resp:
                if resp.status == 200:
                    console.print(f"[green]Health check passed[/green] (HTTP {resp.status})")
                else:
                    console.print(f"[yellow]Health check: HTTP {resp.status}[/yellow]")
        except Exception as e:
            console.print(f"[red]Health check failed:[/red] {e}")


@app.command()
def destroy(
    namespace: str = typer.Option("kubosun", help="Target namespace"),
    yes: bool = typer.Option(False, "--yes", "-y", help="Skip confirmation prompt"),
    dry_run: bool = typer.Option(False, "--dry-run", help="Show what would be deleted without deleting"),
    delete_namespace: bool = typer.Option(False, help="Also delete the namespace/project"),
):
    """Destroy deployment — remove all Kubosun resources from the cluster."""

    user = cluster.check_login()
    console.print(f"Logged in as [bold]{user}[/bold]")

    steps = [
        ("Route", "route", "kubosun", namespace),
        ("Frontend Service", "service", "kubosun-frontend", namespace),
        ("Backend Service", "service", "kubosun-backend", namespace),
        ("Frontend Deployment", "deployment", "kubosun-frontend", namespace),
        ("Backend Deployment", "deployment", "kubosun-backend", namespace),
        ("Frontend BuildConfig", "buildconfig", "kubosun-frontend", namespace),
        ("Backend BuildConfig", "buildconfig", "kubosun-backend", namespace),
        ("Frontend ImageStream", "imagestream", "kubosun-frontend", namespace),
        ("Backend ImageStream", "imagestream", "kubosun-backend", namespace),
        ("Secrets", "secret", "kubosun-secrets", namespace),
        ("ServiceAccount", "serviceaccount", "kubosun", namespace),
    ]

    if dry_run:
        console.print(f"\n[bold yellow]Dry run[/bold yellow] — the following would be deleted:\n")
        for label, kind, name, ns in steps:
            exists = cluster.resource_exists(kind, name, ns)
            if exists:
                console.print(f"  [red]Delete[/red] {label} ({kind}/{name})")
            else:
                console.print(f"  [dim]Skip[/dim]   {label} (not found)")
        # RBAC
        console.print(f"  [red]Remove[/red] RBAC cluster-reader binding")
        # OAuthClient
        if cluster.resource_exists("oauthclient", "kubosun-console"):
            console.print(f"  [red]Delete[/red] OAuthClient (kubosun-console)")
        else:
            console.print(f"  [dim]Skip[/dim]   OAuthClient (not found)")
        if delete_namespace:
            console.print(f"  [red]Delete[/red] Namespace ({namespace})")
        console.print(f"\n[yellow]No changes made.[/yellow]")
        return

    # Confirmation
    console.print()
    console.print(f"[bold red]This will delete all Kubosun resources in namespace '{namespace}':[/bold red]")
    console.print("  - Route, Services, Deployments")
    console.print("  - BuildConfigs, ImageStreams")
    console.print("  - Secrets, ServiceAccount")
    console.print("  - OAuthClient (cluster-scoped)")
    console.print("  - RBAC ClusterRoleBinding")
    if delete_namespace:
        console.print(f"  - [bold red]Namespace '{namespace}' itself[/bold red]")
    console.print()

    if not yes:
        confirmed = typer.confirm("Are you sure you want to proceed?", default=False)
        if not confirmed:
            console.print("Aborted.")
            raise typer.Exit(0)

    # Delete in reverse order of setup
    for label, kind, name, ns in steps:
        deleted = cluster.delete_resource(kind, name, ns)
        if deleted:
            console.print(f"  [red]Deleted[/red] {label}")
        else:
            console.print(f"  [dim]Skipped[/dim] {label} (not found)")

    # Remove RBAC
    try:
        cluster.run_oc([
            "adm", "policy", "remove-cluster-role-from-user", "cluster-reader",
            f"system:serviceaccount:{namespace}:kubosun",
        ], check=False)
        console.print(f"  [red]Removed[/red] RBAC cluster-reader binding")
    except subprocess.CalledProcessError:
        console.print(f"  [dim]Skipped[/dim] RBAC binding (not found)")

    # Delete OAuthClient (cluster-scoped, no namespace)
    deleted = cluster.delete_resource("oauthclient", "kubosun-console")
    if deleted:
        console.print(f"  [red]Deleted[/red] OAuthClient")
    else:
        console.print(f"  [dim]Skipped[/dim] OAuthClient (not found)")

    # Delete namespace if requested
    if delete_namespace:
        try:
            cluster.run_oc(["delete", "project", namespace])
            console.print(f"  [red]Deleted[/red] namespace {namespace}")
        except subprocess.CalledProcessError:
            console.print(f"  [dim]Skipped[/dim] namespace (not found)")

    console.print()
    console.print("[bold green]Destroy complete.[/bold green]")


if __name__ == "__main__":
    app()
