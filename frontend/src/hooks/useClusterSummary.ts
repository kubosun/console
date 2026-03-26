'use client';

import { useQuery } from '@tanstack/react-query';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export interface ClusterSummary {
  cluster: { version: string; platform: string };
  nodes: { total: number; ready: number; notReady: number };
  counts: Record<string, number>;
  events: Array<{
    type: string;
    reason: string;
    message: string;
    namespace: string;
    involvedObject: string;
    lastTimestamp: string;
    count: number;
  }>;
  timestamp: string;
}

export function useClusterSummary() {
  return useQuery({
    queryKey: ['cluster-summary'],
    queryFn: async (): Promise<ClusterSummary> => {
      const response = await fetch(`${API_BASE}/api/cluster/summary`);
      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      return response.json();
    },
    refetchInterval: 15000,
  });
}
