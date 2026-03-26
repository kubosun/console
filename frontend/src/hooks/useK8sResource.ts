'use client';

import { useQuery } from '@tanstack/react-query';
import { k8sGet } from '@/lib/k8s/client';
import type { K8sResource } from '@/lib/k8s/types';

interface UseK8sResourceOptions {
  group: string;
  version: string;
  plural: string;
  name: string;
  namespace?: string;
  enabled?: boolean;
  refetchInterval?: number;
}

export function useK8sResource({
  group,
  version,
  plural,
  name,
  namespace,
  enabled = true,
  refetchInterval = 10000,
}: UseK8sResourceOptions) {
  return useQuery({
    queryKey: ['k8s', group, version, plural, namespace, name],
    queryFn: () => k8sGet<K8sResource>(group, version, plural, name, namespace),
    enabled,
    refetchInterval,
  });
}
