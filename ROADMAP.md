# Kubosun Console — Roadmap

An AI-native Kubernetes/OpenShift console built with Next.js + Python.

## Vision

A Kubernetes console where:
1. **Users** manage clusters through both a traditional UI and an AI agent (natural language)
2. **Developers** extend the console by prompting Claude Code — the codebase is designed for AI-driven development

## Milestones

### M0: Scaffold ✦ _Foundation_

> Get a running app with all infrastructure in place. No features yet — just the harness.

- [ ] Next.js 15 app (App Router, TypeScript strict, PatternFly 6)
- [ ] Python FastAPI backend (async, Pydantic, kubernetes-client)
- [ ] Docker Compose for local development (frontend + backend)
- [ ] Dockerfile for production (multi-stage)
- [ ] CLAUDE.md with project conventions and instructions
- [ ] CI: GitHub Actions (lint, type-check, test, build)
- [ ] Base layout: shell with sidebar, header, content area (PatternFly)
- [ ] Health check endpoints (frontend + backend)
- [ ] ESLint + Biome config, Vitest setup, pytest setup
- [ ] README with setup instructions

**Exit criteria:** `docker compose up` starts both services, you see a shell UI at localhost:3000, backend responds at localhost:8000/health.

---

### M1: K8s Core + AI Agent ✦ _The Engine_

> Connect to a real cluster. Stand up the AI agent alongside traditional K8s data fetching.

**K8s Integration:**
- [ ] Backend auth: kubeconfig (dev) + in-cluster ServiceAccount (prod)
- [ ] K8s proxy endpoint (`/api/kubernetes/...`) with auth + header handling
- [ ] API discovery: enumerate resource types, build model registry
- [ ] Resource CRUD: generic get/list/create/update/patch/delete
- [ ] SSE watch endpoint: real-time resource events streamed to frontend
- [ ] React Query hooks: `useK8sResource`, `useK8sResourceList` with SSE subscriptions
- [ ] RBAC: `useAccessReview` hook backed by SelfSubjectAccessReview

**AI Agent:**
- [ ] Anthropic SDK integration in Python backend
- [ ] K8s operations as Claude tools (list, get, create, patch, delete, logs, events, RBAC check)
- [ ] `/api/ai/chat` streaming endpoint (SSE)
- [ ] Chat panel component in frontend (collapsible side panel)
- [ ] Safety: dry-run by default for mutations, preview → confirm → execute
- [ ] Conversation context: cluster info, namespace, user permissions
- [ ] `useAIAgent` React hook

**Exit criteria:** You can browse resources in the UI and ask the AI "list all pods in namespace X" or "create a deployment for nginx" and it works with real cluster data.

---

### M2: Resource Pages ✦ _The UI_

> Build the resource page template system that Claude Code can replicate.

- [ ] Generic resource list page (works for any K8s resource from discovery)
- [ ] Generic resource details page (metadata, YAML, events tabs)
- [ ] Resource create/edit with YAML editor (Monaco)
- [ ] Table column definitions system (`columns.ts` per resource)
- [ ] Resource actions system (`actions.ts` per resource)
- [ ] Template files in `_templates/` for Claude Code to copy
- [ ] Custom pages for core resources: Pods, Deployments, Services, ConfigMaps, Secrets
- [ ] Resource breadcrumbs and navigation links
- [ ] Namespace selector component
- [ ] Empty states and loading skeletons

**Exit criteria:** Claude Code can add a new resource page by copying templates and adding a YAML entry. Core resources have polished custom pages.

---

### M3: Navigation & Perspectives ✦ _The Structure_

> YAML-driven navigation, multiple perspectives (Admin/Developer).

- [ ] `navigation.yaml` — declarative sidebar configuration
- [ ] Admin perspective layout (cluster-wide management)
- [ ] Developer perspective layout (app-focused, namespace-scoped)
- [ ] Perspective switcher in header
- [ ] Feature flags: CRD-presence detection → enable/disable nav items
- [ ] `models.yaml` — static resource model definitions
- [ ] Search/filter in sidebar
- [ ] User preferences (Zustand + localStorage): theme, perspective, namespace

**Exit criteria:** Two working perspectives with YAML-driven navigation. Adding a nav item = editing YAML.

---

### M4: Dashboards & Monitoring ✦ _Observability_

> Cluster overview, health, metrics, alerts.

- [ ] Cluster overview dashboard (health, capacity, alerts summary)
- [ ] Dashboard card system (extensible via file convention)
- [ ] Prometheus proxy endpoint + metrics query hooks
- [ ] AlertManager proxy endpoint + alerts list
- [ ] Resource metrics (CPU/memory for pods, nodes)
- [ ] Events timeline view
- [ ] AI agent: "why is this pod crashing?" with logs + events context

**Exit criteria:** Dashboard shows cluster health. AI can diagnose issues using metrics, logs, and events.

---

### M5: Advanced Features ✦ _Polish_

> Helm, topology, operators, and production hardening.

- [ ] Helm chart management (list, install, upgrade, rollback)
- [ ] Topology view (application graph visualization)
- [ ] Operator/CRD management
- [ ] OAuth2/OIDC authentication (production auth flow)
- [ ] RBAC-aware UI (hide actions user can't perform)
- [ ] i18n setup (next-intl)
- [ ] Accessibility audit (PatternFly a11y)
- [ ] Production Dockerfile optimization
- [ ] E2E tests (Playwright)

**Exit criteria:** Production-ready console with Helm, topology, and proper auth.

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend framework | Next.js 15 (App Router) | File-based routing = AI-friendly |
| Backend framework | Python FastAPI | Async + native Anthropic SDK |
| State (server) | TanStack React Query | Automatic caching, SSE subscriptions |
| State (client) | Zustand | Minimal boilerplate |
| Design system | PatternFly 6 | K8s/OpenShift standard |
| Real-time | SSE (not WebSocket) | Simpler proxying, auto-reconnect |
| AI | Anthropic Claude (tool use) | Best tool-use support |
| Testing | Vitest + Playwright + pytest | Fast, modern, reliable |
| Package manager | pnpm | Fast, strict |

## Reference

- Study notes: [kubosun/study-notes](https://github.com/kubosun/study-notes)
- OpenShift Console (reference): [openshift/console](https://github.com/openshift/console)
