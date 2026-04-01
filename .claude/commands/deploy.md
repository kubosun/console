# Deploy to OpenShift

Build and deploy the kubosun console to the OpenShift cluster.

## Pre-flight: detect fresh vs existing cluster

```bash
oc whoami 2>/dev/null || echo "NOT_LOGGED_IN"
oc get namespace kubosun 2>/dev/null && echo "NAMESPACE_EXISTS" || echo "FRESH_CLUSTER"
```

- If **NOT_LOGGED_IN**: prompt the user for `oc login` credentials first.
- If **FRESH_CLUSTER**: follow the [First-time setup](#first-time-setup) section.
- If **NAMESPACE_EXISTS**: follow the [Redeploy](#redeploy) section.

---

## First-time setup

Use the kubosun CLI tool which handles all infrastructure creation:

```bash
cd ~/openshift/kubosun-console
pip install -e ./cli
kubosun setup --anthropic-key <KEY>
```

This creates: namespace, OAuthClient, secrets, ImageStreams, BuildConfigs (with
correct `BACKEND_URL=http://kubosun-backend:8000` build arg for the frontend),
deployments, services, route, and RBAC (cluster-reader for the service account).

If the CLI is not available, create resources manually in this order:

1. **Namespace**: `oc new-project kubosun`
2. **ServiceAccount**: `oc create serviceaccount kubosun -n kubosun`
3. **RBAC**: `oc adm policy add-cluster-role-to-user cluster-reader system:serviceaccount:kubosun:kubosun`
4. **OAuthClient**: create an `OAuthClient` named `kubosun-console` with `grantMethod: auto` and a generated secret
5. **Secret** (`kubosun-secrets`): must include `KUBOSUN_ANTHROPIC_API_KEY`, `KUBOSUN_SESSION_SECRET`, `KUBOSUN_OAUTH_CLIENT_ID`, `KUBOSUN_OAUTH_CLIENT_SECRET`, `KUBOSUN_OAUTH_ISSUER_URL`, `KUBOSUN_OAUTH_REDIRECT_URI`
6. **ImageStreams**: `kubosun-backend`, `kubosun-frontend`
7. **BuildConfigs**: binary or Git-based; **the frontend BuildConfig MUST pass `BACKEND_URL=http://kubosun-backend:8000` as a build arg** (otherwise Next.js rewrites will proxy to localhost:8000 and fail)
8. **Trigger builds**: `oc start-build kubosun-backend --from-dir=./backend` and `oc start-build kubosun-frontend --from-dir=./frontend`
9. **Deployments**: apply `deploy/deployment.yaml` — backend MUST have `KUBOSUN_OAUTH_ENABLED=true` and `KUBOSUN_OAUTH_PROVIDER=openshift` env vars; images must reference the internal registry (`image-registry.openshift-image-registry.svc:5000/kubosun/...`)
10. **Services + Route**: apply `deploy/service.yaml`
11. **Verify**: `curl -sk https://$(oc get route kubosun -n kubosun -o jsonpath='{.spec.host}')/auth/user` should return `{"error":"Not authenticated"}` with HTTP 401

### Common pitfall

The frontend `next.config.ts` evaluates `BACKEND_URL` at **build time** (not runtime).
If you forget the build arg, the Next.js rewrites will proxy API calls to `http://localhost:8000`
inside the frontend pod, causing `ECONNREFUSED` errors. You must rebuild the frontend
image whenever `BACKEND_URL` changes.

---

## Redeploy

For subsequent deployments when all infrastructure already exists:

1. Check for uncommitted changes:
   ```bash
   cd ~/openshift/kubosun-console && git status
   ```

2. Trigger OpenShift builds (binary from local source):
   ```bash
   oc start-build kubosun-backend --from-dir=./backend -n kubosun
   oc start-build kubosun-frontend --from-dir=./frontend -n kubosun
   ```

3. Wait for builds to complete (poll every 15 seconds):
   ```bash
   oc get builds -n kubosun
   ```

4. Once both builds are `Complete`, restart the deployments:
   ```bash
   oc rollout restart deployment kubosun-backend -n kubosun
   oc rollout restart deployment kubosun-frontend -n kubosun
   ```

5. Wait for rollouts:
   ```bash
   oc rollout status deployment/kubosun-backend -n kubosun
   oc rollout status deployment/kubosun-frontend -n kubosun
   ```

6. Verify the route responds:
   ```bash
   ROUTE=$(oc get route kubosun -n kubosun -o jsonpath='{.spec.host}')
   curl -sk -o /dev/null -w "HTTP %{http_code}\n" "https://$ROUTE"
   echo "Deployed: https://$ROUTE"
   ```

---

## Key resources
- Namespace: `kubosun`
- OAuthClient: `kubosun-console` (cluster-scoped)
- BuildConfigs: `kubosun-backend`, `kubosun-frontend`
- Deployments: `kubosun-backend`, `kubosun-frontend`
- ServiceAccount: `kubosun` (with `cluster-reader` ClusterRoleBinding)
- Route: `kubosun`
- Secret: `kubosun-secrets`
