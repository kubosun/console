'use client';

import Link from 'next/link';
import { AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatAge } from '@/lib/k8s/resource-utils';

interface Event {
  type: string;
  reason: string;
  message: string;
  namespace: string;
  involvedObject: string;
  lastTimestamp: string;
  count: number;
}

interface RecentEventsCardProps {
  events: Event[];
}

export function RecentEventsCard({ events }: RecentEventsCardProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-lg border p-5">
        <h3 className="text-sm font-medium mb-3">Recent Events</h3>
        <p className="text-sm text-muted-foreground text-center py-4">No recent events.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <h3 className="text-sm font-medium">Recent Events</h3>
        <Link href="/events" className="text-xs text-primary hover:underline">
          View all
        </Link>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {events.map((event, i) => {
          const isWarning = event.type === 'Warning';
          return (
            <div
              key={i}
              className={cn(
                'flex gap-3 px-5 py-2.5 border-b last:border-0 text-sm',
                isWarning && 'bg-yellow-50/50 dark:bg-yellow-900/5',
              )}
            >
              {isWarning ? (
                <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
              ) : (
                <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn('font-medium', isWarning && 'text-yellow-700 dark:text-yellow-400')}>
                    {event.reason}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {event.involvedObject}
                  </span>
                  {event.count > 1 && (
                    <span className="rounded-full bg-muted px-1.5 py-0 text-xs">
                      x{event.count}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-xs truncate">{event.message}</p>
              </div>
              <span className="text-muted-foreground text-xs shrink-0">
                {event.lastTimestamp ? formatAge(event.lastTimestamp) : '-'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
