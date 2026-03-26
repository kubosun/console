'use client';

import { useMemo } from 'react';
import { Cpu, MemoryStick } from 'lucide-react';
import { useNodeMetrics } from '@/hooks/useResourceMetrics';
import type { NodeMetricsList } from '@/hooks/useResourceMetrics';
import { usePrometheusRangeQuery } from '@/hooks/usePrometheusQuery';
import { parseK8sQuantity, formatCPU, formatMemory, usagePercent } from '@/lib/k8s/metrics-utils';
import { cn } from '@/lib/utils';
import { MetricsChart } from './MetricsChart';
import type { DataPoint } from './MetricsChart';

interface ClusterMetricsCardProps {
  capacity: {
    totalCPU: string;
    totalMemory: string;
    allocatableCPU: string;
    allocatableMemory: string;
  };
}

function useTimeRange() {
  return useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    const oneHourAgo = now - 3600;
    return {
      start: String(oneHourAgo),
      end: String(now),
      step: '60',
    };
  }, []);
}

function prometheusToDataPoints(data: unknown): DataPoint[] {
  const result = data as {
    data?: { result?: Array<{ values?: [number, string][] }> };
  };
  const series = result?.data?.result?.[0]?.values;
  if (!series) return [];
  return series.map(([timestamp, value]) => ({
    time: timestamp,
    value: parseFloat(value),
  }));
}

export function ClusterMetricsCard({ capacity }: ClusterMetricsCardProps) {
  const { data, isLoading, isError } = useNodeMetrics();
  const { start, end, step } = useTimeRange();

  const cpuQuery = 'sum(rate(node_cpu_seconds_total{mode!="idle"}[2m])) * 1000';
  const memQuery = 'sum(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes)';

  const { data: cpuHistory } = usePrometheusRangeQuery(cpuQuery, start, end, step);
  const { data: memHistory } = usePrometheusRangeQuery(memQuery, start, end, step);

  const cpuChartData = useMemo(() => prometheusToDataPoints(cpuHistory), [cpuHistory]);
  const memChartData = useMemo(() => {
    const points = prometheusToDataPoints(memHistory);
    return points.map((p) => ({ ...p, value: p.value / (1024 ** 3) }));
  }, [memHistory]);

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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
          <div className="h-2 rounded-full bg-muted overflow-hidden mb-1">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                cpuPercent > 90 ? 'bg-red-500' : cpuPercent > 70 ? 'bg-yellow-500' : 'bg-blue-500',
              )}
              style={{ width: isLoading ? '0%' : `${cpuPercent}%` }}
            />
          </div>
          {!isLoading && (
            <p className="text-xs text-muted-foreground mb-3">{cpuPercent}% used</p>
          )}
          {cpuChartData.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Last hour (millicores)</p>
              <MetricsChart data={cpuChartData} color="#3b82f6" unit="m" height={140} />
            </div>
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
          <div className="h-2 rounded-full bg-muted overflow-hidden mb-1">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                memPercent > 90 ? 'bg-red-500' : memPercent > 70 ? 'bg-yellow-500' : 'bg-purple-500',
              )}
              style={{ width: isLoading ? '0%' : `${memPercent}%` }}
            />
          </div>
          {!isLoading && (
            <p className="text-xs text-muted-foreground mb-3">{memPercent}% used</p>
          )}
          {memChartData.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Last hour (GiB)</p>
              <MetricsChart data={memChartData} color="#a855f7" unit=" GiB" height={140} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
