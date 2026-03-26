'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useK8sResourceList } from '@/hooks/useK8sResourceList';
import { useActiveNamespace } from '@/stores/namespace-store';
import { getResourceConfig, getDefaultConfig } from '@/lib/k8s/resource-registry';
import { urlSegmentToGroup, groupToUrlSegment } from '@/lib/k8s/resource-utils';
import { k8sDelete } from '@/lib/k8s/client';
import type { K8sResource } from '@/lib/k8s/types';
import { DataTable } from './DataTable';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

interface ResourceListPageProps {
  groupSlug: string;
  version: string;
  plural: string;
}

export function ResourceListPage({ groupSlug, version, plural }: ResourceListPageProps) {
  const router = useRouter();
  const [namespace] = useActiveNamespace();
  const apiGroup = urlSegmentToGroup(groupSlug);
  const config = getResourceConfig(groupSlug, version, plural) ?? getDefaultConfig(apiGroup, version, plural);
  const [deleteTarget, setDeleteTarget] = useState<K8sResource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, isLoading, error, refetch } = useK8sResourceList({
    group: apiGroup,
    version,
    plural,
    namespace: config.namespaced ? namespace || undefined : undefined,
  });

  const Icon = config.icon;

  const handleRowClick = (resource: K8sResource) => {
    const ns = resource.metadata.namespace;
    const name = resource.metadata.name;
    const basePath = `/resources/${groupSlug}/${version}/${plural}/${name}`;
    if (ns) {
      router.push(`${basePath}?ns=${ns}`);
    } else {
      router.push(basePath);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await k8sDelete(
        apiGroup,
        version,
        plural,
        deleteTarget.metadata.name,
        deleteTarget.metadata.namespace,
      );
      setDeleteTarget(null);
      refetch();
    } catch {
      // Error will show in UI via refetch
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Icon className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-xl font-semibold">{config.labelPlural}</h1>
        {data && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {data.length}
          </span>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={config.columns}
        data={data ?? []}
        isLoading={isLoading}
        error={error}
        onRowClick={handleRowClick}
        actions={(resource) => [
          {
            label: 'View Details',
            onClick: () => handleRowClick(resource),
          },
          {
            label: 'Delete',
            variant: 'destructive',
            onClick: () => setDeleteTarget(resource),
          },
        ]}
      />

      {/* Delete confirmation */}
      {deleteTarget && (
        <DeleteConfirmDialog
          resource={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
