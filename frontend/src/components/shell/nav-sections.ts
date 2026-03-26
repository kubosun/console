import {
  Activity,
  Bell,
  Box,
  Container,
  FileText,
  FolderOpen,
  Globe,
  HardDrive,
  Lock,
  Monitor,
  Network,
  Package,
  Rocket,
  Server,
  Settings,
  Split,
} from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  /** If set, this nav item is only shown when this API group exists on the cluster. */
  requiredGroup?: string;
}

export interface NavSection {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'cluster',
    label: 'Cluster',
    icon: Server,
    items: [
      { id: 'nodes', label: 'Nodes', href: '/resources/core/v1/nodes', icon: Monitor },
      { id: 'namespaces', label: 'Namespaces', href: '/resources/core/v1/namespaces', icon: FolderOpen },
    ],
  },
  {
    id: 'workloads',
    label: 'Workloads',
    icon: Box,
    items: [
      { id: 'pods', label: 'Pods', href: '/resources/core/v1/pods', icon: Container },
      { id: 'deployments', label: 'Deployments', href: '/resources/apps/v1/deployments', icon: Rocket },
    ],
  },
  {
    id: 'networking',
    label: 'Networking',
    icon: Network,
    items: [
      { id: 'services', label: 'Services', href: '/resources/core/v1/services', icon: Globe },
      { id: 'ingresses', label: 'Ingresses', href: '/resources/networking.k8s.io/v1/ingresses', icon: Network },
      { id: 'routes', label: 'Routes', href: '/resources/route.openshift.io/v1/routes', icon: Split, requiredGroup: 'route.openshift.io' },
    ],
  },
  {
    id: 'configuration',
    label: 'Configuration',
    icon: Settings,
    items: [
      { id: 'configmaps', label: 'ConfigMaps', href: '/resources/core/v1/configmaps', icon: FileText },
      { id: 'secrets', label: 'Secrets', href: '/resources/core/v1/secrets', icon: Lock },
    ],
  },
  {
    id: 'observe',
    label: 'Observe',
    icon: Activity,
    items: [
      { id: 'events', label: 'Events', href: '/events', icon: Activity },
      { id: 'alerts', label: 'Alerts', href: '/alerts', icon: Bell },
    ],
  },
  {
    id: 'storage',
    label: 'Storage',
    icon: HardDrive,
    items: [
      { id: 'pvcs', label: 'PVCs', href: '/resources/core/v1/persistentvolumeclaims', icon: HardDrive },
    ],
  },
  {
    id: 'helm',
    label: 'Helm',
    icon: Package,
    items: [
      { id: 'releases', label: 'Releases', href: '/helm', icon: Package },
    ],
  },
];

export interface FlatNavItem extends NavItem {
  sectionLabel: string;
}

/** Get all nav items as a flat list with their section label. */
export function getAllNavItems(): FlatNavItem[] {
  return NAV_SECTIONS.flatMap((section) =>
    section.items.map((item) => ({ ...item, sectionLabel: section.label })),
  );
}

/** Find a nav item by its ID. */
export function findNavItemById(id: string): FlatNavItem | undefined {
  return getAllNavItems().find((item) => item.id === id);
}
