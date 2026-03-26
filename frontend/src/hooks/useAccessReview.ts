'use client';

import { useQuery } from '@tanstack/react-query';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

interface AccessReviewAttrs {
  verb: string;
  resource: string;
  group?: string;
  namespace?: string;
}

/**
 * Check if the current user can perform an action on a resource.
 * Returns allowed=true while loading (fail-open to not block UI).
 */
export function useAccessReview(attrs: AccessReviewAttrs): {
  allowed: boolean;
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: ['rbac', attrs.verb, attrs.resource, attrs.group ?? '', attrs.namespace ?? ''],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/permissions/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          verb: attrs.verb,
          resource: attrs.resource,
          group: attrs.group ?? '',
          namespace: attrs.namespace ?? null,
        }),
      });
      if (!response.ok) {
        // If permission check fails, default to allowed (fail-open)
        return { allowed: true, reason: '' };
      }
      return response.json();
    },
    staleTime: 30000,
    retry: false,
  });

  return {
    allowed: data?.allowed ?? true, // fail-open while loading
    isLoading,
  };
}
