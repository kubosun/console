/**
 * Resource type registry — central config for all known resource types.
 *
 * To add a new resource type, append an entry to RESOURCE_REGISTRY.
 * The generic list/detail pages use this config for columns, icons, and labels.
 */

import type { LucideIcon } from 'lucide-react';
import {
  Box,
  Container,
  FileText,
  Globe,
  Lock,
  Rocket,
} from 'lucide-react';
import type { K8sResource } from './types';
import { formatAge, getResourceStatus } from './resource-utils';

export interface ColumnDef {
  id: string;
  header: string;
  accessor: (resource: K8sResource) => string;
  sortable?: boolean;
}

export interface ResourceTypeConfig {
  group: string;
  version: string;
  plural: string;
  kind: string;
  label: string;
  labelPlural: string;
  namespaced: boolean;
  icon: LucideIcon;
  columns: ColumnDef[];
}

/** Default columns for any resource type not in the registry. */
export const DEFAULT_COLUMNS: ColumnDef[] = [
  {
    id: 'name',
    header: 'Name',
    accessor: (r) => r.metadata.name,
    sortable: true,
  },
  {
    id: 'namespace',
    header: 'Namespace',
    accessor: (r) => r.metadata.namespace ?? '-',
    sortable: true,
  },
  {
    id: 'age',
    header: 'Age',
    accessor: (r) => formatAge(r.metadata.creationTimestamp),
    sortable: true,
  },
];

/** Registry keyed by "groupSlug/version/plural" where groupSlug is "core" for empty group. */
export const RESOURCE_REGISTRY = new Map<string, ResourceTypeConfig>([
  [
    'core/v1/pods',
    {
      group: '',
      version: 'v1',
      plural: 'pods',
      kind: 'Pod',
      label: 'Pod',
      labelPlural: 'Pods',
      namespaced: true,
      icon: Container,
      columns: [
        { id: 'name', header: 'Name', accessor: (r) => r.metadata.name, sortable: true },
        { id: 'namespace', header: 'Namespace', accessor: (r) => r.metadata.namespace ?? '-', sortable: true },
        { id: 'status', header: 'Status', accessor: (r) => getResourceStatus(r).label, sortable: true },
        { id: 'restarts', header: 'Restarts', accessor: (r) => {
          const statuses = (r.status?.containerStatuses as Array<{ restartCount: number }>) ?? [];
          return String(statuses.reduce((sum, s) => sum + (s.restartCount ?? 0), 0));
        }},
        { id: 'age', header: 'Age', accessor: (r) => formatAge(r.metadata.creationTimestamp), sortable: true },
      ],
    },
  ],
  [
    'apps/v1/deployments',
    {
      group: 'apps',
      version: 'v1',
      plural: 'deployments',
      kind: 'Deployment',
      label: 'Deployment',
      labelPlural: 'Deployments',
      namespaced: true,
      icon: Rocket,
      columns: [
        { id: 'name', header: 'Name', accessor: (r) => r.metadata.name, sortable: true },
        { id: 'namespace', header: 'Namespace', accessor: (r) => r.metadata.namespace ?? '-', sortable: true },
        { id: 'ready', header: 'Ready', accessor: (r) => {
          const ready = (r.status?.readyReplicas as number) ?? 0;
          const desired = (r.spec?.replicas as number) ?? 0;
          return `${ready}/${desired}`;
        }},
        { id: 'status', header: 'Status', accessor: (r) => getResourceStatus(r).label, sortable: true },
        { id: 'age', header: 'Age', accessor: (r) => formatAge(r.metadata.creationTimestamp), sortable: true },
      ],
    },
  ],
  [
    'core/v1/services',
    {
      group: '',
      version: 'v1',
      plural: 'services',
      kind: 'Service',
      label: 'Service',
      labelPlural: 'Services',
      namespaced: true,
      icon: Globe,
      columns: [
        { id: 'name', header: 'Name', accessor: (r) => r.metadata.name, sortable: true },
        { id: 'namespace', header: 'Namespace', accessor: (r) => r.metadata.namespace ?? '-', sortable: true },
        { id: 'type', header: 'Type', accessor: (r) => String(r.spec?.type ?? '-') },
        { id: 'clusterIP', header: 'Cluster IP', accessor: (r) => String(r.spec?.clusterIP ?? '-') },
        { id: 'age', header: 'Age', accessor: (r) => formatAge(r.metadata.creationTimestamp), sortable: true },
      ],
    },
  ],
  [
    'core/v1/configmaps',
    {
      group: '',
      version: 'v1',
      plural: 'configmaps',
      kind: 'ConfigMap',
      label: 'ConfigMap',
      labelPlural: 'ConfigMaps',
      namespaced: true,
      icon: FileText,
      columns: [
        { id: 'name', header: 'Name', accessor: (r) => r.metadata.name, sortable: true },
        { id: 'namespace', header: 'Namespace', accessor: (r) => r.metadata.namespace ?? '-', sortable: true },
        { id: 'keys', header: 'Keys', accessor: (r) => String(Object.keys(r.data ?? {}).length) },
        { id: 'age', header: 'Age', accessor: (r) => formatAge(r.metadata.creationTimestamp), sortable: true },
      ],
    },
  ],
  [
    'core/v1/secrets',
    {
      group: '',
      version: 'v1',
      plural: 'secrets',
      kind: 'Secret',
      label: 'Secret',
      labelPlural: 'Secrets',
      namespaced: true,
      icon: Lock,
      columns: [
        { id: 'name', header: 'Name', accessor: (r) => r.metadata.name, sortable: true },
        { id: 'namespace', header: 'Namespace', accessor: (r) => r.metadata.namespace ?? '-', sortable: true },
        { id: 'type', header: 'Type', accessor: (r) => String(r.type ?? '-') },
        { id: 'keys', header: 'Keys', accessor: (r) => String(Object.keys(r.data ?? {}).length) },
        { id: 'age', header: 'Age', accessor: (r) => formatAge(r.metadata.creationTimestamp), sortable: true },
      ],
    },
  ],
]);

/** Look up a resource config by URL segments. */
export function getResourceConfig(
  groupSlug: string,
  version: string,
  plural: string,
): ResourceTypeConfig | undefined {
  return RESOURCE_REGISTRY.get(`${groupSlug}/${version}/${plural}`);
}

/** Get a default config for unknown resource types. */
export function getDefaultConfig(
  group: string,
  version: string,
  plural: string,
): ResourceTypeConfig {
  return {
    group,
    version,
    plural,
    kind: plural.charAt(0).toUpperCase() + plural.slice(1),
    label: plural.charAt(0).toUpperCase() + plural.slice(1, -1),
    labelPlural: plural.charAt(0).toUpperCase() + plural.slice(1),
    namespaced: true,
    icon: Box,
    columns: DEFAULT_COLUMNS,
  };
}
