'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Blocks, ExternalLink } from 'lucide-react';
import { useK8sResource } from '@/hooks/useK8sResource';
import { cn } from '@/lib/utils';
import { formatAge } from '@/lib/k8s/resource-utils';
import { groupToUrlSegment } from '@/lib/k8s/resource-utils';
import { YamlTab } from './tabs/YamlTab';
import { EventsTab } from './tabs/EventsTab';

interface CrdDetailPageProps {
  name: string;
}

interface CrdVersion {
  name: string;
  served: boolean;
  storage: boolean;
}

interface CrdNames {
  kind: string;
  plural: string;
  singular: string;
  shortNames?: string[];
  listKind: string;
}

type TabId = 'overview' | 'yaml' | 'events';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'yaml', label: 'YAML' },
  { id: 'events', label: 'Events' },
];

export function CrdDetailPage({ name }: CrdDetailPageProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const { data: resource, isLoading, error, refetch } = useK8sResource({
    group: 'apiextensions.k8s.io',
    version: 'v1',
    plural: 'customresourcedefinitions',
    name,
  });

  const listPath = '/resources/apiextensions.k8s.io/v1/customresourcedefinitions';

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-96 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="p-6">
        <Link href={listPath} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" /> Custom Resource Definitions
        </Link>
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-8 text-center">
          <p className="text-destructive font-medium">
            {error ? error.message : `CRD "${name}" not found`}
          </p>
        </div>
      </div>
    );
  }

  const spec = resource.spec as Record<string, unknown>;
  const crdNames = (spec?.names ?? {}) as CrdNames;
  const crdVersions = (spec?.versions ?? []) as CrdVersion[];
  const crdGroup = String(spec?.group ?? '');
  const crdScope = String(spec?.scope ?? '');
  const storageVersion = crdVersions.find((v) => v.storage)?.name ?? crdVersions[0]?.name ?? 'v1';
  const instancesPath = `/resources/${groupToUrlSegment(crdGroup)}/${storageVersion}/${crdNames.plural}`;

  return (
    <div className="p-6 space-y-4">
      {/* Breadcrumb */}
      <Link href={listPath} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Custom Resource Definitions
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Blocks className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-xl font-semibold font-mono">{name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
              <span>{crdNames.kind}</span>
              <span>·</span>
              <span>{crdGroup}</span>
              <span>·</span>
              <span>{formatAge(resource.metadata.creationTimestamp)} old</span>
            </div>
          </div>
        </div>
        <Link
          href={instancesPath}
          className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-accent transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          Browse Instances
        </Link>
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
      {activeTab === 'overview' && (
        <CrdOverview
          group={crdGroup}
          scope={crdScope}
          names={crdNames}
          versions={crdVersions}
          resource={resource}
        />
      )}
      {activeTab === 'yaml' && (
        <YamlTab
          resource={resource}
          group="apiextensions.k8s.io"
          version="v1"
          plural="customresourcedefinitions"
          canEdit={false}
          onSaved={() => refetch()}
        />
      )}
      {activeTab === 'events' && (
        <EventsTab resourceName={name} namespace={undefined} />
      )}
    </div>
  );
}

function CrdOverview({
  group,
  scope,
  names,
  versions,
  resource,
}: {
  group: string;
  scope: string;
  names: CrdNames;
  versions: CrdVersion[];
  resource: { metadata: { name: string; uid: string; creationTimestamp: string; resourceVersion: string } };
}) {
  return (
    <div className="space-y-6">
      {/* Spec */}
      <div>
        <h3 className="text-sm font-medium mb-2 text-muted-foreground">Spec</h3>
        <div className="rounded-lg border p-4">
          <Field label="Group" value={group} mono />
          <Field label="Kind" value={names.kind} />
          <Field label="Plural" value={names.plural} mono />
          <Field label="Singular" value={names.singular} mono />
          <Field label="Scope" value={scope} />
          {names.shortNames && names.shortNames.length > 0 && (
            <Field label="Short Names" value={names.shortNames.join(', ')} mono />
          )}
          <Field label="List Kind" value={names.listKind} />
        </div>
      </div>

      {/* Versions */}
      <div>
        <h3 className="text-sm font-medium mb-2 text-muted-foreground">Versions</h3>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-2 font-medium">Name</th>
                <th className="text-left px-4 py-2 font-medium">Served</th>
                <th className="text-left px-4 py-2 font-medium">Storage</th>
              </tr>
            </thead>
            <tbody>
              {versions.map((v) => (
                <tr key={v.name} className="border-b last:border-0">
                  <td className="px-4 py-2 font-mono">{v.name}</td>
                  <td className="px-4 py-2">
                    <span className={cn(
                      'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                      v.served ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-muted text-muted-foreground',
                    )}>
                      {v.served ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={cn(
                      'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                      v.storage ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-muted text-muted-foreground',
                    )}>
                      {v.storage ? 'Yes' : 'No'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Metadata */}
      <div>
        <h3 className="text-sm font-medium mb-2 text-muted-foreground">Metadata</h3>
        <div className="rounded-lg border p-4">
          <Field label="Name" value={resource.metadata.name} mono />
          <Field label="UID" value={resource.metadata.uid} mono />
          <Field label="Created" value={`${resource.metadata.creationTimestamp} (${formatAge(resource.metadata.creationTimestamp)} ago)`} />
          <Field label="Resource Version" value={resource.metadata.resourceVersion} />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline gap-4 py-1 text-sm">
      <span className="w-36 shrink-0 text-muted-foreground">{label}</span>
      <span className={mono ? 'font-mono text-xs' : ''}>{value}</span>
    </div>
  );
}
