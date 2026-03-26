'use client';

import { Cpu, MemoryStick } from 'lucide-react';
import { usePodMetrics } from '@/hooks/useResourceMetrics';
import type { PodMetrics } from '@/hooks/useResourceMetrics';
import { parseK8sQuantity, formatCPU, formatMemory } from '@/lib/k8s/metrics-utils';
import { cn } from '@/lib/utils';

interface PodMetricsPanelProps {
  name: string;
  namespace: string;
}

export function PodMetricsPanel({ name, namespace }: PodMetricsPanelProps) {
  const { data, isLoading, isError } = usePodMetrics(namespace, name);

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

  const podMetrics = data as PodMetrics;
  const containers = podMetrics.containers ?? [];

  if (containers.length === 0) {
    return (
      <div className="rounded-lg border p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Resource Usage</h3>
        <p className="text-xs text-muted-foreground">No metrics available</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">Resource Usage</h3>
      <div className="space-y-3">
        {containers.map((container) => {
          const cpuMillicores = parseK8sQuantity(container.usage.cpu);
          const memoryBytes = parseK8sQuantity(container.usage.memory);
          return (
            <div key={container.name} className="space-y-2">
              <span className="text-sm font-medium">{container.name}</span>
              <div className="grid grid-cols-2 gap-4">
                <MetricBar
                  icon={<Cpu className="h-3.5 w-3.5 text-blue-500" />}
                  label="CPU"
                  value={formatCPU(cpuMillicores)}
                  barColor="bg-blue-500"
                />
                <MetricBar
                  icon={<MemoryStick className="h-3.5 w-3.5 text-purple-500" />}
                  label="Memory"
                  value={formatMemory(memoryBytes)}
                  barColor="bg-purple-500"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MetricBar({
  icon,
  label,
  value,
  barColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  barColor: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 text-xs">
          {icon}
          <span>{label}</span>
        </div>
        <span className="text-xs font-mono text-muted-foreground">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full', barColor)} style={{ width: '100%' }} />
      </div>
    </div>
  );
}
