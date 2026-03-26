'use client';

import { Container, Rocket, Globe, FolderOpen } from 'lucide-react';
import { useClusterSummary } from '@/hooks/useClusterSummary';
import { ClusterInfoCard } from '@/components/dashboard/ClusterInfoCard';
import { ResourceCountCard } from '@/components/dashboard/ResourceCountCard';
import { NodeHealthCard } from '@/components/dashboard/NodeHealthCard';
import { RecentEventsCard } from '@/components/dashboard/RecentEventsCard';

export default function DashboardPage() {
  const { data, isLoading } = useClusterSummary();

  if (isLoading || !data) {
    return (
      <div className="p-8 space-y-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Cluster overview — click the bot icon to chat with AI
        </p>
      </div>

      {/* Top row: Cluster info + Node health */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ClusterInfoCard
          version={data.cluster.version}
          platform={data.cluster.platform}
        />
        <NodeHealthCard
          total={data.nodes.total}
          ready={data.nodes.ready}
          notReady={data.nodes.notReady}
        />
      </div>

      {/* Resource counts */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <ResourceCountCard
          label="Pods"
          count={data.counts.pods ?? 0}
          icon={Container}
          href="/resources/core/v1/pods"
        />
        <ResourceCountCard
          label="Deployments"
          count={data.counts.deployments ?? 0}
          icon={Rocket}
          href="/resources/apps/v1/deployments"
        />
        <ResourceCountCard
          label="Services"
          count={data.counts.services ?? 0}
          icon={Globe}
          href="/resources/core/v1/services"
        />
        <ResourceCountCard
          label="Namespaces"
          count={data.counts.namespaces ?? 0}
          icon={FolderOpen}
          href="/resources/core/v1/namespaces"
        />
      </div>

      {/* Recent events */}
      <RecentEventsCard events={data.events} />
    </div>
  );
}
