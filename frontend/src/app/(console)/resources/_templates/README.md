# Adding a New Resource Page

## Steps

1. **Add a registry entry** in `src/lib/k8s/resource-registry.ts`:

```typescript
RESOURCE_REGISTRY.set('apps/v1/statefulsets', {
  group: 'apps',
  version: 'v1',
  plural: 'statefulsets',
  kind: 'StatefulSet',
  label: 'StatefulSet',
  labelPlural: 'StatefulSets',
  namespaced: true,
  icon: Database, // from lucide-react
  columns: [
    { id: 'name', header: 'Name', accessor: (r) => r.metadata.name, sortable: true },
    { id: 'namespace', header: 'Namespace', accessor: (r) => r.metadata.namespace ?? '-', sortable: true },
    { id: 'ready', header: 'Ready', accessor: (r) => `${r.status?.readyReplicas ?? 0}/${r.spec?.replicas ?? 0}` },
    { id: 'age', header: 'Age', accessor: (r) => formatAge(r.metadata.creationTimestamp), sortable: true },
  ],
});
```

2. **Add a nav item** in `src/components/shell/AppShell.tsx` — add to the appropriate section in `NAV_SECTIONS`.

3. **Done!** The generic list and detail pages handle everything else automatically.

## Optional: Custom Pages

If you need custom UI beyond the generic pages, create files at:
- `src/app/(console)/resources/{group}/{version}/{plural}/page.tsx` (custom list)
- `src/app/(console)/resources/{group}/{version}/{plural}/[name]/page.tsx` (custom detail)

These override the dynamic route pages.
