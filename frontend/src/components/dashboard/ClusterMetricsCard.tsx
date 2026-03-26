'use client';

import { Cpu, MemoryStick } from 'lucide-react';
import { useNodeMetrics } from '@/hooks/useResourceMetrics';
import type { NodeMetricsList } from '@/hooks/useResourceMetrics';
import { parseK8sQuantity, formatCPU, formatMemory, usagePercent } from '@/lib/k8s/metrics-utils';
import { cn } from '@/lib/utils';

interface ClusterMetricsCardProps {
  capacity: {
    totalCPU: string;
    totalMemory: string;
    allocatableCPU: string;
    allocatableMemory: string;
  };
}

export function ClusterMetricsCard({ capacity }: ClusterMetricsCardProps) {
  const { data, isLoading, isError } = useNodeMetrics();

  const allocatableCPU = parseFloat(capacity.allocatableCPU);
  const allocatableMemory = parseFloat(capacity.allocatableMemory);

  let usedCPU = 0;
  let usedMemory = 0;

  if (data && 'items' in data) {
    const nodeMetrics = data as NodeMetricsList;
    for (const node of nodeMetrics.items) {
      usedCPU += parseK8sQuantity(node.usage.cpu);
      usedMemory += parseK8sQuantity(node.usage.memory);
    }
  }

  const cpuPercent = usagePercent(usedCPU, allocatableCPU);
  const memPercent = usagePercent(usedMemory, allocatableMemory);

  if (isError) {
    return (
      <div className="rounded-lg border p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <Cpu className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-medium">Cluster Metrics</h3>
            <p className="text-xs text-muted-foreground">Metrics API unavailable</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <Cpu className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-sm font-medium">Cluster Metrics</h3>
          <p className="text-xs text-muted-foreground">CPU and memory usage</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* CPU */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-sm">
              <Cpu className="h-3.5 w-3.5 text-blue-500" />
              <span>CPU</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {isLoading
                ? '...'
                : `${formatCPU(usedCPU)} / ${formatCPU(allocatableCPU)}`}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                cpuPercent > 90 ? 'bg-red-500' : cpuPercent > 70 ? 'bg-yellow-500' : 'bg-blue-500',
              )}
              style={{ width: isLoading ? '0%' : `${cpuPercent}%` }}
            />
          </div>
          {!isLoading && (
            <p className="text-xs text-muted-foreground mt-1">{cpuPercent}% used</p>
          )}
        </div>

        {/* Memory */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-sm">
              <MemoryStick className="h-3.5 w-3.5 text-purple-500" />
              <span>Memory</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {isLoading
                ? '...'
                : `${formatMemory(usedMemory)} / ${formatMemory(allocatableMemory)}`}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                memPercent > 90 ? 'bg-red-500' : memPercent > 70 ? 'bg-yellow-500' : 'bg-purple-500',
              )}
              style={{ width: isLoading ? '0%' : `${memPercent}%` }}
            />
          </div>
          {!isLoading && (
            <p className="text-xs text-muted-foreground mt-1">{memPercent}% used</p>
          )}
        </div>
      </div>
    </div>
  );
}
