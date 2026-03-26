'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHelmRelease, useHelmReleaseHistory } from '@/hooks/useHelmReleases';
import { formatAge } from '@/lib/k8s/resource-utils';
import type { HelmRelease } from '@/lib/k8s/types';

type TabId = 'overview' | 'values' | 'history';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'values', label: 'Values' },
  { id: 'history', label: 'History' },
];

function StatusBadge({ status }: { status: string }) {
  const color =
    status === 'deployed'
      ? 'text-green-600'
      : status === 'failed'
        ? 'text-red-600'
        : '';
  return <span className={color}>{status}</span>;
}

function OverviewSection({ release }: { release: HelmRelease }) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4 space-y-3">
        <h3 className="text-sm font-medium">Release Details</h3>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-muted-foreground">Name</span>
          <span className="font-mono">{release.name}</span>
          <span className="text-muted-foreground">Namespace</span>
          <span className="font-mono">{release.namespace}</span>
          <span className="text-muted-foreground">Status</span>
          <StatusBadge status={release.status} />
          <span className="text-muted-foreground">Revision</span>
          <span>{release.revision}</span>
          <span className="text-muted-foreground">Description</span>
          <span>{release.description}</span>
        </div>
      </div>
      <div className="rounded-lg border p-4 space-y-3">
        <h3 className="text-sm font-medium">Chart</h3>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-muted-foreground">Chart</span>
          <span>{release.chart}</span>
          <span className="text-muted-foreground">Chart Version</span>
          <span>{release.chartVersion}</span>
          <span className="text-muted-foreground">App Version</span>
          <span>{release.appVersion}</span>
          <span className="text-muted-foreground">Deployed</span>
          <span>{release.deployedAt ? formatAge(release.deployedAt) + ' ago' : '-'}</span>
        </div>
      </div>
    </div>
  );
}

function ValuesSection({ values }: { values: Record<string, unknown> }) {
  const yaml = JSON.stringify(values, null, 2);

  return (
    <div className="rounded-lg border">
      <div className="border-b px-4 py-2 text-sm font-medium text-muted-foreground">
        User-supplied Values
      </div>
      <pre className="overflow-auto p-4 text-sm font-mono bg-muted/30 max-h-[600px]">
        {Object.keys(values).length > 0 ? yaml : 'No user-supplied values.'}
      </pre>
    </div>
  );
}

function HistorySection({ name, namespace }: { name: string; namespace: string }) {
  const { data: history, isLoading } = useHelmReleaseHistory(name, namespace);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded bg-muted" />
        ))}
      </div>
    );
  }

  const revisions = history ?? [];

  return (
    <div className="rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-2 text-left font-medium">Revision</th>
            <th className="px-4 py-2 text-left font-medium">Status</th>
            <th className="px-4 py-2 text-left font-medium">Chart</th>
            <th className="px-4 py-2 text-left font-medium">App Version</th>
            <th className="px-4 py-2 text-left font-medium">Description</th>
            <th className="px-4 py-2 text-left font-medium">Deployed</th>
          </tr>
        </thead>
        <tbody>
          {revisions.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                No revision history found.
              </td>
            </tr>
          )}
          {revisions.map((rev) => (
            <tr key={rev.revision} className="border-b last:border-0">
              <td className="px-4 py-2 font-mono">{rev.revision}</td>
              <td className="px-4 py-2">
                <StatusBadge status={rev.status} />
              </td>
              <td className="px-4 py-2">{rev.chart} {rev.chartVersion}</td>
              <td className="px-4 py-2">{rev.appVersion}</td>
              <td className="px-4 py-2">{rev.description}</td>
              <td className="px-4 py-2">{rev.deployedAt ? formatAge(rev.deployedAt) + ' ago' : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function HelmReleaseDetailPage({
  params,
}: {
  params: Promise<{ namespace: string; name: string }>;
}) {
  const { namespace, name } = use(params);
  const decodedName = decodeURIComponent(name);
  const { data: release, isLoading, error } = useHelmRelease(decodedName, namespace);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-96 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (error || !release) {
    return (
      <div className="p-6">
        <Link href="/helm" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Helm Releases
        </Link>
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-8 text-center">
          <p className="text-destructive font-medium">
            {error ? error.message : `Helm release "${decodedName}" not found`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Breadcrumb */}
      <Link href="/helm" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Helm Releases
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        <Package className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-xl font-semibold font-mono">{decodedName}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
            <span>{release.chart} {release.chartVersion}</span>
            <span>·</span>
            <StatusBadge status={release.status} />
            <span>·</span>
            <span className="font-mono">{namespace}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'border-b-2 px-1 py-2 text-sm transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-foreground font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && <OverviewSection release={release} />}
      {activeTab === 'values' && <ValuesSection values={release.values ?? {}} />}
      {activeTab === 'history' && <HistorySection name={decodedName} namespace={namespace} />}
    </div>
  );
}
