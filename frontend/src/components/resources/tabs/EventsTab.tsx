'use client';

import { useK8sResourceList } from '@/hooks/useK8sResourceList';
import { formatAge } from '@/lib/k8s/resource-utils';
import { AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventsTabProps {
  resourceName: string;
  namespace?: string;
}

export function EventsTab({ resourceName, namespace }: EventsTabProps) {
  const { data: events, isLoading } = useK8sResourceList({
    group: '',
    version: 'v1',
    plural: 'events',
    namespace,
    refetchInterval: 5000,
  });

  // Filter events for the specific resource
  const filtered = (events ?? []).filter((e) => {
    const involved = e.involvedObject as
      | { name?: string }
      | undefined;
    return involved?.name === resourceName;
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded bg-muted" />
        ))}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm">
        <Info className="h-8 w-8 mb-2 opacity-50" />
        <p>No events found for this resource.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-2 text-left font-medium w-10">Type</th>
            <th className="px-4 py-2 text-left font-medium">Reason</th>
            <th className="px-4 py-2 text-left font-medium">Message</th>
            <th className="px-4 py-2 text-left font-medium w-20">Age</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((event) => {
            const eventType = String(event.type ?? 'Normal');
            const isWarning = eventType === 'Warning';
            return (
              <tr key={event.metadata.uid} className="border-b last:border-0">
                <td className="px-4 py-2">
                  {isWarning ? (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  ) : (
                    <Info className="h-4 w-4 text-blue-500" />
                  )}
                </td>
                <td className={cn('px-4 py-2 font-medium', isWarning && 'text-yellow-600')}>
                  {String(event.reason ?? '-')}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {String(event.message ?? '-')}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {formatAge(event.metadata.creationTimestamp)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
