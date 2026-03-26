'use client';

import { useQuery } from '@tanstack/react-query';
import { k8sFetch } from '@/lib/k8s/client';

export interface ContainerMetrics {
  name: string;
  usage: { cpu: string; memory: string };
}

export interface PodMetrics {
  metadata: { name: string; namespace: string; creationTimestamp: string };
  timestamp: string;
  window: string;
  containers: ContainerMetrics[];
}

export interface PodMetricsList {
  items: PodMetrics[];
}

export interface NodeMetrics {
  metadata: { name: string; creationTimestamp: string };
  timestamp: string;
  window: string;
  usage: { cpu: string; memory: string };
}

export interface NodeMetricsList {
  items: NodeMetrics[];
}

export function usePodMetrics(namespace: string, name?: string) {
  const path = name
    ? `apis/metrics.k8s.io/v1beta1/namespaces/${namespace}/pods/${name}`
    : `apis/metrics.k8s.io/v1beta1/namespaces/${namespace}/pods`;

  return useQuery<PodMetrics | PodMetricsList>({
    queryKey: ['metrics', 'pods', namespace, name],
    queryFn: () => k8sFetch(path),
    refetchInterval: 15000,
  });
}

export function useNodeMetrics(name?: string) {
  const path = name
    ? `apis/metrics.k8s.io/v1beta1/nodes/${name}`
    : `apis/metrics.k8s.io/v1beta1/nodes`;

  return useQuery<NodeMetrics | NodeMetricsList>({
    queryKey: ['metrics', 'nodes', name],
    queryFn: () => k8sFetch(path),
    refetchInterval: 15000,
  });
}
