'use client';

import { useQuery } from '@tanstack/react-query';
import type { HelmRelease } from '@/lib/k8s/types';

async function fetchHelmReleases(namespace?: string): Promise<HelmRelease[]> {
  const params = namespace ? `?namespace=${namespace}` : '';
  const res = await fetch(`/api/helm/releases${params}`);
  if (!res.ok) throw new Error(`Failed to fetch Helm releases: ${res.statusText}`);
  return res.json();
}

async function fetchHelmRelease(name: string, namespace: string): Promise<HelmRelease> {
  const res = await fetch(`/api/helm/releases/${namespace}/${name}`);
  if (!res.ok) throw new Error(`Failed to fetch Helm release: ${res.statusText}`);
  return res.json();
}

async function fetchHelmReleaseHistory(name: string, namespace: string): Promise<HelmRelease[]> {
  const res = await fetch(`/api/helm/releases/${namespace}/${name}/history`);
  if (!res.ok) throw new Error(`Failed to fetch release history: ${res.statusText}`);
  return res.json();
}

export function useHelmReleases(namespace?: string) {
  return useQuery({
    queryKey: ['helm', 'releases', namespace],
    queryFn: () => fetchHelmReleases(namespace),
    refetchInterval: 10000,
  });
}

export function useHelmRelease(name: string, namespace: string) {
  return useQuery({
    queryKey: ['helm', 'release', namespace, name],
    queryFn: () => fetchHelmRelease(name, namespace),
    enabled: !!name && !!namespace,
    refetchInterval: 10000,
  });
}

export function useHelmReleaseHistory(name: string, namespace: string) {
  return useQuery({
    queryKey: ['helm', 'history', namespace, name],
    queryFn: () => fetchHelmReleaseHistory(name, namespace),
    enabled: !!name && !!namespace,
    refetchInterval: 10000,
  });
}
