'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActiveNamespace } from '@/stores/namespace-store';
import { useK8sResourceList } from '@/hooks/useK8sResourceList';

export function NamespaceSelector() {
  const [namespace, setNamespace] = useActiveNamespace();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const { data: namespaces } = useK8sResourceList({
    group: '',
    version: 'v1',
    plural: 'namespaces',
    refetchInterval: 30000,
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = (namespaces ?? []).filter((ns) =>
    ns.metadata.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-accent transition-colors"
      >
        <FolderOpen className="h-4 w-4 text-muted-foreground" />
        <span className="max-w-[140px] truncate">
          {namespace || 'All Namespaces'}
        </span>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-md border bg-popover shadow-lg">
          <div className="p-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter namespaces..."
              className="w-full rounded border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            <button
              onClick={() => {
                setNamespace('');
                setIsOpen(false);
                setSearch('');
              }}
              className={cn(
                'w-full px-3 py-1.5 text-left text-sm hover:bg-accent',
                namespace === '' && 'bg-accent font-medium',
              )}
            >
              All Namespaces
            </button>
            {filtered.map((ns) => (
              <button
                key={ns.metadata.uid}
                onClick={() => {
                  setNamespace(ns.metadata.name);
                  setIsOpen(false);
                  setSearch('');
                }}
                className={cn(
                  'w-full px-3 py-1.5 text-left text-sm hover:bg-accent',
                  namespace === ns.metadata.name && 'bg-accent font-medium',
                )}
              >
                {ns.metadata.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
