'use client';

import { useState, useMemo } from 'react';
import { AlertCircle, Info, Search, RefreshCw } from 'lucide-react';
import { useEvents } from '@/hooks/useEvents';
import type { K8sEvent } from '@/hooks/useEvents';
import { useActiveNamespace } from '@/stores/namespace-store';
import { cn } from '@/lib/utils';
import { formatAge } from '@/lib/k8s/resource-utils';

type EventTypeFilter = 'All' | 'Normal' | 'Warning';

function groupEventsByDate(events: K8sEvent[]): Map<string, K8sEvent[]> {
  const groups = new Map<string, K8sEvent[]>();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);

  for (const event of events) {
    const timestamp = event.lastTimestamp || event.firstTimestamp;
    if (!timestamp) {
      const key = 'Unknown';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(event);
      continue;
    }
    const eventDate = new Date(timestamp);
    const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

    let key: string;
    if (eventDay.getTime() === today.getTime()) {
      key = 'Today';
    } else if (eventDay.getTime() === yesterday.getTime()) {
      key = 'Yesterday';
    } else {
      key = eventDay.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(event);
  }

  return groups;
}

export default function EventsPage() {
  const [namespace] = useActiveNamespace();
  const [typeFilter, setTypeFilter] = useState<EventTypeFilter>('All');
  const [search, setSearch] = useState('');

  const { data, isLoading, dataUpdatedAt } = useEvents({
    namespace: namespace === 'all-namespaces' ? undefined : namespace,
    type: typeFilter === 'All' ? undefined : typeFilter,
    limit: 500,
  });

  const filteredEvents = useMemo(() => {
    const events = data?.events ?? [];
    if (!search) return events;
    const q = search.toLowerCase();
    return events.filter(
      (e) =>
        e.message.toLowerCase().includes(q) ||
        e.reason.toLowerCase().includes(q) ||
        e.involvedObject.name.toLowerCase().includes(q) ||
        e.involvedObject.kind.toLowerCase().includes(q),
    );
  }, [data?.events, search]);

  const grouped = useMemo(() => groupEventsByDate(filteredEvents), [filteredEvents]);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Events</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Cluster events timeline
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex rounded-md border">
          {(['All', 'Normal', 'Warning'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                'px-3 py-1.5 text-sm border-r last:border-r-0 transition-colors',
                typeFilter === t
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted',
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <RefreshCw className={cn('h-3 w-3', isLoading && 'animate-spin')} />
          {dataUpdatedAt
            ? `Updated ${new Date(dataUpdatedAt).toLocaleTimeString()}`
            : 'Loading...'}
        </div>
      </div>

      {/* Event timeline */}
      {filteredEvents.length === 0 ? (
        <div className="rounded-lg border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Loading events...' : 'No events found'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([dateLabel, events]) => (
            <div key={dateLabel}>
              <h2 className="text-sm font-medium text-muted-foreground mb-2 sticky top-0 bg-background py-1">
                {dateLabel}
                <span className="ml-2 text-xs font-normal">({events.length})</span>
              </h2>
              <div className="rounded-lg border divide-y">
                {events.map((event, i) => {
                  const isWarning = event.type === 'Warning';
                  return (
                    <div
                      key={`${event.involvedObject.name}-${event.reason}-${i}`}
                      className={cn(
                        'flex gap-3 px-4 py-3 text-sm',
                        isWarning && 'bg-yellow-50/50 dark:bg-yellow-900/5',
                      )}
                    >
                      {isWarning ? (
                        <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                      ) : (
                        <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={cn(
                              'font-medium',
                              isWarning && 'text-yellow-700 dark:text-yellow-400',
                            )}
                          >
                            {event.reason}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {event.involvedObject.kind}/{event.involvedObject.name}
                          </span>
                          {event.namespace && (
                            <span className="text-muted-foreground text-xs">
                              in {event.namespace}
                            </span>
                          )}
                          {event.count > 1 && (
                            <span className="rounded-full bg-muted px-1.5 py-0 text-xs">
                              x{event.count}
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground text-xs mt-0.5">
                          {event.message}
                        </p>
                        {event.source && (
                          <p className="text-muted-foreground text-xs mt-0.5">
                            Source: {event.source}
                          </p>
                        )}
                      </div>
                      <span className="text-muted-foreground text-xs shrink-0">
                        {event.lastTimestamp ? formatAge(event.lastTimestamp) : '-'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
