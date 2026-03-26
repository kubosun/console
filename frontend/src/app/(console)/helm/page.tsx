'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, ArrowUpDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHelmReleases } from '@/hooks/useHelmReleases';
import { useActiveNamespace } from '@/stores/namespace-store';
import { formatAge } from '@/lib/k8s/resource-utils';
import type { HelmRelease } from '@/lib/k8s/types';

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === 'deployed'
      ? 'success'
      : status === 'failed'
        ? 'error'
        : status === 'superseded' || status === 'uninstalled'
          ? 'muted'
          : 'default';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        variant === 'success' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        variant === 'error' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        variant === 'muted' && 'bg-muted text-muted-foreground',
        variant === 'default' && 'bg-muted text-muted-foreground',
      )}
    >
      {status}
    </span>
  );
}

interface ColumnDef {
  id: string;
  header: string;
  accessor: (r: HelmRelease) => string;
  sortable?: boolean;
}

const COLUMNS: ColumnDef[] = [
  { id: 'name', header: 'Name', accessor: (r) => r.name, sortable: true },
  { id: 'namespace', header: 'Namespace', accessor: (r) => r.namespace, sortable: true },
  { id: 'chart', header: 'Chart', accessor: (r) => r.chart, sortable: true },
  { id: 'chartVersion', header: 'Version', accessor: (r) => r.chartVersion },
  { id: 'appVersion', header: 'App Version', accessor: (r) => r.appVersion },
  { id: 'status', header: 'Status', accessor: (r) => r.status, sortable: true },
  { id: 'deployed', header: 'Deployed', accessor: (r) => r.deployedAt ? formatAge(r.deployedAt) : '' },
];

export default function HelmReleasesPage() {
  const router = useRouter();
  const [namespace] = useActiveNamespace();
  const { data, isLoading, error } = useHelmReleases(namespace || undefined);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleSort = (colId: string) => {
    if (sortColumn === colId) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(colId);
      setSortDir('asc');
    }
  };

  const handleRowClick = (release: HelmRelease) => {
    router.push(`/helm/${release.namespace}/${release.name}`);
  };

  const releases = data ?? [];
  const sortedData = [...releases].sort((a, b) => {
    if (!sortColumn) return 0;
    const col = COLUMNS.find((c) => c.id === sortColumn);
    if (!col) return 0;
    const cmp = col.accessor(a).localeCompare(col.accessor(b), undefined, { numeric: true });
    return sortDir === 'asc' ? cmp : -cmp;
  });

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Package className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Helm Releases</h1>
        {data && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {data.length}
          </span>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/5 p-8 text-sm">
          <AlertCircle className="h-8 w-8 text-destructive mb-2" />
          <p className="text-destructive font-medium">Failed to load Helm releases</p>
          <p className="text-muted-foreground mt-1">{error.message}</p>
        </div>
      )}

      {/* Table */}
      {!error && (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                {COLUMNS.map((col) => (
                  <th key={col.id} className="px-4 py-2 text-left font-medium">
                    {col.sortable ? (
                      <button
                        onClick={() => handleSort(col.id)}
                        className="flex items-center gap-1 hover:text-foreground"
                      >
                        {col.header}
                        <ArrowUpDown className="h-3 w-3" />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b">
                    {COLUMNS.map((col) => (
                      <td key={col.id} className="px-4 py-3">
                        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                      </td>
                    ))}
                  </tr>
                ))}

              {!isLoading && sortedData.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-4 py-8 text-center text-muted-foreground">
                    No Helm releases found.
                  </td>
                </tr>
              )}

              {!isLoading &&
                sortedData.map((release) => (
                  <tr
                    key={`${release.namespace}/${release.name}`}
                    className="border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleRowClick(release)}
                  >
                    {COLUMNS.map((col) => (
                      <td key={col.id} className="px-4 py-2">
                        {col.id === 'name' ? (
                          <span className="font-mono text-xs">{col.accessor(release)}</span>
                        ) : col.id === 'status' ? (
                          <StatusBadge status={col.accessor(release)} />
                        ) : (
                          col.accessor(release)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
