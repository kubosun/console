'use client';

import { useQuery } from '@tanstack/react-query';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

export interface K8sEvent {
  type: string;
  reason: string;
  message: string;
  namespace: string;
  involvedObject: { kind: string; name: string };
  firstTimestamp: string;
  lastTimestamp: string;
  count: number;
  source: string;
}

interface EventsResponse {
  events: K8sEvent[];
  count: number;
}

interface UseEventsOptions {
  namespace?: string;
  type?: 'Normal' | 'Warning';
  involvedObjectKind?: string;
  involvedObjectName?: string;
  limit?: number;
  refetchInterval?: number;
}

export function useEvents(options: UseEventsOptions = {}) {
  return useQuery<EventsResponse>({
    queryKey: ['events', options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options.namespace) params.set('namespace', options.namespace);
      if (options.type) params.set('type', options.type);
      if (options.involvedObjectKind) params.set('involved_object_kind', options.involvedObjectKind);
      if (options.involvedObjectName) params.set('involved_object_name', options.involvedObjectName);
      if (options.limit) params.set('limit', String(options.limit));

      const response = await fetch(`${API_BASE}/api/events?${params}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error(`Events fetch failed (${response.status})`);
      return response.json();
    },
    refetchInterval: options.refetchInterval ?? 10000,
  });
}
