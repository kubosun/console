'use client';

import Link from 'next/link';
import { Bell, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useAlerts } from '@/hooks/useAlerts';
import { cn } from '@/lib/utils';

const SEVERITY_CONFIG: Record<string, { icon: typeof AlertCircle; color: string; bg: string }> = {
  critical: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/20' },
  warning: { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/20' },
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/20' },
};

export function AlertsCard() {
  const { data, isLoading, isError } = useAlerts();

  if (isError) {
    return (
      <div className="rounded-lg border p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <Bell className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-medium">Alerts</h3>
            <p className="text-xs text-muted-foreground">AlertManager unavailable</p>
          </div>
        </div>
      </div>
    );
  }

  const alerts = data?.alerts ?? [];
  const firingAlerts = alerts.filter((a) => a.state === 'active');

  // Count by severity
  const severityCounts: Record<string, number> = {};
  for (const alert of firingAlerts) {
    const sev = alert.severity || 'none';
    severityCounts[sev] = (severityCounts[sev] || 0) + 1;
  }

  return (
    <div className="rounded-lg border">
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <Bell className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-medium">Alerts</h3>
            <p className="text-xs text-muted-foreground">
              {isLoading ? 'Loading...' : `${firingAlerts.length} firing`}
            </p>
          </div>
        </div>
        <Link
          href="/alerts"
          className="text-xs text-primary hover:underline"
        >
          View all
        </Link>
      </div>

      {/* Severity badges */}
      {Object.keys(severityCounts).length > 0 && (
        <div className="flex gap-2 px-5 py-3 border-b">
          {Object.entries(severityCounts)
            .sort(([a], [b]) => {
              const order = ['critical', 'warning', 'info', 'none'];
              return order.indexOf(a) - order.indexOf(b);
            })
            .map(([severity, count]) => {
              const config = SEVERITY_CONFIG[severity];
              return (
                <span
                  key={severity}
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                    config ? `${config.bg} ${config.color}` : 'bg-muted text-muted-foreground',
                  )}
                >
                  {count} {severity}
                </span>
              );
            })}
        </div>
      )}

      {/* Alert list */}
      <div className="max-h-64 overflow-y-auto">
        {firingAlerts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No active alerts
          </p>
        ) : (
          firingAlerts.slice(0, 5).map((alert, i) => {
            const config = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.info;
            const Icon = config.icon;
            return (
              <div
                key={`${alert.name}-${i}`}
                className="flex gap-3 px-5 py-2.5 border-b last:border-0 text-sm"
              >
                <Icon className={cn('h-4 w-4 shrink-0 mt-0.5', config.color)} />
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{alert.name}</span>
                  {alert.namespace && (
                    <span className="text-muted-foreground text-xs ml-2">
                      {alert.namespace}
                    </span>
                  )}
                  <p className="text-muted-foreground text-xs truncate">
                    {alert.summary || alert.description}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
