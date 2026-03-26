"""Generate Kubernetes/OpenShift manifests for Kubosun deployment."""

import secrets


def oauth_client(redirect_uri: str) -> str:
    return f"""\
apiVersion: oauth.openshift.io/v1
kind: OAuthClient
metadata:
  name: kubosun-console
grantMethod: auto
secret: kubosun-oauth-{secrets.token_hex(8)}
redirectURIs:
  - {redirect_uri}
"""


def image_streams(namespace: str) -> str:
    return f"""\
apiVersion: image.openshift.io/v1
kind: ImageStream
metadata:
  name: kubosun-backend
  namespace: {namespace}
---
apiVersion: image.openshift.io/v1
kind: ImageStream
metadata:
  name: kubosun-frontend
  namespace: {namespace}
"""


def build_configs(namespace: str, repo_url: str) -> str:
    return f"""\
apiVersion: build.openshift.io/v1
kind: BuildConfig
metadata:
  name: kubosun-backend
  namespace: {namespace}
spec:
  source:
    type: Git
    git:
      uri: {repo_url}
      ref: main
    contextDir: backend
  strategy:
    type: Docker
    dockerStrategy:
      dockerfilePath: Dockerfile
  output:
    to:
      kind: ImageStreamTag
      name: kubosun-backend:latest
---
apiVersion: build.openshift.io/v1
kind: BuildConfig
metadata:
  name: kubosun-frontend
  namespace: {namespace}
spec:
  source:
    type: Git
    git:
      uri: {repo_url}
      ref: main
    contextDir: frontend
  strategy:
    type: Docker
    dockerStrategy:
      dockerfilePath: Dockerfile
      buildArgs:
        - name: BACKEND_URL
          value: http://kubosun-backend:8000
  output:
    to:
      kind: ImageStreamTag
      name: kubosun-frontend:latest
"""


def k8s_secret(
    namespace: str,
    anthropic_key: str,
    oauth_issuer: str,
    oauth_client_secret: str,
    k8s_api_server: str = "",
) -> str:
    session_secret = secrets.token_hex(32)
    return f"""\
apiVersion: v1
kind: Secret
metadata:
  name: kubosun-secrets
  namespace: {namespace}
type: Opaque
stringData:
  KUBOSUN_ANTHROPIC_API_KEY: "{anthropic_key}"
  KUBOSUN_SESSION_SECRET: "{session_secret}"
  KUBOSUN_OAUTH_CLIENT_ID: "kubosun-console"
  KUBOSUN_OAUTH_CLIENT_SECRET: "{oauth_client_secret}"
  KUBOSUN_OAUTH_ISSUER_URL: "{oauth_issuer}"
  KUBOSUN_OAUTH_REDIRECT_URI: "placeholder"
  KUBOSUN_K8S_API_SERVER: "{k8s_api_server}"
"""


def deployments(namespace: str, registry: str, cors_origin: str) -> str:
    return f"""\
apiVersion: v1
kind: ServiceAccount
metadata:
  name: kubosun
  namespace: {namespace}
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kubosun-backend
  namespace: {namespace}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: kubosun-backend
  template:
    metadata:
      labels:
        app: kubosun-backend
    spec:
      serviceAccountName: kubosun
      containers:
        - name: backend
          image: {registry}/{namespace}/kubosun-backend:latest
          ports:
            - containerPort: 8000
          env:
            - name: KUBOSUN_K8S_IN_CLUSTER
              value: "true"
            - name: KUBOSUN_OAUTH_ENABLED
              value: "true"
            - name: KUBOSUN_OAUTH_PROVIDER
              value: "openshift"
            - name: KUBOSUN_CORS_ORIGINS
              value: '["{cors_origin}"]'
          envFrom:
            - secretRef:
                name: kubosun-secrets
          livenessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 15
            periodSeconds: 15
          readinessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 5
            periodSeconds: 5
          resources:
            requests:
              cpu: 100m
              memory: 256Mi
            limits:
              cpu: 500m
              memory: 512Mi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: kubosun-frontend
  namespace: {namespace}
spec:
  replicas: 1
  selector:
    matchLabels:
      app: kubosun-frontend
  template:
    metadata:
      labels:
        app: kubosun-frontend
    spec:
      containers:
        - name: frontend
          image: {registry}/{namespace}/kubosun-frontend:latest
          ports:
            - containerPort: 3000
          env:
            - name: BACKEND_URL
              value: "http://kubosun-backend:8000"
          livenessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 15
            periodSeconds: 15
          readinessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 300m
              memory: 256Mi
"""


def services_and_route(namespace: str) -> str:
    return f"""\
apiVersion: v1
kind: Service
metadata:
  name: kubosun-backend
  namespace: {namespace}
spec:
  selector:
    app: kubosun-backend
  ports:
    - port: 8000
      targetPort: 8000
---
apiVersion: v1
kind: Service
metadata:
  name: kubosun-frontend
  namespace: {namespace}
spec:
  selector:
    app: kubosun-frontend
  ports:
    - port: 3000
      targetPort: 3000
---
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: kubosun
  namespace: {namespace}
spec:
  to:
    kind: Service
    name: kubosun-frontend
  port:
    targetPort: 3000
  tls:
    termination: edge
    insecureEdgeTerminationPolicy: Redirect
"""
