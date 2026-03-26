'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

const ALL_SECTION_IDS = [
  'cluster',
  'workloads',
  'networking',
  'configuration',
  'observe',
  'storage',
  'helm',
];

interface PreferencesState {
  theme: Theme;
  pinnedNavItems: string[];
  sidebarOpen: boolean;
  expandedSections: string[];
  setTheme: (theme: Theme) => void;
  togglePinnedItem: (id: string) => void;
  setSidebarOpen: (open: boolean) => void;
  setExpandedSections: (sections: string[]) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: 'system',
      pinnedNavItems: [],
      sidebarOpen: true,
      expandedSections: [...ALL_SECTION_IDS],
      setTheme: (theme: Theme) => set({ theme }),
      togglePinnedItem: (id: string) =>
        set((state) => ({
          pinnedNavItems: state.pinnedNavItems.includes(id)
            ? state.pinnedNavItems.filter((item) => item !== id)
            : [...state.pinnedNavItems, id],
        })),
      setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
      setExpandedSections: (sections: string[]) =>
        set({ expandedSections: sections }),
    }),
    { name: 'kubosun-preferences' },
  ),
);

/** Convenience hook returning [theme, setTheme]. */
export function useTheme(): [Theme, (theme: Theme) => void] {
  const theme = usePreferencesStore((s) => s.theme);
  const setTheme = usePreferencesStore((s) => s.setTheme);
  return [theme, setTheme];
}

/** Convenience hook returning [pinnedItems, togglePinnedItem]. */
export function usePinnedNavItems(): [string[], (id: string) => void] {
  const pinned = usePreferencesStore((s) => s.pinnedNavItems);
  const toggle = usePreferencesStore((s) => s.togglePinnedItem);
  return [pinned, toggle];
}

/** Convenience hook returning [sidebarOpen, setSidebarOpen]. */
export function useSidebarOpen(): [boolean, (open: boolean) => void] {
  const open = usePreferencesStore((s) => s.sidebarOpen);
  const setOpen = usePreferencesStore((s) => s.setSidebarOpen);
  return [open, setOpen];
}

/** Convenience hook returning [expandedSections, setExpandedSections]. */
export function useExpandedSections(): [string[], (sections: string[]) => void] {
  const sections = usePreferencesStore((s) => s.expandedSections);
  const setSections = usePreferencesStore((s) => s.setExpandedSections);
  return [sections, setSections];
}
