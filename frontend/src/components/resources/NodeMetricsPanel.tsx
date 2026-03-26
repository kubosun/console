'use client';

import { Cpu, MemoryStick } from 'lucide-react';
import { useNodeMetrics } from '@/hooks/useResourceMetrics';
import type { NodeMetrics } from '@/hooks/useResourceMetrics';
import type { K8sResource } from '@/lib/k8s/types';
import { parseK8sQuantity, formatCPU, formatMemory, usagePercent } from '@/lib/k8s/metrics-utils';
import { cn } from '@/lib/utils';

interface NodeMetricsPanelProps {
  name: string;
  resource: K8sResource;
}

export function NodeMetricsPanel({ name, resource }: NodeMetricsPanelProps) {
  const { data, isLoading, isError } = useNodeMetrics(name);

  if (isError) {
    return (
      <div className="rounded-lg border p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Resource Usage</h3>
        <p className="text-xs text-muted-foreground">Metrics API unavailable</p>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="rounded-lg border p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Resource Usage</h3>
        <div className="h-16 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  const nodeMetrics = data as NodeMetrics;
  const status = (resource as Record<string, unknown>).status as Record<string, unknown> | undefined;
  const allocatable = (status?.allocatable ?? {}) as Record<string, string>;
  const capacity = (status?.capacity ?? {}) as Record<string, string>;

  const usedCPU = parseK8sQuantity(nodeMetrics.usage.cpu);
  const usedMemory = parseK8sQuantity(nodeMetrics.usage.memory);
  const allocatableCPU = parseK8sQuantity(allocatable.cpu ?? capacity.cpu ?? '0');
  const allocatableMemory = parseK8sQuantity(allocatable.memory ?? capacity.memory ?? '0');

  const cpuPct = usagePercent(usedCPU, allocatableCPU);
  const memPct = usagePercent(usedMemory, allocatableMemory);

  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Resource Usage</h3>
      <div className="space-y-4">
        {/* CPU */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-sm">
              <Cpu className="h-3.5 w-3.5 text-blue-500" />
              <span>CPU</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatCPU(usedCPU)} / {formatCPU(allocatableCPU)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                cpuPct > 90 ? 'bg-red-500' : cpuPct > 70 ? 'bg-yellow-500' : 'bg-blue-500',
              )}
              style={{ width: `${cpuPct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{cpuPct}% used</p>
        </div>

        {/* Memory */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-sm">
              <MemoryStick className="h-3.5 w-3.5 text-purple-500" />
              <span>Memory</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {formatMemory(usedMemory)} / {formatMemory(allocatableMemory)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                memPct > 90 ? 'bg-red-500' : memPct > 70 ? 'bg-yellow-500' : 'bg-purple-500',
              )}
              style={{ width: `${memPct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{memPct}% used</p>
        </div>
      </div>
    </div>
  );
}
