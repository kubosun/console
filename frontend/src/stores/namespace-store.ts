'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NamespaceState {
  activeNamespace: string;
  setNamespace: (ns: string) => void;
}

export const useNamespaceStore = create<NamespaceState>()(
  persist(
    (set) => ({
      activeNamespace: 'default',
      setNamespace: (ns: string) => set({ activeNamespace: ns }),
    }),
    { name: 'kubosun-namespace' },
  ),
);

/** Convenience hook returning [namespace, setNamespace]. */
export function useActiveNamespace(): [string, (ns: string) => void] {
  const ns = useNamespaceStore((s) => s.activeNamespace);
  const setNs = useNamespaceStore((s) => s.setNamespace);
  return [ns, setNs];
}
