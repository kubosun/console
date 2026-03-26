# Deploy to OpenShift

Build and deploy the kubosun console to the OpenShift cluster.

## Instructions

1. Check for uncommitted changes:
   ```bash
   cd ~/openshift/kubosun-console && git status
   ```
   If there are changes, commit and push them first.

2. Push to GitHub:
   ```bash
   git push origin main
   ```

3. Trigger OpenShift builds:
   ```bash
   oc start-build kubosun-backend -n kubosun
   oc start-build kubosun-frontend -n kubosun
   ```

4. Wait for builds to complete (poll every 10 seconds):
   ```bash
   oc get builds -n kubosun
   ```

5. Once both builds are `Complete`, restart the deployments:
   ```bash
   oc rollout restart deployment kubosun-backend kubosun-frontend -n kubosun
   ```

6. Wait for pods to be ready:
   ```bash
   oc get pods -n kubosun -l app --no-headers
   ```

7. Verify the route responds:
   ```bash
   ROUTE=$(oc get route kubosun -n kubosun -o jsonpath='{.spec.host}')
   curl -sk -o /dev/null -w "HTTP %{http_code}\n" "https://$ROUTE"
   echo "Deployed: https://$ROUTE"
   ```

## Key resources
- Namespace: `kubosun`
- BuildConfigs: `kubosun-backend`, `kubosun-frontend`
- Deployments: `kubosun-backend`, `kubosun-frontend`
- Route: `kubosun`
- Secret: `kubosun-secrets`
