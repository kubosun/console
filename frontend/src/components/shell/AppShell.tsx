'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Box,
  ChevronDown,
  Container,
  FileText,
  FolderOpen,
  Globe,
  HardDrive,
  LayoutDashboard,
  Lock,
  LogOut,
  Monitor,
  Network,
  Package,
  PanelLeft,
  Split,
  PanelLeftClose,
  Rocket,
  Server,
  Settings,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';
import { NamespaceSelector } from './NamespaceSelector';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
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
      { id: 'routes', label: 'Routes', href: '/resources/route.openshift.io/v1/routes', icon: Split },
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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(NAV_SECTIONS.map((s) => s.id)),
  );

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          'flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200',
          isSidebarOpen ? 'w-60' : 'w-0 overflow-hidden',
        )}
      >
        {/* Brand */}
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
            K
          </div>
          <span className="text-lg font-semibold">Kubosun</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          {/* Overview */}
          <Link
            href="/"
            className={cn(
              'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors mb-1',
              pathname === '/'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
            )}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            Overview
          </Link>

          {/* Sections */}
          {NAV_SECTIONS.map((section) => {
            const SectionIcon = section.icon;
            const isExpanded = expandedSections.has(section.id);
            return (
              <div key={section.id} className="mt-1">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
                >
                  <SectionIcon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{section.label}</span>
                  <ChevronDown
                    className={cn(
                      'h-3 w-3 transition-transform',
                      !isExpanded && '-rotate-90',
                    )}
                  />
                </button>
                {isExpanded && (
                  <div className="ml-4 space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname.startsWith(item.href);
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          className={cn(
                            'flex items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors',
                            isActive
                              ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                              : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                          )}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 items-center gap-4 border-b px-4">
          <button
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="h-5 w-5" />
            ) : (
              <PanelLeft className="h-5 w-5" />
            )}
          </button>
          <NamespaceSelector />
          <div className="flex-1" />
          <UserMenu />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

function UserMenu() {
  const { data } = useUser();

  if (!data?.authenticated) return null;

  const handleLogout = async () => {
    await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
    window.location.href = '/auth/login';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <User className="h-4 w-4" />
        <span>{data.user?.name ?? 'User'}</span>
      </div>
      <button
        onClick={handleLogout}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        aria-label="Logout"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
