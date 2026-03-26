'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAlerts, fetchAlertCounts } from '@/lib/monitoring/client';
import type { AlertsResponse, AlertCounts } from '@/lib/monitoring/client';

export function useAlerts() {
  return useQuery<AlertsResponse>({
    queryKey: ['alerts'],
    queryFn: fetchAlerts,
    refetchInterval: 30000,
  });
}

export function useAlertCounts() {
  return useQuery<AlertCounts>({
    queryKey: ['alerts', 'counts'],
    queryFn: fetchAlertCounts,
    refetchInterval: 30000,
  });
}
