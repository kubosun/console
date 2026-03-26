'use client';

import { Server } from 'lucide-react';

interface ClusterInfoCardProps {
  version: string;
  platform: string;
}

export function ClusterInfoCard({ version, platform }: ClusterInfoCardProps) {
  return (
    <div className="rounded-lg border p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Server className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-medium">Cluster</h3>
          <p className="text-xs text-muted-foreground">Kubernetes Platform</p>
        </div>
      </div>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Version</span>
          <span className="font-mono text-xs">{version}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Platform</span>
          <span className="font-mono text-xs">{platform}</span>
        </div>
      </div>
    </div>
  );
}
