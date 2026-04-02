'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Moon,
  PanelLeft,
  PanelLeftClose,
  Search,
  Star,
  Sun,
  User,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/useUser';
import {
  useTheme,
  usePinnedNavItems,
  useSidebarOpen,
  useExpandedSections,
} from '@/stores/preferences-store';
import { useApiGroups } from '@/hooks/useApiGroups';
import { NAV_SECTIONS, getAllNavItems, findNavItemById } from './nav-sections';
import type { NavItem } from './nav-sections';
import { NamespaceSelector } from './NamespaceSelector';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useSidebarOpen();
  const [expandedSectionsArr, setExpandedSections] = useExpandedSections();
  const [pinnedItems, togglePinned] = usePinnedNavItems();
  const [navSearch, setNavSearch] = useState('');
  const { groups: apiGroups } = useApiGroups();

  const isItemAvailable = (item: NavItem) =>
    !item.requiredGroup || apiGroups.has(item.requiredGroup);

  const visibleSections = useMemo(
    () =>
      NAV_SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter(isItemAvailable),
      })).filter((section) => section.items.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apiGroups],
  );

  const expandedSections = useMemo(
    () => new Set(expandedSectionsArr),
    [expandedSectionsArr],
  );

  const toggleSection = (id: string) => {
    setExpandedSections(
      expandedSections.has(id)
        ? expandedSectionsArr.filter((s) => s !== id)
        : [...expandedSectionsArr, id],
    );
  };

  const allNavItems = useMemo(
    () => getAllNavItems().filter(isItemAvailable),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apiGroups],
  );

  const filteredItems = useMemo(() => {
    if (!navSearch) return null;
    const q = navSearch.toLowerCase();
    return allNavItems.filter((item) =>
      item.label.toLowerCase().includes(q),
    );
  }, [navSearch, allNavItems]);

  const resolvedPins = useMemo(
    () =>
      pinnedItems
        .map((id) => findNavItemById(id))
        .filter(
          (item): item is NonNullable<typeof item> =>
            !!item && isItemAvailable(item),
        ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pinnedItems, apiGroups],
  );

  const isSearching = navSearch.length > 0;

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
          {/* Search */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              className="w-full rounded-md border bg-background pl-8 pr-7 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            {navSearch && (
              <button
                onClick={() => setNavSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {isSearching ? (
            /* Search results */
            <div className="space-y-0.5">
              {filteredItems && filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setNavSearch('')}
                      className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors',
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                      )}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.sectionLabel}
                      </span>
                    </Link>
                  );
                })
              ) : (
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  No results
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Favorites */}
              {resolvedPins.length > 0 && (
                <>
                  <div className="flex items-center gap-2 px-3 py-1 mb-0.5">
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-medium text-muted-foreground">
                      Favorites
                    </span>
                  </div>
                  <div className="space-y-0.5 mb-1">
                    {resolvedPins.map((item) => (
                      <NavItemRow
                        key={item.id}
                        item={item}
                        isActive={pathname.startsWith(item.href)}
                        isPinned
                        onTogglePin={() => togglePinned(item.id)}
                      />
                    ))}
                  </div>
                  <div className="border-b mb-1" />
                </>
              )}

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
              {visibleSections.map((section) => {
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
                        {section.items.map((item) => (
                          <NavItemRow
                            key={item.id}
                            item={item}
                            isActive={pathname.startsWith(item.href)}
                            isPinned={pinnedItems.includes(item.id)}
                            onTogglePin={() => togglePinned(item.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 items-center gap-4 border-b px-4">
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
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
          <ThemeToggle />
          <UserMenu />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

function NavItemRow({
  item,
  isActive,
  isPinned,
  onTogglePin,
}: {
  item: NavItem;
  isActive: boolean;
  isPinned: boolean;
  onTogglePin: () => void;
}) {
  const Icon = item.icon;
  return (
    <div className="group flex items-center">
      <Link
        href={item.href}
        className={cn(
          'flex flex-1 items-center gap-3 rounded-md px-3 py-1.5 text-sm transition-colors',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
            : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
        )}
      >
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {item.label}
      </Link>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onTogglePin();
        }}
        className={cn(
          'shrink-0 rounded p-1 transition-colors',
          isPinned
            ? 'text-yellow-500 hover:text-yellow-600'
            : 'text-transparent group-hover:text-muted-foreground hover:!text-yellow-500',
        )}
        aria-label={isPinned ? `Unpin ${item.label}` : `Pin ${item.label}`}
      >
        <Star
          className={cn('h-3 w-3', isPinned && 'fill-current')}
        />
      </button>
    </div>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useTheme();

  const effectiveTheme =
    theme === 'system'
      ? typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;

  const toggle = () => setTheme(effectiveTheme === 'dark' ? 'light' : 'dark');

  return (
    <button
      onClick={toggle}
      className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
      aria-label="Toggle theme"
    >
      {effectiveTheme === 'dark' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}

function UserMenu() {
  const { data } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!data?.authenticated) return null;

  const name = data.user?.name ?? 'User';
  const email = data.user?.email ?? '';
  const initials = name
    .split(/[\s:]+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');

  const handleLogout = async () => {
    try {
      await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
    } finally {
      window.location.href = '/auth/login';
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        aria-label="User menu"
      >
        {initials || <User className="h-4 w-4" />}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-md border bg-popover shadow-lg">
          <div className="px-3 py-3">
            <p className="text-sm font-medium">{name}</p>
            {email && email !== name && (
              <p className="text-xs text-muted-foreground">{email}</p>
            )}
          </div>
          <div className="border-t" />
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
