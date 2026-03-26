'use client';

import { useState, useMemo } from 'react';
import { Bell, AlertCircle, AlertTriangle, Info, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { useAlerts } from '@/hooks/useAlerts';
import type { Alert } from '@/lib/monitoring/client';
import { cn } from '@/lib/utils';

type SeverityFilter = 'all' | 'critical' | 'warning' | 'info';

const SEVERITY_CONFIG: Record<string, { icon: typeof AlertCircle; color: string; bg: string; badge: string }> = {
  critical: {
    icon: AlertCircle,
    color: 'text-red-600',
    bg: 'bg-red-50 dark:bg-red-900/10',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50 dark:bg-yellow-900/10',
    badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  },
  info: {
    icon: Info,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-900/10',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  },
};

function AlertRow({ alert }: { alert: Alert }) {
  const [expanded, setExpanded] = useState(false);
  const config = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.info;
  const Icon = config.icon;

  return (
    <div className={cn('border-b last:border-0', config.bg)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        )}
        <Icon className={cn('h-4 w-4 shrink-0', config.color)} />
        <span className="font-medium flex-1">{alert.name}</span>
        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', config.badge)}>
          {alert.severity}
        </span>
        {alert.namespace && (
          <span className="text-xs text-muted-foreground">{alert.namespace}</span>
        )}
        <span className="text-xs text-muted-foreground">
          {alert.startsAt ? new Date(alert.startsAt).toLocaleString() : '-'}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-3 pl-14 space-y-2">
          {alert.summary && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">Summary</span>
              <p className="text-sm">{alert.summary}</p>
            </div>
          )}
          {alert.description && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">Description</span>
              <p className="text-sm">{alert.description}</p>
            </div>
          )}
          <div>
            <span className="text-xs font-medium text-muted-foreground">Labels</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {Object.entries(alert.labels).map(([key, value]) => (
                <span
                  key={key}
                  className="inline-flex items-center rounded bg-muted px-1.5 py-0.5 text-xs"
                >
                  <span className="text-muted-foreground">{key}=</span>
                  {value}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AlertsPage() {
  const { data, isLoading, isError } = useAlerts();
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [search, setSearch] = useState('');

  const alerts = useMemo(() => data?.alerts ?? [], [data?.alerts]);

  const filtered = useMemo(() => {
    let result = alerts;
    if (severityFilter !== 'all') {
      result = result.filter((a) => a.severity === severityFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.summary.toLowerCase().includes(q) ||
          a.namespace.toLowerCase().includes(q),
      );
    }
    // Sort: critical first, then warning, then info
    const order = ['critical', 'warning', 'info', 'none'];
    result.sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity));
    return result;
  }, [alerts, severityFilter, search]);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="h-6 w-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold">Alerts</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isLoading ? 'Loading...' : `${alerts.length} total alerts`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search alerts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex rounded-md border">
          {(['all', 'critical', 'warning', 'info'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={cn(
                'px-3 py-1.5 text-sm border-r last:border-r-0 transition-colors capitalize',
                severityFilter === sev
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted',
              )}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Alert list */}
      {isError ? (
        <div className="rounded-lg border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            AlertManager is unavailable
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Loading alerts...' : 'No alerts found'}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          {filtered.map((alert, i) => (
            <AlertRow key={`${alert.name}-${alert.namespace}-${i}`} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
}
