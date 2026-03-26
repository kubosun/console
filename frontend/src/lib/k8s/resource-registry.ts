/**
 * Resource type registry — central config for all known resource types.
 *
 * To add a new resource type, append an entry to RESOURCE_REGISTRY.
 * The generic list/detail pages use this config for columns, icons, and labels.
 */

import type { LucideIcon } from 'lucide-react';
import {
  Blocks,
  Box,
  Container,
  FileText,
  Globe,
  Layers,
  Lock,
  Monitor,
  Network,
  Rocket,
  Split,
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
  [
    'core/v1/nodes',
    {
      group: '',
      version: 'v1',
      plural: 'nodes',
      kind: 'Node',
      label: 'Node',
      labelPlural: 'Nodes',
      namespaced: false,
      icon: Monitor,
      columns: [
        { id: 'name', header: 'Name', accessor: (r) => r.metadata.name, sortable: true },
        { id: 'status', header: 'Status', accessor: (r) => {
          const conditions = (r.status?.conditions as Array<{ type: string; status: string }>) ?? [];
          const ready = conditions.find((c) => c.type === 'Ready');
          return ready?.status === 'True' ? 'Ready' : 'NotReady';
        }, sortable: true },
        { id: 'roles', header: 'Roles', accessor: (r) => {
          const labels = r.metadata.labels ?? {};
          return Object.keys(labels)
            .filter((k) => k.startsWith('node-role.kubernetes.io/'))
            .map((k) => k.replace('node-role.kubernetes.io/', ''))
            .join(', ') || 'none';
        }},
        { id: 'version', header: 'Version', accessor: (r) => String((r.status as Record<string, unknown>)?.nodeInfo ? ((r.status as Record<string, unknown>).nodeInfo as Record<string, string>).kubeletVersion : '-') },
        { id: 'age', header: 'Age', accessor: (r) => formatAge(r.metadata.creationTimestamp), sortable: true },
      ],
    },
  ],
  [
    'core/v1/namespaces',
    {
      group: '',
      version: 'v1',
      plural: 'namespaces',
      kind: 'Namespace',
      label: 'Namespace',
      labelPlural: 'Namespaces',
      namespaced: false,
      icon: Box,
      columns: [
        { id: 'name', header: 'Name', accessor: (r) => r.metadata.name, sortable: true },
        { id: 'status', header: 'Status', accessor: (r) => String(r.status?.phase ?? '-'), sortable: true },
        { id: 'age', header: 'Age', accessor: (r) => formatAge(r.metadata.creationTimestamp), sortable: true },
      ],
    },
  ],
  [
    'networking.k8s.io/v1/ingresses',
    {
      group: 'networking.k8s.io',
      version: 'v1',
      plural: 'ingresses',
      kind: 'Ingress',
      label: 'Ingress',
      labelPlural: 'Ingresses',
      namespaced: true,
      icon: Network,
      columns: [
        { id: 'name', header: 'Name', accessor: (r) => r.metadata.name, sortable: true },
        { id: 'namespace', header: 'Namespace', accessor: (r) => r.metadata.namespace ?? '-', sortable: true },
        { id: 'class', header: 'Class', accessor: (r) => String(r.spec?.ingressClassName ?? '-') },
        { id: 'hosts', header: 'Hosts', accessor: (r) => {
          const rules = (r.spec?.rules as Array<{ host?: string }>) ?? [];
          return rules.map((rule) => rule.host ?? '*').join(', ') || '-';
        }},
        { id: 'age', header: 'Age', accessor: (r) => formatAge(r.metadata.creationTimestamp), sortable: true },
      ],
    },
  ],
  [
    'route.openshift.io/v1/routes',
    {
      group: 'route.openshift.io',
      version: 'v1',
      plural: 'routes',
      kind: 'Route',
      label: 'Route',
      labelPlural: 'Routes',
      namespaced: true,
      icon: Split,
      columns: [
        { id: 'name', header: 'Name', accessor: (r) => r.metadata.name, sortable: true },
        { id: 'namespace', header: 'Namespace', accessor: (r) => r.metadata.namespace ?? '-', sortable: true },
        { id: 'host', header: 'Host', accessor: (r) => String(r.spec?.host ?? '-') },
        { id: 'path', header: 'Path', accessor: (r) => String(r.spec?.path ?? '/') },
        { id: 'service', header: 'Service', accessor: (r) => String((r.spec?.to as Record<string, unknown>)?.name ?? '-') },
        { id: 'tls', header: 'TLS', accessor: (r) => r.spec?.tls ? 'Yes' : 'No' },
        { id: 'age', header: 'Age', accessor: (r) => formatAge(r.metadata.creationTimestamp), sortable: true },
      ],
    },
  ],
  [
    'apiextensions.k8s.io/v1/customresourcedefinitions',
    {
      group: 'apiextensions.k8s.io',
      version: 'v1',
      plural: 'customresourcedefinitions',
      kind: 'CustomResourceDefinition',
      label: 'CRD',
      labelPlural: 'Custom Resource Definitions',
      namespaced: false,
      icon: Blocks,
      columns: [
        { id: 'name', header: 'Name', accessor: (r) => r.metadata.name, sortable: true },
        {
          id: 'group',
          header: 'Group',
          accessor: (r) => String((r.spec as Record<string, unknown>)?.group ?? '-'),
          sortable: true,
        },
        {
          id: 'kind',
          header: 'Kind',
          accessor: (r) => {
            const names = (r.spec as Record<string, unknown>)?.names as Record<string, unknown> | undefined;
            return String(names?.kind ?? '-');
          },
          sortable: true,
        },
        {
          id: 'scope',
          header: 'Scope',
          accessor: (r) => String((r.spec as Record<string, unknown>)?.scope ?? '-'),
          sortable: true,
        },
        {
          id: 'versions',
          header: 'Versions',
          accessor: (r) => {
            const versions = (r.spec as Record<string, unknown>)?.versions as Array<{ name: string; served: boolean }> | undefined;
            return versions?.filter((v) => v.served).map((v) => v.name).join(', ') || '-';
          },
        },
        { id: 'age', header: 'Age', accessor: (r) => formatAge(r.metadata.creationTimestamp), sortable: true },
      ],
    },
  ],
  [
    'operators.coreos.com/v1alpha1/clusterserviceversions',
    {
      group: 'operators.coreos.com',
      version: 'v1alpha1',
      plural: 'clusterserviceversions',
      kind: 'ClusterServiceVersion',
      label: 'Operator',
      labelPlural: 'Operators',
      namespaced: true,
      icon: Layers,
      columns: [
        {
          id: 'displayName',
          header: 'Display Name',
          accessor: (r) => String((r.spec as Record<string, unknown>)?.displayName ?? r.metadata.name),
          sortable: true,
        },
        { id: 'namespace', header: 'Namespace', accessor: (r) => r.metadata.namespace ?? '-', sortable: true },
        {
          id: 'version',
          header: 'Version',
          accessor: (r) => String((r.spec as Record<string, unknown>)?.version ?? '-'),
        },
        {
          id: 'phase',
          header: 'Phase',
          accessor: (r) => String((r.status as Record<string, unknown>)?.phase ?? '-'),
          sortable: true,
        },
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
