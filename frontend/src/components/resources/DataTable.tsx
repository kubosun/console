'use client';

import { useState } from 'react';
import { ArrowUpDown, MoreVertical, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ColumnDef } from '@/lib/k8s/resource-registry';
import type { K8sResource } from '@/lib/k8s/types';

interface ActionItem {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive';
}

interface DataTableProps {
  columns: ColumnDef[];
  data: K8sResource[];
  isLoading: boolean;
  error: Error | null;
  onRowClick?: (resource: K8sResource) => void;
  actions?: (resource: K8sResource) => ActionItem[];
}

export function DataTable({
  columns,
  data,
  isLoading,
  error,
  onRowClick,
  actions,
}: DataTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const handleSort = (colId: string) => {
    if (sortColumn === colId) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(colId);
      setSortDir('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn) return 0;
    const col = columns.find((c) => c.id === sortColumn);
    if (!col) return 0;
    const aVal = col.accessor(a);
    const bVal = col.accessor(b);
    const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
    return sortDir === 'asc' ? cmp : -cmp;
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/5 p-8 text-sm">
        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
        <p className="text-destructive font-medium">Failed to load resources</p>
        <p className="text-muted-foreground mt-1">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            {columns.map((col) => (
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
            {actions && <th className="w-10" />}
          </tr>
        </thead>
        <tbody>
          {isLoading &&
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b">
                {columns.map((col) => (
                  <td key={col.id} className="px-4 py-3">
                    <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                  </td>
                ))}
                {actions && <td />}
              </tr>
            ))}

          {!isLoading && sortedData.length === 0 && (
            <tr>
              <td
                colSpan={columns.length + (actions ? 1 : 0)}
                className="px-4 py-8 text-center text-muted-foreground"
              >
                No resources found.
              </td>
            </tr>
          )}

          {!isLoading &&
            sortedData.map((resource) => (
              <tr
                key={resource.metadata.uid}
                className={cn(
                  'border-b last:border-0 transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-muted/50',
                )}
                onClick={() => onRowClick?.(resource)}
              >
                {columns.map((col) => (
                  <td key={col.id} className="px-4 py-2">
                    {col.id === 'name' ? (
                      <span className="font-mono text-xs">{col.accessor(resource)}</span>
                    ) : col.id === 'status' ? (
                      <StatusBadge value={col.accessor(resource)} />
                    ) : (
                      col.accessor(resource)
                    )}
                  </td>
                ))}
                {actions && (
                  <td className="px-2">
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenu(
                            openMenu === resource.metadata.uid
                              ? null
                              : resource.metadata.uid,
                          );
                        }}
                        className="rounded p-1 hover:bg-accent"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {openMenu === resource.metadata.uid && (
                        <div className="absolute right-0 top-full z-10 mt-1 min-w-[140px] rounded-md border bg-popover py-1 shadow-lg">
                          {actions(resource).map((action) => (
                            <button
                              key={action.label}
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenu(null);
                                action.onClick();
                              }}
                              className={cn(
                                'w-full px-3 py-1.5 text-left text-sm hover:bg-accent',
                                action.variant === 'destructive' && 'text-destructive',
                              )}
                            >
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const variant =
    value === 'Running' || value === 'Available' || value === 'Active'
      ? 'success'
      : value === 'Pending'
        ? 'warning'
        : value === 'Failed' || value === 'Unavailable'
          ? 'error'
          : 'default';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        variant === 'success' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        variant === 'warning' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        variant === 'error' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        variant === 'default' && 'bg-muted text-muted-foreground',
      )}
    >
      {value}
    </span>
  );
}
