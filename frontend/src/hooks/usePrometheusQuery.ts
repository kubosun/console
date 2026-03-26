'use client';

import { useQuery } from '@tanstack/react-query';
import { promQuery, promQueryRange } from '@/lib/monitoring/client';
import type { PrometheusResult } from '@/lib/monitoring/client';

interface UsePrometheusQueryOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

export function usePrometheusQuery(
  query: string,
  options: UsePrometheusQueryOptions = {},
) {
  return useQuery<PrometheusResult>({
    queryKey: ['prometheus', 'query', query],
    queryFn: () => promQuery(query),
    enabled: options.enabled ?? true,
    refetchInterval: options.refetchInterval ?? 30000,
  });
}

export function usePrometheusRangeQuery(
  query: string,
  start: string,
  end: string,
  step: string,
  options: UsePrometheusQueryOptions = {},
) {
  return useQuery<PrometheusResult>({
    queryKey: ['prometheus', 'range', query, start, end, step],
    queryFn: () => promQueryRange(query, start, end, step),
    enabled: options.enabled ?? true,
    refetchInterval: options.refetchInterval ?? 30000,
  });
}
