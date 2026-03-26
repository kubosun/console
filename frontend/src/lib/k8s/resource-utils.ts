/**
 * Kubernetes resource utility functions.
 */

import type { K8sResource } from './types';

/** Convert empty API group to "core" for URL segments. */
export function groupToUrlSegment(group: string): string {
  return group === '' ? 'core' : group;
}

/** Convert "core" URL segment back to empty string for API calls. */
export function urlSegmentToGroup(segment: string): string {
  return segment === 'core' ? '' : segment;
}

/** Format an ISO timestamp as a relative age string. */
export function formatAge(timestamp: string): string {
  const now = Date.now();
  const created = new Date(timestamp).getTime();
  const diffMs = now - created;

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;

  const months = Math.floor(days / 30);
  return `${months}mo`;
}

/** Extract a human-readable status from a K8s resource. */
export function getResourceStatus(resource: K8sResource): {
  label: string;
  variant: 'success' | 'warning' | 'error' | 'default';
} {
  const status = resource.status ?? {};

  // Pods
  const phase = status.phase as string | undefined;
  if (phase) {
    if (phase === 'Running' || phase === 'Succeeded')
      return { label: phase, variant: 'success' };
    if (phase === 'Pending') return { label: phase, variant: 'warning' };
    if (phase === 'Failed') return { label: phase, variant: 'error' };
    return { label: phase, variant: 'default' };
  }

  // Deployments / ReplicaSets — check conditions
  const conditions = status.conditions as
    | Array<{ type: string; status: string }>
    | undefined;
  if (conditions) {
    const available = conditions.find((c) => c.type === 'Available');
    if (available) {
      return available.status === 'True'
        ? { label: 'Available', variant: 'success' }
        : { label: 'Unavailable', variant: 'warning' };
    }
  }

  // Services — always active
  if (resource.kind === 'Service') {
    return { label: 'Active', variant: 'success' };
  }

  // Namespaces
  if (status.phase === 'Active') {
    return { label: 'Active', variant: 'success' };
  }

  return { label: 'Unknown', variant: 'default' };
}

/** Build the K8s API path for a resource type. */
export function buildApiPath(
  group: string,
  version: string,
  plural: string,
  namespace?: string,
  name?: string,
): string {
  const base = group ? `apis/${group}/${version}` : `api/${version}`;
  const nsSegment = namespace ? `namespaces/${namespace}/` : '';
  const nameSegment = name ? `/${name}` : '';
  return `${base}/${nsSegment}${plural}${nameSegment}`;
}
