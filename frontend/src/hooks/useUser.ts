'use client';

import { useQuery } from '@tanstack/react-query';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

interface UserInfo {
  authenticated: boolean;
  oauth_enabled?: boolean;
  user?: {
    name: string;
    uid: string;
    email: string;
  };
}

export function useUser() {
  return useQuery<UserInfo>({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/auth/user`, {
        credentials: 'include',
      });
      if (response.status === 401) {
        return { authenticated: false };
      }
      return response.json();
    },
    retry: false,
    staleTime: 60000,
  });
}
