'use client';

import { useQuery } from '@tanstack/react-query';
import { k8sList } from '@/lib/k8s/client';
import type { K8sResource } from '@/lib/k8s/types';

interface UseK8sResourceListOptions {
  group: string;
  version: string;
  plural: string;
  namespace?: string;
  enabled?: boolean;
  refetchInterval?: number;
}

export function useK8sResourceList({
  group,
  version,
  plural,
  namespace,
  enabled = true,
  refetchInterval = 10000,
}: UseK8sResourceListOptions) {
  return useQuery({
    queryKey: ['k8s', group, version, plural, namespace],
    queryFn: () => k8sList<K8sResource>(group, version, plural, namespace),
    enabled,
    refetchInterval,
    select: (data) => data.items,
  });
}
