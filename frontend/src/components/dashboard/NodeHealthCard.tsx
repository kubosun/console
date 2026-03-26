'use client';

import { CheckCircle, XCircle, Monitor } from 'lucide-react';

interface NodeHealthCardProps {
  total: number;
  ready: number;
  notReady: number;
}

export function NodeHealthCard({ total, ready, notReady }: NodeHealthCardProps) {
  const healthPercent = total > 0 ? Math.round((ready / total) * 100) : 0;
  const isHealthy = notReady === 0;

  return (
    <div className="rounded-lg border p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
          <Monitor className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-sm font-medium">Node Health</h3>
          <p className="text-xs text-muted-foreground">{total} nodes total</p>
        </div>
      </div>

      {/* Health bar */}
      <div className="h-2 rounded-full bg-muted overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all ${isHealthy ? 'bg-green-500' : 'bg-yellow-500'}`}
          style={{ width: `${healthPercent}%` }}
        />
      </div>

      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>{ready} Ready</span>
        </div>
        {notReady > 0 && (
          <div className="flex items-center gap-1.5">
            <XCircle className="h-4 w-4 text-red-500" />
            <span>{notReady} Not Ready</span>
          </div>
        )}
      </div>
    </div>
  );
}
