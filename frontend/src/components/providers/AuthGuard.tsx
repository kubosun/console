'use client';

import { useUser } from '@/hooks/useUser';
import { Loader2 } from 'lucide-react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data, isLoading } = useUser();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // OAuth not enabled — allow access without auth (dev mode)
  if (data?.oauth_enabled === false) {
    return <>{children}</>;
  }

  // Not authenticated — redirect to login
  if (!data?.authenticated) {
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
    }
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    );
  }

  // Authenticated
  return <>{children}</>;
}
