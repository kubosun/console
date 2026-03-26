# Kubosun CLI

Deploy and manage Kubosun Console on OpenShift clusters.

## Install

```bash
pip install -e cli/
# or
pipx install ./cli
```

## Usage

### First-time setup

```bash
# Login to your OpenShift cluster first
oc login https://api.your-cluster.example.com --username admin

# Run setup (prompts for Anthropic API key)
kubosun setup
```

This creates everything: namespace, OAuthClient, secrets, BuildConfigs, deployments, services, route.

### Deploy updates

After pushing code changes to GitHub:

```bash
kubosun deploy
```

Triggers builds, waits for completion, restarts deployments.

### Check status

```bash
kubosun status
```

Shows pods, route URL, and health check.

### Destroy deployment

```bash
# Interactive confirmation
kubosun destroy

# Skip confirmation
kubosun destroy --yes

# Also delete the namespace
kubosun destroy --yes --delete-namespace
```

Removes all Kubosun resources: deployments, services, builds, secrets, route, OAuthClient, and RBAC bindings.

### Add a user

```bash
# Grant view access to specific namespaces
kubosun add-user alice --role view -n default -n my-app

# Grant view access to ALL namespaces except kubosun
kubosun add-user bob --role view --all-namespaces

# Grant edit access
kubosun add-user charlie --role edit -n default
```

The kubosun namespace (where secrets live) is always excluded. Users must first log in via OpenShift OAuth — the user object is created on first login.

### Remove a user

```bash
kubosun remove-user alice
```

Finds and removes all role bindings for the user across all namespaces.

## Options

All commands accept `--namespace` (default: `kubosun`):

```bash
kubosun setup --namespace my-kubosun
kubosun deploy --namespace my-kubosun
kubosun status --namespace my-kubosun
```

## Prerequisites

- `oc` CLI installed and logged in (`oc login`)
- Cluster-admin permissions (for OAuthClient and RBAC)
- Python 3.10+
