'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchResourceModels } from '@/lib/k8s/client';

/**
 * Returns a Set of available API groups on the cluster.
 * Used for feature flags — hide nav items for unavailable CRDs.
 */
export function useApiGroups(): { groups: Set<string>; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ['api-groups'],
    queryFn: async () => {
      const result = await fetchResourceModels();
      const groups = new Set<string>();
      for (const model of Object.values(result.models)) {
        if (model.apiGroup) {
          groups.add(model.apiGroup);
        }
      }
      return Array.from(groups);
    },
    staleTime: 300000, // 5 minutes — matches backend cache TTL
  });

  return {
    groups: new Set(data ?? []),
    isLoading,
  };
}
