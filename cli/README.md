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
