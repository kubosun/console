'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useK8sResource } from '@/hooks/useK8sResource';
import { useAccessReview } from '@/hooks/useAccessReview';
import { urlSegmentToGroup } from '@/lib/k8s/resource-utils';
import { getResourceConfig, getDefaultConfig } from '@/lib/k8s/resource-registry';
import { k8sDelete } from '@/lib/k8s/client';
import { cn } from '@/lib/utils';
import { formatAge, getResourceStatus } from '@/lib/k8s/resource-utils';
import { OverviewTab } from './tabs/OverviewTab';
import { YamlTab } from './tabs/YamlTab';
import { EventsTab } from './tabs/EventsTab';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

interface ResourceDetailPageProps {
  groupSlug: string;
  version: string;
  plural: string;
  name: string;
}

type TabId = 'overview' | 'yaml' | 'events';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'yaml', label: 'YAML' },
  { id: 'events', label: 'Events' },
];

export function ResourceDetailPage({
  groupSlug,
  version,
  plural,
  name,
}: ResourceDetailPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const namespace = searchParams.get('ns') ?? undefined;
  const apiGroup = urlSegmentToGroup(groupSlug);
  const config =
    getResourceConfig(groupSlug, version, plural) ??
    getDefaultConfig(apiGroup, version, plural);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: resource, isLoading, error, refetch } = useK8sResource({
    group: apiGroup,
    version,
    plural,
    name,
    namespace,
  });

  const { allowed: canDelete } = useAccessReview({
    verb: 'delete', resource: plural, group: apiGroup, namespace,
  });
  const { allowed: canUpdate } = useAccessReview({
    verb: 'update', resource: plural, group: apiGroup, namespace,
  });

  const Icon = config.icon;
  const listPath = `/resources/${groupSlug}/${version}/${plural}`;

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
          <ArrowLeft className="h-4 w-4" /> Back to {config.labelPlural}
        </Link>
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-8 text-center">
          <p className="text-destructive font-medium">
            {error ? error.message : `${config.label} "${name}" not found`}
          </p>
        </div>
      </div>
    );
  }

  const status = getResourceStatus(resource);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await k8sDelete(apiGroup, version, plural, name, namespace);
      router.push(listPath);
    } catch {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Breadcrumb */}
      <Link href={listPath} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {config.labelPlural}
      </Link>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-xl font-semibold font-mono">{name}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
              <span>{resource.kind}</span>
              {namespace && (
                <>
                  <span>in</span>
                  <span className="font-mono">{namespace}</span>
                </>
              )}
              <span>·</span>
              <span>{formatAge(resource.metadata.creationTimestamp)} old</span>
              <span>·</span>
              <span className={
                status.variant === 'success' ? 'text-green-600' :
                status.variant === 'error' ? 'text-red-600' :
                status.variant === 'warning' ? 'text-yellow-600' : ''
              }>
                {status.label}
              </span>
            </div>
          </div>
        </div>
        {canDelete && (
          <button
            onClick={() => setShowDelete(true)}
            className="flex items-center gap-1.5 rounded-md border border-destructive/50 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/5 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        )}
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
      {activeTab === 'overview' && <OverviewTab resource={resource} />}
      {activeTab === 'yaml' && (
        <YamlTab
          resource={resource}
          group={apiGroup}
          canEdit={canUpdate}
          version={version}
          plural={plural}
          onSaved={() => refetch()}
        />
      )}
      {activeTab === 'events' && (
        <EventsTab resourceName={name} namespace={namespace} />
      )}

      {/* Delete dialog */}
      {showDelete && (
        <DeleteConfirmDialog
          resource={resource}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
