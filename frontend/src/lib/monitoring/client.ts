/**
 * Monitoring API client — Prometheus queries and AlertManager alerts.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

// --- Prometheus Types ---

export interface PrometheusMetric {
  metric: Record<string, string>;
  value?: [number, string]; // instant query: [timestamp, value]
  values?: [number, string][]; // range query: [[timestamp, value], ...]
}

export interface PrometheusResult {
  status: string;
  data: {
    resultType: string;
    result: PrometheusMetric[];
  };
}

// --- Alert Types ---

export interface Alert {
  name: string;
  severity: string;
  state: string;
  summary: string;
  description: string;
  startsAt: string;
  labels: Record<string, string>;
  namespace: string;
}

export interface AlertsResponse {
  alerts: Alert[];
  count: number;
  error?: string;
}

export interface AlertCounts {
  counts: Record<string, number>;
  total: number;
}

// --- Prometheus API ---

export async function promQuery(
  query: string,
  time?: string,
): Promise<PrometheusResult> {
  const params = new URLSearchParams({ query });
  if (time) params.set('time', time);
  const response = await fetch(
    `${API_BASE}/api/monitoring/prometheus/api/v1/query?${params}`,
    { credentials: 'include' },
  );
  if (!response.ok) {
    throw new Error(`Prometheus query failed (${response.status})`);
  }
  return response.json();
}

export async function promQueryRange(
  query: string,
  start: string,
  end: string,
  step: string,
): Promise<PrometheusResult> {
  const params = new URLSearchParams({ query, start, end, step });
  const response = await fetch(
    `${API_BASE}/api/monitoring/prometheus/api/v1/query_range?${params}`,
    { credentials: 'include' },
  );
  if (!response.ok) {
    throw new Error(`Prometheus range query failed (${response.status})`);
  }
  return response.json();
}

// --- AlertManager API ---

export async function fetchAlerts(): Promise<AlertsResponse> {
  const response = await fetch(`${API_BASE}/api/monitoring/alerts`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`Alerts fetch failed (${response.status})`);
  }
  return response.json();
}

export async function fetchAlertCounts(): Promise<AlertCounts> {
  const response = await fetch(`${API_BASE}/api/monitoring/alerts/count`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(`Alert counts fetch failed (${response.status})`);
  }
  return response.json();
}
