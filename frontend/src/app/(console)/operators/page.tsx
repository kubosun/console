'use client';

import { useRouter } from 'next/navigation';
import { Layers, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useK8sResourceList } from '@/hooks/useK8sResourceList';
import { useActiveNamespace } from '@/stores/namespace-store';
import { formatAge } from '@/lib/k8s/resource-utils';
import type { K8sResource } from '@/lib/k8s/types';

function PhaseBadge({ phase }: { phase: string }) {
  const variant =
    phase === 'Succeeded'
      ? 'success'
      : phase === 'Failed'
        ? 'error'
        : phase === 'Pending' || phase === 'Installing'
          ? 'warning'
          : 'default';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        variant === 'success' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        variant === 'error' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        variant === 'warning' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        variant === 'default' && 'bg-muted text-muted-foreground',
      )}
    >
      {phase}
    </span>
  );
}

export default function OperatorsPage() {
  const router = useRouter();
  const [namespace] = useActiveNamespace();

  const { data, isLoading, isError } = useK8sResourceList({
    group: 'operators.coreos.com',
    version: 'v1alpha1',
    plural: 'clusterserviceversions',
    namespace: namespace === 'all-namespaces' ? undefined : namespace,
  });

  const csvs = (data ?? []) as K8sResource[];

  if (isError) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Layers className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold">Operators</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Installed operators via OLM
            </p>
          </div>
        </div>
        <div className="rounded-lg border p-12 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">Operator Lifecycle Manager is not installed</p>
          <p className="text-xs text-muted-foreground mt-1">
            OLM (operators.coreos.com) is required to manage operators.
          </p>
        </div>
      </div>
    );
  }

  const handleRowClick = (csv: K8sResource) => {
    const ns = csv.metadata.namespace;
    const name = encodeURIComponent(csv.metadata.name);
    router.push(
      `/resources/operators.coreos.com/v1alpha1/clusterserviceversions/${name}?ns=${ns}`,
    );
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Layers className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold">Operators</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isLoading ? 'Loading...' : `${csvs.length} installed operators`}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : csvs.length === 0 ? (
        <div className="rounded-lg border p-12 text-center">
          <p className="text-sm text-muted-foreground">No operators installed</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-2.5 font-medium">Display Name</th>
                <th className="text-left px-4 py-2.5 font-medium">Namespace</th>
                <th className="text-left px-4 py-2.5 font-medium">Version</th>
                <th className="text-left px-4 py-2.5 font-medium">Phase</th>
                <th className="text-left px-4 py-2.5 font-medium">Provided CRDs</th>
                <th className="text-left px-4 py-2.5 font-medium">Age</th>
              </tr>
            </thead>
            <tbody>
              {csvs.map((csv) => {
                const spec = csv.spec as Record<string, unknown>;
                const status = csv.status as Record<string, unknown>;
                const displayName = String(spec?.displayName ?? csv.metadata.name);
                const version = String(spec?.version ?? '-');
                const phase = String(status?.phase ?? '-');
                const owned = (
                  (spec?.customresourcedefinitions as Record<string, unknown>)
                    ?.owned as Array<unknown>
                ) ?? [];

                return (
                  <tr
                    key={`${csv.metadata.namespace}/${csv.metadata.name}`}
                    onClick={() => handleRowClick(csv)}
                    className="border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-2.5 font-medium">{displayName}</td>
                    <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">
                      {csv.metadata.namespace ?? '-'}
                    </td>
                    <td className="px-4 py-2.5">{version}</td>
                    <td className="px-4 py-2.5">
                      <PhaseBadge phase={phase} />
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {owned.length > 0 ? `${owned.length} CRDs` : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {formatAge(csv.metadata.creationTimestamp)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
