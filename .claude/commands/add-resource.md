# Add a Kubernetes Resource Page

Add a new Kubernetes resource type to the kubosun console. This creates the registry entry and navigation item so the generic list/detail pages automatically work.

## Instructions

1. Ask the user for:
   - **Kind** (e.g., DaemonSet, StatefulSet, Ingress)
   - **API group** (e.g., `apps`, `networking.k8s.io`, or empty for core v1)
   - **Version** (e.g., `v1`, `v1beta1`)
   - **Plural** (e.g., `daemonsets`, `statefulsets`)
   - **Nav section** (Cluster, Workloads, Networking, Configuration, Storage)
   - **Key columns** beyond Name/Namespace/Age (e.g., Ready, Status, Type)

2. Read `frontend/src/lib/k8s/resource-registry.ts` and add a new entry to `RESOURCE_REGISTRY`. Follow the existing patterns exactly. Choose an appropriate Lucide icon and add its import if not already imported.

3. Read `frontend/src/components/shell/AppShell.tsx` and add a nav item to the appropriate section in `NAV_SECTIONS`. The `href` format is `/resources/{groupSlug}/{version}/{plural}` where groupSlug is `core` for empty API group.

4. Run `cd frontend && npm run type-check` to verify no TypeScript errors.

5. Commit with message: `Add {Kind} resource page to console`

## Key files
- `frontend/src/lib/k8s/resource-registry.ts` — RESOURCE_REGISTRY map
- `frontend/src/components/shell/AppShell.tsx` — NAV_SECTIONS array
- `frontend/src/lib/k8s/resource-utils.ts` — formatAge, getResourceStatus helpers

## Conventions
- Use `groupToUrlSegment()` for "core" vs actual group in URLs
- Core API (pods, services, configmaps) uses `group: ''` in registry
- Cluster-scoped resources (nodes, namespaces) use `namespaced: false`
- Column accessor returns a string: `(r) => r.metadata.name`
- Import icons from `lucide-react`
